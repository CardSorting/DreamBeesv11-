import { logger, getS3Client } from "../lib/utils.js";
import { VertexAI } from "@google-cloud/vertexai";
import { withVertexRateLimiting } from "../lib/rateLimiter.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "../lib/constants.js";
import { MOCKUP_ITEMS, MOCKUP_PRESETS } from "../lib/mockupData.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

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

        const requestPayload = {
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'image/png', data: imageBase64 } },
                    { text: fullPrompt }
                ]
            }],
        };

        // Generation
        const response = await withVertexRateLimiting(async () => {
            const res = await generativeModel.generateContent(requestPayload);
            return res.response;
        }, { context: 'Mockup Generation', retries: 3 });

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

        if (!outputImageBase64) throw new Error("No image generated.");

        // Upload to B2
        const s3 = await getS3Client();
        const timestamp = Date.now();
        const safeLabel = item.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safePreset = preset.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const key = `mockups/${userUid}/${timestamp}-${safeLabel}-${safePreset}.png`;
        const buffer = Buffer.from(outputImageBase64, 'base64');

        await s3.send(new PutObjectCommand({
            Bucket: B2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: 'image/png'
        }));

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
    const { image } = request.data;
    const uid = request.auth?.uid || 'anonymous';

    if (!image) {
        throw new Error("No image token provided.");
    }

    // Decode base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Select 3 random unique items
    const shuffledItems = [...MOCKUP_ITEMS].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, 3);

    // Parallel Generation
    const promises = selectedItems.map(item => {
        // Random Preset for each
        const randomPreset = MOCKUP_PRESETS[Math.floor(Math.random() * MOCKUP_PRESETS.length)];
        return generateSingleMockup(base64Data, item, randomPreset, uid);
    });

    // Wait all (we want to return what succeeds)
    const results = await Promise.all(promises);
    const successfulPrizes = results.filter(r => r.success);

    if (successfulPrizes.length === 0) {
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

    if (!image) {
        throw new Error("No image data provided.");
    }

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
        logger.error("Mockup Generation Error:", error);
        throw new Error(`Mockup generation failed: ${error.message}`);
    }
};
