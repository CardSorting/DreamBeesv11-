import { db, FieldValue } from "../firebaseInit.js";
import { Wallet } from "../lib/wallet.js";
import { getS3Client, fetchWithTimeout, logger, retryOperation } from "../lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { isValidModelId } from "../lib/modelConventions.js";
import { ForensicLogger } from "../lib/forensics.js";
import { SubstrateHealth } from "../lib/substrateHealth.js";
function findImagePayload(value) {
    if (!value)
        return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('data:image/') ||
            /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed)) {
            return trimmed;
        }
        return null;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const match = findImagePayload(item);
            if (match)
                return match;
        }
        return null;
    }
    if (typeof value === 'object') {
        const record = value;
        const preferredKeys = [
            'image',
            'image_url',
            'imageUrl',
            'url',
            'output',
            'result',
            'data',
            'artifact',
            'artifacts'
        ];
        for (const key of preferredKeys) {
            const match = findImagePayload(record[key]);
            if (match)
                return match;
        }
    }
    return null;
}
async function imagePayloadToBuffer(payload) {
    if (payload.startsWith('http://') || payload.startsWith('https://')) {
        const res = await fetchWithTimeout(payload, {
            headers: { "User-Agent": "DreamBees/1.1" },
            timeout: 60000
        });
        if (!res.ok) {
            throw new Error(`Generated image download failed (${res.status})`);
        }
        return Buffer.from(await res.arrayBuffer());
    }
    const base64 = payload.startsWith('data:image/')
        ? payload.slice(payload.indexOf(',') + 1)
        : payload;
    return Buffer.from(base64.replace(/\s/g, ''), 'base64');
}
async function parseModelPollResponse(res) {
    if (res.status === 202)
        return { kind: 'pending' };
    if (res.status === 404)
        return { kind: 'empty' };
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('image/')) {
        return { kind: 'image', buffer: Buffer.from(await res.arrayBuffer()) };
    }
    if (contentType.includes('application/json')) {
        const payload = await res.json();
        const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : '';
        const error = payload.error || payload.message || payload.detail;
        if (!res.ok || ['failed', 'error', 'cancelled', 'canceled'].includes(status)) {
            throw new Error(`SDXL generation failed: ${String(error || `status ${res.status}`)}`);
        }
        const imagePayload = findImagePayload(payload);
        if (imagePayload) {
            return { kind: 'image', buffer: await imagePayloadToBuffer(imagePayload) };
        }
        if (['queued', 'running', 'generating', 'processing', 'pending', 'started'].includes(status)) {
            return { kind: 'pending' };
        }
        if (['completed', 'complete', 'succeeded', 'success', 'done'].includes(status)) {
            throw new Error("SDXL generation completed without an image payload");
        }
        return { kind: 'empty' };
    }
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`SDXL result request failed (${res.status})${body ? `: ${body.slice(0, 300)}` : ''}`);
    }
    return { kind: 'empty' };
}
/**
 * Main worker for image generation tasks
 */
