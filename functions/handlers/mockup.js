import { logger, getS3Client } from "../lib/utils.js";
import * as fs from 'fs';
import * as path from 'path';
import { VertexAI } from "@google-cloud/vertexai";
import { withVertexRateLimiting } from "../lib/rateLimiter.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { MOCKUP_ITEMS, MOCKUP_PRESETS, TCG_ITEMS, TCG_PRESETS, DOLL_ITEMS, DOLL_PRESETS } from "../lib/mockupData.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { retryOperation } from "../lib/utils.js";
import { HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import { db, FieldValue } from "../firebaseInit.js";
import { HttpsError } from "firebase-functions/v2/https";

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || "dreambees-alchemist";
const location = "us-central1";
const vertexAI = new VertexAI({ project, location });

const MODEL_NAME = "gemini-3-pro-image-preview";

/**
 * Checks config and deducts zaps.
 * Returns the cost that was deducted.
 * @param {string} uid 
 * @returns {Promise<number>} The amount of zaps deducted
 */
const checkAndDeductZaps = async (uid) => {
    // 1. Check Config for Cost
    const configDoc = await db.collection("sys_config").doc("mockup_studio").get();
    const config = configDoc.exists ? configDoc.data() : {};

    // Default to 0.25 if not specified (Micro-transaction style)
    const cost = (config.cost_per_generation !== undefined) ? Number(config.cost_per_generation) : 0.25;

    // 2. Deduct Zaps
    await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await t.get(userRef);

        if (!userDoc.exists) {
            throw new HttpsError('not-found', "User not found");
        }

        const zaps = userDoc.data().zaps || 0;

        if (zaps < cost) {
            throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${cost} Zaps.`);
        }

        t.update(userRef, { zaps: FieldValue.increment(-cost) });
    });

    logger.info(`[Billing] Deducted ${cost} Zaps from ${uid}`);
    return cost;
};

const getModel = () => {
    return vertexAI.getGenerativeModel({ model: MODEL_NAME });
};

/**
 * Helper to generate a single mockup
 */
const generateSingleMockup = async (imageBase64, item, preset, userUid) => {
    try {
        logger.info(`[Mockup] Generating ${item.label}...`);
        const generativeModel = getModel();

        // Interpolate prompt
        const interpolatedScenePrompt = preset.prompt.replace(/{subject}/g, item.subjectNoun);

        // Construct Full Prompt
        const fullPrompt = `
      Act as a world-class commercial product photographer. Your goal is to produce a hyper-realistic e-commerce mockup of a physical ${item.formatSpec} featuring the provided design.
      
      Scene Environment: ${interpolatedScenePrompt}
      
      CRITICAL INSTRUCTIONS FOR IMAGE APPLICATION:
      1. SURFACE INTEGRATION: The input image is the DESIGN that must be printed/applied onto the ${item.formatSpec}. It is NOT a photo of the product; it is the source graphic.
      2. GEOMETRIC WRAPPING: You must perfectly warp and wrap the design to match the curvature, folds, and perspective of the physical object. 
      3. MATERIAL TEXTURE: The design must inherit the surface texture of the substrate.
      
      VISUAL REQUIREMENTS:
      - LIGHTING: Use complex, multi-source studio lighting.
      - REALISM: 4k resolution, highly detailed, sharp focus, professional studio quality, product photography
      
      Output only the final product image.
    `;

        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
        ];

        let requestPayload;

        // ---------------------------------------------------------
        // DOLL MODE LOGIC
        // ---------------------------------------------------------
        if (item.category === 'Doll' && item.moldPath) {
            // Read the mold image
            const moldFilePath = path.join(process.cwd(), 'assets', 'dolls', item.moldPath);

            let moldBuffer;
            try {
                moldBuffer = fs.readFileSync(moldFilePath);
            } catch (e) {
                logger.error(`[Mockup] Failed to read mold file: ${moldFilePath} `, e);
                throw new Error(`Mold asset missing: ${item.label} `);
            }
            const moldBase64 = moldBuffer.toString('base64');

            const dollPrompt = `You are a vinyl designer toy colorist.

You are given an image of a blank, unpainted vinyl toy.
This blank is the final mold.

            RULES(important):
        - Do NOT change the shape, proportions, or pose.
- Do NOT add or remove ears, limbs, or features.
- Do NOT add clothing, accessories, patterns, symbols, or text.
- Do NOT add facial features or expressions.
- Do NOT redraw the toy.

            TASK:
Only apply color, finish, and surface treatment to the existing toy.

You may use:
        - Solid colors
            - Gradients
            - Subtle paint transitions
                - Vinyl finishes(matte, gloss, pearl, soft - touch, translucent)
                    - Very subtle speckle or marbling IF it looks manufacturable

STYLE SEED:
Apply the style, color palette, and texture from the provided User Image.

            OUTPUT:
${preset.prompt} `;

            requestPayload = {
                contents: [{
                    role: 'user',
                    parts: [
                        { text: dollPrompt },
                        { inlineData: { mimeType: 'image/png', data: moldBase64 } }, // The Mold
                        { inlineData: { mimeType: 'image/png', data: imageBase64 } }  // The Style Reference
                    ]
                }],
                safetySettings: safetySettings
            };
        } else {
            // STANDARD / TCG LOGIC
            requestPayload = {
                contents: [{
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: imageBase64 } },
                        { text: fullPrompt }
                    ]
                }],
                safetySettings: safetySettings
            };
        }

        // Generation
        logger.info(`[Mockup] Sending request to Vertex AI for ${item.label}...`);
        const response = await withVertexRateLimiting(async () => {
            const res = await generativeModel.generateContent(requestPayload);
            return res.response;
        }, { context: `Mockup - ${item.label} `, retries: 3 });
        logger.info(`[Mockup] Vertex AI response received for ${item.label}`);

        // Extract Image
        const candidate = response.candidates?.[0];
        let outputImageBase64 = null;
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    outputImageBase64 = part.inlineData.data;
                    break;
                }
            }
        }

        if (!outputImageBase64) {
            const finishReason = candidate?.finishReason;
            const safetyRatings = candidate?.safetyRatings;
            logger.error(`[Mockup] No image generated.Reason: ${finishReason} `, { safetyRatings });
            throw new Error(`No image generated(Reason: ${finishReason})`);
        }

        // Upload to B2 with Rewrite/Retry
        const s3 = await getS3Client();
        const timestamp = Date.now();
        const safeLabel = item.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safePreset = preset.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const key = `mockups / ${userUid}/${timestamp}-${safeLabel}-${safePreset}.png`;
        const buffer = Buffer.from(outputImageBase64, 'base64');

        logger.info(`[Mockup] Uploading to B2: ${key}`);

        // Wrap S3 upload in retry logic
        await retryOperation(async () => {
            await s3.send(new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: 'image/png'
            }));
        }, { retries: 3, backoff: 500, context: `B2-Upload-${safeLabel}` });

        logger.info(`[Mockup] Upload success: ${key}`);

        const url = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${key}`;

        return {
            id: `${item.id}-${timestamp}`,
            url: url,
            filename: `${safeLabel}-${safePreset}.png`,
            label: item.label,
            presetLabel: preset.label,
            prompt: interpolatedScenePrompt,
            mockupItemId: item.id,
            presetId: preset.id,
            success: true
        };

    } catch (error) {
        logger.error(`Failed to generate ${item.label}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Handles the Gacha Spin action: 3 random unique mockups
 */
export const handleGachaSpin = async (request) => {
    logger.info("[Gacha] Spin started", { uid: request.auth?.uid });
    const { image } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated to use Gacha Spin.");
    }

    if (!image) {
        throw new Error("No image token provided.");
    }

    // Cost Check & Deduction
    const costDeducted = await checkAndDeductZaps(uid);

    // Decode base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Select items based on mode
    let sourceItems = MOCKUP_ITEMS;
    let sourcePresets = MOCKUP_PRESETS;

    if (request.data.mode === 'tcg') {
        sourceItems = TCG_ITEMS;
        sourcePresets = TCG_PRESETS;
        logger.info("[Gacha] Mode: TCG/CCG Active");
    } else if (request.data.mode === 'doll') {
        sourceItems = DOLL_ITEMS;
        sourcePresets = DOLL_PRESETS;
        logger.info("[Gacha] Mode: Doll Reskin Active");
    }

    // Select random unique items (currently just 1 for cost saving/speed as per user pref)
    const shuffledItems = [...sourceItems].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, 1);
    logger.info(`[Gacha] Selected items: ${selectedItems.map(i => i.label).join(', ')}`);

    // Parallel Generation
    logger.info("[Gacha] Starting parallel generation...");
    const promises = selectedItems.map((item, idx) => {
        // Random Preset for each
        const randomPreset = sourcePresets[Math.floor(Math.random() * sourcePresets.length)];
        logger.info(`[Gacha] Item ${idx + 1}: ${item.label} with preset ${randomPreset.label}`);
        return generateSingleMockup(base64Data, item, randomPreset, uid);
    });

    // Wait all (we want to return what succeeds)
    const results = await Promise.all(promises);
    logger.info("[Gacha] All generations completed/failed.");

    const successfulPrizes = results.filter(r => r.success);
    logger.info(`[Gacha] Success count: ${successfulPrizes.length}/${results.length}`);

    if (successfulPrizes.length === 0) {
        // Log the errors
        results.forEach(r => { if (!r.success) logger.error("Gacha Item Failed", r.error); });

        // Refund if we took money and failed completely
        if (costDeducted > 0) {
            try {
                await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(costDeducted) });
                logger.info(`[Billing] Refunded ${costDeducted} Zaps to ${uid} due to total failure.`);
            } catch (e) {
                logger.error(`[Billing] Failed to refund user ${uid}`, e);
            }
        }

        throw new Error("The machine jammed! No prizes were generated.");
    }

    return {
        success: true,
        prizes: successfulPrizes
    };
};

/**
 * Generates a mockup image based on an input design and instruction.
 * @param {object} request - The callable request object
 * @returns {object} - { success: true, image: "data:image/png;base64,...", url?: string }
 */
export const handleGenerateMockup = async (request) => {
    const { image, instruction, options } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated.");
    }

    if (!image) {
        throw new Error("No image data provided.");
    }

    // Cost Check
    const costDeducted = await checkAndDeductZaps(uid);

    try {
        const generativeModel = getModel();

        // Decode base64 image (remove header if present)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        // Determine quality keywords
        const quality = options?.quality || 'high';
        const qualityKeywords = quality === 'ultra'
            ? "8k resolution, ultra-sharp details, macro photography textures, ray-traced lighting, cinematic quality, phase one camera"
            : quality === 'high'
                ? "4k resolution, highly detailed, sharp focus, professional studio quality, product photography"
                : "photorealistic, good lighting, clear details";

        const format = options?.format || "4x6 inch photo print";

        // Construct Prompts
        const basePrompt = `Act as a world-class commercial product photographer. Your goal is to produce a hyper-realistic e-commerce mockup of a physical ${format} featuring the provided design.`;

        const instructionPrompt = instruction
            ? `Scene Environment: ${instruction}`
            : "Scene Environment: Placed on a minimal white surface with soft, high-end studio lighting.";

        const fullPrompt = `
      ${basePrompt}
      ${instructionPrompt}
      
      CRITICAL INSTRUCTIONS FOR IMAGE APPLICATION:
      1. SURFACE INTEGRATION: The input image is the DESIGN that must be printed/applied onto the ${format}. It is NOT a photo of the product; it is the source graphic.
      2. GEOMETRIC WRAPPING: You must perfectly warp and wrap the design to match the curvature, folds, and perspective of the physical object. 
         - If cloth: The design must fold and wrinkle with the fabric.
         - If cylindrical (mug/can): The design must curve realistically around the form.
         - If glossy: Reflections must sit ON TOP of the design.
         - If embroidery: The design must be rendered as realistic raised thread stitching with texture and depth.
      3. MATERIAL TEXTURE: The design must inherit the surface texture of the substrate (e.g., the grain of paper, the weave of canvas, the gloss of ceramic). It should not look like a flat digital overlay.
      
      VISUAL REQUIREMENTS:
      - LIGHTING: Use complex, multi-source studio lighting. Shadows should be soft, diffuse, and physically accurate (ambient occlusion).
      - DEPTH: The object must sit naturally in the 3D space. Use subtle depth of field to focus on the product.
      - REALISM: ${qualityKeywords}
      
      Output only the final product image.
    `;

        const requestPayload = {
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'image/png', data: base64Data } },
                    { text: fullPrompt }
                ]
            }],
        };

        // Wrap Vertex AI call with rate limiting
        const response = await withVertexRateLimiting(async () => {
            const result = await generativeModel.generateContent(requestPayload);
            return result.response;
        }, { context: 'Mockup Generation', retries: 3 });

        // Extract the First Candidate
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from Vertex AI.");
        }

        const candidate = candidates[0];
        let outputImageBase64 = null;

        // Check parts for image
        if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    outputImageBase64 = part.inlineData.data;
                }
            }
        }

        if (!outputImageBase64) {
            throw new Error("No image generated by Vertex AI.");
        }

        const result = {
            success: true,
            image: `data:image/png;base64,${outputImageBase64}`
        };

        // Optional: Save to B2 storage
        if (options?.saveToStorage) {
            try {
                // Ensure import works or use require if needed, but module import is standard in this project
                // const { PutObjectCommand } = await import("@aws-sdk/client-s3"); // Already imported at top
                const s3 = await getS3Client();
                const timestamp = Date.now();
                const key = `mockups/${request.auth?.uid || 'anonymous'}/${timestamp}.png`;
                const buffer = Buffer.from(outputImageBase64, 'base64');

                await s3.send(new PutObjectCommand({
                    Bucket: B2_BUCKET,
                    Key: key,
                    Body: buffer,
                    ContentType: 'image/png'
                }));

                result.url = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${key}`;
            } catch (uploadError) {
                logger.warn("B2 upload failed, returning base64 only:", uploadError.message);
            }
        }

        return result;

    } catch (error) {
        // Refund on failure
        if (costDeducted > 0) {
            try {
                await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(costDeducted) });
                logger.info(`[Billing] Refunded ${costDeducted} Zaps to ${uid} due to failure.`);
            } catch (e) {
                logger.error(`[Billing] Failed to refund user ${uid}`, e);
            }
        }

        logger.error("Mockup Generation Error:", error);
        throw new Error(`Mockup generation failed: ${error.message}`);
    }
};

