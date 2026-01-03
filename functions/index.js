import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, onRequest } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createCheckoutSession, constructWebhookEvent, createPortalSession } from "./stripeHelpers.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json");

// Initializing Firebase Admin
// Use the service account key only for local emulation or if env var not set
// In production (Cloud Functions), initializeApp() uses ADC (default service account)
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
    const serviceAccount = require("./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json");
    initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    initializeApp();
}
const db = getFirestore();

// Environment variables should be set in Firebase Functions config
// firebase functions:config:set huggingface.token="..." b2.key_id="..." ...
// Or for v2, use params or process.env if deployed with .env support

const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION;
const B2_BUCKET = process.env.B2_BUCKET;
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;

const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

export const generateImage = onDocumentCreated(
    {
        document: "generation_queue/{requestId}",
        timeoutSeconds: 300, // 5 minutes max
        memory: "1GiB",
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }

        const data = snapshot.data();
        const requestId = event.params.requestId;

        // Prevent infinite loops or re-runs if already processed
        if (data.status !== "pending") {
            return;
        }

        try {
            // Update status to processing
            await snapshot.ref.update({ status: "processing" });

            const { prompt, modelId, userId, negative_prompt, steps, cfg, aspectRatio, scheduler } = data;

            // --- Input Validation & Cleaning ---
            let cleanPrompt = prompt;

            if (!cleanPrompt || typeof cleanPrompt !== 'string') {
                await snapshot.ref.update({ status: "failed", error: "Invalid prompt" });
                return;
            }

            // 1. Remove excessive emojis (if > 5)
            // Regex to match emojis (simplified common ranges)
            const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
            const emojiCount = (cleanPrompt.match(emojiRegex) || []).length;
            if (emojiCount > 5) {
                // Strip ALL emojis if excessive
                cleanPrompt = cleanPrompt.replace(emojiRegex, '');
            }

            // 2. Collapse repeated punctuation/symbols (e.g. "!!!!" -> "!")
            // Collapse sequences of 3+ same non-alphanumeric chars to 1
            cleanPrompt = cleanPrompt.replace(/([^a-zA-Z0-9\s])\1{2,}/g, '$1');

            // 3. Remove long number sequences (5+ digits)
            cleanPrompt = cleanPrompt.replace(/\d{5,}/g, '');

            // 4. Trim and check length
            cleanPrompt = cleanPrompt.trim();

            if (cleanPrompt.length < 5) {
                await snapshot.ref.update({ status: "failed", error: "Prompt too short or invalid after cleaning" });
                return;
            }

            // Removed invalid assignment to const 'prompt'
            // We successfully have 'cleanPrompt' to use for subsequent steps.

            const validAspectRatios = ['1:1', '2:3', '3:2', '9:16', '16:9'];
            const safeAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

            // Clamp steps 10-50 (or whatever the API limits are, keep it reasonable)
            // Default is 30.
            let safeSteps = parseInt(steps);
            if (isNaN(safeSteps) || safeSteps < 10) safeSteps = 10;
            if (safeSteps > 50) safeSteps = 50;

            // Clamp CFG 1-20
            // Default is 5.0
            let safeCfg = parseFloat(cfg);
            if (isNaN(safeCfg) || safeCfg < 1) safeCfg = 1.0;
            if (safeCfg > 20) safeCfg = 20.0;
            // ------------------------

            // --- Credit Check Logic ---
            const userRef = db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            let user = userDoc.exists ? userDoc.data() : {};

            // Default values for new users
            if (!user.credits && user.credits !== 0) user.credits = 5;
            if (!user.lastDailyReset) user.lastDailyReset = new Date(0); // Epoch

            const now = new Date();
            const lastReset = user.lastDailyReset.toDate ? user.lastDailyReset.toDate() : new Date(user.lastDailyReset);
            const oneDay = 24 * 60 * 60 * 1000;

            // Daily Reset Logic for minimal example (or just reset if > 24h)
            if (now - lastReset > oneDay) {
                user.credits = 5; // Reset to daily free limit
                user.lastDailyReset = now;
                await userRef.set({ credits: 5, lastDailyReset: now }, { merge: true });
            }

            // Check subscription
            const isPro = user.subscriptionStatus === 'active';

            // Start - moved after buffer check in old code, but now we do it before enqueueing
            // --- Rate Limiting (10s cooldown) ---
            const lastGenTime = user.lastGenerationTime ? (user.lastGenerationTime.toDate ? user.lastGenerationTime.toDate() : new Date(user.lastGenerationTime)) : new Date(0);
            if (now - lastGenTime < 10000) { // 10 seconds in ms
                await snapshot.ref.update({ status: "failed", error: "Rate limit exceeded. Please wait 10 seconds between generations." });
                return;
            }
            // ------------------------------------

            // Deduct credit if not Pro (or deduct for Pro too if we want usage tracking)
            // For this implementation: Pro = Unlimited, Free = 5 credits.
            const userUpdate = { lastGenerationTime: now };
            if (!isPro) {
                userUpdate.credits = FieldValue.increment(-1);
            }
            await userRef.update(userUpdate);
            // End - moved logic


            // --- Enqueue Background Task for Execution ---
            // Instead of executing heavy logic here, we enqueue it to Cloud Tasks.
            // This allows us to use Cloud Tasks' rate limiting to act as a buffer.

            const queue = getFunctions().taskQueue("generateImageTask");

            // Pass all necessary data to the task
            // We use the cleaned prompt and valid logic from here
            await queue.enqueue({
                requestId,
                userId,
                prompt: cleanPrompt, // Use the cleaned version
                originalPrompt: prompt, // Keep original just in case? No, clean is better.
                negative_prompt: negative_prompt || "",
                modelId,
                steps: safeSteps,
                cfg: safeCfg,
                aspectRatio: safeAspectRatio,
                scheduler: scheduler || 'DPM++ 2M Karras'
            });

            // Update status to 'queued' to indicate it's in the buffer
            await snapshot.ref.update({ status: "queued" });

            console.log(`Request ${requestId} enqueued to generateImageTask`);

        } catch (error) {
            console.error("Error queueing image generation:", error);
            await snapshot.ref.update({
                status: "failed",
                error: error.message
            });
        }
    }
);

