import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError, logger, getPromptHash, getPromptMetadata } from "../lib/utils.js";
import { generateVisionPrompt, SLIDESHOW_MASTER_PROMPT } from "../lib/ai.js";
import { VALID_MODELS } from "../lib/constants.js";
import { ZAP_COSTS, REEL_COSTS } from "../lib/costs.js";
import { randomUUID } from 'crypto';

export const handleCreateGenerationRequest = async (request) => {
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) logger.warn("App Check verification failed (Warn Mode)");
    let uid = request.auth?.uid;
    const { prompt, negative_prompt, modelId, aspectRatio, steps, cfg, seed, scheduler, useTurbo, requestId } = request.data;

    // Allow unauthenticated GalMix requests
    if (!uid && modelId === 'galmix') {
        uid = `anonymous-galmix-${randomUUID()}`;
    }

    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) throw new HttpsError('invalid-argument', "Prompt is required");
    if (modelId && !VALID_MODELS.includes(modelId)) throw new HttpsError('invalid-argument', `Invalid model ID.`);

    let cleanPrompt = prompt.trim();
    cleanPrompt = cleanPrompt.replace(/([^a-zA-Z0-9\s])\1{2,}/g, '$1').replace(/\d{5,}/g, '').trim();

    const promptHash = getPromptHash(cleanPrompt);
    const promptMetadata = getPromptMetadata(cleanPrompt);

    const validAspectRatios = ['1:1', '2:3', '3:2', '9:16', '16:9'];
    const safeAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';
    const safeSteps = Math.min(Math.max(parseInt(steps) || 30, 10), 50);
    const safeCfg = Math.min(Math.max(parseFloat(cfg) || 7.0, 1.0), 20.0);

    try {

        const queueRef = requestId ? db.collection('generation_queue').doc(requestId) : db.collection('generation_queue').doc();

        // --- Cloudflare Cost Control ---
        if (modelId === 'flux-2-dev') {
            const { calculateFluxCost } = await import("../lib/costs.js"); // Moved to costs.js or keep local
            const { checkCumulativeLimit } = await import("../lib/abuse.js");
            const estimatedCost = calculateFluxCost(safeAspectRatio, safeSteps);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // 1. Global Limit Check ($50.00/day)
            await checkCumulativeLimit(`cf_global_cost:${today}`, estimatedCost, 50.00, 86400);

            // 2. User Limit Check ($2.00/day)
            await checkCumulativeLimit(`cf_user_cost:${uid}:${today}`, estimatedCost, 2.00, 86400);

            logger.info(`[CostControl] Flux Estimate: $${estimatedCost.toFixed(4)}`, { uid, modelId });
        }
        // -------------------------------

        if (uid.startsWith('anonymous-galmix')) {
            // Anonymous Path: No Zap deduction, no user doc optimization
            await queueRef.set({
                userId: uid, prompt: cleanPrompt, negative_prompt: negative_prompt || "", modelId: modelId || "galmix",
                status: 'queued', aspectRatio: safeAspectRatio, steps: safeSteps, cfg: safeCfg, seed: seed || -1,
                scheduler: scheduler || 'DPM++ 2M Karras', promptHash, promptMetadata, createdAt: FieldValue.serverTimestamp()
            }, { merge: true }); // Merge in case it already exists but we want to be safe
        } else {
            // Authenticated Path: Transaction for Zaps
            const userRef = db.collection('users').doc(uid);

            await db.runTransaction(async (t) => {
                const userDoc = await t.get(userRef);
                if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

                // Idempotency check
                const existingJob = await t.get(queueRef);
                if (existingJob.exists) {
                    logger.info("Idempotent generation request", { uid, requestId });
                    return;
                }

                const userData = userDoc.data();
                const isSubscriber = userData.subscriptionStatus === 'active';

                const activeJobs = await t.get(db.collection('generation_queue').where('userId', '==', uid).where('status', 'in', ['queued', 'processing']).limit(11));
                if (activeJobs.size >= 10) throw new HttpsError('resource-exhausted', "Too many pending generations.");

                let cost = 0;
                const isPremiumModel = ['zit-model', 'zit-base-model'].includes(modelId);
                const isFreeModel = ['galmix'].includes(modelId);

                if (isFreeModel) cost = ZAP_COSTS.IMAGE_GENERATION_FREE;
                else if (useTurbo || isPremiumModel) cost = ZAP_COSTS.IMAGE_GENERATION_TURBO;
                else if (!isSubscriber) cost = ZAP_COSTS.IMAGE_GENERATION;

                const effectiveZaps = (userData.zaps || 0);
                if (effectiveZaps < cost && cost > 0) throw new HttpsError('resource-exhausted', `Insufficient Zaps.`);

                if (cost > 0) t.update(userRef, { zaps: FieldValue.increment(-cost), lastGenerationTime: FieldValue.serverTimestamp() });

                t.set(queueRef, {
                    userId: uid, prompt: cleanPrompt, negative_prompt: negative_prompt || "", modelId: modelId || "wai-illustrious",
                    status: 'queued', aspectRatio: safeAspectRatio, steps: safeSteps, cfg: safeCfg, seed: seed || -1,
                    scheduler: scheduler || 'DPM++ 2M Karras', promptHash, promptMetadata, createdAt: FieldValue.serverTimestamp()
                });
            });
        }

        const LOCATION = "us-central1";
        const queue = getFunctions().taskQueue(`locations/${LOCATION}/functions/urgentWorker`);

        await queue.enqueue({
            taskType: 'image',
            requestId: queueRef.id, userId: uid, prompt: cleanPrompt, negative_prompt, modelId, steps: safeSteps,
            cfg: safeCfg, aspectRatio: safeAspectRatio, scheduler, useTurbo: !!useTurbo, promptHash, promptMetadata
        });
        return { requestId: queueRef.id };
    } catch (error) {
        throw handleError(error, { uid, modelId });
    }
};

