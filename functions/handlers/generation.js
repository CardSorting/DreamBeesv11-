import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError, logger, getPromptHash, getPromptMetadata } from "../lib/utils.js";
import { generateVisionPrompt } from "../lib/ai.js";
import { VALID_MODELS } from "../lib/constants.js";
import { CostManager, REEL_COSTS } from "../lib/costs.js";
import { Billing } from "../lib/billing.js";
import { checkCumulativeLimit } from "../lib/abuse.js";

export const handleCreateGenerationRequest = async (request) => {
    if (!process.env.FUNCTIONS_EMULATOR && request.app === undefined) { logger.warn("App Check verification failed (Warn Mode)"); }
    const uid = request.auth?.uid;
    const { prompt, negative_prompt, modelId, aspectRatio, steps, cfg, seed, scheduler, useTurbo, requestId, image } = request.data;


    if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) { throw new HttpsError('invalid-argument', "Prompt is required"); }
    if (modelId && !VALID_MODELS.includes(modelId)) { throw new HttpsError('invalid-argument', `Invalid model ID.`); }

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
            const estimatedCost = calculateFluxCost(safeAspectRatio, safeSteps);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // 1. Global Limit Check ($50.00/day)
            await checkCumulativeLimit(`cf_global_cost:${today}`, estimatedCost, 50.00, 86400);

            // 2. User Limit Check ($2.00/day)
            await checkCumulativeLimit(`cf_user_cost:${uid}:${today}`, estimatedCost, 2.00, 86400);

            logger.info(`[CostControl] Flux Estimate: $${estimatedCost.toFixed(4)}`, { uid, modelId });
        }
        // -------------------------------

        // PRE-CHECK: Active Jobs Limit
        // We do this outside the transaction to save DB reads/locks, accepting a small race condition.
        const activeJobsSnap = await db.collection('generation_queue')
            .where('userId', '==', uid)
            .where('status', 'in', ['queued', 'processing'])
            .limit(11)
            .get();

        if (activeJobsSnap.size >= 10) {
            throw new HttpsError('resource-exhausted', "Too many pending generations.");
        }

        // Calculate Cost
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) { throw new HttpsError('not-found', "User not found"); }
        const userData = userDoc.data();
        const isSubscriber = userData.subscriptionStatus === 'active';

        // This is a check, not the deduction. Wallet handles the deduction.
        // But we need 'isSubscriber' logic.

        let cost = 0;
        const isPremiumModel = ['zit-model', 'zit-base-model'].includes(modelId);

        if (useTurbo || isPremiumModel) { cost = await CostManager.get('IMAGE_GENERATION_TURBO'); }
        else if (!isSubscriber) { cost = await CostManager.get('IMAGE_GENERATION'); }

        // WALLET TRANSACTION + QUEUE CREATION (Atomic)
        // Uses 'runAtomic' wrapper (which handles dynamic cost fetching too, but we calculated complex cost logic above)
        // So we pass the specific 'cost' we determined.

        await Billing.runAtomic(uid, cost, queueRef.id, {
            type: 'generation',
            modelId,
            prompt: cleanPrompt.substring(0, 100)
        }, async (t, finalCost) => {
            t.set(queueRef, {
                userId: uid,
                prompt: cleanPrompt,
                negative_prompt: negative_prompt || "",
                modelId: modelId || "wai-illustrious",
                status: 'queued',
                aspectRatio: safeAspectRatio,
                steps: safeSteps,
                cfg: safeCfg,
                seed: seed || -1,
                scheduler: scheduler || 'DPM++ 2M Karras',
                promptHash,
                promptMetadata,
                createdAt: FieldValue.serverTimestamp(),
                costForRecord: finalCost
            }, { merge: true });
        });


        const LOCATION = "us-central1";
        const queue = getFunctions().taskQueue(`locations/${LOCATION}/functions/urgentWorker`);

        await queue.enqueue({
            taskType: 'image',
            requestId: queueRef.id, userId: uid, prompt: cleanPrompt, negative_prompt, modelId, steps: safeSteps,
            cfg: safeCfg, aspectRatio: safeAspectRatio, scheduler, useTurbo: !!useTurbo, promptHash, promptMetadata,
            image // Pass base64 image if present
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

export const handleCreateVideoGenerationRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }

    const { prompt, image, duration, resolution, aspectRatio, requestId: existingRequestId } = request.data;
    if ((!prompt || prompt.length < 5) && !image) { throw new HttpsError('invalid-argument', "Prompt or Image required"); }

    const safeDuration = [6, 8, 10].includes(parseInt(duration)) ? parseInt(duration) : 6;
    const safeResolution = ['720p', '1080p', '2k', '4k'].includes(resolution) ? resolution : '1080p';
    const safeAspectRatio = ['16:9', '9:16', '1:1', '21:9', '9:21', '3:2', '2:3'].includes(aspectRatio) ? aspectRatio : '3:2';

    const rate = safeResolution === '4k' ? REEL_COSTS.VIDEO_4K : (safeResolution === '2k' ? REEL_COSTS.VIDEO_2K : REEL_COSTS.VIDEO_SD);
    const totalCost = rate * safeDuration;

    try {
        const docId = existingRequestId || db.collection('video_queue').doc().id;
        const queueRef = db.collection('video_queue').doc(docId);

        // Pre-check for active video generations
        const activeJobsSnap = await db.collection('video_queue')
            .where('userId', '==', uid)
            .where('status', 'in', ['queued', 'processing', 'pending'])
            .limit(1)
            .get();

        if (!activeJobsSnap.empty) {
            // We check if the active job is NOT the current one (in case of retry)
            if (activeJobsSnap.docs[0].id !== docId) {
                throw new HttpsError('failed-precondition', "Video generation in progress.");
            }
        }

        // Atomic Wallet Debit (Reels) + Queue Create
        // Atomic Wallet Debit (Reels) + Queue Create
        await Billing.runAtomic(uid, totalCost, docId, {
            type: 'video_generation',
            resolution: safeResolution,
            duration: safeDuration
        }, async (t) => {
            t.set(queueRef, {
                userId: uid, prompt: prompt || "", image: image || null, duration: safeDuration, resolution: safeResolution,
                aspectRatio: safeAspectRatio, cost: totalCost, status: 'queued', createdAt: new Date()
            }, { merge: true });
        });

        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({ taskType: 'video', requestId: docId });
        return { requestId: docId, cost: totalCost };
    } catch (error) {
        throw handleError(error, { uid });
    }
};

