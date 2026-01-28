import { logger, getS3Client, retryOperation } from "../lib/utils.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
// import { withVertexRateLimiting } from "../lib/rateLimiter.js"; // [REMOVED]
// [REMOVED] import { vertexFlow } from "../lib/vertexFlow.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { MOCKUP_ITEMS, MOCKUP_PRESETS, TCG_ITEMS, TCG_PRESETS, DOLL_ITEMS, DOLL_PRESETS, RESKIN_ITEMS, RESKIN_PRESETS } from "../lib/mockupData.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db, FieldValue } from "../firebaseInit.js";
import { HttpsError } from "firebase-functions/v2/https";
import { ZAP_COSTS } from "../lib/costs.js";
import { deductZapsAtomic } from "../lib/credits.js";

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Vertex AI
const project = process.env.GCLOUD_PROJECT || "dreambees-alchemist";
const location = "us-central1";
const vertexAI = new VertexAI({ project, location });

const MODEL_NAME = "gemini-2.5-flash-image";

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
            // Resolve path using __dirname (handlers/) -> up one level -> assets/dolls
            const functionsRoot = path.resolve(__dirname, '..');
            const moldFilePath = path.join(functionsRoot, 'assets', 'dolls', item.moldPath);

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
        } else if (item.category === 'Reskin' && item.moldPath) {
            // ---------------------------------------------------------
            // RESKIN MODE LOGIC (Credit Cards, etc)
            // ---------------------------------------------------------
            const functionsRoot = path.resolve(__dirname, '..');
            const moldFilePath = path.join(functionsRoot, 'assets', 'reskins', item.moldPath);

            let moldBuffer;
            try {
                moldBuffer = fs.readFileSync(moldFilePath);
            } catch (e) {
                logger.error(`[Mockup] Failed to read Reskin mold file: ${moldFilePath}`, e);
                throw new Error(`Reskin mold asset missing: ${item.label}`);
            }
            const moldBase64 = moldBuffer.toString('base64');

            const reskinPrompt = `You are a world-class industrial designer and material specialist.
            
            INPUTS:
            1. THE MOLD: The provided image of a blank/basic physical product.
            2. THE DESIGN: The Style Reference image containing the pattern, color, and aesthetic to be applied.
            
            TASK:
            "Reskin" the MOLD by applying the aesthetic from the DESIGN onto its surfaces.
            
            CORE PRINCIPLES:
            - GEOMETRIC FIDELITY: Maintain the EXACT shape, proportions, and physical details of the MOLD. Do not add or remove physical components.
            - MATERIAL REALISM: The final product must look like a high-end physical object made of the material described in the item specification (${item.formatSpec}). 
              - If the mold is metallic: Use complex reflections, brushed or polished textures, and realistic specular highlights.
              - If the mold is vinyl/plastic: Use appropriate surface sheen (matte or gloss) and respect manufacturing seams or mold lines.
            - SURFACE INTEGRATION: The DESIGN must look like it is part of the object (printed, engraved, embossed, or woven), not like a flat digital overlay. It should follow every curve and indentation of the mold.
            
            DESIGN PLACEMENT LOGIC:
            - If the DESIGN is a repeating pattern: Apply it as a full-bleed wrap across the surface of the mold.
            - If the DESIGN is a standalone graphic or logo: Place it prominently and artistically on the primary focal area of the mold (e.g., the face of a card, the chest of a toy).
            - COMPLEMENTARY COLORING: If the design doesn't cover the whole mold, use a balanced secondary color from the design's palette for the remaining surfaces.
            
            CRITICAL:
            Ensure all functional parts of the mold remain recognizable (e.g., the chip on a credit card, the eyes/sculpt of a toy) but styled to match the new aesthetic.
            
            OUTPUT:
            ${preset.prompt}`;

            requestPayload = {
                contents: [{
                    role: 'user',
                    parts: [
                        { text: reskinPrompt },
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

        // [MODIFIED] Use VertexFlow (High Priority)
        // Reverted to direct call
        const res = await generativeModel.generateContent(requestPayload);
        const response = res.response;

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
        const key = `mockups/${userUid}/${timestamp}-${safeLabel}-${safePreset}.png`;
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
    const cost = ZAP_COSTS.MOCKUP_GEN || 0.25;
    const requestId = request.data.requestId || `gacha_${Date.now()}`;
    const billing = await deductZapsAtomic(uid, cost, requestId, 'action_logs');
    if (billing.idempotent) return { success: true, idempotent: true };

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
    } else if (request.data.mode === 'reskin') {
        sourceItems = RESKIN_ITEMS;
        sourcePresets = RESKIN_PRESETS;
        logger.info("[Gacha] Mode: General Reskin Active");
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

        // Note: No manual refund here. Idempotency protects the deduction.
        // If it's a transient failure, user can retry with the same requestId.
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
    const cost = ZAP_COSTS.MOCKUP_GEN || 0.25;
    const requestId = request.data.requestId || `mockup_${Date.now()}`;
    const billing = await deductZapsAtomic(uid, cost, requestId, 'action_logs');
    if (billing.idempotent) return { success: true, idempotent: true };

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

        // Wrap Vertex AI call with [MODIFIED] VertexFlow
        const response = await vertexFlow.execute('MOCKUP_GEN', async () => {
            const result = await generativeModel.generateContent(requestPayload);
            return result.response;
        }, vertexFlow.constructor.PRIORITY.HIGH);

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
        // No manual refund, use idempotent retries
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
    const item = MOCKUP_ITEMS.find(i => i.id === itemId) ||
        TCG_ITEMS.find(i => i.id === itemId) ||
        DOLL_ITEMS.find(i => i.id === itemId) ||
        RESKIN_ITEMS.find(i => i.id === itemId);

    if (!item) {
        throw new HttpsError('not-found', `Mockup Item '${itemId}' not found in backend config.`);
    }

    // Default to 'clean studio' if no preset provided
    let preset = null;
    if (presetId) {
        preset = MOCKUP_PRESETS.find(p => p.id === presetId) ||
            TCG_PRESETS.find(p => p.id === presetId) ||
            DOLL_PRESETS.find(p => p.id === presetId) ||
            RESKIN_PRESETS.find(p => p.id === presetId);
    }
    if (!preset) {
        preset = MOCKUP_PRESETS.find(p => p.id === 'studio') || MOCKUP_PRESETS[0];
    }

    // 2. Cost Check & Deduction
    const cost = ZAP_COSTS.MOCKUP_GEN || 0.25;
    const requestId = request.data.requestId || `mockitem_${Date.now()}`;
    const billing = await deductZapsAtomic(uid, cost, requestId, 'action_logs');
    if (billing.idempotent) return { success: true, idempotent: true };

    try {
        // 3. Generate
        // Decode base64
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const result = await generateSingleMockup(base64Data, item, preset, uid);

        if (!result.success) {
            throw new Error(result.error);
        }

        // 4. Save to Firestore (Dedicated 'mockups' collection)
        try {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            const userData = userDoc.exists ? userDoc.data() : {};

            await db.collection('mockups').doc(result.id).set({
                id: result.id,
                userId: uid,
                userDisplayName: userData.displayName || 'Anonymous',
                userPhotoURL: userData.photoURL || '',
                type: 'mockup',
                url: result.url, // B2 URL
                thumbnailUrl: result.url, // Same for now
                prompt: result.prompt,
                label: item.label,
                mockupItemId: item.id,
                presetId: preset.id,
                createdAt: FieldValue.serverTimestamp(),
                isPublic: true,
                likes: 0,
                views: 0
            });
            logger.info(`[Mockup] Saved metadata to mockups/${result.id}`);
        } catch (dbError) {
            logger.error(`[Mockup] Failed to save metadata to Firestore:`, dbError);
        }

        return result;

    } catch (error) {
        // No manual refund, use idempotent retries
        logger.error(`Failed to generate item ${itemId}:`, error);
        throw new HttpsError('internal', `Generation failed: ${error.message}`);
    }
};