// Helper: Calculate Flux Cost
function calculateFluxCost(aspectRatio, steps) {
    // Unit Pricing: $0.00021 per input 512x512 tile/step, $0.00041 per output 512x512 tile/step
    // Simplified approximation: 
    // Average resolution ~1MP (1024x1024) = 4 tiles (512x512)
    // Input cost ~0 (negligible for text)
    // Output cost = 4 tiles * step_count * $0.00041

    const tileMap = {
        '1:1': 4, // 1024x1024
        '2:3': 4, // 832x1216 ~4
        '3:2': 4,
        '9:16': 4,
        '16:9': 4
    };

    const tiles = tileMap[aspectRatio] || 4;
    const s = steps || 20;

    // $0.00041 per tile per step
    return tiles * s * 0.00041;
}

import { checkCumulativeLimit } from "../lib/abuse.js";


export const handleCreateVideoGenerationRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, image, duration, resolution, aspectRatio, requestId: existingRequestId } = request.data;
    if ((!prompt || prompt.length < 5) && !image) throw new HttpsError('invalid-argument', "Prompt or Image required");

    const safeDuration = [6, 8, 10].includes(parseInt(duration)) ? parseInt(duration) : 6;
    const safeResolution = ['720p', '1080p', '2k', '4k'].includes(resolution) ? resolution : '1080p';
    const safeAspectRatio = ['16:9', '9:16', '1:1', '21:9', '9:21', '3:2', '2:3'].includes(aspectRatio) ? aspectRatio : '3:2';

    const rate = safeResolution === '4k' ? REEL_COSTS.VIDEO_4K : (safeResolution === '2k' ? REEL_COSTS.VIDEO_2K : REEL_COSTS.VIDEO_SD);
    const totalCost = rate * safeDuration;

    try {
        const userRef = db.collection('users').doc(uid);
        const requestId = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

            const newDocRef = existingRequestId ? db.collection('video_queue').doc(existingRequestId) : db.collection('video_queue').doc();

            const existingJob = await t.get(newDocRef);
            if (existingJob.exists) return newDocRef.id;

            const activeJobs = await t.get(db.collection('video_queue').where('userId', '==', uid).where('status', 'in', ['queued', 'processing', 'pending']).limit(1));
            if (!activeJobs.empty) throw new HttpsError('failed-precondition', "Video generation in progress.");

            const reels = userDoc.data().reels || 0;
            if (reels < totalCost) throw new HttpsError('resource-exhausted', "Insufficient Reels.");

            t.update(userRef, { reels: FieldValue.increment(-totalCost) });
            t.set(newDocRef, {
                userId: uid, prompt: prompt || "", image: image || null, duration: safeDuration, resolution: safeResolution,
                aspectRatio: safeAspectRatio, cost: totalCost, status: 'queued', createdAt: new Date()
            });
            return newDocRef.id;
        });

        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({ taskType: 'video', requestId });
        return { requestId, cost: totalCost };
    } catch (error) {
        throw handleError(error, { uid });
    }
};

