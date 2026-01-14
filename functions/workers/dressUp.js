
import { db, FieldValue } from "../firebaseInit.js";
import { getS3Client, logger, retryOperation } from "../lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";

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
        const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;

        const imageRef = await db.collection("images").add({
            userId, prompt, modelId: "gemini-2.5-flash-image",
            imageUrl: null, thumbnailUrl: null, lqip: null,
            createdAt: new Date(), originalRequestId: requestId,
            type: 'dress-up', status: 'processing'
        });
        await docRef.update({ resultImageId: imageRef.id, status: 'processing' });



        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        const request = { contents: [{ role: 'user', parts: [{ inlineData: { mimeType: "image/png", data: cleanBase64 } }, { text: prompt }] }] };
        const result = await model.generateContent(request);
        const response = await result.response;
        const generatedImageBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

        if (!generatedImageBase64) throw new Error("No image data returned from Gemini");

        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
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

        await imageRef.update({ imageUrl, thumbnailUrl, lqip, status: 'completed', completedAt: new Date() });
        await docRef.update({ status: "completed", imageUrl, thumbnailUrl, lqip, completedAt: new Date(), resultImageId: imageRef.id });

    } catch (error) {
        logger.error(`[processDressUpTask] Failed`, error);
        await retryOperation(() => db.collection('users').doc(userId).update({ zaps: FieldValue.increment(cost) }), { context: 'Refund DressUp Task' })
            .catch(e => logger.error("DressUp Refund Error", e, { userId }));
        await docRef.update({ status: "failed", error: error.message });
    }
}

