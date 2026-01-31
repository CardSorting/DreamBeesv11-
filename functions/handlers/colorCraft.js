import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "../firebaseInit.js";
import { handleError, getS3Client } from "../lib/utils.js";
import { generateColoringPageImage } from "../lib/ai.js";
import { CostManager } from "../lib/costs.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { Billing } from "../lib/billing.js";

/**
 * Generates a single coloring page image.
 */
export const handleCreateColoringPage = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }

    const { prompt, style, requestId } = request.data;
    if (!prompt) { throw new HttpsError('invalid-argument', "Prompt is required."); }

    const COST = await CostManager.get('COLORING_PAGE');

    try {
        return await Billing.runTwoPhase(uid, 'COLORING_PAGE', requestId, { type: 'colorcraft_page', prompt },
            // Phase 1: Init (Log check only for ActionLogs, but TwoPhase handles debit idempotency via Wallet)
            async (t) => {
                const logRef = requestId ? db.collection('action_logs').doc(requestId) : null;
                // We don't have a queue ref here? The original code didn't create a 'queue' document, just an log.
                // So we just log the action.
                if (logRef) { t.set(logRef, { type: 'colorcraft_page', userId: uid, prompt, createdAt: FieldValue.serverTimestamp() }); }
            },
            // Phase 2: Async Gen
            async () => {
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
                    isPublic: true,
                    type: 'colorcraft',
                    style: style
                });

                return {
                    imageUrl,
                    thumbnailUrl,
                };
            },
            { retries: 0 }
        );

    } catch (error) {
        throw handleError(error, { uid });
    }
};
