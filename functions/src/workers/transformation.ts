import { db } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";
import { generateVisionPrompt, enhancePromptWithGemini } from "../lib/ai.js";

/**
 * Processes an analysis task.
 */
export const processAnalysisTask = async (req: { data: any }): Promise<void> => {
    const { requestId, imageUrl, image } = req.data;
    const docRef = db.collection('analysis_queue').doc(requestId);

    try {
        await docRef.update({ status: 'analyzing' });

        const prompt = await generateVisionPrompt(imageUrl || image);

        await docRef.update({
            status: 'completed',
            prompt: prompt,
            completedAt: new Date()
        });
    } catch (error: any) {
        logger.error(`Analysis failed for ${requestId}`, error);
        await docRef.update({
            status: 'failed',
            error: error.message
        });
    }
};

/**
 * Processes an enhance task.
 */
export const processEnhanceTask = async (req: { data: any }): Promise<void> => {
    const { requestId, originalPrompt } = req.data;
    const docRef = db.collection('enhance_queue').doc(requestId);

    try {
        await docRef.update({ status: 'processing' });

        const enhancedPrompt = await enhancePromptWithGemini(originalPrompt);

        await docRef.update({
            status: 'completed',
            prompt: enhancedPrompt,
            completedAt: new Date()
        });
    } catch (error: any) {
        logger.error(`Enhance failed for ${requestId}`, error);
        await docRef.update({
            status: 'failed',
            error: error.message
        });
    }
};
