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

    try {
        const docRef = await db.collection('analysis_queue').add({ userId: uid, image: image || null, imageUrl: imageUrl || null, status: 'queued', createdAt: new Date() });

        // Enqueue task to 'universalWorker'
        await getFunctions().taskQueue('workers-universalWorker').enqueue({
            taskType: 'analysis',
            requestId: docRef.id,
            userId: uid,
            image: image || null,
            imageUrl: imageUrl || null
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
    try {
        const docRef = await db.collection('enhance_queue').add({ userId: uid, originalPrompt: request.data.prompt, status: 'queued', createdAt: new Date() });

        // Enqueue task to 'universalWorker'
        await getFunctions().taskQueue('workers-universalWorker').enqueue({
            taskType: 'enhance',
            requestId: docRef.id,
            userId: uid,
            originalPrompt: request.data.prompt
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
