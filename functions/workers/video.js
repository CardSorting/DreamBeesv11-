
import { db, FieldValue } from "../firebaseInit.js";
import { getS3Client, fetchWithRetry, logger, retryOperation, findPrimaryUrl } from "../lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { generateVisionPrompt } from "../lib/ai.js";

export const processVideoTask = async (request) => {
    const { requestId } = request.data;
    if (!requestId) { return; }

    const docRef = db.collection('video_queue').doc(requestId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) { return; }
    const data = snapshot.data();
    if (['processing', 'completed'].includes(data.status)) {
        logger.info(`Video Task ${requestId} already processed. Status: ${data.status}`);
        return;
    }

    try {
        let finalPrompt = data.prompt;
        if (!finalPrompt || finalPrompt.length < 5) {
            if (data.image) {
                try {
                    const generatedPrompt = await generateVisionPrompt(data.image);
                    if (generatedPrompt && generatedPrompt.length > 5) {
                        finalPrompt = generatedPrompt;
                        await docRef.update({ prompt: finalPrompt });
                    } else { throw new Error("Failed to generate prompt from image"); }
                } catch { throw new Error("Failed to auto-generate prompt from image."); }
            } else { throw new Error("Generation prompt is empty."); }
        }

        await docRef.update({ status: "processing" });



        const { default: Replicate } = await import("replicate");
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const allowedDurations = [6, 8, 10];
        let safeDuration = parseInt(data.duration);
        if (!allowedDurations.includes(safeDuration)) { safeDuration = 6; }

        const input = {
            prompt: finalPrompt, duration: safeDuration, resolution: data.resolution || "1080p",
            aspect_ratio: data.aspectRatio || "3:2", generate_audio: true
        };
        if (data.image) { input.image = data.image; }

        const prediction = await replicate.predictions.create({ model: "lightricks/ltx-2-pro", input });
        const result = await replicate.wait(prediction);
        if (result.status === "failed") { throw new Error(`AI Model Error: ${result.error}`); }

        const videoUrl = findPrimaryUrl(result);
        if (!videoUrl) { throw new Error("No video URL could be extracted."); }

        const response = await fetchWithRetry(videoUrl, { timeout: 30000, retries: 3 });
        if (!response.ok) { throw new Error(`Replicate Download Error`); }
        const buffer = Buffer.from(await response.arrayBuffer());

        const filename = `videos/${data.userId}/${Date.now()}.mp4`;
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();
        await s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: filename, Body: buffer, ContentType: "video/mp4" }));
        const b2Url = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${filename}`;

        const videoDoc = {
            userId: data.userId, prompt: finalPrompt, videoUrl: b2Url,
            duration: data.duration, resolution: data.resolution, cost: data.cost,
            isPublic: true,
            createdAt: new Date(), originalRequestId: requestId
        };
        const videoRef = await db.collection("videos").add(videoDoc);

        await docRef.update({ status: "completed", videoUrl: b2Url, completedAt: new Date(), resultVideoId: videoRef.id });

    } catch (error) {
        logger.error(`Task Failed for ${requestId}`, error);
        await retryOperation(() => db.collection('users').doc(data.userId).update({ reels: FieldValue.increment(data.cost) }), { context: 'Refund Video Task' })
            .catch(e => logger.error("Video Refund Error", e, { userId: data.userId }));
        await docRef.update({ status: "failed", error: error.message });
    }
}

