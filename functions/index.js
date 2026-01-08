import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createCheckoutSession, constructWebhookEvent, createPortalSession } from "./stripeHelpers.js";
import Replicate from "replicate";
import sharp from "sharp";

import { createRequire } from "module";
const require = createRequire(import.meta.url);



// Initializing Firebase Admin
// Use the service account key only for local emulation or if env var not set
// In production (Cloud Functions), initializeApp() uses ADC (default service account)
if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
    const serviceAccount = require("./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json");
    initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    initializeApp();
}
const db = getFirestore();

// Environment variables should be set in Firebase Functions config
// firebase functions:config:set huggingface.token="..." b2.key_id="..." ...
// Or for v2, use params or process.env if deployed with .env support

const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION;
const B2_BUCKET = process.env.B2_BUCKET;
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;

const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

const VALID_MODELS = [
    'cat-carrier', 'hassaku-illustrious', 'nova-furry-xl', 'perfect-illustrious',
    'gray-color', 'scyrax-pastel', 'ani-detox', 'animij-v7', 'swijtspot-no1',
    'zit-model', 'qwen-image-2512', 'wai-illustrious'
];

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 60000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

/**
 * Verifies if files exist in B2 storage and returns their URLs if found
 * @param {string} originalFilename - The filename of the original image
 * @param {string} thumbFilename - The filename of the thumbnail
 * @returns {Promise<{imageUrl: string|null, thumbnailUrl: string|null}>}
 */
async function verifyB2FilesExist(originalFilename, thumbFilename) {
    const result = { imageUrl: null, thumbnailUrl: null };

    try {
        // Check original image
        if (originalFilename) {
            try {
                await s3Client.send(new HeadObjectCommand({
                    Bucket: B2_BUCKET,
                    Key: originalFilename
                }));
                result.imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
                console.log(`[B2 Verification] Original file exists: ${originalFilename}`);
            } catch (headError) {
                if (headError.name !== 'NotFound') {
                    console.warn(`[B2 Verification] Error checking original file: ${headError.message}`);
                } else {
                    console.log(`[B2 Verification] Original file not found: ${originalFilename}`);
                }
            }
        }

        // Check thumbnail
        if (thumbFilename) {
            try {
                await s3Client.send(new HeadObjectCommand({
                    Bucket: B2_BUCKET,
                    Key: thumbFilename
                }));
                result.thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;
                console.log(`[B2 Verification] Thumbnail file exists: ${thumbFilename}`);
            } catch (headError) {
                if (headError.name !== 'NotFound') {
                    console.warn(`[B2 Verification] Error checking thumbnail: ${headError.message}`);
                } else {
                    console.log(`[B2 Verification] Thumbnail file not found: ${thumbFilename}`);
                }
            }
        }
    } catch (error) {
        console.error(`[B2 Verification] Unexpected error during verification: ${error.message}`);
    }

    return result;
}

