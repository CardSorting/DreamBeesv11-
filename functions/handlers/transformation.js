import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError, logger, retryOperation } from "../lib/utils.js";
import { enhancePromptWithGemini, transformImageWithGemini } from "../lib/ai.js";
// [REMOVED] import { HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import { ZAP_COSTS } from "../lib/costs.js";
// [REMOVED] import { vertexFlow } from "../lib/vertexFlow.js";

export const handleCreateAnalysisRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }
    const { image, imageUrl, requestId } = request.data;
    if (!image && !imageUrl) { throw new HttpsError('invalid-argument', "Image required"); }

    const COST = ZAP_COSTS.IMAGE_ANALYSIS;

    try {
        const docRef = requestId ? db.collection('analysis_queue').doc(requestId) : db.collection('analysis_queue').doc();

        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) { throw new HttpsError('not-found', "User not found"); }

            const existing = await t.get(docRef);
            if (existing.exists) { return; }

            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) { throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`); }

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            t.set(docRef, { userId: uid, image: image || null, imageUrl: imageUrl || null, status: 'queued', createdAt: FieldValue.serverTimestamp() });
        });

        // Enqueue task to 'backgroundWorker'
        await getFunctions().taskQueue('locations/us-central1/functions/backgroundWorker').enqueue({
            taskType: 'analysis',
            requestId: docRef.id,
            userId: uid,
            image: image || null,
            imageUrl: imageUrl || null,
            cost: COST // Pass cost for refund if needed
        });

        return { requestId: docRef.id };
    } catch (error) {
        throw handleError(error, { uid });
    }
};

export const handleCreateEnhanceRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }
    const { prompt, requestId } = request.data;
    if (!prompt) { throw new HttpsError('invalid-argument', "Prompt required"); }

    const COST = ZAP_COSTS.IMAGE_ENHANCE;

    try {
        const docRef = requestId ? db.collection('enhance_queue').doc(requestId) : db.collection('enhance_queue').doc();

        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) { throw new HttpsError('not-found', "User not found"); }

            const existing = await t.get(docRef);
            if (existing.exists) { return; }

            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) { throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`); }

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            t.set(docRef, { userId: uid, originalPrompt: prompt, status: 'queued', createdAt: FieldValue.serverTimestamp() });
        });

        // Enqueue task to 'urgentWorker'
        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({
            taskType: 'enhance',
            requestId: docRef.id,
            userId: uid,
            originalPrompt: prompt,
            cost: COST
        });

        return { requestId: docRef.id };
    } catch (error) { throw handleError(error, { uid }); }
};

export const handleTransformPrompt = async (request) => {
    const { prompt, styleName, intensity, instructions } = request.data;
    if (!prompt) { throw new HttpsError('invalid-argument', "Prompt required"); }
    try {
        const enhanced = await enhancePromptWithGemini(
            `${prompt}. Style: ${styleName}. Intensity: ${intensity}. ${instructions || ""}`
        );
        return { prompt: enhanced };
    } catch (error) { throw handleError(error); }
};

export const handleTransformImage = async (request) => {
    const { imageUrl, styleName, instructions, intensity, requestId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }
    const COST = ZAP_COSTS.IMAGE_TRANSFORM;
    try {
        const logRef = requestId ? db.collection('action_logs').doc(requestId) : null;

        await db.runTransaction(async (t) => {
            if (logRef) {
                const existing = await t.get(logRef);
                if (existing.exists) { return; }
            }

            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) { throw new HttpsError('not-found', "User not found"); }
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) { throw new HttpsError('resource-exhausted', "Insufficient Zaps."); }

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            if (logRef) { t.set(logRef, { type: 'transform_image', userId: uid, createdAt: FieldValue.serverTimestamp() }); }
        });
        const result = await transformImageWithGemini(imageUrl, styleName, instructions, intensity, uid);
        return result;
    } catch (error) {
        if (error.code !== 'resource-exhausted') {
            // Retry refund aggressively
            await retryOperation(() => db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }), { context: 'Refund Transform' })
                .catch(e => logger.error("Refund failed after retries", e, { uid }));
        }
        throw handleError(error, { uid });
    }
};


