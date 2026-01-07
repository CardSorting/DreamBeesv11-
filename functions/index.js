import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createCheckoutSession, constructWebhookEvent, createPortalSession } from "./stripeHelpers.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

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
            if (!user.credits && user.credits !== 0) user.credits = 30; // Generous starting credits
            // Set lastDailyReset to NOW for new users so they don't trigger an immediate reset
            if (!user.lastDailyReset) user.lastDailyReset = new Date();

            const now = new Date();
            const lastReset = user.lastDailyReset.toDate ? user.lastDailyReset.toDate() : new Date(user.lastDailyReset);
            const oneDay = 24 * 60 * 60 * 1000;

            // Daily Reset Logic
            // Only reset if it's been > 24h AND the user has fewer than 5 credits.
            // This prevents wiping out the 30 starting credits or purchased packs.
            if (now - lastReset > oneDay) {
                if ((user.credits || 0) < 5) {
                    user.credits = 5; // Top up to daily limit
                    // We only update lastDailyReset if we actually topped up? 
                    // Or always update it to mark the new cycle?
                    // Let's always update it so we check again tomorrow.
                }
                user.lastDailyReset = now;
                // We use set with merge to ensure fields exist, though update is likely fine if user exists.
                // Using update pattern below.
                const updateData = { lastDailyReset: now };
                if ((user.credits || 0) < 5) {
                    updateData.credits = 5;
                }

                await userRef.set(updateData, { merge: true });

                // Update local user object so the check below uses correct values
                if (updateData.credits) user.credits = updateData.credits;
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

            // 1. Call Model Endpoint
            console.log(`Generating image for ${requestId} (${aspectRatio} - ${resolution.width}x${resolution.height}) using model ${modelId || 'default'}...`);

            let buffer;

            if (modelId === 'zit-model') {
                // ZIT-model specific endpoint (POST)
                console.log("Using ZIT-model endpoint...");

                // Determine if aspect ratio is directly supported by ZIT
                // ZIT supports: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9, 9:21
                const zitSupportedRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'];
                const useAspectRatioParam = zitSupportedRatios.includes(aspectRatio);

                const zBody = {
                    prompt: prompt,
                    steps: steps, // ZIT recommends 9, but we pass user value (clamped 10-50 currently)
                    // If supported, pass string, else pass explicit width/height
                    ...(useAspectRatioParam ? { aspect_ratio: aspectRatio } : { width: resolution.width, height: resolution.height })
                };

                const response = await fetch("https://cardsorting--zit-only-fastapi-app.modal.run/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(zBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`ZIT Modal API Error: ${errText}`);
                }

                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);

            } else if (modelId === 'qwen-image-2512') {
                // Qwen-Image-2512 specific endpoint (POST)
                console.log("Using Qwen-Image-2512 endpoint...");

                const qBody = {
                    prompt: prompt,
                    negative_prompt: negative_prompt || "",
                    aspect_ratio: aspectRatio // Qwen supports aspect_ratio directly
                };

                const response = await fetch("https://cardsorting--qwen-image-2512-qwenimage-api-generate.modal.run", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(qBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Qwen Modal API Error: ${errText}`);
                }

                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);

            } else {
                // Default / SDXL Multi-Model Endpoint (GET)
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
                        method: "GET"
                    }
                );

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Modal API Error: ${errText}`);
                }

                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
            }

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
            // Construct CDN URL with explicit bucket path
            const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${filename}`;

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
    const { priceId, successUrl, cancelUrl, mode } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token.email;

    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
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
        // Default mode to 'subscription' if not provided, unless we logic it out. 
        // Or let helper default it.
        const sessionUrl = await createCheckoutSession(uid, email, priceId, successUrl, cancelUrl, mode);
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
            const mode = session.mode; // 'subscription' or 'payment'

            if (mode === 'subscription') {
                // Update user to active subscription
                await db.collection('users').doc(userId).set({
                    subscriptionStatus: 'active',
                    stripeCustomerId: customerId,
                    credits: 1000, // Monthly allowance
                    planTier: 'pro'
                }, { merge: true });
            } else if (mode === 'payment') {
                // Handle One-Time Credit Packs & Reel Packs
                // Map Amount (in cents) to Credits or Reels
                const amount = session.amount_total;
                let creditsToAdd = 0;
                let reelsToAdd = 0;

                // Credit Packs (odd ending or specific values)
                if (amount === 499) creditsToAdd = 100;        // Starter
                else if (amount === 1999) creditsToAdd = 500;  // Pro
                else if (amount === 4999) creditsToAdd = 1500; // Studio

                // Reel Packs (Video Generation)
                else if (amount === 600) reelsToAdd = 600;     // Reels Starter
                else if (amount === 1500) reelsToAdd = 1500;   // Reels Creator
                else if (amount === 3500) reelsToAdd = 3600;   // Reels Pro (with bonus)
                else if (amount === 8500) reelsToAdd = 9000;   // Reels Studio (with bonus)

                if (creditsToAdd > 0) {
                    console.log(`Adding ${creditsToAdd} credits to user ${userId} for payment of $${amount / 100}`);
                    await db.collection('users').doc(userId).update({
                        credits: FieldValue.increment(creditsToAdd)
                    });
                } else if (reelsToAdd > 0) {
                    console.log(`Adding ${reelsToAdd} reels to user ${userId} for payment of $${amount / 100}`);
                    await db.collection('users').doc(userId).update({
                        reels: FieldValue.increment(reelsToAdd)
                    });
                } else {
                    console.warn(`Unknown payment amount: ${amount} for user ${userId}`);
                }
            }

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

export const serveSitemap = onRequest({
    cors: true,
    memory: "256MiB"
}, async (req, res) => {
    try {
        const db = getFirestore();
        const baseUrl = 'https://dreambeesai.com';

        // 1. Static Pages
        const staticPages = [
            '',
            '/generate',
            '/models',
            '/gallery',
            '/pricing',
            '/blog',
            '/about',
            '/features',
            '/contact',
            '/auth'
        ];

        let urls = staticPages.map(path => ({
            loc: `${baseUrl}${path}`,
            changefreq: 'daily',
            priority: path === '' ? '1.0' : '0.8'
        }));

        const modelsSnapshot = await db.collection('models').get();
        modelsSnapshot.forEach(doc => {
            urls.push({
                loc: `${baseUrl}/model/${doc.id}`,
                changefreq: 'weekly',
                priority: '0.7',
                lastmod: new Date().toISOString() // Or use implicit today
            });
        });

        // 3. Blog Posts (Hardcoded for now as data source is client-side static)
        const blogPosts = [
            { id: 'prompt-director-drift-evaluation', date: '2026-01-03' }
        ];

        blogPosts.forEach(post => {
            urls.push({
                loc: `${baseUrl}/blog/${post.id}`,
                changefreq: 'monthly',
                priority: '0.7',
                lastmod: new Date(post.date).toISOString()
            });
        });

        // 4. Construct XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        urls.forEach(url => {
            xml += `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
        });

        xml += `
</urlset>`;

        // 5. Send Response
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // Cache for 24h
        res.status(200).send(xml);

    } catch (error) {
        console.error("Error generating sitemap:", error);
        res.status(500).send("Error generating sitemap");
    }
});