// New Cloud Task for processing the image generation
export const generateImageTask = onTaskDispatched(
    {
        retryConfig: {
            maxAttempts: 3,
            minBackoffSeconds: 60,
        },
        rateLimits: {
            maxConcurrentDispatches: 2, // Concurrency of 2. With ~8s execution time, this is approx 1 req / 4s.
            maxDispatchesPerSecond: 1, // Max burst rate (if tasks were instant)
        },
        memory: "1GiB",
        timeoutSeconds: 300,
    },
    async (req) => {
        const { requestId, userId, prompt, negative_prompt, modelId, steps, cfg, aspectRatio, scheduler } = req.data;

        console.log(`Task processing started for ${requestId}`);

        // Re-establish refs inside task (since it's a separate execution context)
        const db = getFirestore(); // Admin SDK instance

        // Note: verify the document still exists and is in 'queued' or 'processing' state? 
        // Or just proceed. Proceeding is robust.

        try {
            // Update status to processing (execution started)
            await db.collection("generation_queue").doc(requestId).update({ status: "processing" });

            if (!B2_KEY_ID) throw new Error("Missing B2 credentials");

            // Define resolution mapping for SDXL
            const resolutionMap = {
                '1:1': { width: 1024, height: 1024 },
                '2:3': { width: 832, height: 1216 },
                '3:2': { width: 1216, height: 832 },
                '9:16': { width: 768, height: 1344 },
                '16:9': { width: 1344, height: 768 }
            };

            const resolution = resolutionMap[aspectRatio] || resolutionMap['1:1'];

            // --- Simulated Delay for Cold Starts / Buffering ---
            // Adjust these values as needed based on observed backend latency
            const MODEL_DELAYS = {
                "cat-carrier": 8000,
                "hassaku-illustrious": 8000,
                "default": 8000
            };

            const delayMs = MODEL_DELAYS[modelId] || MODEL_DELAYS["default"];
            if (delayMs > 0) {
                console.log(`Applying simulated delay of ${delayMs}ms for model ${modelId || 'unknown'}...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            // ----------------------------------------------------

            // 1. Call Modal Endpoint
            console.log(`Generating image for ${requestId} (${aspectRatio} - ${resolution.width}x${resolution.height}) using Modal endpoint...`);

            // Construct query parameters
            const params = new URLSearchParams({
                prompt: prompt,
                model: modelId || "cat-carrier",
                negative_prompt: negative_prompt || "",
                steps: steps.toString(),
                cfg: cfg.toString(),
                width: resolution.width.toString(),
                height: resolution.height.toString(),
                scheduler: scheduler || 'DPM++ 2M Karras'
            });

            const response = await fetch(
                `https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${params.toString()}`,
                {
                    method: "GET" // Assuming Modal uses GET for this? Previous code used GET.
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Modal API Error: ${errText}`);
            }

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 2. Upload to Backblaze B2
            const filename = `generated/${userId}/${Date.now()}.png`;
            console.log(`Uploading to B2: ${filename}...`);

            const command = new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: filename,
                Body: buffer,
                ContentType: "image/png",
            });

            await s3Client.send(command);
            const imageUrl = `${B2_PUBLIC_URL}/${filename}`;

            // 3. Save to main 'images' collection
            const imageDoc = {
                userId,
                prompt: prompt,
                negative_prompt: negative_prompt || "",
                steps: steps,
                cfg: cfg,
                aspectRatio: aspectRatio,
                modelId,
                imageUrl,
                createdAt: new Date(),
                originalrequestId: requestId
            };

            const imageRef = await db.collection("images").add(imageDoc);
            console.log(`Image saved to images/${imageRef.id}`);

            // 4. Update queue status to completed
            await db.collection("generation_queue").doc(requestId).update({
                status: "completed",
                imageUrl: imageUrl,
                completedAt: new Date(),
                resultImageId: imageRef.id
            });

        } catch (error) {
            console.error("Error generating image in task:", error);
            await db.collection("generation_queue").doc(requestId).update({
                status: "failed",
                error: error.message
            });
            // We re-throw if we want Cloud Tasks to retry automatically (based on retryConfig).
            // However, if it's a deterministic error (like bad prompt), we shouldn't retry.
            // For now, logging and marking failed is safer to avoid loops, unless it's network error.
            // Cloud Tasks retry logic handles network errors often before we catch? 
            // If we catch, we suppress retry.
            // Let's suppress retry for logic errors.
        }
    }
);

