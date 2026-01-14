import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as functionsV1 from "firebase-functions/v1";
import { db } from "./firebaseInit.js";
import { generateVisionPrompt, enhancePromptWithGemini } from "./lib/ai.js";
import { logger } from "./lib/utils.js";

// ============================================================================
// Triggers
// ============================================================================

export const onUserCreatedTrigger = functionsV1.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;

    try {
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (doc.exists) {
            logger.info(`User ${uid} already exists, skipping creation.`);
            return;
        }

        const userData = {
            uid,
            email: email || "",
            displayName: displayName || "",
            photoURL: photoURL || "",
            createdAt: new Date(),
            zaps: 10,
            reels: 0,
            subscriptionStatus: 'inactive',
            role: 'user'
        };

        await userRef.set(userData);
        logger.info(`User ${uid} created in Firestore.`);
    } catch (error) {
        logger.error(`Error creating user ${uid}`, error);
    }
});

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
            if (data.status !== 'queued') {
                logger.info(`Analysis Trigger ${requestId} skipped (status: ${data.status})`);
                return;
            }
            await snapshot.ref.update({ status: 'analyzing' });

            const prompt = await generateVisionPrompt(data.imageUrl || data.image);

            await snapshot.ref.update({
                status: 'completed',
                prompt: prompt,
                completedAt: new Date()
            });
        } catch (error) {
            logger.error(`Analysis failed for ${requestId}`, error);
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
        if (data.status !== 'queued') {
            logger.info(`Enhance Trigger ${requestId} skipped (status: ${data.status})`);
            return;
        }
        await snapshot.ref.update({ status: 'processing' });

        const enhancedPrompt = await enhancePromptWithGemini(data.originalPrompt);

        await snapshot.ref.update({
            status: 'completed',
            prompt: enhancedPrompt,
            completedAt: new Date()
        });
    } catch (error) {
        logger.error(`Enhance failed for ${requestId}`, error);
        await snapshot.ref.update({
            status: 'failed',
            error: error.message
        });
    }
});

export const triggers = {
    onUserCreatedTrigger,
    onAnalysisQueueCreatedV3,
    onEnhanceQueueCreatedV3
};
