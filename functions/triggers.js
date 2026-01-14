import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { db } from "./firebaseInit.js";
import { generateVisionPrompt, enhancePromptWithGemini } from "./lib/ai.js";
import { logger, getS3Client } from "./lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "./lib/constants.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

// ============================================================================
// Triggers
// ============================================================================

/**
 * Gen 2 Blocking Function: Triggered before a new user is created in Firebase Auth.
 * Used to initialize the user's Firestore document.
 */
export const onUserCreatedTrigger = beforeUserCreated(async (event) => {
    const user = event.data;
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
        logger.info(`User ${uid} created in Firestore (Blocking Function).`);
    } catch (error) {
        logger.error(`Error creating user ${uid}`, error);
        // Note: Throwing here would block user creation in Auth. 
        // We log and swallow to allow Auth to proceed even if DB init fails.
    }
});

/**
 * Gen 2 Firestore Trigger: processing cleanup when a User Document is deleted.
 * This acts as the cascade delete handler since Gen 2 Auth 'onDelete' is not available.
 * Triggered when a document is deleted from the 'users' collection.
 */
export const onUserDocumentDeleted = onDocumentDeleted({
    document: "users/{userId}",
    memory: "256MiB"
}, async (event) => {
    const uid = event.params.userId;
    logger.info(`Processing cleanup for deleted user document ${uid}`);

    try {
        // Cascade Delete User Content

        // Delete Images
        const imagesSnap = await db.collection('images').where('userId', '==', uid).get();
        const imageBatch = db.batch();
        imagesSnap.docs.forEach(doc => imageBatch.delete(doc.ref));
        await imageBatch.commit();
        logger.info(`Deleted ${imagesSnap.size} images for user ${uid}`);

        // Delete Videos
        const videosSnap = await db.collection('videos').where('userId', '==', uid).get();
        const videoBatch = db.batch();
        videosSnap.docs.forEach(doc => videoBatch.delete(doc.ref));
        await videoBatch.commit();
        logger.info(`Deleted ${videosSnap.size} videos for user ${uid}`);

        // Delete Generation Queue Items (Optional)
        const queueSnap = await db.collection('generation_queue').where('userId', '==', uid).get();
        const queueBatch = db.batch();
        queueSnap.docs.forEach(doc => queueBatch.delete(doc.ref));
        await queueBatch.commit();

    } catch (error) {
        logger.error(`Error cleaning up user ${uid}`, error);
    }
});

export const onImageDeletedTrigger = onDocumentDeleted({
    document: "images/{imageId}",
    memory: "256MiB"
}, async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();

    const filesToDelete = [];
    if (data.imageUrl) filesToDelete.push(data.imageUrl);
    if (data.thumbnailUrl) filesToDelete.push(data.thumbnailUrl);

    if (filesToDelete.length === 0) return;

    try {
        const s3 = await getS3Client();
        const deletePromises = filesToDelete.map(url => {
            // Extract Key from URL
            const parts = url.split(`${B2_BUCKET}/`);
            if (parts.length < 2) return Promise.resolve();
            const key = parts[1];
            return s3.send(new DeleteObjectCommand({ Bucket: B2_BUCKET, Key: key }));
        });

        await Promise.all(deletePromises);
        logger.info(`Deleted ${filesToDelete.length} B2 files for image ${event.params.imageId}`);
    } catch (error) {
        logger.error(`Failed to delete B2 files for image ${event.params.imageId}`, error);
    }
});

export const onVideoDeletedTrigger = onDocumentDeleted({
    document: "videos/{videoId}",
    memory: "256MiB"
}, async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();

    if (!data.videoUrl) return;

    try {
        const s3 = await getS3Client();
        const parts = data.videoUrl.split(`${B2_BUCKET}/`);
        if (parts.length < 2) return;
        const key = parts[1];

        await s3.send(new DeleteObjectCommand({ Bucket: B2_BUCKET, Key: key }));
        logger.info(`Deleted B2 file for video ${event.params.videoId}`);
    } catch (error) {
        logger.error(`Failed to delete B2 file for video ${event.params.videoId}`, error);
    }
});


export const onAnalysisQueueCreatedV3 = onDocumentCreated(
    {
        document: "analysis_queue/{requestId}",
        memory: "256MiB"
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

export const onEnhanceQueueCreatedV3 = onDocumentCreated({
    document: "enhance_queue/{requestId}",
    memory: "256MiB"
}, async (event) => {
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
    onUserDocumentDeleted,
    onImageDeletedTrigger,
    onVideoDeletedTrigger,
    onAnalysisQueueCreatedV3,
    onEnhanceQueueCreatedV3
};