// ============================================================================
// Generation Request Functions
// ============================================================================

export const createGenerationRequest = onCall(async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }

    const { prompt, negative_prompt, modelId, aspectRatio, steps, cfg, seed, scheduler } = request.data;

    // Input validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
        throw new HttpsError('invalid-argument', "Prompt is required and must be at least 5 characters");
    }

    if (!modelId || typeof modelId !== 'string') {
        throw new HttpsError('invalid-argument', "Model ID is required");
    }

    // Validate aspect ratio
    const validAspectRatios = ['1:1', '2:3', '3:2', '9:16', '16:9'];
    const safeAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    // Validate and clamp steps (10-50)
    let safeSteps = parseInt(steps) || 30;
    if (isNaN(safeSteps) || safeSteps < 10) safeSteps = 10;
    if (safeSteps > 50) safeSteps = 50;

    // Validate and clamp CFG (1-20)
    let safeCfg = parseFloat(cfg) || 7.0;
    if (isNaN(safeCfg) || safeCfg < 1) safeCfg = 1.0;
    if (safeCfg > 20) safeCfg = 20.0;

    // Validate seed (can be -1 for random or a number)
    let safeSeed = parseInt(seed) || -1;
    if (isNaN(safeSeed)) safeSeed = -1;

    try {
        // Create the generation queue entry
        const docRef = await db.collection('generation_queue').add({
            userId: uid,
            prompt: prompt.trim(),
            negative_prompt: negative_prompt || "",
            modelId: modelId,
            status: 'pending',
            aspectRatio: safeAspectRatio,
            steps: safeSteps,
            cfg: safeCfg,
            seed: safeSeed,
            scheduler: scheduler || 'DPM++ 2M Karras',
            createdAt: new Date()
        });

        return { requestId: docRef.id };
    } catch (error) {
        console.error("Error creating generation request:", error);
        throw new HttpsError('internal', "Failed to create generation request", error.message);
    }
});

// ============================================================================
// Image Management Functions
// ============================================================================

