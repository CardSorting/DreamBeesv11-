import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { handleError, logger } from "../lib/utils.js";
// Core orchestration layer
import { ImageGenerationOrchestrator } from "../core/ImageGenerationOrchestrator.js";
/**
 * HANDLER: Create Generation Request (Infrastructure Layer)
 *
 * This handler provides Firebase-specific concerns and coordination:
 * - Auth/AuthN/AuthZ
 * - Task queue submission
 * - Error handling
 *
 * BUSINESS LOGIC delegated to ImageGenerationOrchestrator (Core Layer)
 */
export const handleCreateGenerationRequest = async (request) => {
    // 1. Firebase-specific validation
    if (!process.env.FUNCTIONS_EMULATOR && request.app === undefined) {
        logger.warn("App Check verification failed (Warn Mode)");
    }
    if (!request.auth) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }
    const uid = request.auth.uid;
    const initiatorUid = uid; // Track initiator for security
    // Allow system/admin to submit on behalf of specific user
    const data = request.data;
    const callerRole = request.auth.token?.role || 'user';
    const finalUid = (['admin', 'system'].includes(callerRole) && data.targetUserId) ? data.targetUserId : uid;
    if (!finalUid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }
    // 2. Add Firebase-specific context to request
    const firebaseContext = {
        ...data,
        idempotencyKey: data.idempotencyKey || null,
        auth: {
            uid: initiatorUid,
            token: { role: callerRole }
        }
    };
    try {
        // 3. Delegate to Core orchestrator for business logic
        const result = await ImageGenerationOrchestrator.handleRequest(firebaseContext, db);
        // Check if orchestrator returned an error (properly typed check)
        const errorResult = result;
        if (errorResult.status) {
            throw new HttpsError('internal', errorResult.error || 'Generation failed');
        }
        // 4. Return Firebase-specific response (result is guaranteed to be GenerationResult here - type guard passed)
        const generatedResult = result;
        const requestId = generatedResult.requestId;
        // Queue worker task without blocking response (inline retry + recovery fallback)
        enqueueGenerationTaskWithRetry(requestId, firebaseContext, finalUid).catch((enqueueErr) => {
            logger.error(`[Generation Handler] Enqueue failed for ${requestId}`, enqueueErr);
        });
        return {
            requestId
        };
    }
    catch (error) {
        logger.error(`[Generation Handler] Error for user ${uid}:`, error);
        throw handleError(error, { uid, modelId: data.modelId });
    }
};
const ENQUEUE_MAX_ATTEMPTS = 2;
async function enqueueGenerationTaskWithRetry(requestId, ctx, userId) {
    const existing = await db.collection('generation_queue').doc(requestId).get();
    if (existing.exists && existing.data()?.enqueuedAt && !existing.data()?.enqueueError) {
        return;
    }
    let lastError;
    for (let attempt = 1; attempt <= ENQUEUE_MAX_ATTEMPTS; attempt++) {
        try {
            await enqueueGenerationTask(requestId, ctx, userId);
            await db.collection('generation_queue').doc(requestId).update({
                enqueuedAt: FieldValue.serverTimestamp(),
                enqueueAttempts: attempt
            }).catch(() => { });
            return;
        }
        catch (err) {
            lastError = err;
            logger.warn(`[Generation Handler] Enqueue attempt ${attempt} failed for ${requestId}`, err);
        }
    }
    await db.collection('generation_queue').doc(requestId).update({
        enqueueError: lastError instanceof Error ? lastError.message : 'Enqueue failed',
        lastEnqueueAttempt: FieldValue.serverTimestamp()
    }).catch(() => { });
    throw lastError;
}
/**
 * Help: Enqueue generation task for worker (Infrastructure)
 */
async function enqueueGenerationTask(requestId, ctx, userId) {
    const { prompt, negative_prompt, modelId, steps, cfg, aspectRatio, scheduler, image } = ctx;
    const taskData = {
        taskType: 'image',
        requestId,
        userId,
        prompt,
        negative_prompt,
        modelId: modelId || "wai-illustrious",
        steps: steps || 30,
        cfg: cfg || 7.0,
        aspectRatio: aspectRatio || "1:1",
        scheduler: scheduler || 'DPM++ 2M Karras',
        image
    };
    const LOCATION = "us-central1";
    const queue = getFunctions().taskQueue(`locations/${LOCATION}/functions/urgentWorker`);
    await queue.enqueue(taskData);
}
//# sourceMappingURL=generation.js.map