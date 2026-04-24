import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError } from "../lib/utils.js";
import { enhancePromptWithGemini } from "../lib/ai.js";
import { CostManager } from "../lib/costs.js";
import { Billing } from "../lib/billing.js";
/**
 * Handle Create Analysis Request
 */
export const handleCreateAnalysisRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }
    const { image, imageUrl, requestId } = request.data;
    if (!image && !imageUrl) {
        throw new HttpsError('invalid-argument', "Image required");
    }
    const COST = await CostManager.get('IMAGE_ANALYSIS');
    try {
        const docRef = requestId ? db.collection('analysis_queue').doc(requestId) : db.collection('analysis_queue').doc();
        await Billing.runAtomic(uid, 'IMAGE_ANALYSIS', docRef.id, { type: 'analysis' }, async (t) => {
            const existing = await t.get(docRef);
            if (existing.exists) {
                return;
            }
            t.set(docRef, { userId: uid, image: image || null, imageUrl: imageUrl || null, status: 'queued', createdAt: FieldValue.serverTimestamp() });
        });
        await getFunctions().taskQueue('locations/us-central1/functions/backgroundWorker').enqueue({
            taskType: 'analysis',
            requestId: docRef.id,
            userId: uid,
            image: image || null,
            imageUrl: imageUrl || null,
            cost: COST
        });
        return { requestId: docRef.id };
    }
    catch (error) {
        throw handleError(error, { uid });
    }
};
/**
 * Handle Create Enhance Request
 */
export const handleCreateEnhanceRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }
    const { prompt, requestId } = request.data;
    if (!prompt) {
        throw new HttpsError('invalid-argument', "Prompt required");
    }
    const COST = await CostManager.get('IMAGE_ENHANCE');
    try {
        const docRef = requestId ? db.collection('enhance_queue').doc(requestId) : db.collection('enhance_queue').doc();
        await Billing.runAtomic(uid, 'IMAGE_ENHANCE', docRef.id, { type: 'enhance' }, async (t) => {
            const existing = await t.get(docRef);
            if (existing.exists) {
                return;
            }
            t.set(docRef, { userId: uid, originalPrompt: prompt, status: 'queued', createdAt: FieldValue.serverTimestamp() });
        });
        await getFunctions().taskQueue('locations/us-central1/functions/urgentWorker').enqueue({
            taskType: 'enhance',
            requestId: docRef.id,
            userId: uid,
            originalPrompt: prompt,
            cost: COST
        });
        return { requestId: docRef.id };
    }
    catch (error) {
        throw handleError(error, { uid });
    }
};
/**
 * Handle Transform Prompt
 */
export const handleTransformPrompt = async (request) => {
    const { prompt, styleName, intensity, instructions } = request.data;
    if (!prompt) {
        throw new HttpsError('invalid-argument', "Prompt required");
    }
    try {
        const enhanced = await enhancePromptWithGemini(`${prompt}. Style: ${styleName}. Intensity: ${intensity}. ${instructions || ""}`);
        return { prompt: enhanced };
    }
    catch (error) {
        throw handleError(error);
    }
};
/**
 * Handle Transform Image
 */
export const handleTransformImage = async (request) => {
    const { imageUrl, styleName, instructions, intensity, requestId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }
    try {
        if (requestId) {
            db.collection('action_logs').doc(requestId);
        }
        const { transformImageWithFlux } = await import("../lib/ai.js");
        const result = await transformImageWithFlux(imageUrl, styleName, instructions, intensity, uid);
        return result;
    }
    catch (error) {
        throw handleError(error, { uid });
    }
};
//# sourceMappingURL=transformation.js.map