export const getUserImages = onCall(async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }

    const { limit: limitParam = 24, startAfterId, searchQuery } = request.data;
    const limit = Math.min(Math.max(parseInt(limitParam) || 24, 1), 100); // Between 1 and 100

    try {
        let query = db.collection('images')
            .where('userId', '==', uid)
            // .where('hidden', '!=', true) // Removed to avoid composite index requirement and "missing field" filtering
            .orderBy('createdAt', 'desc')
            .limit(limit);

        // Handle pagination
        if (startAfterId) {
            const startAfterDoc = await db.collection('images').doc(startAfterId).get();
            if (startAfterDoc.exists) {
                query = query.startAfter(startAfterDoc);
            }
        }

        const snapshot = await query.get();
        const images = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
        }));

        // Client-side search filtering if searchQuery provided
        let filteredImages = images;
        if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
            const queryLower = searchQuery.toLowerCase();
            filteredImages = images.filter(img =>
                img.prompt?.toLowerCase().includes(queryLower)
            );
        }

        // Filter hidden images in memory
        filteredImages = filteredImages.filter(img => img.hidden !== true);

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        const hasMore = snapshot.docs.length === limit;

        return {
            images: filteredImages,
            lastVisibleId: lastVisible?.id || null,
            hasMore: hasMore
        };
    } catch (error) {
        console.error("Error fetching user images:", error);
        throw new HttpsError('internal', "Failed to fetch images", error.message);
    }
});

export const getImageDetail = onCall(async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { imageId } = request.data;

    if (!imageId || typeof imageId !== 'string') {
        throw new Error("Image ID is required");
    }

    try {
        const imageDoc = await db.collection('images').doc(imageId).get();

        if (!imageDoc.exists) {
            throw new Error("Image not found");
        }

        const imageData = imageDoc.data();

        // Verify ownership
        if (imageData.userId !== uid) {
            throw new Error("Unauthorized: You don't have access to this image");
        }

        return {
            id: imageDoc.id,
            ...imageData,
            createdAt: imageData.createdAt?.toDate?.()?.toISOString() || imageData.createdAt
        };
    } catch (error) {
        console.error("Error fetching image detail:", error);
        if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
            throw error;
        }
        throw new Error("Failed to fetch image");
    }
});

export const deleteImage = onCall(async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { imageId } = request.data;

    if (!imageId || typeof imageId !== 'string') {
        throw new Error("Image ID is required");
    }

    try {
        const imageDoc = await db.collection('images').doc(imageId).get();

        if (!imageDoc.exists) {
            throw new Error("Image not found");
        }

        const imageData = imageDoc.data();

        // Verify ownership
        if (imageData.userId !== uid) {
            throw new Error("Unauthorized: You don't have permission to delete this image");
        }

        // Delete the image document
        await db.collection('images').doc(imageId).delete();

        return { success: true };
    } catch (error) {
        console.error("Error deleting image:", error);
        if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
            throw error;
        }
        throw new Error("Failed to delete image");
    }
});

export const deleteImagesBatch = onCall(async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { imageIds } = request.data;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
        throw new Error("Image IDs array is required");
    }

    if (imageIds.length > 50) {
        throw new Error("Cannot delete more than 50 images at once");
    }

    try {
        // Verify ownership of all images before deleting
        const imageDocs = await Promise.all(
            imageIds.map(id => db.collection('images').doc(id).get())
        );

        const unauthorized = [];
        const notFound = [];
        const valid = [];

        imageDocs.forEach((doc, index) => {
            if (!doc.exists) {
                notFound.push(imageIds[index]);
            } else if (doc.data().userId !== uid) {
                unauthorized.push(imageIds[index]);
            } else {
                valid.push(imageIds[index]);
            }
        });

        if (unauthorized.length > 0) {
            throw new Error(`Unauthorized: You don't have permission to delete ${unauthorized.length} image(s)`);
        }

        if (notFound.length > 0 && valid.length === 0) {
            throw new Error(`Images not found: ${notFound.join(', ')}`);
        }

        // Delete all valid images
        const batch = db.batch();
        valid.forEach(id => {
            batch.delete(db.collection('images').doc(id));
        });
        await batch.commit();

        return {
            success: true,
            deleted: valid.length,
            notFound: notFound.length,
            skipped: unauthorized.length
        };
    } catch (error) {
        console.error("Error deleting images batch:", error);
        if (error.message.includes("Unauthorized") || error.message.includes("not found")) {
            throw error;
        }
        throw new Error("Failed to delete images");
    }
});

// ============================================================================
// Rating Functions
// ============================================================================

