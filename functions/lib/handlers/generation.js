import { HttpsError } from "firebase-functions/v2/https";
import { db, getFunctions } from "../firebaseInit.js";
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
        auth: {
            uid: initiatorUid,
            token: { role: callerRole }
        }
    };
    try {
        // 3. Delegate to Core orchestrator for business logic
        const result = await ImageGenerationOrchestrator.handleRequest(firebaseContext, db, callerRole === 'premium' || callerRole === 'admin');
        // Check if orchestrator returned an error (properly typed check)
        const errorResult = result;
        if (errorResult.status) {
            throw new HttpsError('internal', errorResult.error || 'Generation failed');
        }
        // 4. Return Firebase-specific response (result is guaranteed to be GenerationResult here - type guard passed)
        const generatedResult = result;
        const requestId = generatedResult.requestId;
        // 5. Queue task for worker (Infrastructure concern)
        await enqueueGenerationTask(requestId, firebaseContext, finalUid);
        return {
            requestId,
            wheelUp: generatedResult.wheelUp || false,
            milestoneReached: generatedResult.milestoneReached || false,
            questsProgressed: generatedResult.questsProgressed || [],
            questsCompleted: generatedResult.questsCompleted || [],
            achievementsUnlocked: generatedResult.achievementsUnlocked || []
        };
    }
    catch (error) {
        logger.error(`[Generation Handler] Error for user ${uid}:`, error);
        throw handleError(error, { uid, modelId: data.modelId });
    }
};
/**
 * Help: Enqueue generation task for worker (Infrastructure)
 */
async function enqueueGenerationTask(requestId, ctx, userId) {
    const { prompt, negative_prompt, modelId, steps, cfg, aspectRatio, scheduler, image, targetPersonaId, action, shouldBookmark } = ctx;
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
        image,
        targetPersonaId,
        action,
        shouldBookmark: !!shouldBookmark
    };
    const LOCATION = "us-central1";
    const queue = getFunctions().taskQueue(`locations/${LOCATION}/functions/urgentWorker`);
    await queue.enqueue(taskData);
}
//# sourceMappingURL=generation.js.map