export const handleMeowaccTransform = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "Auth required"); }

    const { imageBase64, mimeType, mode, extraData, requestId } = request.data;
    if (!imageBase64) { throw new HttpsError('invalid-argument', "Image data required"); }

    const COST = ZAP_COSTS.MEOWACC;

    try {
        const queueRef = requestId ? db.collection('generation_queue').doc(requestId) : db.collection('generation_queue').doc();
        const userRef = db.collection('users').doc(uid);
        let userDisplayName = "DreamBees User";

        let alreadyExists = false;
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) { throw new HttpsError('not-found', "User not found"); }

            const existing = await t.get(queueRef);
            if (existing.exists) {
                alreadyExists = true;
                return;
            }

            const userData = userDoc.data();
            const zaps = userData.zaps || 0;
            if (zaps < COST) { throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`); }

            userDisplayName = userData.displayName || userData.username || "DreamBees User";

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            // We'll set the initial doc to prevent double charging
            t.set(queueRef, {
                userId: uid,
                status: 'processing',
                type: 'meowacc',
                createdAt: FieldValue.serverTimestamp()
            });
        });

        if (alreadyExists) { return { success: true, idempotent: true }; }

        const {
            MEOWACC_PROMPT,
            MEOWACC_CARD_PROMPT,
            MEOWACC_SPORTS_PROMPT,
            MEOWACC_SPORTS_PRO_PROMPT,
            MEOWACC_FIFA_PROMPT,
            MEOWACC_POSTER_PROMPT,
            MEOWACC_ENSEMBLE_PROMPT,
            MEOWACC_COMIC_PROMPT,
            MEOWACC_TAROT_PROMPT,
            MEOWACC_MEOWD_PROMPT,
            generatePokerPrompt
        } = await import("../lib/meowaccPrompts.js");

        let selectedPrompt = MEOWACC_PROMPT;
        if (mode === 'card') { selectedPrompt = MEOWACC_CARD_PROMPT; }
        else if (mode === 'sports') { selectedPrompt = MEOWACC_SPORTS_PROMPT; }
        else if (mode === 'sports_pro') { selectedPrompt = MEOWACC_SPORTS_PRO_PROMPT; }
        else if (mode === 'fifa') { selectedPrompt = MEOWACC_FIFA_PROMPT; }
        else if (mode === 'poster') { selectedPrompt = MEOWACC_POSTER_PROMPT; }
        else if (mode === 'ensemble') { selectedPrompt = MEOWACC_ENSEMBLE_PROMPT; }
        else if (mode === 'comic') { selectedPrompt = MEOWACC_COMIC_PROMPT; }
        else if (mode === 'tarot') { selectedPrompt = MEOWACC_TAROT_PROMPT(extraData); }
        else if (mode === 'meowd') { selectedPrompt = MEOWACC_MEOWD_PROMPT; }
        else if (mode === 'poker_single') { selectedPrompt = generatePokerPrompt(extraData); }

        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: selectedPrompt },
                    { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } }
                ]
            }]
        });

        const response = (await result.response).candidates?.[0];
        if (response?.finishReason === 'SAFETY') { throw new HttpsError('failed-precondition', "Blocked by safety filter."); }

        const generatedImageBase64 = response?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!generatedImageBase64) { throw new Error("No image data returned from AI"); }

        const { default: sharp } = await import("sharp");
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const { getS3Client } = await import("../lib/utils.js");
        const { B2_BUCKET, B2_PUBLIC_URL } = await import("../lib/constants.js");

        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        const sharpImg = sharp(imageBuffer);

        const [webpBuffer, thumbBuffer, lqipBuffer] = await Promise.all([
            sharpImg.webp({ quality: 90 }).toBuffer(),
            sharpImg.resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
            sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer()
        ]);
        const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

        const timestamp = Date.now();
        const baseFolder = `generated/${uid}/meowacc_${timestamp}`;
        const originalFilename = `${baseFolder}.webp`;
        const thumbFilename = `${baseFolder}_thumb.webp`;

        const s3 = await getS3Client();
        await Promise.all([
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename, Body: webpBuffer, ContentType: "image/webp" })),
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename, Body: thumbBuffer, ContentType: "image/webp" }))
        ]);

        const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

        await queueRef.update({
            userDisplayName,
            prompt: `[MEOWACC: ${mode}] ${selectedPrompt.substring(0, 100)}...`,
            modelId: 'meowacc',
            status: 'completed',
            imageUrl,
            thumbnailUrl,
            lqip,
            completedAt: FieldValue.serverTimestamp(),
            hidden: false
        });

        // 4. Also save to user's images for private collection consistency
        await db.collection("images").add({
            userId: uid,
            prompt: `[MEOWACC: ${mode}]`,
            modelId: 'meowacc',
            imageUrl,
            thumbnailUrl,
            lqip,
            createdAt: FieldValue.serverTimestamp(),
            type: 'meowacc'
        });

        return { imageBase64: generatedImageBase64, imageUrl, thumbnailUrl };

    } catch (error) {
        // Refund on failure
        if (error.code !== 'resource-exhausted') {
            await retryOperation(() => db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }), { context: 'Refund MeowAcc' })
                .catch(e => logger.error("Refund failed", e, { uid }));
        }
        throw handleError(error, { uid });
    }
};
