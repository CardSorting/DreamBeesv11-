import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError, logger, getPromptHash, getPromptMetadata } from "../lib/utils.js";
import { generateVisionPrompt, SLIDESHOW_MASTER_PROMPT } from "../lib/ai.js";
import { VALID_MODELS } from "../lib/constants.js";

export const handleCreateGenerationRequest = async (request) => {
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) logger.warn("App Check verification failed (Warn Mode)");
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, negative_prompt, modelId, aspectRatio, steps, cfg, seed, scheduler, useTurbo } = request.data;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) throw new HttpsError('invalid-argument', "Prompt is required");
    if (modelId && !VALID_MODELS.includes(modelId)) throw new HttpsError('invalid-argument', `Invalid model ID.`);

    let cleanPrompt = prompt.trim();
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

export const handleCreateVideoGenerationRequest = async (request) => {
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

        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({ taskType: 'video', requestId });
        return { requestId, cost: totalCost };
    } catch (error) {
        throw handleError(error, { uid });
    }
};

export const handleCreateDressUpRequest = async (request) => {
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
        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({ taskType: 'dress-up', requestId: queueRef.id, userId: uid, image, prompt, cost: COST });
        return { requestId: queueRef.id };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleCreateSlideshowGeneration = async (request) => {
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
        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({ taskType: 'slideshow', requestId: queueRef.id, userId: uid, image, mode: safeMode, language, cost: COST });
        return { requestId: queueRef.id };
    } catch (e) { throw handleError(e, { uid }); }
};

export const handleGenerateVideoPrompt = async (request) => {
    const { image, imageUrl } = request.data;
    try {
        const prompt = await generateVisionPrompt(imageUrl || image);
        return { prompt };
    } catch (e) { throw new HttpsError('internal', e.message); }
};