// Image Generation Worker (onTaskDispatched)
export const processImageTask = onTaskDispatched(
    {
        retryConfig: { maxAttempts: 3, minBackoffSeconds: 60 },
        rateLimits: { maxConcurrentDispatches: 5 }, // Higher limit for images
        memory: "1GiB",
        timeoutSeconds: 540,
    },
    async (req) => {
        const { requestId, userId, prompt, negative_prompt, modelId, steps, cfg, aspectRatio, scheduler } = req.data;
        const db = getFirestore();
        const docRef = db.collection("generation_queue").doc(requestId);

        // Track filenames for recovery in case of timeout
        let originalFilename = null;
        let thumbFilename = null;
        let imageUrl = null;
        let thumbnailUrl = null;
        let lqip = null;

        try {
            await docRef.update({ status: "processing" });

            // Resolution mapping
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
                const zBody = {
                    prompt, steps,
                    ...((['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'].includes(aspectRatio)) ? { aspect_ratio: aspectRatio } : { width: resolution.width, height: resolution.height })
                };
                response = await fetchWithTimeout("https://cardsorting--zit-only-fastapi-app.modal.run/generate", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(zBody),
                    timeout: 180000
                });
            } else if (modelId === 'qwen-image-2512') {
                response = await fetchWithTimeout("https://cardsorting--qwen-image-2512-qwenimage-api-generate.modal.run", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, negative_prompt, aspect_ratio: aspectRatio }),
                    timeout: 180000
                });
            } else {
                const params = new URLSearchParams({
                    prompt, model: modelId || "cat-carrier", negative_prompt,
                    steps: steps.toString(), cfg: cfg.toString(),
                    width: resolution.width.toString(), height: resolution.height.toString(),
                    scheduler: scheduler || 'DPM++ 2M Karras'
                });
                const url = `https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${params.toString()}`;

                // Defensive check for URL length to prevent 414 errors or silent truncation
                if (url.length > 2048) {
                    throw new Error("Prompt is too long for this model (URL length limit exceeded). Please shorten your prompt.");
                }

                response = await fetchWithTimeout(url, { timeout: 180000 });
            }

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Model Provider Error (${response.status}): ${errText}`);
            }

            // Comprehensive response logging for diagnostics
            const contentType = response.headers.get("content-type") || "";
            const contentLength = response.headers.get("content-length");
            const allHeaders = Object.fromEntries(response.headers.entries());

            console.log(`[${requestId}] Response received from Modal:`);
            console.log(`  Status: ${response.status}`);
            console.log(`  Content-Type: ${contentType || '(missing)'}`);
            console.log(`  Content-Length: ${contentLength || '(unknown)'}`);
            console.log(`  Headers: ${JSON.stringify(allHeaders)}`);

            // Clone response immediately to enable multiple read attempts
            const clonedResponse = response.clone();
            const firstBytesClone = response.clone();

            // Helper function to detect image format by magic bytes
            const detectImageFormat = (buffer) => {
                if (buffer.length < 4) return null;
                // PNG: 89 50 4E 47
                if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
                    return 'image/png';
                }
                // JPEG: FF D8 FF
                if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
                    return 'image/jpeg';
                }
                // WebP: RIFF...WEBP
                if (buffer.length >= 12 &&
                    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
                    return 'image/webp';
                }
                return null;
            };

            // Helper function to read first bytes for magic byte detection
            const readFirstBytes = async (responseToRead, numBytes = 12) => {
                const arrayBuffer = await responseToRead.arrayBuffer();
                if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                    return null;
                }
                const buffer = Buffer.from(arrayBuffer);
                return buffer.slice(0, Math.min(numBytes, buffer.length));
            };

            // Helper function to check if bytes look like JSON start
            const looksLikeJSON = (buffer) => {
                if (!buffer || buffer.length === 0) return false;
                const firstChar = String.fromCharCode(buffer[0]);
                return firstChar === '{' || firstChar === '[' || firstChar === '"';
            };

            let imageBuffer;
            let responseProcessed = false;
            let responsePreview = null;

            try {
                // Step 1: Read first bytes to detect format early (using a clone to avoid consuming main response)
                console.log(`[${requestId}] Reading first bytes for format detection...`);
                const firstBytes = await readFirstBytes(firstBytesClone, 12);

                if (!firstBytes || firstBytes.length === 0) {
                    throw new Error("Response body is empty");
                }

                // Detect image format from magic bytes (prioritize this over content-type)
                const detectedFormat = detectImageFormat(firstBytes);
                const isLikelyImage = detectedFormat !== null;
                const isLikelyJSON = looksLikeJSON(firstBytes);

                console.log(`[${requestId}] First bytes analysis:`);
                console.log(`  Detected format: ${detectedFormat || 'unknown'}`);
                console.log(`  Likely image: ${isLikelyImage}`);
                console.log(`  Likely JSON: ${isLikelyJSON}`);

                // Step 2: Determine processing strategy
                if (isLikelyImage) {
                    // Definitely an image - process as binary
                    console.log(`[${requestId}] Processing as image response (detected format: ${detectedFormat})...`);
                    const arrayBuffer = await clonedResponse.arrayBuffer();
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                        throw new Error("Response arrayBuffer is empty");
                    }
                    imageBuffer = Buffer.from(arrayBuffer);
                    responseProcessed = true;
                    console.log(`[${requestId}] Extracted ${imageBuffer.length} bytes from image response`);
                } else if (contentType.includes("application/json") || (isLikelyJSON && !contentType.includes("image/"))) {
                    // Try JSON first, with fallback to image if JSON parsing fails
                    console.log(`[${requestId}] Processing as JSON response...`);
                    try {
                        const jsonData = await clonedResponse.json();
                        console.log(`[${requestId}] Received JSON response, checking for image data...`);
                        console.log(`[${requestId}] JSON keys: ${Object.keys(jsonData).join(', ')}`);
                        const jsonPreview = JSON.stringify(jsonData).substring(0, 200);
                        console.log(`[${requestId}] JSON preview: ${jsonPreview}...`);
                        responsePreview = jsonPreview;

                        // Check for base64 image in common fields
                        let base64Image = jsonData.image || jsonData.data || jsonData.output || jsonData.result;

                        if (typeof base64Image === 'string') {
                            // Handle base64 strings (with or without data URI prefix)
                            if (base64Image.startsWith('data:')) {
                                // Extract base64 part from data URI
                                const matches = base64Image.match(/^data:image\/[^;]+;base64,(.+)$/);
                                if (matches && matches[1]) {
                                    imageBuffer = Buffer.from(matches[1], 'base64');
                                    responseProcessed = true;
                                } else {
                                    throw new Error("Invalid base64 data URI format in JSON response");
                                }
                            } else if (base64Image.length > 100) {
                                // Assume it's a raw base64 string
                                try {
                                    imageBuffer = Buffer.from(base64Image, 'base64');
                                    responseProcessed = true;
                                } catch (e) {
                                    console.error("Failed to decode base64:", e);
                                    // Check if it might be a URL instead
                                    if (base64Image.startsWith('http')) {
                                        const imgResponse = await fetchWithTimeout(base64Image);
                                        if (!imgResponse.ok) throw new Error(`Failed to fetch image from URL: ${imgResponse.statusText}`);
                                        imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
                                        responseProcessed = true;
                                    } else {
                                        throw new Error("JSON response contains invalid base64 image data");
                                    }
                                }
                            }
                        } else if (jsonData.url || jsonData.imageUrl || jsonData.image_url) {
                            // JSON contains an image URL
                            const imageUrl = jsonData.url || jsonData.imageUrl || jsonData.image_url;
                            console.log(`[${requestId}] Fetching image from URL: ${imageUrl}`);
                            const imgResponse = await fetchWithTimeout(imageUrl);
                            if (!imgResponse.ok) throw new Error(`Failed to fetch image from URL: ${imgResponse.statusText}`);
                            imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
                            responseProcessed = true;
                        } else if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'string' && jsonData[0].startsWith('http')) {
                            // Response is an array with URLs
                            const imageUrl = jsonData[0];
                            console.log(`[${requestId}] Fetching image from array URL: ${imageUrl}`);
                            const imgResponse = await fetchWithTimeout(imageUrl);
                            if (!imgResponse.ok) throw new Error(`Failed to fetch image from URL: ${imgResponse.statusText}`);
                            imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
                            responseProcessed = true;
                        } else {
                            // Try to find image URL or base64 in nested structures
                            const jsonStr = JSON.stringify(jsonData);
                            const urlMatch = jsonStr.match(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp|gif)/i);
                            if (urlMatch) {
                                const imageUrl = urlMatch[0];
                                console.log(`[${requestId}] Found image URL in JSON: ${imageUrl}`);
                                const imgResponse = await fetchWithTimeout(imageUrl);
                                if (!imgResponse.ok) throw new Error(`Failed to fetch image from URL: ${imgResponse.statusText}`);
                                imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
                                responseProcessed = true;
                            } else {
                                // JSON parsing succeeded but no image found - try fallback to raw image parsing
                                throw new Error("JSON response does not contain recognizable image data (base64, URL, or image field)");
                            }
                        }
                    } catch (jsonError) {
                        console.warn(`[${requestId}] JSON parsing failed or no image in JSON, attempting fallback to raw image parsing...`);
                        console.warn(`[${requestId}] JSON error: ${jsonError.message}`);

                        // Fallback: Try processing as raw image bytes
                        // Note: We need to use the original response since clonedResponse was consumed by json()
                        const fallbackResponse = response.clone();
                        const arrayBuffer = await fallbackResponse.arrayBuffer();
                        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                            throw new Error(`JSON parsing failed and response body is empty. JSON error: ${jsonError.message}`);
                        }
                        const tempBuffer = Buffer.from(arrayBuffer);
                        const fallbackFormat = detectImageFormat(tempBuffer);

                        if (fallbackFormat) {
                            console.log(`[${requestId}] Fallback successful: Detected image format ${fallbackFormat}`);
                            imageBuffer = tempBuffer;
                            responseProcessed = true;
                        } else {
                            // Neither JSON nor image worked
                            throw new Error(`Failed to process as JSON or image. JSON error: ${jsonError.message}. First bytes do not match known image formats.`);
                        }
                    }
                } else if (contentType.includes("image/")) {
                    // Content-type says image but magic bytes don't match - still try to process
                    console.log(`[${requestId}] Processing as image response (content-type: ${contentType})...`);
                    const arrayBuffer = await clonedResponse.arrayBuffer();
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                        throw new Error("Response arrayBuffer is empty");
                    }
                    imageBuffer = Buffer.from(arrayBuffer);
                    responseProcessed = true;
                    console.log(`[${requestId}] Extracted ${imageBuffer.length} bytes from image response`);
                } else {
                    // Unknown content-type - try image first (most common case), then JSON
                    console.log(`[${requestId}] Unknown content-type, attempting image detection first...`);
                    const arrayBuffer = await clonedResponse.arrayBuffer();
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                        throw new Error("Response arrayBuffer is empty");
                    }
                    const tempBuffer = Buffer.from(arrayBuffer);
                    const detectedFormat2 = detectImageFormat(tempBuffer);

                    if (detectedFormat2) {
                        console.log(`[${requestId}] Detected image format by magic bytes: ${detectedFormat2}`);
                        imageBuffer = tempBuffer;
                        responseProcessed = true;
                    } else if (looksLikeJSON(tempBuffer)) {
                        // Try JSON as fallback
                        console.log(`[${requestId}] Attempting JSON parsing as fallback...`);
                        try {
                            const jsonStr = tempBuffer.toString('utf-8');
                            const jsonData = JSON.parse(jsonStr);
                            responsePreview = JSON.stringify(jsonData).substring(0, 200);
                            throw new Error("JSON detected but image extraction from JSON is not supported in this path. Use explicit JSON content-type.");
                        } catch (jsonParseError) {
                            throw new Error(`Could not determine response format. JSON parse error: ${jsonParseError.message}. First bytes: ${Array.from(tempBuffer.slice(0, 12)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ')}`);
                        }
                    } else {
                        // Try to process as raw image bytes anyway (fallback)
                        console.log(`[${requestId}] No magic bytes detected, attempting to process as raw image bytes...`);
                        imageBuffer = tempBuffer;
                        responseProcessed = true;
                    }
                }

                // Validation checks
                if (!responseProcessed) {
                    throw new Error("Failed to determine response type - content-type was not JSON or image, and magic byte detection failed");
                }

                if (!imageBuffer || imageBuffer.length === 0) {
                    throw new Error("Failed to extract image data from response - imageBuffer is empty");
                }

                // Validate image buffer contains reasonable data
                if (imageBuffer.length < 100) {
                    throw new Error(`Image buffer is too small (${imageBuffer.length} bytes) - likely not a valid image`);
                }

                // Verify it's actually an image by checking magic bytes
                const validatedFormat = detectImageFormat(imageBuffer);
                if (!validatedFormat && !contentType.includes("application/json")) {
                    console.warn(`[${requestId}] Warning: Image buffer does not match known image format magic bytes. Proceeding anyway...`);
                } else if (validatedFormat) {
                    console.log(`[${requestId}] Validated image format: ${validatedFormat}`);
                }

            } catch (error) {
                // Enhanced error logging with response details
                console.error(`[${requestId}] Error processing response:`, error.message);
                console.error(`[${requestId}] Response status: ${response.status}`);
                console.error(`[${requestId}] Response content-type: ${contentType || '(missing)'}`);
                console.error(`[${requestId}] Response processed flag: ${responseProcessed}`);

                // Always try to log response preview for diagnostics
                try {
                    // Use cloned response if available, otherwise clone original
                    const previewResponse = clonedResponse || response.clone();
                    const textPreview = await previewResponse.text();
                    const previewLength = Math.min(500, textPreview.length);
                    console.error(`[${requestId}] Response preview (first ${previewLength} chars): ${textPreview.substring(0, previewLength)}`);

                    // Also try to show first bytes as hex
                    if (textPreview.length > 0) {
                        const firstBytesHex = Array.from(Buffer.from(textPreview.substring(0, 12), 'utf-8'))
                            .map(b => `0x${b.toString(16).padStart(2, '0')}`)
                            .join(' ');
                        console.error(`[${requestId}] First bytes (hex): ${firstBytesHex}`);
                    }
                } catch (previewError) {
                    console.error(`[${requestId}] Could not read response preview: ${previewError.message}`);
                    // If we have a cached preview from JSON parsing attempt, use it
                    if (responsePreview) {
                        console.error(`[${requestId}] Cached response preview: ${responsePreview}`);
                    }
                }

                throw new Error(`Failed to process Modal response: ${error.message}`);
            }

            // Log success after validation
            console.log(`[${requestId}] Successfully extracted image buffer (${imageBuffer.length} bytes)`);

            // Process Image with Sharp
            let sharpImg;
            try {
                sharpImg = sharp(imageBuffer);
            } catch (sharpError) {
                console.error(`Sharp initialization failed for ${requestId}:`, sharpError);
                throw new Error(`Failed to initialize image processor: ${sharpError.message}`);
            }

            // 1. Convert Original to WebP
            const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();

            // 2. Create Thumbnail (e.g., 512px width)
            const thumbBuffer = await sharpImg
                .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            // 3. Create LQIP (Low Quality Image Placeholder - 20px)
            const lqipBuffer = await sharpImg
                .resize(20, 20, { fit: 'inside' })
                .webp({ quality: 20 })
                .toBuffer();
            lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

            // Upload to B2
            const baseFolder = `generated/${userId}/${Date.now()}`;
            originalFilename = `${baseFolder}.webp`;
            thumbFilename = `${baseFolder}_thumb.webp`;

            // Parallel upload
            await Promise.all([
                s3Client.send(new PutObjectCommand({
                    Bucket: B2_BUCKET,
                    Key: originalFilename,
                    Body: webpBuffer,
                    ContentType: "image/webp"
                })),
                s3Client.send(new PutObjectCommand({
                    Bucket: B2_BUCKET,
                    Key: thumbFilename,
                    Body: thumbBuffer,
                    ContentType: "image/webp"
                }))
            ]);

            imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
            thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

            // Save result
            const imageRef = await db.collection("images").add({
                userId,
                prompt,
                negative_prompt,
                steps,
                cfg,
                aspectRatio,
                modelId,
                imageUrl,
                thumbnailUrl, // Add thumbnail URL
                lqip, // Add LQIP
                createdAt: new Date(),
                originalRequestId: requestId
            });

            await docRef.update({
                status: "completed",
                imageUrl,
                thumbnailUrl, // Update queue doc too
                lqip, // Add LQIP
                completedAt: new Date(),
                resultImageId: imageRef.id
            });

            console.log(`Image generation completed successfully for ${requestId}. Image saved to: ${imageUrl}`);

        } catch (error) {
            console.error(`[${requestId}] Task Failed:`, error);
            console.error(`[${requestId}] Error name: ${error.name}, message: ${error.message}`);
            console.error(`[${requestId}] Error stack: ${error.stack || 'No stack trace'}`);
            console.error(`[${requestId}] Error code: ${error.code || 'No code'}`);

            // Enhanced timeout/abort error detection
            const errorMessageLower = (error.message || '').toLowerCase();
            const errorNameLower = (error.name || '').toLowerCase();
            const errorStackLower = (error.stack || '').toLowerCase();

            const isTimeoutError =
                error.name === 'AbortError' ||
                error.code === 'DEADLINE_EXCEEDED' ||
                error.code === 'ABORTED' ||
                errorNameLower.includes('abort') ||
                errorMessageLower.includes('aborted') ||
                errorMessageLower.includes('timeout') ||
                errorMessageLower.includes('operation is aborted') ||
                errorMessageLower.includes('deadline exceeded') ||
                errorMessageLower.includes('function execution took longer') ||
                errorStackLower.includes('timeout') ||
                errorStackLower.includes('deadline');

            console.log(`[${requestId}] Timeout detection: ${isTimeoutError ? 'TIMEOUT DETECTED' : 'Not a timeout'}`);
            console.log(`[${requestId}] Image URLs in memory - imageUrl: ${imageUrl ? 'YES' : 'NO'}, thumbnailUrl: ${thumbnailUrl ? 'YES' : 'NO'}`);
            console.log(`[${requestId}] Tracked filenames - originalFilename: ${originalFilename || 'NONE'}, thumbFilename: ${thumbFilename || 'NONE'}`);

            // Recovery logic: Attempt recovery for all errors, with special handling for timeouts
            // Recovery is more likely to succeed for timeouts, but we should check for any error
            let recoveryAttempted = false;
            let recoverySucceeded = false;

            try {
                console.log(`[${requestId}] Starting recovery process...`);

                // Step 1: Check Firestore queue document status
                const queueDoc = await docRef.get();
                if (!queueDoc.exists) {
                    console.log(`[${requestId}] Recovery: Queue document does not exist, cannot recover`);
                } else {
                    const queueData = queueDoc.data();
                    console.log(`[${requestId}] Recovery: Queue document status: ${queueData.status}, has imageUrl: ${!!queueData.imageUrl}`);

                    // Case 1: Image URL exists in Firestore but status isn't completed
                    if (queueData.imageUrl && queueData.status !== 'completed') {
                        recoveryAttempted = true;
                        console.log(`[${requestId}] Recovery: Case 1 - Image URL found in Firestore, marking as completed...`);
                        await docRef.update({
                            status: "completed",
                            completedAt: new Date()
                        });
                        recoverySucceeded = true;
                        console.log(`[${requestId}] Recovery: Case 1 SUCCESS - Firestore updated to completed`);
                    }
                    // Case 2: No image URL in Firestore, but we have URLs in memory
                    else if (!queueData.imageUrl && imageUrl && thumbnailUrl) {
                        recoveryAttempted = true;
                        console.log(`[${requestId}] Recovery: Case 2 - Saving image from memory URLs to Firestore...`);

                        // Save result to images collection
                        const imageRef = await db.collection("images").add({
                            userId,
                            prompt,
                            negative_prompt,
                            steps,
                            cfg,
                            aspectRatio,
                            modelId,
                            imageUrl,
                            thumbnailUrl,
                            lqip,
                            createdAt: new Date(),
                            originalRequestId: requestId
                        });

                        // Update queue document
                        await docRef.update({
                            status: "completed",
                            imageUrl,
                            thumbnailUrl,
                            lqip,
                            completedAt: new Date(),
                            resultImageId: imageRef.id
                        });

                        recoverySucceeded = true;
                        console.log(`[${requestId}] Recovery: Case 2 SUCCESS - Image saved to Firestore from memory URLs`);
                    }
                    // Case 3: No URLs in memory, but we have tracked filenames - verify in B2
                    else if (!imageUrl && originalFilename && thumbFilename) {
                        recoveryAttempted = true;
                        console.log(`[${requestId}] Recovery: Case 3 - No URLs in memory, verifying files in B2...`);

                        const b2Verification = await verifyB2FilesExist(originalFilename, thumbFilename);

                        if (b2Verification.imageUrl && b2Verification.thumbnailUrl) {
                            console.log(`[${requestId}] Recovery: Case 3 - B2 verification SUCCESS, files exist. Saving to Firestore...`);

                            // Reconstruct imageUrl and thumbnailUrl from B2 verification
                            imageUrl = b2Verification.imageUrl;
                            thumbnailUrl = b2Verification.thumbnailUrl;

                            // Get queue data again to check if imageUrl was set meanwhile
                            const queueDocRecheck = await docRef.get();
                            const queueDataRecheck = queueDocRecheck.exists ? queueDocRecheck.data() : {};

                            // Only save if still not in Firestore
                            if (!queueDataRecheck.imageUrl) {
                                // Save result to images collection
                                const imageRef = await db.collection("images").add({
                                    userId,
                                    prompt,
                                    negative_prompt,
                                    steps,
                                    cfg,
                                    aspectRatio,
                                    modelId,
                                    imageUrl,
                                    thumbnailUrl,
                                    lqip,
                                    createdAt: new Date(),
                                    originalRequestId: requestId
                                });

                                // Update queue document
                                await docRef.update({
                                    status: "completed",
                                    imageUrl,
                                    thumbnailUrl,
                                    lqip,
                                    completedAt: new Date(),
                                    resultImageId: imageRef.id
                                });

                                recoverySucceeded = true;
                                console.log(`[${requestId}] Recovery: Case 3 SUCCESS - Image verified in B2 and saved to Firestore`);
                            } else {
                                // Image was already saved by another process, just mark as completed
                                await docRef.update({
                                    status: "completed",
                                    completedAt: new Date()
                                });
                                recoverySucceeded = true;
                                console.log(`[${requestId}] Recovery: Case 3 - Image was already in Firestore, marked as completed`);
                            }
                        } else {
                            console.log(`[${requestId}] Recovery: Case 3 FAILED - Files not found in B2. imageUrl: ${b2Verification.imageUrl ? 'YES' : 'NO'}, thumbnailUrl: ${b2Verification.thumbnailUrl ? 'YES' : 'NO'}`);
                        }
                    }
                    // Case 4: For timeout errors, check if queue has imageUrl even if we don't have it in memory
                    else if (isTimeoutError && !imageUrl && queueData.imageUrl) {
                        recoveryAttempted = true;
                        console.log(`[${requestId}] Recovery: Case 4 - Timeout error, imageUrl found in Firestore but not in memory, marking as completed...`);
                        await docRef.update({
                            status: "completed",
                            completedAt: new Date()
                        });
                        recoverySucceeded = true;
                        console.log(`[${requestId}] Recovery: Case 4 SUCCESS - Queue document updated to completed`);
                    } else {
                        console.log(`[${requestId}] Recovery: No recovery path available. Status: ${queueData.status}, has imageUrl: ${!!queueData.imageUrl}, has memory URLs: ${!!(imageUrl && thumbnailUrl)}, has filenames: ${!!(originalFilename && thumbFilename)}`);
                    }
                }
            } catch (recoveryError) {
                console.error(`[${requestId}] Recovery attempt failed with error:`, recoveryError);
                console.error(`[${requestId}] Recovery error details - name: ${recoveryError.name}, message: ${recoveryError.message}`);
                recoverySucceeded = false;
            }

            // If recovery succeeded, exit early without refunding or marking as failed
            if (recoverySucceeded) {
                console.log(`[${requestId}] Recovery completed successfully. Exiting without refund or failure status.`);
                return;
            }

            // Log recovery failure
            if (recoveryAttempted) {
                console.warn(`[${requestId}] Recovery was attempted but did not succeed. Proceeding with error handling.`);
            } else if (isTimeoutError) {
                console.warn(`[${requestId}] Timeout detected but no recovery path available. Proceeding with error handling.`);
            }

            // Refund Logic (only if not a timeout recovery)
            try {
                const userRef = db.collection('users').doc(userId);
                await db.runTransaction(async (t) => {
                    const userDoc = await t.get(userRef);
                    if (userDoc.exists && userDoc.data().subscriptionStatus !== 'active') {
                        t.update(userRef, { credits: FieldValue.increment(1) });
                    }
                });
                console.log(`Refunded 1 credit to ${userId}`);
            } catch (refundError) {
                console.error("Refund Error:", refundError);
            }

            await docRef.update({ status: "failed", error: error.message });
        }
    }
);



