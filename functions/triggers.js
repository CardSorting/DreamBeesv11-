import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { generateVisionPrompt, enhancePromptWithGemini } from "./ai.js";

// ============================================================================
// Triggers
// ============================================================================

export const onAnalysisQueueCreatedV3 = onDocumentCreated(
    {
        document: "analysis_queue/{requestId}",
        memory: "1GiB"
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;

        const data = snapshot.data();
        const requestId = event.params.requestId;

        try {
            await snapshot.ref.update({ status: 'analyzing' });

            const prompt = await generateVisionPrompt(data.imageUrl || data.image);

            await snapshot.ref.update({
                status: 'completed',
                prompt: prompt,
                completedAt: new Date()
            });
        } catch (error) {
            console.error(`Analysis failed for ${requestId}:`, error);
            await snapshot.ref.update({
                status: 'failed',
                error: error.message
            });
        }
    });

export const onEnhanceQueueCreatedV3 = onDocumentCreated("enhance_queue/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const requestId = event.params.requestId;

    try {
        await snapshot.ref.update({ status: 'processing' });

        const enhancedPrompt = await enhancePromptWithGemini(data.originalPrompt);

        await snapshot.ref.update({
            status: 'completed',
            prompt: enhancedPrompt,
            completedAt: new Date()
        });
    } catch (error) {
        console.error(`Enhance failed for ${requestId}:`, error);
        await snapshot.ref.update({
            status: 'failed',
            error: error.message
        });
    }
});