export const handleCreateDressUpRequest = async (request) => {
    const { image, prompt, requestId } = request.data;
    const uid = request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");

    const COST = ZAP_COSTS.DRESS_UP;

    try {
        const queueRef = requestId ? db.collection('generation_queue').doc(requestId) : db.collection('generation_queue').doc();
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

            const existingJob = await t.get(queueRef);
            if (existingJob.exists) return;

            const userData = userDoc.data();
            const userDisplayName = userData.displayName || "Explorer";

            if ((userData.zaps || 0) < COST) throw new HttpsError('resource-exhausted', "Insufficient Zaps");

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            t.set(queueRef, {
                userId: uid,
                userDisplayName,
                prompt,
                modelId: 'dressup',
                status: 'queued',
                type: 'dress-up',
                cost: COST,
                hidden: false,
                createdAt: FieldValue.serverTimestamp()
            });
        });

        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({
            taskType: 'dress-up',
            requestId: queueRef.id,
            userId: uid,
            image,
            prompt,
            cost: COST
        });
        return { requestId: queueRef.id };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleCreateSlideshowGeneration = async (request) => {
    const { image, mode, language, requestId } = request.data;
    const uid = request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");
    const safeMode = mode || 'poster';
    const COST = safeMode === 'slideshow' ? ZAP_COSTS.SLIDESHOW : ZAP_COSTS.POSTER;
    try {
        const queueRef = requestId ? db.collection('generation_queue').doc(requestId) : db.collection('generation_queue').doc();
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

            const existingJob = await t.get(queueRef);
            if (existingJob.exists) return;

            const userData = userDoc.data();
            const userDisplayName = userData.displayName || "Explorer";

            if ((userData.zaps || 0) < COST) throw new HttpsError('resource-exhausted', "Insufficient Zaps");

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            t.set(queueRef, {
                userId: uid,
                userDisplayName,
                status: 'queued',
                type: 'slideshow',
                modelId: 'nekomimi',
                mode: safeMode,
                language: language || 'English',
                cost: COST,
                hidden: false,
                createdAt: FieldValue.serverTimestamp()
            });
        });
        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({
            taskType: 'slideshow',
            requestId: queueRef.id,
            userId: uid,
            image,
            mode: safeMode,
            language,
            cost: COST
        });
        return { requestId: queueRef.id };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleGenerateVideoPrompt = async (request) => {
    const { image, imageUrl, requestId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const COST = ZAP_COSTS.VIDEO_PROMPT;

    try {
        const logRef = requestId ? db.collection('action_logs').doc(requestId) : null;

        // Deduct Zaps
        await db.runTransaction(async (t) => {
            if (logRef) {
                const existing = await t.get(logRef);
                if (existing.exists) return;
            }

            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`);

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            if (logRef) t.set(logRef, { type: 'video_prompt', userId: uid, createdAt: FieldValue.serverTimestamp() });
        });

        const prompt = await generateVisionPrompt(imageUrl || image);
        return { prompt };

    } catch (e) {
        // Only refund if we deduced but then the AI call failed
        // Wait, if we use a transaction it's hard to refund "after".
        // The original code had a manual refund in the catch block. 
        // With idempotency, we should be careful.
        if (e.code !== 'resource-exhausted') {
            await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }).catch(err => logger.error("Refund failed", err));
        }
        throw new HttpsError('internal', e.message);
    }
};
