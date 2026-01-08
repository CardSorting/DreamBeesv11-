import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createCheckoutSession, constructWebhookEvent, createPortalSession } from "./stripeHelpers.js";
import Replicate from "replicate";
import sharp from "sharp";

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

// Image Generation Worker (onTaskDispatched)
export const processImageTask = onTaskDispatched(
    {
        retryConfig: { maxAttempts: 3, minBackoffSeconds: 60 },
        rateLimits: { maxConcurrentDispatches: 5 }, // Higher limit for images
        memory: "1GiB",
        timeoutSeconds: 300,
    },
    async (req) => {
        const { requestId, userId, prompt, negative_prompt, modelId, steps, cfg, aspectRatio, scheduler } = req.data;
        const db = getFirestore();
        const docRef = db.collection("generation_queue").doc(requestId);

        try {
            await docRef.update({ status: "processing" });

            // Resolution mapping
            const resolutionMap = {
                '1:1': { width: 1024, height: 1024 },
                '2:3': { width: 832, height: 1216 },
                '3:2': { width: 1216, height: 832 },
                '9:16': { width: 768, height: 1344 },
                '16:9': { width: 1344, height: 768 }
            };
            const resolution = resolutionMap[aspectRatio] || resolutionMap['1:1'];

            let buffer;
            if (modelId === 'zit-model') {
                const zBody = {
                    prompt, steps,
                    ...((['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'].includes(aspectRatio)) ? { aspect_ratio: aspectRatio } : { width: resolution.width, height: resolution.height })
                };
                const resp = await fetch("https://cardsorting--zit-only-fastapi-app.modal.run/generate", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(zBody)
                });
                if (!resp.ok) throw new Error(`ZIT Error: ${await resp.text()}`);
                buffer = Buffer.from(await resp.arrayBuffer());
            } else if (modelId === 'qwen-image-2512') {
                const resp = await fetch("https://cardsorting--qwen-image-2512-qwenimage-api-generate.modal.run", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, negative_prompt, aspect_ratio: aspectRatio })
                });
                if (!resp.ok) throw new Error(`Qwen Error: ${await resp.text()}`);
                buffer = Buffer.from(await resp.arrayBuffer());
            } else {
                const params = new URLSearchParams({
                    prompt, model: modelId || "cat-carrier", negative_prompt,
                    steps: steps.toString(), cfg: cfg.toString(),
                    width: resolution.width.toString(), height: resolution.height.toString(),
                    scheduler: scheduler || 'DPM++ 2M Karras'
                });
                const resp = await fetch(`https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${params.toString()}`);
                if (!resp.ok) throw new Error(`Model Error: ${await resp.text()}`);
                buffer = Buffer.from(await resp.arrayBuffer());
            }

            // Process Image with Sharp
            const sharpImg = sharp(buffer);

            // 1. Convert Original to WebP
            const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();

            // 2. Create Thumbnail (e.g., 512px width)
            const thumbBuffer = await sharpImg
                .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            // 3. Create LQIP (Low Quality Image Placeholder - 20px)
            const lqipBuffer = await sharpImg
                .resize(20, 20, { fit: 'inside' })
                .webp({ quality: 20 })
                .toBuffer();
            const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

            // Upload to B2
            const baseFolder = `generated/${userId}/${Date.now()}`;
            const originalFilename = `${baseFolder}.webp`;
            const thumbFilename = `${baseFolder}_thumb.webp`;

            // Parallel upload
            await Promise.all([
                s3Client.send(new PutObjectCommand({
                    Bucket: B2_BUCKET,
                    Key: originalFilename,
                    Body: webpBuffer,
                    ContentType: "image/webp"
                })),
                s3Client.send(new PutObjectCommand({
                    Bucket: B2_BUCKET,
                    Key: thumbFilename,
                    Body: thumbBuffer,
                    ContentType: "image/webp"
                }))
            ]);

            const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
            const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

            // Save result
            const imageRef = await db.collection("images").add({
                userId,
                prompt,
                negative_prompt,
                steps,
                cfg,
                aspectRatio,
                modelId,
                imageUrl,
                thumbnailUrl, // Add thumbnail URL
                lqip, // Add LQIP
                createdAt: new Date(),
                originalRequestId: requestId
            });

            await docRef.update({
                status: "completed",
                imageUrl,
                thumbnailUrl, // Update queue doc too
                lqip, // Add LQIP
                completedAt: new Date(),
                resultImageId: imageRef.id
            });

        } catch (error) {
            console.error("Task Failed:", error);
            await docRef.update({ status: "failed", error: error.message });
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
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
    }

    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, negative_prompt, modelId, aspectRatio, steps, cfg, seed, scheduler } = request.data;

    // --- Input Validation & Cleaning ---
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
        throw new HttpsError('invalid-argument', "Prompt is required and must be at least 5 characters");
    }

    let cleanPrompt = prompt.trim();
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    if ((cleanPrompt.match(emojiRegex) || []).length > 5) {
        cleanPrompt = cleanPrompt.replace(emojiRegex, '');
    }
    cleanPrompt = cleanPrompt.replace(/([^a-zA-Z0-9\s])\1{2,}/g, '$1').replace(/\d{5,}/g, '').trim();
    if (cleanPrompt.length < 5) throw new HttpsError('invalid-argument', "Prompt failed safety cleaning");

    const validAspectRatios = ['1:1', '2:3', '3:2', '9:16', '16:9'];
    const safeAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';
    let safeSteps = Math.min(Math.max(parseInt(steps) || 30, 10), 50);
    let safeCfg = Math.min(Math.max(parseFloat(cfg) || 7.0, 1.0), 20.0);

    try {
        const userRef = db.collection('users').doc(uid);

        // Atomic Credit/Daily Reset Transaction
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

            const userData = userDoc.data();
            const now = new Date();
            const lastReset = userData.lastDailyReset?.toDate?.() || new Date(0);
            const isPro = userData.subscriptionStatus === 'active';

            const userUpdate = { lastGenerationTime: now };

            // Daily Reset
            if (now - lastReset > 24 * 60 * 60 * 1000) {
                userUpdate.lastDailyReset = now;
                if ((userData.credits || 0) < 5) userUpdate.credits = 5;
            }

            // check rate limit (10s)
            const lastGen = userData.lastGenerationTime?.toDate?.() || new Date(0);
            if (now - lastGen < 10000) throw new HttpsError('resource-exhausted', "Please wait 10 seconds between generations.");

            // Deduct credits
            const currentCredits = userUpdate.credits !== undefined ? userUpdate.credits : (userData.credits || 0);
            if (!isPro) {
                if (currentCredits < 1) throw new HttpsError('resource-exhausted', "Insufficient credits");
                userUpdate.credits = (userUpdate.credits || userData.credits) - 1;
            }

            t.update(userRef, userUpdate);
        });

        // 1. Create entry in queue
        const docRef = await db.collection('generation_queue').add({
            userId: uid,
            prompt: cleanPrompt,
            negative_prompt: negative_prompt || "",
            modelId: modelId || "cat-carrier",
            status: 'queued',
            aspectRatio: safeAspectRatio,
            steps: safeSteps,
            cfg: safeCfg,
            seed: seed || -1,
            scheduler: scheduler || 'DPM++ 2M Karras',
            createdAt: new Date()
        });

        // 2. Enqueue Task
        const queue = getFunctions().taskQueue('processImageTask');
        await queue.enqueue({
            requestId: docRef.id, userId: uid, prompt: cleanPrompt, negative_prompt,
            modelId, steps: safeSteps, cfg: safeCfg, aspectRatio: safeAspectRatio, scheduler
        });

        return { requestId: docRef.id };
    } catch (error) {
        console.error("Error creating generation request:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', "Failed to create generation request", error.message);
    }
});

