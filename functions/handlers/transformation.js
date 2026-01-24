import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError, logger, retryOperation } from "../lib/utils.js";
import { enhancePromptWithGemini, transformImageWithGemini } from "../lib/ai.js";
import { VertexAI } from "@google-cloud/vertexai";

export const handleCreateAnalysisRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");
    const { image, imageUrl } = request.data;
    if (!image && !imageUrl) throw new HttpsError('invalid-argument', "Image required");

    const COST = 0.5;

    try {
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`);
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
        });

        const docRef = await db.collection('analysis_queue').add({ userId: uid, image: image || null, imageUrl: imageUrl || null, status: 'queued', createdAt: new Date() });

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
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");
    if (!request.data.prompt) throw new HttpsError('invalid-argument', "Prompt required");

    const COST = 1;

    try {
        await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`);
            t.update(userRef, { zaps: FieldValue.increment(-COST) });
        });

        const docRef = await db.collection('enhance_queue').add({ userId: uid, originalPrompt: request.data.prompt, status: 'queued', createdAt: new Date() });

        // Enqueue task to 'urgentWorker'
        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({
            taskType: 'enhance',
            requestId: docRef.id,
            userId: uid,
            originalPrompt: request.data.prompt,
            cost: COST
        });

        return { requestId: docRef.id };
    } catch (error) { throw handleError(error, { uid }); }
};

export const handleTransformPrompt = async (request) => {
    const { prompt, styleName, intensity, instructions } = request.data;
    if (!prompt) throw new HttpsError('invalid-argument', "Prompt required");
    try {
        const enhanced = await enhancePromptWithGemini(`${prompt}. Style: ${styleName}. Intensity: ${intensity}. ${instructions || ""}`);
        return { prompt: enhanced };
    } catch (error) { throw handleError(error); }
};

export const handleTransformImage = async (request) => {
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
            // Retry refund aggressively
            await retryOperation(() => db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }), { context: 'Refund Transform' })
                .catch(e => logger.error("Refund failed after retries", e, { uid }));
        }
        throw handleError(error, { uid });
    }
};

export const handleGenerateLyrics = async (request) => {
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
        // Retry refund aggressively
        await retryOperation(() => db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }), { context: 'Refund Lyrics' })
            .catch(e => logger.error("Refund failed after retries", e, { uid }));
        throw handleError(error, { uid });
    }
};

export const handleMeowaccTransform = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "Auth required");

    const { imageBase64, mimeType, mode, extraData } = request.data;
    if (!imageBase64) throw new HttpsError('invalid-argument', "Image data required");

    const COST = 0.5; // Standard transformation cost

    try {
        const userRef = db.collection('users').doc(uid);
        let userDisplayName = "DreamBees User";

        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

            const userData = userDoc.data();
            const zaps = userData.zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`);

            userDisplayName = userData.displayName || userData.username || "DreamBees User";

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
        });

        // Use the consolidated prompts
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
        if (mode === 'card') selectedPrompt = MEOWACC_CARD_PROMPT;
        else if (mode === 'sports') selectedPrompt = MEOWACC_SPORTS_PROMPT;
        else if (mode === 'sports_pro') selectedPrompt = MEOWACC_SPORTS_PRO_PROMPT;
        else if (mode === 'fifa') selectedPrompt = MEOWACC_FIFA_PROMPT;
        else if (mode === 'poster') selectedPrompt = MEOWACC_POSTER_PROMPT;
        else if (mode === 'ensemble') selectedPrompt = MEOWACC_ENSEMBLE_PROMPT;
        else if (mode === 'comic') selectedPrompt = MEOWACC_COMIC_PROMPT;
        else if (mode === 'tarot') selectedPrompt = MEOWACC_TAROT_PROMPT(extraData);
        else if (mode === 'meowd') selectedPrompt = MEOWACC_MEOWD_PROMPT;
        else if (mode === 'poker_single') selectedPrompt = generatePokerPrompt(extraData);

        // Call Vertex AI Gemeni 2.5 Flash Image via existing lib/ai.js or implement here
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
        if (response?.finishReason === 'SAFETY') throw new HttpsError('failed-precondition', "Blocked by safety filter.");

        const generatedImageBase64 = response?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!generatedImageBase64) throw new Error("No image data returned from AI");

        // --- Post-Processing & Feed Integration ---
        const { default: sharp } = await import("sharp");
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const { getS3Client } = await import("../lib/utils.js");
        const { B2_BUCKET, B2_PUBLIC_URL } = await import("../lib/constants.js");

        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        const sharpImg = sharp(imageBuffer);

        // 1. Generate versions
        const [webpBuffer, thumbBuffer, lqipBuffer] = await Promise.all([
            sharpImg.webp({ quality: 90 }).toBuffer(),
            sharpImg.resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
            sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer()
        ]);
        const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

        // 2. Upload to B2
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

        // 3. Save to Public Feed (generation_queue)
        const docRef = db.collection('generation_queue').doc();
        await docRef.set({
            userId: uid,
            userDisplayName,
            prompt: `[MEOWACC: ${mode}] ${selectedPrompt.substring(0, 100)}...`,
            modelId: 'meowacc',
            status: 'completed',
            imageUrl,
            thumbnailUrl,
            lqip,
            createdAt: FieldValue.serverTimestamp(),
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
