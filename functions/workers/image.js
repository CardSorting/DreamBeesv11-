
import { db, FieldValue } from "../firebaseInit.js";
import { getS3Client, fetchWithTimeout, fetchWithRetry, readFirstBytes, detectImageFormat, logger, retryOperation } from "../lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";

// Local helper
const looksLikeJSON = (buffer) => {
    if (!buffer || buffer.length === 0) return false;
    const firstChar = String.fromCharCode(buffer[0]);
    return firstChar === '{' || firstChar === '[' || firstChar === '"';
};

export const processImageTask = async (req) => {
    const { requestId, userId, modelId, negative_prompt, steps = 30, cfg = 7, aspectRatio = '1:1', scheduler, promptHash, promptMetadata } = req.data;
    let prompt = req.data.prompt;

    // Safety: Cap prompt length to 1500 chars for all models to prevent validation errors (Modal/Zit limit)
    if (prompt && prompt.length > 1500) {
        prompt = prompt.substring(0, 1500);
    }
    const docRef = db.collection("generation_queue").doc(requestId);

    const existingDoc = await docRef.get();
    if (existingDoc.exists && ['processing', 'completed'].includes(existingDoc.data().status)) {
        logger.info(`Idempotency check: Task ${requestId} already processed. Skipping.`, { requestId, status: existingDoc.data().status });
        return;
    }

    let originalFilename = null;
    let thumbFilename = null;
    let imageUrl = null;
    let thumbnailUrl = null;
    let lqip = null;

    const [activeJobsSnapshot, userSnap] = await Promise.all([
        db.collection('generation_queue').where('userId', '==', userId).where('status', '==', 'processing').get(),
        db.collection('users').doc(userId).get()
    ]);

    const activeCount = activeJobsSnapshot.docs.filter(d => d.id !== requestId).length;
    const userData = userSnap.data() || {};
    const isSubscriber = userData.subscriptionStatus === 'active';
    const useTurbo = req.data.useTurbo;
    const isPremiumModel = ['zit-model', 'qwen-image-2512'].includes(modelId);

    let allowedConcurrency = 3;
    if (useTurbo || isPremiumModel) allowedConcurrency = 5;
    else if (isSubscriber) allowedConcurrency = 3;
    else allowedConcurrency = 3;

    if (activeCount >= allowedConcurrency) {
        logger.warn(`[Throttling] User ${userId} busy. Active: ${activeCount}/${allowedConcurrency}. Re-queuing task ${requestId}.`, { userId, activeCount, allowedConcurrency });
        throw new Error(`Throttling: Concurrency Limit (${allowedConcurrency}) Reached. Retrying...`);
    }

    try {
        await docRef.update({ status: "processing" });

        const resolutionMap = {
            '1:1': { width: 1024, height: 1024 },
            '2:3': { width: 832, height: 1216 },
            '3:2': { width: 1216, height: 832 },
            '9:16': { width: 768, height: 1344 },
            '16:9': { width: 1344, height: 768 }
        };
        const resolution = resolutionMap[aspectRatio] || resolutionMap['1:1'];

        let response;
        if (modelId === 'zit-model') {
            const ZIT_A10G_BASE = "https://mariecoderinc--zit-a10g-fastapi-app.modal.run";
            const ZIT_H100_BASE = "https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run";
            const baseUrl = useTurbo ? ZIT_H100_BASE : ZIT_A10G_BASE;

            const zBody = { prompt, steps, width: resolution.width, height: resolution.height };

            if (useTurbo && ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'].includes(aspectRatio)) {
                delete zBody.width; delete zBody.height; zBody.aspect_ratio = aspectRatio;
            }

            const submitUrl = `${baseUrl}/generate`;
            logger.info(`[${requestId}] Submitting zit-model job to ${useTurbo ? 'H100' : 'A10G'}: ${submitUrl}`);

            let submitResponse;
            try {
                submitResponse = await fetchWithRetry(submitUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(zBody),
                    timeout: 45000,
                    retries: 3
                });
            } catch (err) {
                if (err.message.includes("429")) {
                    logger.warn(`[Throttling] Zit API rate limited (429). Re-queuing task ${requestId}.`);
                    throw new Error(`Throttling: Zit API Busy (429). Retrying...`);
                }
                throw err;
            }

            if (!submitResponse.ok) {
                throw new Error(`Zit Submission Failed (${submitResponse.status}): ${await submitResponse.text()}`);
            }

            const submitJson = await submitResponse.json();
            if (!submitJson.job_id) throw new Error("No job_id from Zit API");
            const jobId = submitJson.job_id;
            logger.info(`[${requestId}] Zit job submitted: ${jobId}`);

            // Poll for result (max 180 seconds)
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            let imageBuffer = null;
            // Poll every 2s for up to 90 attempts (180s)
            for (let poll = 0; poll < 90; poll++) {
                await sleep(2000);
                const resultRes = await fetch(`${baseUrl}/result/${jobId}`);

                if (resultRes.status === 202) {
                    // Still processing
                    continue;
                }

                if (!resultRes.ok) {
                    // Try to parse error
                    try {
                        const errJson = await resultRes.json();
                        if (errJson.status === 'failed') {
                            throw new Error(errJson.error || `Zit generation failed with status ${resultRes.status}`);
                        }
                    } catch (e) {
                        // ignore json parse error, just throw status error
                    }
                    throw new Error(`Zit Polling Error (${resultRes.status}): ${await resultRes.text()}`);
                }

                const ct = resultRes.headers.get('content-type') || '';
                if (ct.includes('image/')) {
                    imageBuffer = Buffer.from(await resultRes.arrayBuffer());
                    break;
                }

                const statusJson = await resultRes.json();
                if (statusJson.status === 'failed') throw new Error(statusJson.error || 'Zit generation failed');
                if (statusJson.status === 'completed' && !imageBuffer) {
                    // Should have been binary if completed, but handle edge case if it returns json with url
                    // (Though docs say binary)
                    throw new Error('Zit reported completed but returned JSON instead of binary image.');
                }
            }
            if (!imageBuffer) throw new Error("Zit generation timed out");

            // Skip standard response processing
            response = { ok: true, _fluxImageBuffer: imageBuffer }; // reusing _fluxImageBuffer hack for now as it handles raw buffer bypass
        } else if (modelId === 'qwen-image-2512') {
            response = await fetchWithRetry("https://mariecoderinc--qwen-image-2512-qwenimage-api-generate.modal.run", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, negative_prompt, aspect_ratio: aspectRatio }), timeout: 180000, retries: 3
            });
        } else if (modelId === 'flux-klein-4b') {
            // Flux uses async job pattern: submit, then poll for result
            const FLUX_ENDPOINT = "https://mariecoderinc--flux-klein-4b-fastapi-app.modal.run";

            // 1. Submit job
            let submitResponse;
            try {
                submitResponse = await fetchWithRetry(`${FLUX_ENDPOINT}/generate`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt,
                        height: resolution.height,
                        width: resolution.width
                    }), timeout: 45000, retries: 3
                });
            } catch (err) {
                if (err.message.includes("429")) {
                    logger.warn(`[Throttling] Flux API rate limited (429). Re-queuing task ${requestId}.`);
                    throw new Error(`Throttling: Flux API Busy (429). Retrying...`);
                }
                throw err;
            }

            const submitJson = await submitResponse.json();
            if (!submitJson.job_id) throw new Error("No job_id from Flux API");
            const jobId = submitJson.job_id;
            logger.info(`[${requestId}] Flux job submitted: ${jobId}`);

            // 2. Poll for result (max 120 seconds)
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            let imageBuffer = null;
            for (let poll = 0; poll < 60; poll++) {
                await sleep(2000);
                const resultRes = await fetch(`${FLUX_ENDPOINT}/result/${jobId}`);
                const ct = resultRes.headers.get('content-type') || '';
                if (ct.includes('image/')) {
                    imageBuffer = Buffer.from(await resultRes.arrayBuffer());
                    break;
                }
                const statusJson = await resultRes.json();
                if (statusJson.status === 'failed') throw new Error(statusJson.error || 'Flux generation failed');
            }
            if (!imageBuffer) throw new Error("Flux generation timed out");

            // Skip the normal response parsing; we already have imageBuffer
            // Jump directly to image processing (after the main if/else block handles response)
            response = { ok: true, _fluxImageBuffer: imageBuffer };
        } else {

            // SDXL Handling
            const SDXL_A10G_ASYNC_BASE = "https://mariecoderinc--sdxl-multi-model-a10g-model-web-app.modal.run";
            const INTERNAL_SDXL_ENDPOINT = "https://mariecoderinc--sdxl-multi-model-model-web-inference.modal.run";

            if (req.data.useTurbo) {
                // Turbo (Internal) - Keep Synchronous for now as no Async docs provided
                const params = new URLSearchParams({
                    prompt, model: modelId || "wai-illustrious", negative_prompt,
                    steps: steps.toString(), cfg: cfg.toString(),
                    width: resolution.width.toString(), height: resolution.height.toString(),
                    scheduler: scheduler || 'DPM++ 2M Karras'
                });
                const url = `${INTERNAL_SDXL_ENDPOINT}?${params.toString()}`;
                if (url.length > 2048) throw new Error("Prompt is too long (URL length limit).");
                response = await fetchWithRetry(url, { timeout: 180000, retries: 3 });
            } else {
                // Standard A10G - Use Async Pattern
                const submitUrl = `${SDXL_A10G_ASYNC_BASE}/generate`;
                const sBody = {
                    prompt,
                    model: modelId || "wai-illustrious",
                    negative_prompt, // Optional, but usually ignored by some simple endpoints, good to pass if doc allows. Docs don't explicitly forbid extra keys.
                    steps,
                    width: resolution.width,
                    height: resolution.height,
                    scheduler: scheduler || 'DPM++ 2M Karras'
                };

                logger.info(`[${requestId}] Submitting SDXL job to A10G (Async): ${submitUrl}`);

                let submitResponse;
                try {
                    submitResponse = await fetchWithRetry(submitUrl, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(sBody), timeout: 45000, retries: 3
                    });
                } catch (err) {
                    if (err.message.includes("429")) {
                        logger.warn(`[Throttling] SDXL A10G API rate limited (429). Re-queuing task ${requestId}.`);
                        throw new Error(`Throttling: SDXL A10G API Busy (429). Retrying...`);
                    }
                    throw err;
                }

                if (!submitResponse.ok) {
                    throw new Error(`SDXL Submission Failed (${submitResponse.status}): ${await submitResponse.text()}`);
                }

                const submitJson = await submitResponse.json();
                if (!submitJson.job_id) throw new Error("No job_id from SDXL API");
                const jobId = submitJson.job_id;
                logger.info(`[${requestId}] SDXL job submitted: ${jobId}`);

                // Poll for result (max 180 seconds)
                const sleep = (ms) => new Promise(r => setTimeout(r, ms));
                let imageBuffer = null;
                for (let poll = 0; poll < 90; poll++) {
                    await sleep(2000);
                    const resultRes = await fetch(`${SDXL_A10G_ASYNC_BASE}/jobs/${jobId}`);

                    if (resultRes.status === 202) continue; // Still processing (Queued/Generating)

                    if (!resultRes.ok) {
                        try {
                            const errJson = await resultRes.json();
                            if (errJson.status === 'failed') {
                                throw new Error(errJson.error || `SDXL generation failed with status ${resultRes.status}`);
                            }
                        } catch (e) {
                            // ignore
                        }
                        throw new Error(`SDXL Polling Error (${resultRes.status}): ${await resultRes.text()}`);
                    }

                    const ct = resultRes.headers.get('content-type') || '';
                    if (ct.includes('image/')) {
                        imageBuffer = Buffer.from(await resultRes.arrayBuffer());
                        break;
                    }

                    const statusJson = await resultRes.json();
                    if (statusJson.status === 'failed') throw new Error(statusJson.error || 'SDXL generation failed');
                    // Note: Docs say "If processing: Returns JSON ... If complete: Returns Image Binary". 
                    // So if we get JSON here and it's not failed, it's likely still queued/generating (though usage of 202 vs 200 in poll phase varies, code assumes 200 JSON for status updates in some patterns, but docs specific 202 for SUBMIT response. For Poll, it says "If processing: Returns JSON").
                    // Let's safe guard: if status is queued/generating, continue.
                    if (['queued', 'generating', 'processing'].includes(statusJson.status)) continue;
                }

                if (!imageBuffer) throw new Error("SDXL generation timed out");
                response = { ok: true, _fluxImageBuffer: imageBuffer }; // reusing _fluxImageBuffer hack
            }
        }

        if (!response.ok && !response._fluxImageBuffer) throw new Error(`Model Provider Error (${response.status}): ${await response.text()}`);

        let imageBuffer;
        let responseProcessed = false;

        // Special case: Flux async pattern already has the image buffer
        if (response._fluxImageBuffer) {
            imageBuffer = response._fluxImageBuffer;
            responseProcessed = true;
        } else {
            try {
                const contentType = response.headers.get("content-type") || "";
                const clonedResponse = response.clone();
                const firstBytesClone = response.clone();
                const firstBytes = await readFirstBytes(firstBytesClone, 12);
                if (!firstBytes || firstBytes.length === 0) throw new Error("Response body is empty");
                const detectedFormat = detectImageFormat(firstBytes);
                const isLikelyImage = detectedFormat !== null;
                const isLikelyJSON = looksLikeJSON(firstBytes);

                if (isLikelyImage) {
                    const arrayBuffer = await clonedResponse.arrayBuffer();
                    imageBuffer = Buffer.from(arrayBuffer);
                    responseProcessed = true;
                } else if (contentType.includes("application/json") || (isLikelyJSON && !contentType.includes("image/"))) {
                    try {
                        const jsonData = await clonedResponse.json();
                        let base64Image = jsonData.image || jsonData.data || jsonData.output || jsonData.result;
                        if (jsonData.image_bytes) {
                            imageBuffer = Buffer.from(jsonData.image_bytes, 'hex');
                            responseProcessed = true;
                        }
                        if (typeof base64Image === 'string') {
                            if (base64Image.startsWith('data:')) {
                                const matches = base64Image.match(/^data:image\/[^;]+;base64,(.+)$/);
                                if (matches) imageBuffer = Buffer.from(matches[1], 'base64');
                            } else if (base64Image.length > 100) {
                                try { imageBuffer = Buffer.from(base64Image, 'base64'); } catch { }
                            }
                            if (imageBuffer) responseProcessed = true;
                        }
                        if (!responseProcessed && (jsonData.url || jsonData.imageUrl)) {
                            const ir = await fetchWithTimeout(jsonData.url || jsonData.imageUrl);
                            imageBuffer = Buffer.from(await ir.arrayBuffer());
                            responseProcessed = true;
                        }
                    } catch {
                        const fb = response.clone();
                        const ab = await fb.arrayBuffer();
                        if (detectImageFormat(Buffer.from(ab))) {
                            imageBuffer = Buffer.from(ab);
                            responseProcessed = true;
                        }
                    }
                } else {
                    const ab = await clonedResponse.arrayBuffer();
                    imageBuffer = Buffer.from(ab);
                    responseProcessed = true;
                }
                if (!imageBuffer || imageBuffer.length < 100) throw new Error("Invalid image buffer extracted");
            } catch (error) {
                logger.error(`[${requestId}] Processing error: ${error.message}`, error);
                throw error;
            }
        }

        // Image processing - runs for all models
        const { default: sharp } = await import("sharp");
        const sharpImg = sharp(imageBuffer);
        const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
        const thumbBuffer = await sharpImg.resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        const lqipBuffer = await sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer();
        lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

        const baseFolder = `generated/${userId}/${Date.now()}`;
        originalFilename = `${baseFolder}.webp`;
        thumbFilename = `${baseFolder}_thumb.webp`;

        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();

        await Promise.all([
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename, Body: webpBuffer, ContentType: "image/webp" })),
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename, Body: thumbBuffer, ContentType: "image/webp" }))
        ]);

        imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

        const imageRef = await db.collection("images").add({
            userId, prompt, negative_prompt, steps, cfg, aspectRatio, modelId,
            imageUrl, thumbnailUrl, lqip, promptHash, promptMetadata,
            createdAt: FieldValue.serverTimestamp(), originalRequestId: requestId
        });

        await docRef.update({ status: "completed", imageUrl, thumbnailUrl, lqip, completedAt: new Date(), resultImageId: imageRef.id });

    } catch (error) {
        logger.error(`[${requestId}] Task Failed`, error);
        let recoverySucceeded = false;
        if (imageUrl && thumbnailUrl) {
            try {
                const queueDoc = await docRef.get();
                if (queueDoc.exists && !queueDoc.data().imageUrl) {
                    await docRef.update({ status: "completed", imageUrl, thumbnailUrl, lqip, completedAt: new Date() });
                    recoverySucceeded = true;
                }
            } catch (recErr) { logger.error("Recovery failed", recErr); }
        }

        if (!recoverySucceeded) {
            await retryOperation(() => db.collection('users').doc(userId).update({ zaps: FieldValue.increment(1) }), { context: 'Refund Image Task' })
                .catch(e => logger.error("Refund Error", e, { userId }));
            await docRef.update({ status: "failed", error: error.message });
        }
    }
}

