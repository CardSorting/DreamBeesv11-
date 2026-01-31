
import { db, FieldValue } from "../firebaseInit.js";
import { getS3Client, logger, retryOperation } from "../lib/utils.js";
import { Wallet } from "../lib/wallet.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
// [REMOVED] import { vertexFlow } from "../lib/vertexFlow.js";

export const processDressUpTask = async (req) => {
    const { requestId, userId, image, prompt, cost } = req.data;
    const docRef = db.collection("generation_queue").doc(requestId);

    try {
        const snap = await docRef.get();
        if (snap.exists && ['processing', 'completed'].includes(snap.data().status)) {
            logger.info(`DressUp Task ${requestId} already processed.`);
            return;
        }

        await docRef.update({ status: "processing" });


        const imageRef = await db.collection("images").add({
            userId, prompt, modelId: "dressup",
            imageUrl: null, thumbnailUrl: null, lqip: null,
            createdAt: FieldValue.serverTimestamp(), originalRequestId: requestId,
            type: 'dress-up', status: 'processing'
        });
        await docRef.update({ resultImageId: imageRef.id, status: 'processing' });


        const { modalAPI } = await import("../lib/modal.js");
        const imageBuffer = await modalAPI.editAndWait({
            prompt,
            image: image, // Use original input (URL or Base64)
            num_steps: 4,
            width: 1024,
            height: 1024
        });
        const { default: sharp } = await import("sharp");
        const sharpImg = sharp(imageBuffer);
        const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
        const thumbBuffer = await sharpImg.resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer();
        const lqipBuffer = await sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer();
        const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

        const baseFolder = `generated/${userId}/${Date.now()}`;
        const originalFilename = `${baseFolder}.webp`;
        const thumbFilename = `${baseFolder}_thumb.webp`;

        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();

        await Promise.all([
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename, Body: webpBuffer, ContentType: "image/webp" })),
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename, Body: thumbBuffer, ContentType: "image/webp" }))
        ]);

        const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

        await imageRef.update({ imageUrl, thumbnailUrl, lqip, status: 'completed', completedAt: FieldValue.serverTimestamp() });
        await docRef.update({ status: "completed", imageUrl, thumbnailUrl, lqip, completedAt: FieldValue.serverTimestamp(), resultImageId: imageRef.id });

    } catch (error) {
        logger.error(`[processDressUpTask] Failed`, error);
        await retryOperation(async () => {
            await Wallet.credit(userId, cost, `refund_dressup_${requestId}`, { reason: 'dressup_failed', originalRequestId: requestId });
        }, { context: 'Refund DressUp Task' })
            .catch(e => logger.error("DressUp Refund Error", e, { userId }));
        await docRef.update({ status: "failed", error: error.message });
    }
}