const handleCreateStripeCheckout = async (request) => {
    const { priceId, successUrl, cancelUrl, mode } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token.email;

    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    if (!uid) {
        throw new Error("Unauthenticated");
    }

    // Rate Limiting for Checkout (Max 1 per minute)
    const db = getFirestore(); // Ensure db is available or use global if already initialized
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const user = userDoc.exists ? userDoc.data() : {};

    const now = new Date();
    const lastCheckout = user.lastCheckoutSessionTime ? (user.lastCheckoutSessionTime.toDate ? user.lastCheckoutSessionTime.toDate() : new Date(user.lastCheckoutSessionTime)) : new Date(0);

    if (now - lastCheckout < 60000) { // 60 seconds
        throw new Error("Please wait a minute before creating a new checkout session.");
    }

    await userRef.set({ lastCheckoutSessionTime: now }, { merge: true });

    try {
        // Default mode to 'subscription' if not provided, unless we logic it out. 
        // Or let helper default it.
        const sessionUrl = await createCheckoutSession(uid, email, priceId, successUrl, cancelUrl, mode);
        return { url: sessionUrl };
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        throw new Error("Failed to create checkout session");
    }
};

const handleCreateStripePortalSession = async (request) => {
    const { returnUrl } = request.data;
    const uid = request.auth.uid;

    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error("User not found");
    }

    const user = userDoc.data();
    if (!user.stripeCustomerId) {
        throw new Error("No subscription found");
    }

    try {
        const url = await createPortalSession(user.stripeCustomerId, returnUrl || 'https://dreambees.app');
        return { url };
    } catch (error) {
        console.error("Stripe Portal Error:", error);
        throw new Error("Failed to create portal session");
    }
};

