import { db, FieldValue } from "../firebaseInit.js";
import { getS3Client, fetchWithTimeout, logger, retryOperation } from "../lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from "../lib/constants.js";
// [REMOVED] import { vertexFlow } from "../lib/vertexFlow.js";

// Local helpers removed (unused)


// Simplified Endpoints
const ENDPOINTS = {
    'zit_h100': 'https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run',
    'zit_a10g': 'https://mariecoderinc--zit-a10g-fastapi-app.modal.run',
    'zit_base': 'https://mariecoderinc--zit-h100-stable-base-fastapi-app.modal.run',
    'sdxl_a10g': 'https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run',
    'sdxl_h100': 'https://mariecoderinc--sdxl-multi-model-h100-model-web.modal.run',
    'flux_klein': 'https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run',
    'flux2dev': 'https://api.cloudflare.com/client/v4/accounts/CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-2-dev'
};

/**
 * Main worker for image generation tasks
 * Removed LoadBalancer for simplified direct execution
 */
export const processImageTask = async (req) => {
    const {
        requestId, userId, modelId, negative_prompt,
        steps = 30, cfg = 7, aspectRatio = '1:1',
        scheduler, promptHash, promptMetadata
    } = req.data;

    let prompt = req.data.prompt;

    // Safety: Cap prompt length
    if (prompt && prompt.length > 1500) {
        prompt = prompt.substring(0, 1500);
    }

    const docRef = db.collection("generation_queue").doc(requestId);

    const existingDoc = await docRef.get();
    if (existingDoc.exists && ['processing', 'completed'].includes(existingDoc.data().status)) {
        logger.info(`Idempotency check: Task ${requestId} already processed. Skipping.`, { requestId });
        return;
    }

    let imageUrl = null;
    let thumbnailUrl = null;
    let lqip = null;
    let imageBuffer = null;

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

        // --- MODEL EXECUTION ---


        if (modelId === 'flux-klein-4b') {
            imageBuffer = await (async () => {
                const endpoint = ENDPOINTS.flux_klein;
                const body = {
                    prompt,
                    image: req.data.image, // Base64 input
                    strength: 0.75, // Default strength
                    steps: 4, // Fast 4-step
                    width: resolution.width,
                    height: resolution.height
                };

                logger.info(`[${requestId}] Running Flux Klein Edit`);
                const submitResponse = await fetch(`${endpoint}/edit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (!submitResponse.ok) {
                    const e = await submitResponse.text();
                    throw new Error(`Flux Klein Submission Failed (${submitResponse.status}): ${e}`);
                }

                const { job_id } = await submitResponse.json();

                // Poll for result
                for (let poll = 0; poll < 60; poll++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const resultRes = await fetch(`${endpoint}/result/${job_id}`);

                    if (resultRes.status === 200) {
                        const ct = resultRes.headers.get('content-type') || '';
                        if (ct.includes('image/')) {
                            return Buffer.from(await resultRes.arrayBuffer());
                        }
                        // Check if JSON says still generating
                        const json = await resultRes.json().catch(() => ({}));
                        if (json.status === 'failed') {
                            throw new Error(json.error || "Flux Klein Generation Failed");
                        }
                    }
                }
                throw new Error("Flux Klein generation timed out");
            })();
        }
        else if (modelId === 'zit-model' || modelId === 'zit-base-model') {
            imageBuffer = await (async () => {
                const endpoint = modelId === 'zit-base-model' ? ENDPOINTS.zit_base : ENDPOINTS.zit_h100;
                const defaultSteps = modelId === 'zit-base-model' ? 28 : 9;

                logger.info(`[${requestId}] Running ${modelId} generation`);
                const body = {
                    prompt,
                    steps: steps || defaultSteps,
                    width: resolution.width,
                    height: resolution.height
                };

                const submitResponse = await fetch(`${endpoint}/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (!submitResponse.ok) { throw new Error(`${modelId} Submission Failed (${submitResponse.status})`); }

                const { job_id } = await submitResponse.json();

                // Poll for result
                for (let poll = 0; poll < 120; poll++) {
                    await new Promise(r => setTimeout(r, 4000));
                    let resultRes = await fetch(`${endpoint}/result/${job_id}`);
                    if (resultRes.status === 404) { resultRes = await fetch(`${endpoint}/jobs/${job_id}`); }

                    if (resultRes.status === 202) { continue; }
                    if (!resultRes.ok) { throw new Error(`${modelId} Polling Error (${resultRes.status})`); }

                    const ct = resultRes.headers.get('content-type') || '';
                    if (ct.includes('image/')) {
                        return Buffer.from(await resultRes.arrayBuffer());
                    }
                }
                throw new Error(`${modelId} generation timed out`);
            })();
        }
        else if (modelId === 'flux-2-dev') {
            imageBuffer = await (async () => {
                const cfUrl = ENDPOINTS.flux2dev.replace('CLOUDFLARE_ACCOUNT_ID', CLOUDFLARE_ACCOUNT_ID);
                logger.info(`[${requestId}] Running flux-2-dev via Cloudflare. URL: ${cfUrl.substring(0, 50)}...`);

                const formData = new FormData();
                formData.append('prompt', prompt);
                formData.append('steps', '25');
                formData.append('width', String(resolution.width));
                formData.append('height', String(resolution.height));

                const cfRes = await fetch(cfUrl, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}` },
                    body: formData
                });

                if (!cfRes.ok) {
                    const errText = await cfRes.text();
                    logger.error(`[${requestId}] Cloudflare Flux Failed (${cfRes.status})`, { error: errText });
                    throw new Error(`Cloudflare Flux Failed (${cfRes.status}): ${errText.substring(0, 200)}`);
                }

                const contentType = cfRes.headers.get("content-type") || "";

                if (contentType.includes("image/")) {
                    logger.info(`[${requestId}] Flux: Received binary image response.`);
                    return Buffer.from(await cfRes.arrayBuffer());
                } else {
                    const cfJson = await cfRes.json();
                    const base64Img = cfJson.result?.image || cfJson.result;
                    if (!base64Img || typeof base64Img !== 'string') {
                        logger.error(`[${requestId}] Flux: No image data in JSON response.`, { response: cfJson });
                        throw new Error("No image data from Cloudflare");
                    }
                    logger.info(`[${requestId}] Flux: Received Base64 image response.`);
                    return Buffer.from(base64Img, 'base64');
                }
            })();
        }
        else {
            // Default SDXL Path
            imageBuffer = await (async () => {
                logger.info(`[${requestId}] Running SDXL generation`);
                const body = {
                    prompt,
                    model: modelId || "wai-illustrious",
                    negative_prompt,
                    steps,
                    width: resolution.width,
                    height: resolution.height,
                    scheduler: scheduler || 'DPM++ 2M Karras'
                };

                const submitResponse = await fetchWithTimeout(`${ENDPOINTS.sdxl_a10g}/generate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": "DreamBees/1.1"
                    },
                    body: JSON.stringify(body),
                    timeout: 120000
                });

                if (!submitResponse.ok) { throw new Error(`SDXL Submission Failed (${submitResponse.status})`); }

                const { job_id } = await submitResponse.json();

                // Poll for result
                for (let poll = 0; poll < 120; poll++) {
                    await new Promise(r => setTimeout(r, 4000));
                    let resultRes = await fetch(`${ENDPOINTS.sdxl_a10g}/result/${job_id}`);
                    if (resultRes.status === 404) { resultRes = await fetch(`${ENDPOINTS.sdxl_a10g}/jobs/${job_id}`); }

                    if (resultRes.status === 202) { continue; }
                    if (!resultRes.ok) { throw new Error(`SDXL Polling Error (${resultRes.status})`); }

                    if (resultRes.headers.get('content-type')?.includes('image/')) {
                        return Buffer.from(await resultRes.arrayBuffer());
                    }

                    // Prevent infinite loop if 200 OK but not image (e.g. JSON error)
                    const text = await resultRes.text();
                    logger.warn(`[${requestId}] SDXL Polling: Received 200 OK but Content-Type is ${resultRes.headers.get('content-type')}`, { body: text.substring(0, 500) });
                    throw new Error(`SDXL Unexpected Response: ${text.substring(0, 100)}`);
                }
                throw new Error("SDXL generation timed out");
            })();
        }

        if (!imageBuffer || imageBuffer.length < 100) {
            throw new Error("Failed to generate or retrieve image buffer");
        }

        // --- IMAGE PROCESSING ---
        const { default: sharp } = await import("sharp");
        const sharpImg = sharp(imageBuffer);

        const [webpBuffer, thumbBuffer, lqipBuffer] = await Promise.all([
            sharpImg.webp({ quality: 90 }).toBuffer(),
            sharpImg.resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
            sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer()
        ]);

        lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

        const baseFolder = `generated/${userId}/${Date.now()}`;
        const originalFilename = `${baseFolder}.webp`;
        const thumbFilename = `${baseFolder}_thumb.webp`;

        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();

        await Promise.all([
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename, Body: webpBuffer, ContentType: "image/webp" })),
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename, Body: thumbBuffer, ContentType: "image/webp" }))
        ]);

        imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

        // Create image history entry
        const imageRef = await db.collection("images").add({
            userId, prompt, negative_prompt, steps, cfg, aspectRatio, modelId,
            imageUrl, thumbnailUrl, lqip, promptHash, promptMetadata,
            isPublic: true,
            createdAt: FieldValue.serverTimestamp(), originalRequestId: requestId
        });

        // Update queue doc
        await retryOperation(() => docRef.update({
            status: "completed",
            imageUrl, thumbnailUrl, lqip,
            completedAt: new Date(),
            resultImageId: imageRef.id
        }));

    } catch (error) {
        logger.error(`[${requestId}] Task Failed: ${error.message}`, error);

        // Refund if not anonymous
        if (userId && !userId.startsWith('anonymous')) {
            await db.collection('users').doc(userId).update({
                zaps: FieldValue.increment(1)
            }).catch(e => logger.error("Refund Error", e));
        }

        await docRef.update({
            status: "failed",
            error: error.message
        }).catch(() => { });
    }
};
