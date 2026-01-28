import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "../firebaseInit.js";
import { handleError, logger, retryOperation, getS3Client } from "../lib/utils.js";
import { generateColoringBookConcepts, generateColoringPageImage } from "../lib/ai.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ZAP_COSTS } from "../lib/costs.js";
import sharp from "sharp";

/**
 * Generates a single coloring page image.
 */
export const handleCreateColoringPage = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, style, requestId } = request.data;
    if (!prompt) throw new HttpsError('invalid-argument', "Prompt is required.");

    const COST = ZAP_COSTS.COLORING_PAGE;

    try {
        const logRef = requestId ? db.collection('action_logs').doc(requestId) : null;
        let alreadyExists = false;

        await db.runTransaction(async (t) => {
            if (logRef) {
                const existing = await t.get(logRef);
                if (existing.exists) {
                    alreadyExists = true;
                    return;
                }
            }

            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
            const zaps = userDoc.data().zaps || 0;
            if (zaps < COST) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${COST} Zaps.`);

            t.update(userRef, { zaps: FieldValue.increment(-COST) });
            if (logRef) t.set(logRef, { type: 'colorcraft_page', userId: uid, prompt, createdAt: FieldValue.serverTimestamp() });
        });

        if (alreadyExists) return { success: true, idempotent: true };

        const generatedImageBase64 = await generateColoringPageImage(prompt, style);

        // --- Post Processing & Storage (Match MeowAcc Pattern) ---
        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        const sharpImg = sharp(imageBuffer);

        const [webpBuffer, thumbBuffer] = await Promise.all([
            sharpImg.webp({ quality: 90 }).toBuffer(),
            sharpImg.resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer()
        ]);

        const timestamp = Date.now();
        const baseFolder = `generated/${uid}/colorcraft_${timestamp}`;
        const originalFilename = `${baseFolder}.webp`;
        const thumbFilename = `${baseFolder}_thumb.webp`;

        const s3 = await getS3Client();
        await Promise.all([
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename, Body: webpBuffer, ContentType: "image/webp" })),
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename, Body: thumbBuffer, ContentType: "image/webp" }))
        ]);

        const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

        // Save to DB
        await db.collection("images").add({
            userId: uid,
            prompt: `[COLORCRAFT] ${prompt}`,
            modelId: 'colorcraft',
            imageUrl,
            thumbnailUrl,
            createdAt: FieldValue.serverTimestamp(),
            type: 'colorcraft',
            style: style
        });

        // We skip adding to generation_queue to avoid flooding the feed with single pages
        // Return exact format frontend expects (plus URL for persistence)
        return {
            imageUrl,
            thumbnailUrl,
        };

    } catch (error) {
        if (error.code !== 'resource-exhausted') {
            await retryOperation(() => db.collection('users').doc(uid).update({ zaps: FieldValue.increment(COST) }), { context: 'Refund ColorCraft Image' })
                .catch(e => logger.error("Refund failed", e, { uid }));
        }
        throw handleError(error, { uid });
    }
};