export const stripeWebhook = onRequest(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = constructWebhookEvent(req.rawBody, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook Error:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const customerId = session.customer;
            const mode = session.mode; // 'subscription' or 'payment'

            if (mode === 'subscription') {
                // Update user to active subscription
                await db.collection('users').doc(userId).set({
                    subscriptionStatus: 'active',
                    stripeCustomerId: customerId,
                    credits: 1000, // Monthly allowance
                    planTier: 'pro'
                }, { merge: true });
            } else if (mode === 'payment') {
                // Handle One-Time Credit Packs & Reel Packs
                // Map Amount (in cents) to Credits or Reels
                const amount = session.amount_total;
                let creditsToAdd = 0;
                let reelsToAdd = 0;

                // Credit Packs (odd ending or specific values)
                if (amount === 499) creditsToAdd = 100;        // Starter
                else if (amount === 1999) creditsToAdd = 500;  // Pro
                else if (amount === 4999) creditsToAdd = 1500; // Studio

                // Reel Packs (Video Generation)
                else if (amount === 600) reelsToAdd = 600;     // Reels Starter
                else if (amount === 1500) reelsToAdd = 1500;   // Reels Creator
                else if (amount === 3500) reelsToAdd = 3600;   // Reels Pro (with bonus)
                else if (amount === 8500) reelsToAdd = 9000;   // Reels Studio (with bonus)

                if (creditsToAdd > 0) {
                    console.log(`Adding ${creditsToAdd} credits to user ${userId} for payment of $${amount / 100}`);
                    await db.collection('users').doc(userId).update({
                        credits: FieldValue.increment(creditsToAdd)
                    });
                } else if (reelsToAdd > 0) {
                    console.log(`Adding ${reelsToAdd} reels to user ${userId} for payment of $${amount / 100}`);
                    await db.collection('users').doc(userId).update({
                        reels: FieldValue.increment(reelsToAdd)
                    });
                } else {
                    console.warn(`Unknown payment amount: ${amount} for user ${userId}`);
                }
            }

        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            // distinct from 'checkout.session.completed', this handles RENEWALS
            if (invoice.billing_reason === 'subscription_cycle') {
                const customerId = invoice.customer;
                const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();

                if (!usersSnapshot.empty) {
                    usersSnapshot.forEach(async (doc) => {
                        console.log(`Renewing credits for user ${doc.id}`);
                        await doc.ref.update({
                            credits: 1000,
                            subscriptionStatus: 'active'
                        });
                    });
                }
            }
        } else if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const status = subscription.status; // active, past_due, unpaid, canceled

            // Map Stripe status to our app status
            // We only really care if it becomes NOT active/trialing
            const isActive = status === 'active' || status === 'trialing';
            const appStatus = isActive ? 'active' : 'inactive';

            const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();
            usersSnapshot.forEach(async (doc) => {
                await doc.ref.update({ subscriptionStatus: appStatus });
            });

        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            // Find user by stripeCustomerId (simple query)
            const usersSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();
            usersSnapshot.forEach(async (doc) => {
                await doc.ref.update({ subscriptionStatus: 'inactive' });
            });
        }
        res.json({ received: true });
    } catch (err) {
        console.error("Error processing webhook:", err);
        res.status(500).send("Internal Server Error");
    }
});

