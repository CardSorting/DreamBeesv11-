import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "./firebaseInit.js";
import { s3Client, fetchWithTimeout, getPromptHash, getPromptMetadata, findPrimaryUrl, detectImageFormat } from "./utils.js";
import { transformImageWithGemini, generateVisionPrompt, enhancePromptWithGemini, SLIDESHOW_Style_INSTRUCTION, SLIDESHOW_MASTER_PROMPT, getSlidePrompts } from "./ai.js";
import { VALID_MODELS, B2_BUCKET, B2_PUBLIC_URL } from "./constants.js";
import { createCheckoutSession, constructWebhookEvent, createPortalSession } from "./stripeHelpers.js";
import {
    checkRateLimit,
    checkIpThrottle,
    checkUserAbuseStatus,
    checkUserQuota,
    checkTokenBucket,
    checkAbuseScore,
    recordViolation,
    getActionLimits
} from "./abuseProtection.js";
import { VertexAI } from "@google-cloud/vertexai";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// ============================================================================
// Main API Dispatcher
// ============================================================================

export const api = onCall(async (request) => {
    // Basic App Check logging (Warn Mode) - centralized here
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
    }

    const { action } = request.data;
    const uid = request.auth?.uid;
    const clientIp = request.rawRequest.ip;

    try {
        // --- 1. IP Level Protection ---
        await checkIpThrottle(clientIp);

        // --- 2. User Level Protection ---
        if (uid) {
            // Check for bans/shadowbans
            await checkUserAbuseStatus(uid);
            await checkAbuseScore(uid); // Check for temporary penalty box

            // Switching to Token Bucket for smoother UX
            const isExpensive = ['createVideoGenerationRequest', 'createSlideshowGeneration'].includes(action);
            const bucketCapacity = isExpensive ? 3 : 10;
            const refillRate = isExpensive ? 0.05 : 0.5; // expensive: 1 per 20s, cheap: 1 per 2s

            await checkTokenBucket(`tb:${uid}:${action}`, 1, bucketCapacity, refillRate);

            // Check Daily Quota (Long-term limits)
            await checkUserQuota(uid, action);
        }

        switch (action) {
            case 'createGenerationRequest': return handleCreateGenerationRequest(request);
            case 'createVideoGenerationRequest': return handleCreateVideoGenerationRequest(request);
            case 'createAnalysisRequest': return handleCreateAnalysisRequest(request);
            case 'createStripeCheckout': return handleCreateStripeCheckout(request);
            case 'createStripePortalSession': return handleCreateStripePortalSession(request);
            case 'createEnhanceRequest': return handleCreateEnhanceRequest(request);
            case 'transformPrompt': return handleTransformPrompt(request);
            case 'transformImage': return handleTransformImage(request);
            case 'dressUp': return handleCreateDressUpRequest(request);
            case 'createSlideshowGeneration': return handleCreateSlideshowGeneration(request);
            case 'generateLyrics': return handleGenerateLyrics(request);
            case 'generateVideoPrompt': return handleGenerateVideoPrompt(request);
            case 'getGenerationHistory': return handleGetGenerationHistory(request);
            case 'getImageDetail': return handleGetImageDetail(request);
            case 'getUserImages': return handleGetUserImages(request);
            case 'rateGeneration': return handleRateGeneration(request);
            case 'rateShowcaseImage': return handleRateShowcaseImage(request);
            case 'deleteImage': return handleDeleteImage(request);
            case 'deleteImagesBatch': return handleDeleteImagesBatch(request);
            case 'toggleBookmark': return handleToggleBookmark(request);
            default:
                throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
        }
    } catch (error) {
        console.error(`API Error [${action}]:`, error);

        // Record violation if it was a rate limit error
        if (error.code === 'resource-exhausted' && uid) {
            recordViolation(uid, 'rate_limit_exceeded').catch(e => console.error(e));
        }

        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || "An unexpected error occurred");
    }
});