// ============================================================================
// Image Management Functions
// ============================================================================

export const getUserImages = onCall(async (request) => {
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }

    const { limit: limitParam = 24, startAfterId, startAfterCollection, searchQuery } = request.data;
    const limit = Math.min(Math.max(parseInt(limitParam) || 24, 1), 100);

    try {
        let imageQuery = db.collection('images')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        let videoQuery = db.collection('videos')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        // Handle pagination
        if (startAfterId) {
            let cursorDoc = null;
            let cursorType = startAfterCollection;

            // If we have a hint, try that first
            if (cursorType === 'image') {
                const snap = await db.collection('images').doc(startAfterId).get();
                if (snap.exists) cursorDoc = snap;
            } else if (cursorType === 'video') {
                const snap = await db.collection('videos').doc(startAfterId).get();
                if (snap.exists) cursorDoc = snap;
            }

            // Fallback: If no hint or hint failed, try discovery
            if (!cursorDoc) {
                const [imgSnap, vidSnap] = await Promise.all([
                    db.collection('images').doc(startAfterId).get(),
                    db.collection('videos').doc(startAfterId).get()
                ]);
                if (imgSnap.exists) {
                    cursorDoc = imgSnap;
                    cursorType = 'image';
                } else if (vidSnap.exists) {
                    cursorDoc = vidSnap;
                    cursorType = 'video';
                }
            }

            if (cursorDoc) {
                const cursorDate = cursorDoc.data().createdAt;
                if (cursorType === 'image') {
                    imageQuery = imageQuery.startAfter(cursorDoc);
                    videoQuery = videoQuery.where('createdAt', '<', cursorDate);
                } else {
                    videoQuery = videoQuery.startAfter(cursorDoc);
                    imageQuery = imageQuery.where('createdAt', '<', cursorDate);
                }
            }
        }

        // Use Promise.allSettled for "Degraded Mode" resilience
        const [imageRes, videoRes] = await Promise.allSettled([
            imageQuery.get(),
            videoQuery.get()
        ]);

        const warnings = [];
        let imageItems = [];
        let videoItems = [];

        if (imageRes.status === 'fulfilled') {
            imageItems = imageRes.value.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'image',
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
            }));
        } else {
            console.error("Image collection fetch failed:", imageRes.reason);
            warnings.push("Images temporarily unavailable");
        }

        if (videoRes.status === 'fulfilled') {
            videoItems = videoRes.value.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'video',
                imageUrl: doc.data().imageSnapshotUrl || doc.data().videoUrl,
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
            }));
        } else {
            console.error("Video collection fetch failed:", videoRes.reason);
            warnings.push("Videos temporarily unavailable");
        }

        let allItems = [...imageItems, ...videoItems];

        // Search filtering (Client-sideish for now)
        if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
            const queryLower = searchQuery.toLowerCase();
            allItems = allItems.filter(item =>
                item.prompt?.toLowerCase().includes(queryLower)
            );
        }

        allItems = allItems.filter(item => item.hidden !== true);
        allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const pagedItems = allItems.slice(0, limit);
        const lastVisible = pagedItems[pagedItems.length - 1];

        return {
            images: pagedItems,
            lastVisibleId: lastVisible?.id || null,
            lastVisibleType: lastVisible?.type || null, // Hint for next page
            hasMore: pagedItems.length === limit,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    } catch (error) {
        console.error("Error fetching user gallery:", error);
        throw new HttpsError('internal', "Failed to fetch gallery", error.message);
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
        // Check both collections in parallel
        // Optimization: We could guess based on ID format if distinct, but simpler to just check.
        // Actually, checking existence efficiently:
        // We will fetch all from 'images' and 'videos' using getAll (if supported) or individual gets.
        // Since we have max 50, individual gets or parallel checks are fine.

        const checks = await Promise.all(imageIds.map(async (id) => {
            const imgDoc = await db.collection('images').doc(id).get();
            if (imgDoc.exists) return { type: 'image', doc: imgDoc };

            const vidDoc = await db.collection('videos').doc(id).get();
            if (vidDoc.exists) return { type: 'video', doc: vidDoc };

            return null;
        }));

        const unauthorized = [];
        const notFound = [];
        const valid = []; // { id, ref }

        checks.forEach((result, index) => {
            const id = imageIds[index];
            if (!result) {
                notFound.push(id);
            } else {
                const data = result.doc.data();
                if (data.userId !== uid) {
                    unauthorized.push(id);
                } else {
                    valid.push({ id, ref: result.doc.ref });
                }
            }
        });

        if (unauthorized.length > 0) {
            throw new Error(`Unauthorized: You don't have permission to delete ${unauthorized.length} item(s)`);
        }

        if (notFound.length > 0 && valid.length === 0) {
            // If some found, we proceed with deleting them (partial success logic?) 
            // Original code threw if ALL were not found, but proceeded if mixed? 
            // "if (notFound.length > 0 && valid.length === 0)" -> throws only if NOTHING valid.
            // If mixed, we proceed.
            throw new Error(`Items not found: ${notFound.join(', ')}`);
        }

        // Delete all valid items
        const batch = db.batch();
        valid.forEach(item => {
            batch.delete(item.ref);
        });
        await batch.commit();

        return {
            success: true,
            deleted: valid.length,
            notFound: notFound.length,
            skipped: unauthorized.length
        };
    } catch (error) {
        console.error("Error deleting items batch:", error);
        if (error.message.includes("Unauthorized") || error.message.includes("not found")) {
            throw error;
        }
        throw new Error("Failed to delete items");
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

// ============================================================================
// Video Generation Functions (Reels)
// ============================================================================

// Video Generation Worker
export const processVideoTask = onTaskDispatched(
    {
        timeoutSeconds: 540,
        memory: "2GiB",
        retryConfig: {
            maxAttempts: 2,
            minBackoffSeconds: 30,
        }
    },
    async (request) => {
        const { requestId } = request.data;
        if (!requestId) return;

        const docRef = db.collection('video_queue').doc(requestId);
        const snapshot = await docRef.get();
        if (!snapshot.exists) return;

        const data = snapshot.data();
        if (data.status === "completed" || data.status === "failed") return;

        try {
            // Note: In the new async flow, we expect the prompt to be already analyzed or provided.
            // If it's still empty but autoPrompt was true, we fallback to a safe error or use provided image description.
            let finalPrompt = data.prompt;

            if (!finalPrompt || finalPrompt.length < 5) {
                if (data.image) {
                    // We really should have an analyzed prompt by now. 
                    // If not, we fail and ask user to use the analysis tool first.
                    throw new Error("No prompt provided. Please use the Auto-Prompt tool first for image-to-video.");
                } else {
                    throw new Error("Generation prompt is empty or too short.");
                }
            }

            await docRef.update({ status: "processing" });

            const replicate = new Replicate({
                auth: process.env.REPLICATE_API_TOKEN,
            });

            const input = {
                prompt: finalPrompt,
                duration: data.duration,
                resolution: data.resolution,
                aspectRatio: data.aspectRatio,
                generate_audio: true
            };

            if (data.image) input.image = data.image;

            console.log(`Executing Replicate job for ${requestId}...`);
            const output = await replicate.run("lightricks/ltx-2-pro", { input });

            let videoUrl = output;
            if (output && typeof output.url === 'function') {
                videoUrl = output.url();
            }

            if (!videoUrl || typeof videoUrl !== 'string') {
                throw new Error("No video URL returned from AI model");
            }

            // Download and Persist to B2
            console.log(`Saving result to B2 for ${requestId}...`);
            const response = await fetch(videoUrl);
            if (!response.ok) throw new Error(`Replicate Download Error: ${response.statusText}`);
            const buffer = Buffer.from(await response.arrayBuffer());

            const filename = `videos/${data.userId}/${Date.now()}.mp4`;
            await s3Client.send(new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: filename,
                Body: buffer,
                ContentType: "video/mp4",
            }));

            const b2Url = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${filename}`;

            // Finalize
            const videoDoc = {
                userId: data.userId,
                prompt: finalPrompt,
                videoUrl: b2Url,
                duration: data.duration,
                resolution: data.resolution,
                cost: data.cost,
                createdAt: new Date(),
                originalRequestId: requestId
            };

            const videoRef = await db.collection("videos").add(videoDoc);

            await docRef.update({
                status: "completed",
                videoUrl: b2Url,
                completedAt: new Date(),
                resultVideoId: videoRef.id
            });

        } catch (error) {
            console.error(`Task Failed for ${requestId}:`, error);

            // Refund logic
            try {
                const userRef = db.collection('users').doc(data.userId);
                await db.runTransaction(async (t) => {
                    t.update(userRef, { reels: FieldValue.increment(data.cost) });
                });
                console.log(`Refunded ${data.cost} reels to ${data.userId}`);
            } catch (refundError) {
                console.error("Refund Error:", refundError);
            }

            await docRef.update({
                status: "failed",
                error: error.message
            });
        }
    }
);





// ============================================================================
// Asynchronous Image Analysis Queue
// ============================================================================

// Helper for Vision Prompt Generation
async function generateVisionPrompt(imageUrl) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set");
    }

    const PROMPT_GUIDELINES = `
Single continuous paragraph: Write the entire scene as one unbroken paragraph, using straightforward descriptive language, maintaining strict chronological flow from start to finish.
Present-tense action verbs: Use active present tense (strides, grips, approaches) and present-progressive forms (running, walking) to create immediacy and ongoing motion.
Explicit camera behavior: Specify shot type (wide/medium/close-up), camera movement (pushes in/dollies/pans), speed (slowly/rapidly), and technical details (rack focus/shallow depth of field/handheld).
Precise physical details: Include specific measurements where relevant (2mm eyebrow raise), exact body positions, hand/finger placements, facial micro-expressions, and clothing/fabric behavior.
Atmospheric environment: Describe lighting quality (golden hour/fluorescent/neon), color temperatures, weather conditions, surface textures, and ambient elements that enhance mood.
Smooth temporal flow: Connect actions with subtle transitions (as, while, then) ensuring each movement naturally leads to the next without jarring cuts.
Genre-specific language: Use cinematography terms appropriate to the stated style (documentary authenticity, thriller paranoia, epic grandeur).
Character specificity: Include age, ethnicity, distinguishing features, clothing, and emotional states shown through observable physical manifestations rather than internal thoughts.
`;

    let imageContentUrl = "";
    if (imageUrl.trim().startsWith('http')) {
        imageContentUrl = imageUrl;
    } else if (imageUrl.trim().startsWith('data:')) {
        imageContentUrl = imageUrl;
    } else {
        imageContentUrl = `data:image/png;base64,${imageUrl}`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dreambees.app",
            "X-Title": "DreamBees"
        },
        body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze the image and write a video generation prompt based on these guidelines:\n" + PROMPT_GUIDELINES },
                        { type: "image_url", image_url: { url: imageContentUrl } }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

export const createAnalysisRequest = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { image, imageUrl } = request.data;
    if (!image && !imageUrl) {
        throw new HttpsError('invalid-argument', "Image data or URL is required");
    }

    try {
        const docRef = await db.collection('analysis_queue').add({
            userId: uid,
            image: image || null,
            imageUrl: imageUrl || null,
            status: 'queued',
            createdAt: new Date()
        });
        return { requestId: docRef.id };
    } catch (error) {
        console.error("Analysis Request Error:", error);
        throw new HttpsError('internal', "Failed to create analysis request");
    }
});

export const onAnalysisQueueCreated = onDocumentCreated("analysis_queue/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const requestId = event.params.requestId;

    try {
        await snapshot.ref.update({ status: 'analyzing' });

        const prompt = await generateVisionPrompt(data.imageUrl || data.image);

        await snapshot.ref.update({
            status: 'completed',
            prompt: prompt,
            completedAt: new Date()
        });
    } catch (error) {
        console.error(`Analysis failed for ${requestId}:`, error);
        await snapshot.ref.update({
            status: 'failed',
            error: error.message
        });
    }
});

// Deprecated blocking function - keep for compatibility for a few cycles
export const generateVideoPrompt = onCall(async (request) => {
    const { image, imageUrl } = request.data;
    try {
        const prompt = await generateVisionPrompt(imageUrl || image);
        return { prompt };
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
});

export const createVideoGenerationRequest = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, image, duration, resolution, aspectRatio } = request.data;
    if (!prompt || prompt.length < 5) throw new HttpsError('invalid-argument', "Prompt required");

    let safeDuration = Math.min(Math.max(parseInt(duration) || 6, 5), 20);
    const rate = resolution === '4k' ? 72 : (resolution === '2k' ? 36 : 18);
    const totalCost = rate * safeDuration;

    try {
        const userRef = db.collection('users').doc(uid);

        const requestId = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

            const activeJobs = await db.collection('video_queue')
                .where('userId', '==', uid)
                .where('status', 'in', ['queued', 'processing', 'pending'])
                .limit(1).get();
            if (!activeJobs.empty) throw new HttpsError('failed-precondition', "Generation already in progress.");

            const currentReels = userDoc.data().reels || 0;
            if (currentReels < totalCost) throw new HttpsError('resource-exhausted', "Insufficient Reels");

            t.update(userRef, { reels: FieldValue.increment(-totalCost) });

            const newDocRef = db.collection('video_queue').doc();
            t.set(newDocRef, {
                userId: uid,
                prompt: prompt.trim(),
                image: image || null,
                duration: safeDuration,
                resolution: resolution || '1080p',
                aspectRatio: aspectRatio || null,
                cost: totalCost,
                status: 'queued',
                createdAt: new Date()
            });

            return newDocRef.id;
        });

        const queue = getFunctions().taskQueue('processVideoTask');
        await queue.enqueue({ requestId });

        return { requestId, cost: totalCost };
    } catch (error) {
        console.error("Video Request Error:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', "Failed to create video request", error.message);
    }
});