export const serveSitemap = onRequest({
    cors: true,
    memory: "256MiB"
}, async (req, res) => {
    try {
        const db = getFirestore();
        const baseUrl = 'https://dreambeesai.com';

        // 1. Static Pages
        const staticPages = [
            '',
            '/generate',
            '/models',
            '/gallery',
            '/pricing',
            '/blog',
            '/about',
            '/features',
            '/contact',
            '/auth'
        ];

        let urls = staticPages.map(path => ({
            loc: `${baseUrl}${path}`,
            changefreq: 'daily',
            priority: path === '' ? '1.0' : '0.8'
        }));

        const modelsSnapshot = await db.collection('models').get();
        modelsSnapshot.forEach(doc => {
            urls.push({
                loc: `${baseUrl}/model/${doc.id}`,
                changefreq: 'weekly',
                priority: '0.7',
                lastmod: new Date().toISOString() // Or use implicit today
            });
        });

        // 3. Blog Posts (Hardcoded for now as data source is client-side static)
        const blogPosts = [
            { id: 'prompt-director-drift-evaluation', date: '2026-01-03' }
        ];

        blogPosts.forEach(post => {
            urls.push({
                loc: `${baseUrl}/blog/${post.id}`,
                changefreq: 'monthly',
                priority: '0.7',
                lastmod: new Date(post.date).toISOString()
            });
        });

        // 4. Construct XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        urls.forEach(url => {
            xml += `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
        });

        xml += `
</urlset>`;

        // 5. Send Response
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // Cache for 24h
        res.status(200).send(xml);

    } catch (error) {
        console.error("Error generating sitemap:", error);
        res.status(500).send("Error generating sitemap");
    }
});

// ============================================================================
// Generation Request Functions
// ============================================================================

const handleCreateGenerationRequest = async (request) => {
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
    }

    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, negative_prompt, modelId, aspectRatio, steps, cfg, seed, scheduler } = request.data;

    // --- Input Validation & Cleaning ---
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
        throw new HttpsError('invalid-argument', "Prompt is required and must be at least 5 characters");
    }

    if (modelId && !VALID_MODELS.includes(modelId)) {
        throw new HttpsError('invalid-argument', `Invalid model ID: ${modelId}. Supported models: ${VALID_MODELS.join(', ')}`);
    }

    let cleanPrompt = prompt.trim();
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    if ((cleanPrompt.match(emojiRegex) || []).length > 5) {
        cleanPrompt = cleanPrompt.replace(emojiRegex, '');
    }
    cleanPrompt = cleanPrompt.replace(/([^a-zA-Z0-9\s])\1{2,}/g, '$1').replace(/\d{5,}/g, '').trim();
    if (cleanPrompt.length < 5) throw new HttpsError('invalid-argument', "Prompt failed safety cleaning");

    const validAspectRatios = ['1:1', '2:3', '3:2', '9:16', '16:9'];
    const safeAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';
    let safeSteps = Math.min(Math.max(parseInt(steps) || 30, 10), 50);
    let safeCfg = Math.min(Math.max(parseFloat(cfg) || 7.0, 1.0), 20.0);

    try {
        const userRef = db.collection('users').doc(uid);
        const queueRef = db.collection('generation_queue').doc(); // Create ref outside

        // Atomic Credit/Daily Reset Transaction
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

            // 1. Concurrency Check (Max 5 active jobs)
            const activeJobsQuery = db.collection('generation_queue')
                .where('userId', '==', uid)
                .where('status', 'in', ['queued', 'processing'])
                .limit(5); // Fail fast if > 5
            const activeJobs = await t.get(activeJobsQuery);
            if (activeJobs.size >= 5) {
                throw new HttpsError('resource-exhausted', "Too many active generations. Please wait for some to complete.");
            }

            const userData = userDoc.data();
            const now = new Date();
            const lastReset = userData.lastDailyReset?.toDate?.() || new Date(0);
            const isPro = userData.subscriptionStatus === 'active';

            const userUpdate = { lastGenerationTime: now };

            // Daily Reset
            if (now - lastReset > 24 * 60 * 60 * 1000) {
                userUpdate.lastDailyReset = now;
                if ((userData.credits || 0) < 5) userUpdate.credits = 5;
            }

            // check rate limit (5s) - Reduced from 10s to be friendlier since we have strict concurrency limit now
            const lastGen = userData.lastGenerationTime?.toDate?.() || new Date(0);
            if (now - lastGen < 5000) throw new HttpsError('resource-exhausted', "Please slow down.");

            // Deduct credits
            // Re-calculate current credits based on potentail daily reset
            let effectiveCredits = (userUpdate.credits !== undefined) ? userUpdate.credits : (userData.credits || 0);

            if (!isPro) {
                if (effectiveCredits < 1) throw new HttpsError('resource-exhausted', "Insufficient credits");
                userUpdate.credits = effectiveCredits - 1;
            }

            t.update(userRef, userUpdate);

            // Create Queue Item ATOMICALLY
            t.set(queueRef, {
                userId: uid,
                prompt: cleanPrompt,
                negative_prompt: negative_prompt || "",
                modelId: modelId || "cat-carrier",
                status: 'queued',
                aspectRatio: safeAspectRatio,
                steps: safeSteps,
                cfg: safeCfg,
                seed: seed || -1,
                scheduler: scheduler || 'DPM++ 2M Karras',
                createdAt: new Date()
            });
        });

        // 2. Enqueue Task (Only if transaction succeeded)
        const queue = getFunctions().taskQueue('processImageTask');
        await queue.enqueue({
            requestId: queueRef.id, userId: uid, prompt: cleanPrompt, negative_prompt,
            modelId, steps: safeSteps, cfg: safeCfg, aspectRatio: safeAspectRatio, scheduler
        });

        return { requestId: queueRef.id };
    } catch (error) {
        console.error("Error creating generation request:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', "Failed to create generation request", error.message);
    }
};

// ============================================================================
// Image Management Functions
// ============================================================================

const handleGetUserImages = async (request) => {
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }

    const { limit: limitParam = 24, startAfterId, startAfterCollection, searchQuery } = request.data;
    const limit = Math.min(Math.max(parseInt(limitParam) || 24, 1), 100);

    try {
        let imageQuery = db.collection('images')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        let videoQuery = db.collection('videos')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        // Handle pagination
        if (startAfterId) {
            let cursorDoc = null;
            let cursorType = startAfterCollection;

            // If we have a hint, try that first
            if (cursorType === 'image') {
                const snap = await db.collection('images').doc(startAfterId).get();
                if (snap.exists) cursorDoc = snap;
            } else if (cursorType === 'video') {
                const snap = await db.collection('videos').doc(startAfterId).get();
                if (snap.exists) cursorDoc = snap;
            }

            // Fallback: If no hint or hint failed, try discovery
            if (!cursorDoc) {
                const [imgSnap, vidSnap] = await Promise.all([
                    db.collection('images').doc(startAfterId).get(),
                    db.collection('videos').doc(startAfterId).get()
                ]);
                if (imgSnap.exists) {
                    cursorDoc = imgSnap;
                    cursorType = 'image';
                } else if (vidSnap.exists) {
                    cursorDoc = vidSnap;
                    cursorType = 'video';
                }
            }

            if (cursorDoc) {
                const cursorDate = cursorDoc.data().createdAt;
                if (cursorType === 'image') {
                    imageQuery = imageQuery.startAfter(cursorDoc);
                    videoQuery = videoQuery.where('createdAt', '<', cursorDate);
                } else {
                    videoQuery = videoQuery.startAfter(cursorDoc);
                    imageQuery = imageQuery.where('createdAt', '<', cursorDate);
                }
            }
        }

        // Use Promise.allSettled for "Degraded Mode" resilience
        const [imageRes, videoRes] = await Promise.allSettled([
            imageQuery.get(),
            videoQuery.get()
        ]);

        const warnings = [];
        let imageItems = [];
        let videoItems = [];

        if (imageRes.status === 'fulfilled') {
            imageItems = imageRes.value.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'image',
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
            }));
        } else {
            console.error("Image collection fetch failed:", imageRes.reason);
            warnings.push("Images temporarily unavailable");
        }

        if (videoRes.status === 'fulfilled') {
            videoItems = videoRes.value.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'video',
                imageUrl: doc.data().imageSnapshotUrl || doc.data().videoUrl,
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
            }));
        } else {
            console.error("Video collection fetch failed:", videoRes.reason);
            warnings.push("Videos temporarily unavailable");
        }

        let allItems = [...imageItems, ...videoItems];

        // Search filtering (Client-sideish for now)
        if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
            const queryLower = searchQuery.toLowerCase();
            allItems = allItems.filter(item =>
                item.prompt?.toLowerCase().includes(queryLower)
            );
        }

        allItems = allItems.filter(item => item.hidden !== true);
        allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const pagedItems = allItems.slice(0, limit);
        const lastVisible = pagedItems[pagedItems.length - 1];

        return {
            images: pagedItems,
            lastVisibleId: lastVisible?.id || null,
            lastVisibleType: lastVisible?.type || null, // Hint for next page
            hasMore: pagedItems.length === limit,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    } catch (error) {
        console.error("Error fetching user gallery:", error);
        throw new HttpsError('internal', "Failed to fetch gallery", error.message);
    }
};

const handleGetImageDetail = async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { imageId } = request.data;

    if (!imageId || typeof imageId !== 'string') {
        throw new Error("Image ID is required");
    }

    try {
        const imageDoc = await db.collection('images').doc(imageId).get();

        if (!imageDoc.exists) {
            throw new Error("Image not found");
        }

        const imageData = imageDoc.data();

        // Verify ownership
        if (imageData.userId !== uid) {
            throw new Error("Unauthorized: You don't have access to this image");
        }

        return {
            id: imageDoc.id,
            ...imageData,
            createdAt: imageData.createdAt?.toDate?.()?.toISOString() || imageData.createdAt
        };
    } catch (error) {
        console.error("Error fetching image detail:", error);
        if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
            throw error;
        }
        throw new Error("Failed to fetch image");
    }
};

const handleDeleteImage = async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { imageId } = request.data;

    if (!imageId || typeof imageId !== 'string') {
        throw new Error("Image ID is required");
    }

    try {
        const imageDoc = await db.collection('images').doc(imageId).get();

        if (!imageDoc.exists) {
            throw new Error("Image not found");
        }

        const imageData = imageDoc.data();

        // Verify ownership
        if (imageData.userId !== uid) {
            throw new Error("Unauthorized: You don't have permission to delete this image");
        }

        // Delete the image document
        await db.collection('images').doc(imageId).delete();

        return { success: true };
    } catch (error) {
        console.error("Error deleting image:", error);
        if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
            throw error;
        }
        throw new Error("Failed to delete image");
    }
};

const handleDeleteImagesBatch = async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { imageIds } = request.data;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
        throw new Error("Image IDs array is required");
    }

    if (imageIds.length > 50) {
        throw new Error("Cannot delete more than 50 images at once");
    }

    try {
        // Check both collections in parallel
        // Optimization: We could guess based on ID format if distinct, but simpler to just check.
        // Actually, checking existence efficiently:
        // We will fetch all from 'images' and 'videos' using getAll (if supported) or individual gets.
        // Since we have max 50, individual gets or parallel checks are fine.

        const checks = await Promise.all(imageIds.map(async (id) => {
            const imgDoc = await db.collection('images').doc(id).get();
            if (imgDoc.exists) return { type: 'image', doc: imgDoc };

            const vidDoc = await db.collection('videos').doc(id).get();
            if (vidDoc.exists) return { type: 'video', doc: vidDoc };

            return null;
        }));

        const unauthorized = [];
        const notFound = [];
        const valid = []; // { id, ref }

        checks.forEach((result, index) => {
            const id = imageIds[index];
            if (!result) {
                notFound.push(id);
            } else {
                const data = result.doc.data();
                if (data.userId !== uid) {
                    unauthorized.push(id);
                } else {
                    valid.push({ id, ref: result.doc.ref });
                }
            }
        });

        if (unauthorized.length > 0) {
            throw new Error(`Unauthorized: You don't have permission to delete ${unauthorized.length} item(s)`);
        }

        if (notFound.length > 0 && valid.length === 0) {
            // If some found, we proceed with deleting them (partial success logic?) 
            // Original code threw if ALL were not found, but proceeded if mixed? 
            // "if (notFound.length > 0 && valid.length === 0)" -> throws only if NOTHING valid.
            // If mixed, we proceed.
            throw new Error(`Items not found: ${notFound.join(', ')}`);
        }

        // Delete all valid items
        const batch = db.batch();
        valid.forEach(item => {
            batch.delete(item.ref);
        });
        await batch.commit();

        return {
            success: true,
            deleted: valid.length,
            notFound: notFound.length,
            skipped: unauthorized.length
        };
    } catch (error) {
        console.error("Error deleting items batch:", error);
        if (error.message.includes("Unauthorized") || error.message.includes("not found")) {
            throw error;
        }
        throw new Error("Failed to delete items");
    }
};