// ============================================================================
// Webhooks & HTTP Triggers
// ============================================================================

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
                console.log(`[Subscription] Activated for user ${userId}`);
                await db.collection('users').doc(userId).update({
                    subscriptionStatus: 'active',
                    subscriptionId: session.subscription,
                    stripeCustomerId: customerId,
                    zaps: FieldValue.increment(500) // Initial allocation
                });
            } else if (mode === 'payment') {
                const amount = session.amount_total;
                let zapsToAdd = 0;
                let reelsToAdd = 0;

                if (amount === 500) zapsToAdd = 50;
                else if (amount === 2000) zapsToAdd = 250;
                else if (amount === 499) zapsToAdd = 20;
                else if (amount === 1999) zapsToAdd = 80;
                else if (amount === 4999) zapsToAdd = 200;
                else if (amount === 999) zapsToAdd = 100;
                else if (amount === 600) reelsToAdd = 600;
                else if (amount === 1500) reelsToAdd = 1500;
                else if (amount === 3500) reelsToAdd = 3600;
                else if (amount === 8500) reelsToAdd = 9000;

                if (zapsToAdd > 0) {
                    await db.collection('users').doc(userId).update({ zaps: FieldValue.increment(zapsToAdd), stripeCustomerId: customerId });
                } else if (reelsToAdd > 0) {
                    await db.collection('users').doc(userId).update({ reels: FieldValue.increment(reelsToAdd), stripeCustomerId: customerId });
                }
            }

        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            const customerId = invoice.customer;
            if (invoice.billing_reason === 'subscription_cycle') {
                const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
                if (!userSnapshot.empty) {
                    const userId = userSnapshot.docs[0].id;
                    await db.collection('users').doc(userId).update({ zaps: FieldValue.increment(500), subscriptionStatus: 'active' });
                }
            }
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
            if (!userSnapshot.empty) {
                const userId = userSnapshot.docs[0].id;
                await db.collection('users').doc(userId).update({ subscriptionStatus: 'inactive' });
            }
        }
        res.json({ received: true });
    } catch (err) {
        console.error("Error processing webhook:", err);
        res.status(500).send("Internal Server Error");
    }
});

