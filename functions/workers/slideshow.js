import { db, FieldValue } from "../firebaseInit.js";
import { getS3Client, logger, retryOperation } from "../lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { SLIDESHOW_MASTER_PROMPT, getSlidePrompts } from "../lib/ai.js";

export const processSlideshowTask = async (req) => {
    const { requestId, userId, image, mode, language, cost } = req.data;
    const docRef = db.collection("generation_queue").doc(requestId);

    try {
        const snap = await docRef.get();
        if (snap.exists && ['processing', 'completed'].includes(snap.data().status)) {
            logger.info(`Slideshow Task ${requestId} already processed.`);
            return;
        }

        await docRef.update({ status: "processing" });
        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        const prompts = [];
        if (mode === 'poster') {
            const languageInstruction = `\n\nOUTPUT LANGUAGE RULE: The entire infographic text MUST be written in ${language}.`;
            prompts.push(SLIDESHOW_MASTER_PROMPT + languageInstruction);
        } else {
            prompts.push(...getSlidePrompts(language));
        }

        const currentDoc = await docRef.get();
        const currentData = currentDoc.data();
        let results = currentData.results || [];
        let resultImageId = currentData.resultImageId;

        if (results.length === 0) {
            results = prompts.map((p, idx) => ({ slideIndex: idx, prompt: p, status: 'pending', imageUrl: null, thumbnailUrl: null }));
            const slideshowRef = await db.collection("images").add({
                userId, prompt: prompts[0], modelId: "nekomimi",
                imageUrl: null, thumbnailUrl: null, lqip: null, createdAt: FieldValue.serverTimestamp(),
                originalRequestId: requestId, type: 'slideshow', slides: results, slideCount: results.length, status: 'processing'
            });
            resultImageId = slideshowRef.id;
            await docRef.update({ results, resultImageId });
        }

        const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;

        for (let i = 0; i < prompts.length; i++) {
            if (results[i]?.status === 'completed' || results[i]?.imageUrl || results[i]?.status === 'failed') continue;

            const prompt = prompts[i];
            let generatedImageBase64 = null;
            let attempts = 0;
            let slideError = null;

            while (attempts < 3 && !generatedImageBase64) {
                try {
                    const request = { contents: [{ role: 'user', parts: [{ inlineData: { mimeType: "image/png", data: cleanBase64 } }, { text: prompt }] }] };
                    const result = await model.generateContent(request);
                    generatedImageBase64 = (await result.response).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
                    if (!generatedImageBase64) throw new Error("No image data");
                } catch (genError) {
                    attempts++;
                    slideError = genError.message;
                    if (genError.message.includes("Safety")) break;
                    await new Promise(r => setTimeout(r, 2000 * attempts));
                }
            }

            if (!generatedImageBase64) {
                results[i] = { ...results[i], status: 'failed', error: slideError };
                await docRef.update({ results });
                if (resultImageId) await db.collection("images").doc(resultImageId).update({ slides: results });
                continue;
            }

            const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
            const { default: sharp } = await import("sharp");
            const sharpImg = sharp(imageBuffer);
            const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
            const thumbBuffer = await sharpImg.resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer();
            const lqipBuffer = await sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer();
            const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

            const baseFolder = `generated/${userId}/${Date.now()}_${i}`;
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

            results[i] = { ...results[i], imageUrl, thumbnailUrl, lqip, status: 'completed' };
            await docRef.update({ results });

            if (resultImageId) {
                const updateData = { slides: results };
                if (i === 0 || (!updateData.imageUrl && imageUrl)) {
                    Object.assign(updateData, { imageUrl, thumbnailUrl, lqip });
                }
                await db.collection("images").doc(resultImageId).update(updateData);
            }
            if (i < prompts.length - 1) await new Promise(resolve => setTimeout(resolve, 3000));
        }

        await docRef.update({ status: "completed", results: results, completedAt: FieldValue.serverTimestamp() });

    } catch (error) {
        logger.error(`[processSlideshowTask] Failed`, error);
        await retryOperation(() => db.collection('users').doc(userId).update({ zaps: FieldValue.increment(cost) }), { context: 'Refund Slideshow Task' })
            .catch(e => logger.error("Slideshow Refund Error", e, { userId }));
        await docRef.update({ status: "failed", error: error.message });
    }
}