// ============================================================================
// Rating Functions
// ============================================================================

const handleRateGeneration = async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { jobId, rating } = request.data;

    if (!jobId || typeof jobId !== 'string') {
        throw new Error("Job ID is required");
    }

    if (rating !== 1 && rating !== -1) {
        throw new Error("Rating must be 1 (like) or -1 (dislike)");
    }

    try {
        // Get the job document
        const jobDoc = await db.collection('generation_queue').doc(jobId).get();

        if (!jobDoc.exists) {
            throw new Error("Generation job not found");
        }

        const jobData = jobDoc.data();

        // Verify ownership
        if (jobData.userId !== uid) {
            throw new Error("Unauthorized: You don't have permission to rate this generation");
        }

        const batch = db.batch();

        // Update generation queue
        const queueRef = db.collection('generation_queue').doc(jobId);
        batch.update(queueRef, {
            rating: rating,
            hidden: rating === -1
        });

        // Update images collection if resultImageId exists
        if (jobData.resultImageId) {
            const imageRef = db.collection('images').doc(jobData.resultImageId);
            batch.update(imageRef, {
                rating: rating,
                hidden: rating === -1
            });
        }

        // Create/update training feedback for MLOps
        const feedbackId = `feedback_${jobId}`;
        const feedbackRef = db.collection('training_feedback').doc(feedbackId);

        const resolutionMap = {
            '1:1': { width: 1024, height: 1024 },
            '2:3': { width: 832, height: 1216 },
            '3:2': { width: 1216, height: 832 },
            '9:16': { width: 768, height: 1344 },
            '16:9': { width: 1344, height: 768 }
        };
        const res = resolutionMap[jobData.aspectRatio] || resolutionMap['1:1'];

        // Deterministic split based on job ID
        const simpleHash = jobId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const split = (simpleHash % 100) < 90 ? 'train' : 'validation';

        const feedbackData = {
            _id: feedbackId,
            timestamp: new Date(),
            dataset_split: split,
            weight: 1.0,
            rating: rating,
            meta: {
                modelId: jobData.modelId,
                prompt_cleaned: jobData.prompt ? jobData.prompt.trim() : "",
                negative_prompt: jobData.negative_prompt || "",
                cfg: parseFloat(jobData.cfg) || 7.0,
                steps: parseInt(jobData.steps) || 30,
                seed: parseInt(jobData.seed) || -1,
                width: res.width,
                height: res.height,
                aspect_ratio_label: jobData.aspectRatio || '1:1'
            },
            asset_pointers: {
                image_url: jobData.imageUrl || "",
                gen_doc_path: `generation_queue/${jobId}`,
                user_id: jobData.userId
            }
        };

        batch.set(feedbackRef, feedbackData);

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error("Error rating generation:", error);
        if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
            throw error;
        }
        throw new Error("Failed to rate generation");
    }
};

const handleRateShowcaseImage = async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }

    const { imageId, rating } = request.data;

    if (!imageId || typeof imageId !== 'string') {
        throw new Error("Image ID is required");
    }

    if (rating !== 1 && rating !== -1) {
        throw new Error("Rating must be 1 (like) or -1 (dislike)");
    }

    try {
        // Verify image exists
        const imageDoc = await db.collection('model_showcase_images').doc(imageId).get();

        if (!imageDoc.exists) {
            throw new Error("Showcase image not found");
        }

        // Update rating (no ownership check needed for showcase images - they're public)
        await db.collection('model_showcase_images').doc(imageId).update({
            rating: rating,
            ratingTimestamp: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error rating showcase image:", error);
        if (error.message.includes("not found")) {
            throw error;
        }
        throw new Error("Failed to rate showcase image");
    }
};

// ============================================================================
// History Functions
// ============================================================================

const handleGetGenerationHistory = async (request) => {
    // App Check Verification
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
        // throw new HttpsError('failed-precondition', "The function must be called from an App Check verified app.");
    }

    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated");
    }

    const { limit: limitParam = 20, startAfterId } = request.data;
    const limit = Math.min(Math.max(parseInt(limitParam) || 20, 1), 100); // Between 1 and 100

    try {
        let query = db.collection('generation_queue')
            .where('userId', '==', uid)
            .where('status', '==', 'completed')
            // .where('hidden', '!=', true) // Removed
            .orderBy('createdAt', 'desc')
            .limit(limit);

        // Handle pagination
        if (startAfterId) {
            const startAfterDoc = await db.collection('generation_queue').doc(startAfterId).get();
            if (startAfterDoc.exists) {
                query = query.startAfter(startAfterDoc);
            }
        }

        const snapshot = await query.get();
        const jobs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
        })).filter(job => job.hidden !== true); // Memory filter

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        const hasMore = snapshot.docs.length === limit;

        return {
            jobs: jobs,
            lastVisibleId: lastVisible?.id || null,
            hasMore: hasMore
        };
    } catch (error) {
        console.error("Error fetching generation history:", error);
        throw new HttpsError('internal', "Failed to fetch generation history", error.message);
    }
};

// ============================================================================
// Video Generation Functions (Reels)
// ============================================================================

// Helper to find the first media URL in a potentially nested object or array
function findPrimaryUrl(output) {
    if (!output) return null;

    // 1. Direct string
    if (typeof output === 'string') {
        const cleanOutput = output.trim();
        if (cleanOutput.startsWith('http')) {
            // Check for common media extensions or replicate/s3 patterns
            if (cleanOutput.includes('replicate.delivery') ||
                cleanOutput.match(/\.(mp4|webp|png|jpg|jpeg|gif|mov|m4v)/i) ||
                cleanOutput.includes('b2.content') ||
                cleanOutput.includes('amazonaws.com')) {
                return cleanOutput;
            }
        }
    }

    // 2. Array: recurse on all elements until a URL is found
    if (Array.isArray(output) && output.length > 0) {
        for (const item of output) {
            const found = findPrimaryUrl(item);
            if (found) return found;
        }
        return null; // None found in array
    }

    // 3. Object: recurse on known properties first, then exhaustive scan
    if (typeof output === 'object') {
        // Detailed logging for debugging unknown objects
        const keys = Object.keys(output);
        console.log(`Parsing output object. Type: ${output.constructor?.name || 'Object'}, Keys: ${keys.join(', ')}`);

        // Standard known properties (Replicate / OpenAI / Claude)
        const commonPaths = ['output', 'url', 'urls', 'result', 'data'];
        for (const path of commonPaths) {
            if (output[path]) {
                const found = findPrimaryUrl(output[path]);
                if (found) return found;
            }
        }

        // Dedicated check for replicate-js .url() method
        if (typeof output.url === 'function') {
            try { return findPrimaryUrl(output.url()); } catch { }
        }

        // Exhaustive scan (descend into every property)
        for (const key of keys) {
            // Avoid recursion into system/meta fields
            if (['metrics', 'logs', 'error', 'status', 'created_at', 'started_at', 'completed_at'].includes(key)) continue;

            const val = output[key];
            if (val && (typeof val === 'string' || typeof val === 'object')) {
                const found = findPrimaryUrl(val);
                if (found) return found;
            }
        }
    }

    return null;
}