export const rateGeneration = onCall(async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { jobId, rating } = request.data;

    if (!jobId || typeof jobId !== 'string') {
        throw new Error("Job ID is required");
    }

    if (rating !== 1 && rating !== -1) {
        throw new Error("Rating must be 1 (like) or -1 (dislike)");
    }

    try {
        // Get the job document
        const jobDoc = await db.collection('generation_queue').doc(jobId).get();

        if (!jobDoc.exists) {
            throw new Error("Generation job not found");
        }

        const jobData = jobDoc.data();

        // Verify ownership
        if (jobData.userId !== uid) {
            throw new Error("Unauthorized: You don't have permission to rate this generation");
        }

        const batch = db.batch();

        // Update generation queue
        const queueRef = db.collection('generation_queue').doc(jobId);
        batch.update(queueRef, {
            rating: rating,
            hidden: rating === -1
        });

        // Update images collection if resultImageId exists
        if (jobData.resultImageId) {
            const imageRef = db.collection('images').doc(jobData.resultImageId);
            batch.update(imageRef, {
                rating: rating,
                hidden: rating === -1
            });
        }

        // Create/update training feedback for MLOps
        const feedbackId = `feedback_${jobId}`;
        const feedbackRef = db.collection('training_feedback').doc(feedbackId);

        const resolutionMap = {
            '1:1': { width: 1024, height: 1024 },
            '2:3': { width: 832, height: 1216 },
            '3:2': { width: 1216, height: 832 },
            '9:16': { width: 768, height: 1344 },
            '16:9': { width: 1344, height: 768 }
        };
        const res = resolutionMap[jobData.aspectRatio] || resolutionMap['1:1'];

        // Deterministic split based on job ID
        const simpleHash = jobId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const split = (simpleHash % 100) < 90 ? 'train' : 'validation';

        const feedbackData = {
            _id: feedbackId,
            timestamp: new Date(),
            dataset_split: split,
            weight: 1.0,
            rating: rating,
            meta: {
                modelId: jobData.modelId,
                prompt_cleaned: jobData.prompt ? jobData.prompt.trim() : "",
                negative_prompt: jobData.negative_prompt || "",
                cfg: parseFloat(jobData.cfg) || 7.0,
                steps: parseInt(jobData.steps) || 30,
                seed: parseInt(jobData.seed) || -1,
                width: res.width,
                height: res.height,
                aspect_ratio_label: jobData.aspectRatio || '1:1'
            },
            asset_pointers: {
                image_url: jobData.imageUrl || "",
                gen_doc_path: `generation_queue/${jobId}`,
                user_id: jobData.userId
            }
        };

        batch.set(feedbackRef, feedbackData);

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error("Error rating generation:", error);
        if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
            throw error;
        }
        throw new Error("Failed to rate generation");
    }
});

export const rateShowcaseImage = onCall(async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { imageId, rating } = request.data;

    if (!imageId || typeof imageId !== 'string') {
        throw new Error("Image ID is required");
    }

    if (rating !== 1 && rating !== -1) {
        throw new Error("Rating must be 1 (like) or -1 (dislike)");
    }

    try {
        // Verify image exists
        const imageDoc = await db.collection('model_showcase_images').doc(imageId).get();

        if (!imageDoc.exists) {
            throw new Error("Showcase image not found");
        }

        // Update rating (no ownership check needed for showcase images - they're public)
        await db.collection('model_showcase_images').doc(imageId).update({
            rating: rating,
            ratingTimestamp: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error rating showcase image:", error);
        if (error.message.includes("not found")) {
            throw error;
        }
        throw new Error("Failed to rate showcase image");
    }
});

// ============================================================================
// History Functions
// ============================================================================

export const getGenerationHistory = onCall(async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }

    const { limit: limitParam = 20, startAfterId } = request.data;
    const limit = Math.min(Math.max(parseInt(limitParam) || 20, 1), 100); // Between 1 and 100

    try {
        let query = db.collection('generation_queue')
            .where('userId', '==', uid)
            .where('status', '==', 'completed')
            // .where('hidden', '!=', true) // Removed
            .orderBy('createdAt', 'desc')
            .limit(limit);

        // Handle pagination
        if (startAfterId) {
            const startAfterDoc = await db.collection('generation_queue').doc(startAfterId).get();
            if (startAfterDoc.exists) {
                query = query.startAfter(startAfterDoc);
            }
        }

        const snapshot = await query.get();
        const jobs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
        })).filter(job => job.hidden !== true); // Memory filter

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        const hasMore = snapshot.docs.length === limit;

        return {
            jobs: jobs,
            lastVisibleId: lastVisible?.id || null,
            hasMore: hasMore
        };
    } catch (error) {
        console.error("Error fetching generation history:", error);
        throw new HttpsError('internal', "Failed to fetch generation history", error.message);
    }
});