/**
 * Generates a specific Mockup Item with a Preset
 */
export const handleGenerateMockupItem = async (request) => {
    const { image, itemId, presetId } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', "User must be authenticated.");
    }
    if (!image) {
        throw new Error("No image data provided.");
    }
    if (!itemId) {
        throw new Error("No item ID provided.");
    }

    // 1. Look up Item and Preset from code config
    const item = MOCKUP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        throw new HttpsError('not-found', `Mockup Item '${itemId}' not found in backend config.`);
    }

    // Default to 'clean studio' if no preset provided
    let preset = null;
    if (presetId) {
        preset = MOCKUP_PRESETS.find(p => p.id === presetId);
    }
    if (!preset) {
        preset = MOCKUP_PRESETS.find(p => p.id === 'studio') || MOCKUP_PRESETS[0];
    }

    // 2. Cost Check & Deduction
    const costDeducted = await checkAndDeductZaps(uid);

    try {
        // 3. Generate
        // Decode base64
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const result = await generateSingleMockup(base64Data, item, preset, uid);

        if (!result.success) {
            throw new Error(result.error);
        }

        // 4. Save to Firestore (reuse 'generations' collection like MockupFeed)
        try {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            const userData = userDoc.exists ? userDoc.data() : {};

            await db.collection('generations').doc(result.id).set({
                id: result.id,
                userId: uid,
                userDisplayName: userData.displayName || 'Anonymous',
                userPhotoURL: userData.photoURL || '',
                type: 'mockup',
                url: result.url, // B2 URL
                thumbnailUrl: result.url, // Same for now
                prompt: result.prompt,
                label: item.label,
                mockupItemId: item.id, // Important for "Items created with..." query
                presetId: preset.id,
                createdAt: FieldValue.serverTimestamp(),
                isPublic: true, // Default to true for feed
                likes: 0,
                views: 0
            });
            logger.info(`[Mockup] Saved metadata to generations/${result.id}`);
        } catch (dbError) {
            logger.error(`[Mockup] Failed to save metadata to Firestore:`, dbError);
            // Don't fail the request, just log it. The user still got their image.
        }

        return result;

    } catch (error) {
        // Refund on failure
        if (costDeducted > 0) {
            try {
                await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(costDeducted) });
                logger.info(`[Billing] Refunded ${costDeducted} Zaps to ${uid} due to failure.`);
            } catch (e) {
                logger.error(`[Billing] Failed to refund user ${uid}`, e);
            }
        }
        logger.error(`Failed to generate item ${itemId}:`, error);
        throw new HttpsError('internal', `Generation failed: ${error.message}`);
    }
};