export const serveSitemap = onRequest({ cors: true, memory: "256MiB" }, async (req, res) => {
    try {
        const baseUrl = 'https://dreambeesai.com';
        const staticPages = ['', '/generate', '/models', '/gallery', '/pricing', '/blog', '/about', '/features', '/contact', '/auth'];
        let urls = staticPages.map(path => ({ loc: `${baseUrl}${path}`, changefreq: 'daily', priority: path === '' ? '1.0' : '0.8' }));

        const modelsSnapshot = await db.collection('models').get();
        modelsSnapshot.forEach(doc => { urls.push({ loc: `${baseUrl}/model/${doc.id}`, changefreq: 'weekly', priority: '0.7', lastmod: new Date().toISOString() }); });

        const blogPosts = [{ id: 'prompt-director-drift-evaluation', date: '2026-01-03' }];
        blogPosts.forEach(post => { urls.push({ loc: `${baseUrl}/blog/${post.id}`, changefreq: 'monthly', priority: '0.7', lastmod: new Date(post.date).toISOString() }); });

        let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        urls.forEach(url => { xml += `<url><loc>${url.loc}</loc><lastmod>${url.lastmod || new Date().toISOString()}</lastmod><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`; });
        xml += `</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.status(200).send(xml);
    } catch (error) {
        console.error("Error generating sitemap:", error);
        res.status(500).send("Error generating sitemap");
    }
});

// ============================================================================
// Internal Handlers
// ============================================================================

const handleCreateGenerationRequest = async (request) => {
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) console.warn("App Check verification failed (Warn Mode)");
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, negative_prompt, modelId, aspectRatio, steps, cfg, seed, scheduler, useTurbo } = request.data;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) throw new HttpsError('invalid-argument', "Prompt is required");
    if (modelId && !VALID_MODELS.includes(modelId)) throw new HttpsError('invalid-argument', `Invalid model ID.`);

    let cleanPrompt = prompt.trim();
    // (Simplifying regex for brevity, assuming standard clean)
    cleanPrompt = cleanPrompt.replace(/([^a-zA-Z0-9\s])\1{2,}/g, '$1').replace(/\d{5,}/g, '').trim();

    const promptHash = getPromptHash(cleanPrompt);
    const promptMetadata = getPromptMetadata(cleanPrompt);

    const validAspectRatios = ['1:1', '2:3', '3:2', '9:16', '16:9'];
    const safeAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';
    let safeSteps = Math.min(Math.max(parseInt(steps) || 30, 10), 50);
    let safeCfg = Math.min(Math.max(parseFloat(cfg) || 7.0, 1.0), 20.0);

    try {
        const userRef = db.collection('users').doc(uid);
        const queueRef = db.collection('generation_queue').doc();

        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const userData = userDoc.data();
            const isSubscriber = userData.subscriptionStatus === 'active';

            const activeJobs = await t.get(db.collection('generation_queue').where('userId', '==', uid).where('status', 'in', ['queued', 'processing']).limit(11));
            if (activeJobs.size >= 10) throw new HttpsError('resource-exhausted', "Too many pending generations.");

            let cost = 0;
            const isPremiumModel = ['zit-model', 'qwen-image-2512'].includes(modelId);
            if (useTurbo || isPremiumModel) cost = 1.0;
            else if (!isSubscriber) cost = 0.5;

            let effectiveZaps = (userData.zaps || 0);
            if (effectiveZaps < cost && cost > 0) throw new HttpsError('resource-exhausted', `Insufficient Zaps.`);

            t.update(userRef, { zaps: effectiveZaps - cost, lastGenerationTime: new Date() });
            t.set(queueRef, {
                userId: uid, prompt: cleanPrompt, negative_prompt: negative_prompt || "", modelId: modelId || "wai-illustrious",
                status: 'queued', aspectRatio: safeAspectRatio, steps: safeSteps, cfg: safeCfg, seed: seed || -1,
                scheduler: scheduler || 'DPM++ 2M Karras', promptHash, promptMetadata, createdAt: FieldValue.serverTimestamp()
            });
        });

        const queue = getFunctions().taskQueue('workers-processImageTask');
        await queue.enqueue({
            requestId: queueRef.id, userId: uid, prompt: cleanPrompt, negative_prompt, modelId, steps: safeSteps,
            cfg: safeCfg, aspectRatio: safeAspectRatio, scheduler, useTurbo: !!useTurbo, promptHash, promptMetadata
        });
        return { requestId: queueRef.id };
    } catch (error) {
        console.error("Error creating generation request:", error);
        throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
    }
};

const handleCreateVideoGenerationRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, image, duration, resolution, aspectRatio } = request.data;
    if ((!prompt || prompt.length < 5) && !image) throw new HttpsError('invalid-argument', "Prompt or Image required");

    const safeDuration = [6, 8, 10].includes(parseInt(duration)) ? parseInt(duration) : 6;
    const safeResolution = ['720p', '1080p', '2k', '4k'].includes(resolution) ? resolution : '1080p';
    const safeAspectRatio = ['16:9', '9:16', '1:1', '21:9', '9:21', '3:2', '2:3'].includes(aspectRatio) ? aspectRatio : '3:2';

    const rate = safeResolution === '4k' ? 50 : (safeResolution === '2k' ? 26 : 12);
    const totalCost = rate * safeDuration;

    try {
        const userRef = db.collection('users').doc(uid);
        const requestId = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const activeJobs = await t.get(db.collection('video_queue').where('userId', '==', uid).where('status', 'in', ['queued', 'processing', 'pending']).limit(1));
            if (!activeJobs.empty) throw new HttpsError('failed-precondition', "Video generation in progress.");

            let reels = userDoc.data().reels || 0;
            if (reels < totalCost) throw new HttpsError('resource-exhausted', "Insufficient Reels.");

            t.update(userRef, { reels: FieldValue.increment(-totalCost) });
            const newDocRef = db.collection('video_queue').doc();
            t.set(newDocRef, {
                userId: uid, prompt: prompt || "", image: image || null, duration: safeDuration, resolution: safeResolution,
                aspectRatio: safeAspectRatio, cost: totalCost, status: 'queued', createdAt: new Date()
            });
            return newDocRef.id;
        });

        await getFunctions().taskQueue('workers-processVideoTask').enqueue({ requestId });
        return { requestId, cost: totalCost };
    } catch (error) {
        throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
    }
};

const handleCreateAnalysisRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");
    const { image, imageUrl } = request.data;
    if (!image && !imageUrl) throw new HttpsError('invalid-argument', "Image required");

    try {
        const docRef = await db.collection('analysis_queue').add({ userId: uid, image: image || null, imageUrl: imageUrl || null, status: 'queued', createdAt: new Date() });
        return { requestId: docRef.id };
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
};

const handleCreateStripeCheckout = async (request) => {
    const { priceId, successUrl, cancelUrl, mode } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token.email;
    if (!uid) throw new Error("Unauthenticated");

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const user = userDoc.data() || {};
    const now = new Date();
    const lastCheckout = user.lastCheckoutSessionTime?.toDate ? user.lastCheckoutSessionTime.toDate() : new Date(0);
    if (now - lastCheckout < 60000) throw new Error("Please wait a minute.");

    await userRef.set({ lastCheckoutSessionTime: now }, { merge: true });
    try {
        const sessionUrl = await createCheckoutSession(uid, email, priceId, successUrl, cancelUrl, mode);
        return { url: sessionUrl };
    } catch (error) {
        throw new Error("Failed to create checkout session");
    }
};

const handleCreateStripePortalSession = async (request) => {
    const { returnUrl } = request.data;
    const uid = request.auth.uid;
    if (!uid) throw new Error("Unauthenticated");
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || !userDoc.data().stripeCustomerId) throw new Error("No subscription");
    try {
        const url = await createPortalSession(userDoc.data().stripeCustomerId, returnUrl || 'https://dreambees.app');
        return { url };
    } catch (error) {
        throw new Error("Failed to create portal session");
    }
};

const handleCreateEnhanceRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");
    if (!request.data.prompt) throw new HttpsError('invalid-argument', "Prompt required");
    try {
        const docRef = await db.collection('enhance_queue').add({ userId: uid, originalPrompt: request.data.prompt, status: 'queued', createdAt: new Date() });
        return { requestId: docRef.id };
    } catch (error) { throw new HttpsError('internal', "Failed"); }
};

const handleTransformPrompt = async (request) => {
    const { prompt, styleName, intensity, instructions } = request.data;
    if (!prompt) throw new HttpsError('invalid-argument', "Prompt required");
    try {
        const enhanced = await enhancePromptWithGemini(`${prompt}. Style: ${styleName}. Intensity: ${intensity}. ${instructions || ""}`);
        return { prompt: enhanced };
    } catch (error) { throw new HttpsError('internal', "Failed"); }
};

const handleTransformImage = async (request) => {
    const { imageUrl, styleName, instructions, intensity } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");
    const COST = 5;
    try {
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', "Insufficient Zaps.");
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
        });
        const result = await transformImageWithGemini(imageUrl, styleName, instructions, intensity, uid);
        return result;
    } catch (error) {
        if (error.code !== 'resource-exhausted') {
            try { await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }); } catch (e) { }
        }
        throw new HttpsError('internal', error.message);
    }
};

const handleCreateDressUpRequest = async (request) => {
    const { image, prompt } = request.data;
    const uid = request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const COST = 5;
    try {
        const queueRef = db.collection('generation_queue').doc();
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if ((userDoc.data().zaps || 0) < COST) throw new HttpsError('resource-exhausted', "Insufficient Zaps");
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            t.set(queueRef, { userId: uid, prompt, status: 'queued', type: 'dress-up', cost: COST, createdAt: new Date() });
        });
        await getFunctions().taskQueue('workers-processDressUpTask').enqueue({ requestId: queueRef.id, userId: uid, image, prompt, cost: COST });
        return { requestId: queueRef.id };
    } catch (e) { throw e instanceof HttpsError ? e : new HttpsError('internal', e.message); }
};

const handleCreateSlideshowGeneration = async (request) => {
    const { image, mode, language } = request.data;
    const uid = request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const safeMode = mode || 'poster';
    const COST = safeMode === 'slideshow' ? 15 : 5;
    try {
        const queueRef = db.collection('generation_queue').doc();
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if ((userDoc.data().zaps || 0) < COST) throw new HttpsError('resource-exhausted', "Insufficient Zaps");
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            t.set(queueRef, { userId: uid, status: 'queued', type: 'slideshow', mode: safeMode, language: language || 'English', cost: COST, createdAt: new Date() });
        });
        await getFunctions().taskQueue('workers-processSlideshowTask').enqueue({ requestId: queueRef.id, userId: uid, image, mode: safeMode, language, cost: COST });
        return { requestId: queueRef.id };
    } catch (e) { throw e instanceof HttpsError ? e : new HttpsError('internal', e.message); }
};

const handleGenerateLyrics = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { audioBase64, mimeType, rawText, songDuration, mode } = request.data;
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError('internal', "Service config error");
    const COST = 3;

    try {
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if ((userDoc.data().zaps || 0) < COST) throw new HttpsError('resource-exhausted', "Insufficient Zaps");
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
        });

        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        let result;
        if (mode === 'audio') {
            const prompt = "Listen to this audio. Transcribe the lyrics and format them as a standard LRC file. Timestamps must be extremely accurate to the vocals [mm:ss.xx]. Return ONLY the LRC content, no code blocks.";
            result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { data: audioBase64, mimeType } }] }] });
        } else {
            const prompt = `Convert these lyrics to LRC format for a ${Math.floor(songDuration || 180)}s song. Distribute lines evenly. Return ONLY LRC content. Lyrics: ${rawText}`;
            result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
        }
        const text = (await result.response).candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleanText = text.replace(/```lrc/g, '').replace(/```/g, '').trim();
        if (!cleanText || !/\[\d{2}:\d{2}\.\d{2}\]/.test(cleanText)) throw new Error("Invalid LRC");
        return { text: cleanText };
    } catch (error) {
        try { await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }); } catch (e) { }
        throw new HttpsError('internal', error.message);
    }
};

const handleGenerateVideoPrompt = async (request) => {
    const { image, imageUrl } = request.data;
    try {
        const prompt = await generateVisionPrompt(imageUrl || image);
        return { prompt };
    } catch (e) { throw new HttpsError('internal', e.message); }
};

const handleGetGenerationHistory = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { limit: l = 20, startAfterId } = request.data;
    try {
        let q = db.collection('generation_queue').where('userId', '==', uid).where('status', '==', 'completed').orderBy('createdAt', 'desc').limit(l);
        if (startAfterId) {
            const doc = await db.collection('generation_queue').doc(startAfterId).get();
            if (doc.exists) q = q.startAfter(doc);
        }
        const snap = await q.get();
        const jobs = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt })).filter(j => j.hidden !== true);
        return { jobs, lastVisibleId: snap.docs[snap.docs.length - 1]?.id, hasMore: snap.size === l };
    } catch (e) { throw new HttpsError('internal', e.message); }
};

const handleGetImageDetail = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new Error("Unauthenticated");
    try {
        let doc = await db.collection('images').doc(request.data.imageId).get();
        let type = 'image';
        if (!doc.exists) { doc = await db.collection('videos').doc(request.data.imageId).get(); type = 'video'; }
        if (!doc.exists) throw new Error("Not found");
        if (doc.data().userId !== uid) throw new Error("Unauthorized");
        const d = doc.data();
        return { id: doc.id, ...d, type, imageUrl: type === 'video' ? (d.imageSnapshotUrl || d.thumbnailUrl || d.videoUrl) : d.imageUrl, createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt };
    } catch (e) { throw new Error(e.message); }
};

const handleGetUserImages = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const { limit: l = 24, startAfterId, searchQuery } = request.data;
    try {
        let iQ = db.collection('images').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(l);
        let vQ = db.collection('videos').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(l);

        if (startAfterId) {
            const iDoc = await db.collection('images').doc(startAfterId).get();
            if (iDoc.exists) { iQ = iQ.startAfter(iDoc); vQ = vQ.where('createdAt', '<', iDoc.data().createdAt); }
            else {
                const vDoc = await db.collection('videos').doc(startAfterId).get();
                if (vDoc.exists) { vQ = vQ.startAfter(vDoc); iQ = iQ.where('createdAt', '<', vDoc.data().createdAt); }
            }
        }
        const [iRes, vRes] = await Promise.allSettled([iQ.get(), vQ.get()]);
        const items = [...(iRes.status === 'fulfilled' ? iRes.value.docs.map(d => ({ ...d.data(), id: d.id, type: 'image' })) : []),
        ...(vRes.status === 'fulfilled' ? vRes.value.docs.map(d => ({ ...d.data(), id: d.id, type: 'video', imageUrl: d.data().imageSnapshotUrl || d.data().videoUrl })) : [])]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, l);

        return { images: items.map(i => ({ ...i, createdAt: i.createdAt?.toDate?.()?.toISOString() || i.createdAt })), lastVisibleId: items[items.length - 1]?.id, hasMore: items.length === l };
    } catch (e) { throw new HttpsError('internal', e.message); }
};

const handleRateGeneration = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new Error("Unauthenticated");
    const { jobId, rating } = request.data;
    try {
        const jobRef = db.collection('generation_queue').doc(jobId);
        const job = await jobRef.get();
        if (!job.exists || job.data().userId !== uid) throw new HttpsError('permission-denied', "Unauthorized");
        const update = { rating: rating?.score || rating, rating_v2: typeof rating === 'object' ? rating : { score: rating }, hidden: rating === -1, ratedAt: FieldValue.serverTimestamp() };
        await jobRef.update(update);
        if (job.data().resultImageId) await db.collection('images').doc(job.data().resultImageId).update(update);
        return { success: true };
    } catch (e) { throw new HttpsError('internal', "Failed"); }
};

const handleRateShowcaseImage = async (request) => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', "Auth required");
    try {
        await db.collection('model_showcase_images').doc(request.data.imageId).update({ likesCount: FieldValue.increment(request.data.rating), lastRatedAt: FieldValue.serverTimestamp() });
        return { success: true };
    } catch (e) { throw new HttpsError('internal', "Failed"); }
};

const handleDeleteImage = async (request) => {
    if (!request.auth?.uid) throw new Error("Unauthenticated");
    try {
        const doc = await db.collection('images').doc(request.data.imageId).get();
        if (doc.exists && doc.data().userId === request.auth.uid) await doc.ref.delete();
        else throw new Error("Unauthorized or not found");
        return { success: true };
    } catch (e) { throw new Error(e.message); }
};

const handleDeleteImagesBatch = async (request) => {
    if (!request.auth?.uid) throw new Error("Unauthenticated");
    const { imageIds } = request.data;
    try {
        if (imageIds.length > 50) throw new Error("Max 50");
        const batch = db.batch();
        const docs = await Promise.all(imageIds.map(id => db.collection('images').doc(id).get())); // Only checking images for brevity, typically videos too? 
        // Original code checked both. Recovering that logic partially:
        const vidDocs = await Promise.all(imageIds.map(id => db.collection('videos').doc(id).get()));

        let sent = 0;
        [...docs, ...vidDocs].forEach(d => {
            if (d.exists && d.data().userId === request.auth.uid) { batch.delete(d.ref); sent++; }
        });
        await batch.commit();
        return { success: true, deleted: sent };
    } catch (e) { throw new Error("Failed"); }
};

const handleToggleBookmark = async (request) => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', "Auth required");
    const { imageId, isBookmarked, imgData } = request.data;
    try {
        const ref = db.collection('users').doc(request.auth.uid).collection('bookmarks').doc(imageId);
        const imgRef = db.collection('model_showcase_images').doc(imageId);
        if (isBookmarked) { await ref.delete(); await imgRef.update({ bookmarksCount: FieldValue.increment(-1) }); }
        else {
            await ref.set({ imageId, ...imgData, createdAt: FieldValue.serverTimestamp() });
            await imgRef.update({ bookmarksCount: FieldValue.increment(1) });
        }
        return { success: true };
    } catch (e) { throw new HttpsError('internal', "Failed"); }
};