export const processImageTask = async (req) => {
    const { requestId, userId, modelId, negative_prompt, steps = 30, cfg = 7, aspectRatio = '1:1', scheduler, promptHash, promptMetadata } = req.data;
    let prompt = req.data.prompt;
    if (prompt && prompt.length > 1500) {
        prompt = prompt.substring(0, 1500);
    }
    const forensic = new ForensicLogger({
        requestId,
        workerName: 'ImageWorker',
        taskType: 'image',
        userId,
        startTime: Date.now()
    });
    const docRef = db.collection("generation_queue").doc(requestId);
    // --- DETERMINISTIC LOCK: Atomic State Transition ---
    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(docRef);
            if (!doc.exists) {
                throw new Error("Job document missing");
            }
            const data = doc.data();
            if (['processing', 'completed'].includes(data.status)) {
                throw new Error(`IDEMPOTENCY_BLOCK: Status is ${data.status}`);
            }
            t.update(docRef, {
                status: "processing",
                stage: "generating",
                startedAt: FieldValue.serverTimestamp()
            });
        });
        forensic.checkpoint('locked_and_processing');
        await docRef.update({ progress: 15 }).catch(() => { });
    }
    catch (e) {
        if (e.message.includes('IDEMPOTENCY_BLOCK')) {
            forensic.checkpoint('skipped_idempotent');
            return;
        }
        throw e;
    }
    // ---------------------------------------------------
    let imageUrl = null;
    let thumbnailUrl = null;
    let lqip = null;
    let imageBuffer = null;
    try {
        const resolutionMap = {
            '1:1': { width: 1024, height: 1024 },
            '2:3': { width: 832, height: 1216 },
            '3:2': { width: 1216, height: 832 },
            '9:16': { width: 768, height: 1344 },
            '16:9': { width: 1344, height: 768 }
        };
        const resolution = resolutionMap[aspectRatio] || resolutionMap['1:1'];
        // --- MODEL EXECUTION ---
        if (!isValidModelId(modelId)) {
            throw new Error(`Unsupported model ID: ${modelId}`);
        }
        imageBuffer = await (async () => {
            logger.info(`[${requestId}] Running SDXL generation for model: ${modelId}`);
            let finalSteps = steps || 30;
            let finalCfg = cfg || 7;
            let finalScheduler = scheduler || 'DPM++ 2M Karras';
            let hires_fix = false;
            let finalPrompt = prompt;
            if (modelId === 'wai-illustrious') {
                hires_fix = true;
            }
            else if (modelId === 'z-image-turbo-a100') {
                finalSteps = Math.min(Math.max(steps || 8, 1), 9);
                finalCfg = cfg || 7;
                finalScheduler = scheduler || 'DPM++ 2M Karras';
                hires_fix = false;
            }
            else if (modelId === 'nova-3d-cg-xl') {
                hires_fix = true;
                const qualityTags = ", 3d render, cgi, masterwork, ultra detailed, cinematic lighting";
                if (!finalPrompt.toLowerCase().includes("3d render")) {
                    finalPrompt = `${finalPrompt}${qualityTags}`;
                }
            }
            else if (modelId === 'anima') {
                finalSteps = steps || 30;
                finalCfg = cfg || 4.5;
                finalScheduler = scheduler || 'FlowMatchEuler';
                hires_fix = false;
            }
            const body = modelId === 'z-image-turbo-a100'
                ? {
                    prompt: finalPrompt,
                    negative_prompt,
                    steps: finalSteps,
                    aspect_ratio: aspectRatio,
                    width: resolution.width,
                    height: resolution.height
                }
                : {
                    prompt: finalPrompt,
                    model: modelId || "wai-illustrious",
                    negative_prompt,
                    steps: finalSteps,
                    cfg: finalCfg,
                    width: resolution.width,
                    height: resolution.height,
                    scheduler: finalScheduler,
                    hires_fix
                };
            const { getModelEndpoint } = await import("../lib/modelConventions.js");
            const endpoint = getModelEndpoint(modelId);
            const submitResponse = await fetchWithTimeout(`${endpoint}/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "DreamBees/1.1"
                },
                body: JSON.stringify(body),
                timeout: 120000
            });
            if (!submitResponse.ok) {
                throw new Error(`SDXL Submission Failed (${submitResponse.status})`);
            }
            const { job_id } = await submitResponse.json();
            await docRef.update({ stage: "generating", progress: 20 }).catch(() => { });
            for (let poll = 0; poll < 120; poll++) {
                const delayMs = poll === 0 ? 300 : Math.min(600 + poll * 280, 2800);
                await new Promise(r => setTimeout(r, delayMs));
                const pollProgress = Math.min(75, 20 + poll * 3);
                docRef.update({ stage: "generating", progress: pollProgress }).catch(() => { });
                const [resultRes, jobsRes] = await Promise.all([
                    fetchWithTimeout(`${endpoint}/result/${job_id}`, { timeout: 12000 }).catch(() => null),
                    fetchWithTimeout(`${endpoint}/jobs/${job_id}`, { timeout: 12000 }).catch(() => null)
                ]);
                let pending = false;
                for (const res of [resultRes, jobsRes]) {
                    if (!res)
                        continue;
                    const parsed = await parseModelPollResponse(res);
                    if (parsed.kind === 'pending') {
                        pending = true;
                        continue;
                    }
                    if (parsed.kind === 'image') {
                        return parsed.buffer;
                    }
                }
                if (pending)
                    continue;
            }
            throw new Error("SDXL generation timed out");
        })();
        if (!imageBuffer || imageBuffer.length < 100) {
            throw new Error("Failed to generate or retrieve image buffer");
        }
        await docRef.update({ progress: 72, stage: "generating" }).catch(() => { });
        const { default: sharp } = await import("sharp");
        // LQIP first — smallest encode, pushed to client before full resize/upload work
        const lqipBuffer = await sharp(imageBuffer)
            .resize(20, 20, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 20 })
            .toBuffer();
        lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;
        await docRef.update({ progress: 78, lqip, stage: "generating" }).catch(() => { });
        const [webpBuffer, thumbBuffer] = await Promise.all([
            sharp(imageBuffer).webp({ quality: 90 }).toBuffer(),
            sharp(imageBuffer).resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
        ]);
        const baseFolder = `generated/${userId}/${Date.now()}`;
        const originalFilename = `${baseFolder}.webp`;
        const thumbFilename = `${baseFolder}_thumb.webp`;
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();
        forensic.checkpoint('upload_starting');
        thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;
        // Thumbnail first — client can show preview before full upload finishes
        await s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename, Body: thumbBuffer, ContentType: "image/webp" }));
        await docRef.update({
            stage: "saving",
            progress: 85,
            thumbnailUrl,
            lqip
        }).catch(() => { });
        await s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename, Body: webpBuffer, ContentType: "image/webp" }));
        forensic.checkpoint('upload_complete');
        imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        // Signal completion immediately — catalog write can finish in the background
        await retryOperation(() => docRef.update({
            status: "completed",
            stage: "done",
            progress: 100,
            imageUrl, thumbnailUrl, lqip,
            completedAt: new Date()
        }));
        db.collection("images").add({
            userId, prompt, negative_prompt, steps, cfg, aspectRatio, modelId,
            imageUrl, thumbnailUrl, lqip, promptHash, promptMetadata,
            isPublic: true,
            createdAt: FieldValue.serverTimestamp(), originalRequestId: requestId
        }).then((imageRef) => {
            docRef.update({ resultImageId: imageRef.id }).catch(() => { });
        }).catch((catalogErr) => {
            logger.error(`[${requestId}] Catalog write failed`, catalogErr);
        });
        // RECORD SUCCESS
        await SubstrateHealth.recordSuccess(modelId);
    }
    catch (error) {
        forensic.fail(error);
        if (userId && !userId.startsWith('anonymous')) {
            try {
                // RECORD FAILURE FOR CIRCUIT BREAKER
                await SubstrateHealth.recordFailure(modelId, error.message);
                // DETERMINISTIC REFUND ID
                const doc = await docRef.get();
                const cost = doc.data()?.cost || 1;
                const refundId = `refund_worker_${requestId}`;
                await Wallet.credit(userId, cost, refundId, {
                    auditType: 'worker_refund',
                    originalRequestId: requestId,
                    reason: error.message
                });
            }
            catch (refundError) {
                logger.error("Refund Error", refundError);
            }
        }
        await docRef.update({
            status: "failed",
            error: error.message,
            failedAt: FieldValue.serverTimestamp()
        }).catch(() => { });
    }
};
//# sourceMappingURL=image.js.map