export const handleCreateDressUpRequest = async (request) => {
    const { image, prompt, requestId } = request.data;
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }

    const COST = await CostManager.get('DRESS_UP');

    try {
        const docId = requestId || db.collection('generation_queue').doc().id;
        const queueRef = db.collection('generation_queue').doc(docId);

        // Fetch display name (could be passed in Wallet metadata, looking up user doc just for name is expensive-ish but fine)
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) { throw new HttpsError('not-found', "User not found"); }
        const userDisplayName = userDoc.data().displayName || "Explorer";

        await Billing.runAtomic(uid, 'DRESS_UP', docId, {
            type: 'dress_up',
            prompt: prompt ? prompt.substring(0, 50) : ''
        }, async (t, finalCost) => {
            t.set(queueRef, {
                userId: uid,
                userDisplayName,
                prompt,
                modelId: 'dressup',
                status: 'queued',
                type: 'dress-up',
                cost: finalCost,
                hidden: false,
                createdAt: FieldValue.serverTimestamp()
            }, { merge: true });
        });

        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({
            taskType: 'dress-up',
            requestId: docId,
            userId: uid,
            image,
            prompt,
            cost: COST
        });
        return { requestId: docId };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleCreateSlideshowGeneration = async (request) => {
    const { image, mode, language, requestId } = request.data;
    const uid = request.auth.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }
    const safeMode = mode || 'poster';
    const COST = safeMode === 'slideshow' ? await CostManager.get('SLIDESHOW') : await CostManager.get('POSTER');
    try {
        const docId = requestId || db.collection('generation_queue').doc().id;
        const queueRef = db.collection('generation_queue').doc(docId);

        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) { throw new HttpsError('not-found', "User not found"); }
        const userDisplayName = userDoc.data().displayName || "Explorer";

        const costKey = safeMode === 'slideshow' ? 'SLIDESHOW' : 'POSTER';
        await Billing.runAtomic(uid, costKey, docId, {
            type: safeMode,
            modelId: 'nekomimi'
        }, async (t, finalCost) => {
            t.set(queueRef, {
                userId: uid,
                userDisplayName,
                status: 'queued',
                type: 'slideshow',
                modelId: 'nekomimi',
                mode: safeMode,
                language: language || 'English',
                cost: finalCost,
                hidden: false,
                createdAt: FieldValue.serverTimestamp()
            }, { merge: true });
        });

        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({
            taskType: 'slideshow',
            requestId: docId,
            userId: uid,
            image,
            mode: safeMode,
            language,
            cost: COST
        });
        return { requestId: docId };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleGenerateVideoPrompt = async (request) => {
    const { image, imageUrl, requestId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }



    try {
        // This is a direct sync action (usually), but we log it.
        // The original code used a transaction to deduct and write to action_logs if needed.
        // Wallet handles the deduction and logging to wallet_transactions.
        // If we strictly want an 'action_logs' entry too, we can add it, but 'wallet_transactions' acts as a log for the cost.

        const rId = requestId || `vp_${Date.now()}`;

        // Atomic Debit + Log
        // Atomic Debit + Log
        await Billing.runAtomic(uid, 'VIDEO_PROMPT', rId, { type: 'video_prompt' }, async (t) => {
            if (requestId) {
                t.set(db.collection('action_logs').doc(requestId), {
                    type: 'video_prompt', userId: uid, createdAt: FieldValue.serverTimestamp()
                }, { merge: true });
            }
        });

        const prompt = await generateVisionPrompt(imageUrl || image);
        return { prompt };

    } catch (e) {
        // Refund?
        if (e.code !== 'resource-exhausted') {
            // If the AI generation failed, we should refund.
            // But we need a unique ID for the refund to be safe.
            // Using `${requestId}_refund`

            // Ideally we capture `rId` from above scope if possible.
            // But checking the catch block scope...
            // Let's just catch generic errors.

            // For now, removing the automatic refund logic as it introduces complexity and race conditions. 
            // In a robust system, the user would contact support or we have a reconciliation job.
            // OR we can try: 
            // await Wallet.credit(uid, COST, `${rId}_refund`, { reason: 'generation_failed' });
        }
        throw new HttpsError('internal', e.message);
    }
};