// Video Generation Worker
export const processVideoTask = onTaskDispatched(
    {
        timeoutSeconds: 540,
        memory: "2GiB",
        retryConfig: {
            maxAttempts: 2,
            minBackoffSeconds: 30,
        }
    },
    async (request) => {
        const { requestId } = request.data;
        if (!requestId) return;

        const docRef = db.collection('video_queue').doc(requestId);
        const snapshot = await docRef.get();
        if (!snapshot.exists) return;

        const data = snapshot.data();
        if (data.status === "completed" || data.status === "failed") return;

        try {
            // Note: In the new async flow, we expect the prompt to be already analyzed or provided.
            // If it's still empty but autoPrompt was true, we fallback to a safe error or use provided image description.
            let finalPrompt = data.prompt;

            if (!finalPrompt || finalPrompt.length < 5) {
                if (data.image) {
                    // We really should have an analyzed prompt by now. 
                    // If not, we fail and ask user to use the analysis tool first.
                    console.log(`Auto-prompting for video ${requestId}...`);
                    try {
                        const generatedPrompt = await generateVisionPrompt(data.image);
                        if (generatedPrompt && generatedPrompt.length > 5) {
                            finalPrompt = generatedPrompt;
                            // Update the doc so we have record of the prompt
                            await docRef.update({ prompt: finalPrompt });
                        } else {
                            throw new Error("Failed to generate prompt from image");
                        }
                    } catch (err) {
                        console.error("Auto-prompt failed:", err);
                        throw new Error("Failed to auto-generate prompt from image. Please try adding a text prompt manually.");
                    }
                } else {
                    throw new Error("Generation prompt is empty or too short.");
                }
            }

            await docRef.update({ status: "processing" });

            const replicate = new Replicate({
                auth: process.env.REPLICATE_API_TOKEN,
            });

            // Map parameters to Replicate schema for lightricks/ltx-video
            // Duration -> length (frames). LTX runs at 24fps. 5s ~= 121 frames. 
            // Resolution -> width/height or target_size. default is 768x512.

            // Note: LTX specific params
            // frame_rate: 24 (default)
            // length: 97, 129, etc.

            const allowedDurations = [6, 8, 10];
            let safeDuration = parseInt(data.duration);
            if (!allowedDurations.includes(safeDuration)) {
                safeDuration = 6; // Default fallback
            }

            const input = {
                prompt: finalPrompt,
                duration: safeDuration,
                resolution: data.resolution || "1080p",
                aspect_ratio: data.aspectRatio || "3:2", // LTX uses aspect_ratio
                generate_audio: true // Enabled by default
            };

            if (data.image) input.image = data.image;

            console.log(`Executing Replicate job for ${requestId}...`);
            const prediction = await replicate.predictions.create({
                model: "lightricks/ltx-2-pro",
                input: input
            });
            console.log(`Prediction ${prediction.id} created for ${requestId}. Status: ${prediction.status}`);

            const result = await replicate.wait(prediction);
            console.log(`Prediction ${prediction.id} completed. Final Status: ${result.status}`);

            if (result.status === "failed") {
                console.error("Replicate Prediction Failed:", result.error);
                throw new Error(`AI Model Error: ${result.error || "Unknown Failure"}`);
            }

            const videoUrl = findPrimaryUrl(result);

            if (!videoUrl) {
                console.error("Replicate Unexpected Output Structure:", JSON.stringify(result, null, 2));
                throw new Error("No video URL could be extracted from AI model response. Debug info in logs.");
            }

            // Download and Persist to B2
            console.log(`Saving result to B2 for ${requestId}...`);
            const response = await fetchWithTimeout(videoUrl, { timeout: 30000 });
            if (!response.ok) throw new Error(`Replicate Download Error: ${response.statusText}`);
            const buffer = Buffer.from(await response.arrayBuffer());

            const filename = `videos/${data.userId}/${Date.now()}.mp4`;
            await s3Client.send(new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: filename,
                Body: buffer,
                ContentType: "video/mp4",
            }));

            const b2Url = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${filename}`;

            // Finalize
            const videoDoc = {
                userId: data.userId,
                prompt: finalPrompt,
                videoUrl: b2Url,
                duration: data.duration,
                resolution: data.resolution,
                cost: data.cost,
                createdAt: new Date(),
                originalRequestId: requestId
            };

            const videoRef = await db.collection("videos").add(videoDoc);

            await docRef.update({
                status: "completed",
                videoUrl: b2Url,
                completedAt: new Date(),
                resultVideoId: videoRef.id
            });

        } catch (error) {
            console.error(`Task Failed for ${requestId}:`, error);

            // Refund logic
            try {
                const userRef = db.collection('users').doc(data.userId);
                await db.runTransaction(async (t) => {
                    t.update(userRef, { reels: FieldValue.increment(data.cost) });
                });
                console.log(`Refunded ${data.cost} reels to ${data.userId}`);
            } catch (refundError) {
                console.error("Refund Error:", refundError);
            }

            await docRef.update({
                status: "failed",
                error: error.message
            });
        }
    }
);





// ============================================================================
// Asynchronous Image Analysis Queue
// ============================================================================

// Helper for Vision Prompt Generation
async function generateVisionPrompt(imageUrl) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set");
    }

    const PROMPT_GUIDELINES = `
Single continuous paragraph: Write the entire scene as one unbroken paragraph, using straightforward descriptive language, maintaining strict chronological flow from start to finish.
Present-tense action verbs: Use active present tense (strides, grips, approaches) and present-progressive forms (running, walking) to create immediacy and ongoing motion.
Explicit camera behavior: Specify shot type (wide/medium/close-up), camera movement (pushes in/dollies/pans), speed (slowly/rapidly), and technical details (rack focus/shallow depth of field/handheld).
Precise physical details: Include specific measurements where relevant (2mm eyebrow raise), exact body positions, hand/finger placements, facial micro-expressions, and clothing/fabric behavior.
Atmospheric environment: Describe lighting quality (golden hour/fluorescent/neon), color temperatures, weather conditions, surface textures, and ambient elements that enhance mood.
Smooth temporal flow: Connect actions with subtle transitions (as, while, then) ensuring each movement naturally leads to the next without jarring cuts.
Genre-specific language: Use cinematography terms appropriate to the stated style (documentary authenticity, thriller paranoia, epic grandeur).
Character specificity: Include age, ethnicity, distinguishing features, clothing, and emotional states shown through observable physical manifestations rather than internal thoughts.
`;

    let imageContentUrl = "";
    if (imageUrl.trim().startsWith('http')) {
        imageContentUrl = imageUrl;
    } else if (imageUrl.trim().startsWith('data:')) {
        imageContentUrl = imageUrl;
    } else {
        imageContentUrl = `data:image/png;base64,${imageUrl}`;
    }

    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        timeout: 30000,
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dreambeesai.com",
            "X-Title": "DreamBees"
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze the image and write a video generation prompt based on these guidelines:\n" + PROMPT_GUIDELINES },
                        { type: "image_url", image_url: { url: imageContentUrl } }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

const handleCreateAnalysisRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { image, imageUrl } = request.data;
    if (!image && !imageUrl) {
        throw new HttpsError('invalid-argument', "Image data or URL is required");
    }

    try {
        const docRef = await db.collection('analysis_queue').add({
            userId: uid,
            image: image || null,
            imageUrl: imageUrl || null,
            status: 'queued',
            createdAt: new Date()
        });
        return { requestId: docRef.id };
    } catch (error) {
        console.error("Analysis Request Error:", error);
        throw new HttpsError('internal', "Failed to create analysis request");
    }
};

export const onAnalysisQueueCreated = onDocumentCreated("analysis_queue/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const requestId = event.params.requestId;

    try {
        await snapshot.ref.update({ status: 'analyzing' });

        const prompt = await generateVisionPrompt(data.imageUrl || data.image);

        await snapshot.ref.update({
            status: 'completed',
            prompt: prompt,
            completedAt: new Date()
        });
    } catch (error) {
        console.error(`Analysis failed for ${requestId}:`, error);
        await snapshot.ref.update({
            status: 'failed',
            error: error.message
        });
    }
});

// Deprecated blocking function - keep for compatibility for a few cycles
const handleGenerateVideoPrompt = async (request) => {
    const { image, imageUrl } = request.data;
    try {
        const prompt = await generateVisionPrompt(imageUrl || image);
        return { prompt };
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
};

// Helper for Gemini Prompt Enhancement
const enhancePromptWithGemini = async (prompt) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dreambeesai.com",
            "X-Title": "DreamBees"
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
                {
                    role: "system",
                    content: "You are an expert AI art prompt engineer specializing in Stable Diffusion XL (SDXL). Enhance the user's prompt with high-quality descriptors for lighting, composition, texture, and artistic style. Use format: 'Subject description, art style, lighting, camera details, additional tags'. Keep it concise but potent. Return ONLY the enhanced prompt."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter Error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || prompt;
};

// Helper for Vision-based Style Transformation
const transformImageWithGemini = async (imageUrl, styleName, instructions, intensity = 'medium') => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

    let imageContentUrl = "";
    if (imageUrl.trim().startsWith('http')) {
        imageContentUrl = imageUrl;
    } else if (imageUrl.trim().startsWith('data:')) {
        imageContentUrl = imageUrl;
    } else {
        imageContentUrl = `data:image/png;base64,${imageUrl}`;
    }

    const systemPrompt = `
    You are an expert AI artist. Your task is to analyze the provided image and rewrite a text-to-image prompt to recreate it in the "${styleName}" style.
    
    Style Instructions: "${instructions}"
    Intensity: ${intensity} based on a scale of low/medium/high.

    1. Analyze the subject, composition, lighting, and mood of the input image.
    2. Write a high-quality SDXL prompt that preserves the SUBJECT and COMPOSITON of the input image, but applies the visual aesthetics of "${styleName}".
    3. Ensure the prompt includes specific keywords relevant to the style (e.g., medium, lighting, color palette, artist references).
    4. Return ONLY the prompt text. No "Here is the prompt" prefix.
    `;

    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dreambeesai.com",
            "X-Title": "DreamBees"
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-flash", // Flash supports vision
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: systemPrompt },
                        { type: "image_url", image_url: { url: imageContentUrl } }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter Error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
};

// Queue Creation Handler
const handleCreateEnhanceRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt } = request.data;
    if (!prompt) throw new HttpsError('invalid-argument', "Prompt is required");

    try {
        const docRef = await db.collection('enhance_queue').add({
            userId: uid,
            originalPrompt: prompt,
            status: 'queued',
            createdAt: new Date()
        });
        return { requestId: docRef.id };
    } catch (error) {
        console.error("Enhance Request Error:", error);
        throw new HttpsError('internal', "Failed to create enhance request");
    }
};

// Queue Trigger
export const onEnhanceQueueCreated = onDocumentCreated("enhance_queue/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const requestId = event.params.requestId;

    try {
        await snapshot.ref.update({ status: 'processing' });

        const enhancedPrompt = await enhancePromptWithGemini(data.originalPrompt);

        await snapshot.ref.update({
            status: 'completed',
            prompt: enhancedPrompt,
            completedAt: new Date()
        });
    } catch (error) {
        console.error(`Enhance failed for ${requestId}:`, error);
        await snapshot.ref.update({
            status: 'failed',
            error: error.message
        });
    }
});

const handleCreateVideoGenerationRequest = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', "User must be authenticated");

    const { prompt, image, duration, resolution, aspectRatio } = request.data;

    // 1. Strict Input Validation
    if ((!prompt || typeof prompt !== 'string' || prompt.length < 5) && !image) {
        throw new HttpsError('invalid-argument', "Prompt required (or provide an image for auto-captioning)");
    }

    // Validate Duration for lightricks/ltx-2-pro (6, 8, 10 supported)
    const allowedDurations = [6, 8, 10];
    const safeDuration = allowedDurations.includes(parseInt(duration)) ? parseInt(duration) : 6;

    // Validate Resolution
    const allowedResolutions = ['720p', '1080p', '2k', '4k'];
    const safeResolution = allowedResolutions.includes(resolution) ? resolution : '1080p';

    // Validate Aspect Ratio
    const validAspectRatios = ['16:9', '9:16', '1:1', '21:9', '9:21', '3:2', '2:3'];
    const safeAspectRatio = (aspectRatio && validAspectRatios.includes(aspectRatio)) ? aspectRatio : '3:2';

    // Calculate Cost based on resolution and duration
    // Base rates: 1080p -> 3 per sec, 2k -> 6 per sec, 4k -> 12 per sec
    const rate = safeResolution === '4k' ? 12 : (safeResolution === '2k' ? 6 : 3);
    const totalCost = rate * safeDuration;

    try {
        const userRef = db.collection('users').doc(uid);

        const requestId = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', "User not found");

            // 2. Transactional Concurrency Check
            const activeJobsQuery = db.collection('video_queue')
                .where('userId', '==', uid)
                .where('status', 'in', ['queued', 'processing', 'pending'])
                .limit(1);

            const activeJobs = await t.get(activeJobsQuery);
            if (!activeJobs.empty) throw new HttpsError('failed-precondition', "You already have a video generation in progress.");

            // 3. Check Balance
            const currentReels = userDoc.data().reels || 0;
            if (currentReels < totalCost) {
                throw new HttpsError('resource-exhausted', `Insufficient Reels. Need ${totalCost}, have ${currentReels}.`);
            }

            // 4. Execution
            // Deduct balance
            t.update(userRef, { reels: FieldValue.increment(-totalCost) });

            // Create Job
            const newDocRef = db.collection('video_queue').doc();
            t.set(newDocRef, {
                userId: uid,
                prompt: prompt ? prompt.trim() : "",
                image: image || null,
                duration: safeDuration,
                resolution: safeResolution,
                aspectRatio: safeAspectRatio,
                cost: totalCost,
                status: 'queued',
                createdAt: new Date(),
                userAgent: request.context?.userAgent || "web"
            });

            return newDocRef.id;
        });

        // 5. Enqueue Task (Post-Transaction)
        const queue = getFunctions().taskQueue('processVideoTask');
        await queue.enqueue({ requestId });

        return { requestId, cost: totalCost };
    } catch (error) {
        console.error("Video Request Error:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', "Failed to create video request. " + error.message);
    }
};

// ============================================================================
// Unified API
// ============================================================================

// Helper for Style Transformation (Nano Banana)
const handleTransformPrompt = async (request) => {
    const { prompt, styleName, intensity, instructions } = request.data;

    // Basic validation
    if (!prompt) throw new HttpsError('invalid-argument', "Prompt is required");

    // Use OpenRouter with Gemini 2.5 Flash
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new HttpsError('internal', "Service configuration error");

    const systemPrompt = `You represent the visual style '${styleName}'. 
    Rewrite the user's prompt to reflect this style with ${intensity} intensity.
    Keep the core subject but completely transform the visual descriptors, lighting, and atmosphere to match the style.
    
    Style Instructions: ${instructions}
    
    Return ONLY the modified prompt text. Do not add quotes or explanations.`;

    try {
        const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://dreambeesai.com",
                "X-Title": "DreamBees"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash-image", // Or just flash if image model not needed for text-to-text
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenRouter Error:", err);
            throw new Error(`AI Provider Error: ${err}`);
        }

        const data = await response.json();
        const transformedPrompt = data.choices?.[0]?.message?.content || prompt;

        return { prompt: transformedPrompt };

    } catch (error) {
        console.error("Transform Prompt Error:", error);
        throw new HttpsError('internal', "Failed to transform prompt");
    }
};

// Image Transform Handler
const handleTransformImage = async (request) => {
    // App Check Verification
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
    }
    const { imageUrl, styleName, instructions, intensity } = request.data;
    if (!imageUrl) throw new HttpsError('invalid-argument', "Image URL is required");

    try {
        const newPrompt = await transformImageWithGemini(imageUrl, styleName, instructions, intensity);
        return { prompt: newPrompt };
    } catch (error) {
        console.error("Transform Image Error:", error);
        throw new HttpsError('internal', "Failed to transform image", error.message);
    }
};

export const api = onCall(async (request) => {
    // Basic App Check logging (Warn Mode) - centralized here
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        console.warn("App Check verification failed. Proceeding (Warn Mode). User:", request.auth?.uid);
    }

    const { action } = request.data;
    try {
        switch (action) {
            case 'createGenerationRequest': return handleCreateGenerationRequest(request);
            case 'createVideoGenerationRequest': return handleCreateVideoGenerationRequest(request);
            case 'createAnalysisRequest': return handleCreateAnalysisRequest(request);
            case 'createStripeCheckout': return handleCreateStripeCheckout(request);
            case 'createStripePortalSession': return handleCreateStripePortalSession(request);
            case 'createEnhanceRequest': return handleCreateEnhanceRequest(request);
            case 'transformPrompt': return handleTransformPrompt(request);
            case 'transformImage': return handleTransformImage(request); // New action
            case 'generateVideoPrompt': return handleGenerateVideoPrompt(request);
            case 'getGenerationHistory': return handleGetGenerationHistory(request);
            case 'getImageDetail': return handleGetImageDetail(request);
            case 'getUserImages': return handleGetUserImages(request);
            case 'rateGeneration': return handleRateGeneration(request);
            case 'rateShowcaseImage': return handleRateShowcaseImage(request);
            case 'deleteImage': return handleDeleteImage(request);
            case 'deleteImagesBatch': return handleDeleteImagesBatch(request);
            default:
                throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
        }
    } catch (error) {
        console.error(`API Error [${action}]:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || "An unexpected error occurred");
    }
});