export const createStripeCheckout = onCall(async (request) => {
    const { priceId, successUrl, cancelUrl } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token.email;

    // App Check Verification
    if (request.app == undefined) {
        throw new Error("The function must be called from an App Check verified app.");
    }

    if (!uid) {
        throw new Error("Unauthenticated");
    }

    // Rate Limiting for Checkout (Max 1 per minute)
    const db = getFirestore(); // Ensure db is available or use global if already initialized
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const user = userDoc.exists ? userDoc.data() : {};

    const now = new Date();
    const lastCheckout = user.lastCheckoutSessionTime ? (user.lastCheckoutSessionTime.toDate ? user.lastCheckoutSessionTime.toDate() : new Date(user.lastCheckoutSessionTime)) : new Date(0);

    if (now - lastCheckout < 60000) { // 60 seconds
        throw new Error("Please wait a minute before creating a new checkout session.");
    }

    await userRef.set({ lastCheckoutSessionTime: now }, { merge: true });

    try {
        const sessionUrl = await createCheckoutSession(uid, email, priceId, successUrl, cancelUrl);
        return { url: sessionUrl };
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        throw new Error("Failed to create checkout session");
    }
});

export const createStripePortalSession = onCall(async (request) => {
    const { returnUrl } = request.data;
    const uid = request.auth.uid;

    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error("User not found");
    }

    const user = userDoc.data();
    if (!user.stripeCustomerId) {
        throw new Error("No subscription found");
    }

    try {
        const url = await createPortalSession(user.stripeCustomerId, returnUrl || 'https://dreambees.app');
        return { url };
    } catch (error) {
        console.error("Stripe Portal Error:", error);
        throw new Error("Failed to create portal session");
    }
});

export const stripeWebhook = onRequest(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = constructWebhookEvent(req.rawBody, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook Error:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const customerId = session.customer;

            // Update user to active subscription
            await db.collection('users').doc(userId).set({
                subscriptionStatus: 'active',
                stripeCustomerId: customerId,
                credits: 1000, // Monthly allowance
                planTier: 'pro'
            }, { merge: true });

        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            // distinct from 'checkout.session.completed', this handles RENEWALS
            if (invoice.billing_reason === 'subscription_cycle') {
                const customerId = invoice.customer;
                const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();

                if (!usersSnapshot.empty) {
                    usersSnapshot.forEach(async (doc) => {
                        console.log(`Renewing credits for user ${doc.id}`);
                        await doc.ref.update({
                            credits: 1000,
                            subscriptionStatus: 'active'
                        });
                    });
                }
            }
        } else if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const status = subscription.status; // active, past_due, unpaid, canceled

            // Map Stripe status to our app status
            // We only really care if it becomes NOT active/trialing
            const isActive = status === 'active' || status === 'trialing';
            const appStatus = isActive ? 'active' : 'inactive';

            const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();
            usersSnapshot.forEach(async (doc) => {
                await doc.ref.update({ subscriptionStatus: appStatus });
            });

        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            // Find user by stripeCustomerId (simple query)
            const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();
            usersSnapshot.forEach(async (doc) => {
                await doc.ref.update({ subscriptionStatus: 'inactive' });
            });
        }
        res.json({ received: true });
    } catch (err) {
        console.error("Error processing webhook:", err);
        res.status(500).send("Internal Server Error");
    }
});
