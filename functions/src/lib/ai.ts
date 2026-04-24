import { db } from "../firebaseInit.js";
import { getS3Client, fetchWithTimeout, logger } from "./utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "./constants.js";
// [REMOVED] import { vertexFlow } from "./vertexFlow.js";

// Move Constants

// Helper for Vision Prompt Generation
export async function generateVisionPrompt(imageUrl) {
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const PROMPT_GUIDELINES = "Describe the image in detail for an AI art generator. Focus on subject, medium, style, lighting, color, and composition.";

    let mimeType = "image/png";
    let imageBase64 = "";

    if (imageUrl.trim().startsWith('data:')) {
        const parts = imageUrl.trim().split(',');
        mimeType = parts[0].match(/:(.*?);/)[1];
        imageBase64 = parts[1];
    } else {
        try {
            const imgRes = await fetchWithTimeout(imageUrl);
            const arrayBuffer = await imgRes.arrayBuffer();
            imageBase64 = Buffer.from(arrayBuffer).toString('base64');
            const contentType = imgRes.headers.get('content-type');
            if (contentType) { mimeType = contentType; }
        } catch (e) {
            logger.error("Failed to fetch image for Vertex AI:", e);
            throw new Error("Could not retrieve image for analysis");
        }
    }

    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    { text: "Analyze the image and write an image generation prompt based on these guidelines:\n" + PROMPT_GUIDELINES },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    }
                ]
            }
        ]
    };

    // Reverted to direct call
    const result = await model.generateContent(request as any);

    const response = await result.response;
    const candidate = response.candidates?.[0];
    const textOutput = candidate?.content?.parts?.[0]?.text || "";

    return textOutput;
}

// Helper for Gemini Prompt Enhancement
export const enhancePromptWithGemini = async (prompt) => {
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: {
            role: 'system',
            parts: [{ text: "You are an expert AI art prompt engineer specializing in Stable Diffusion XL (SDXL). Enhance the user's prompt with high-quality descriptors for lighting, composition, texture, and artistic style. Use format: 'Subject description, art style, lighting, camera details, additional tags'. Keep it concise but potent. Return ONLY the enhanced prompt." }]
        } as any
    });

    const request = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ]
    };

    // Reverted to direct call
    const result = await model.generateContent(request);

    const response = await result.response;
    const textOutput = response.candidates?.[0]?.content?.parts?.[0]?.text;

    return textOutput || prompt;
};

// Helper for Vision-based Style Transformation (using Vertex AI)
// Helper for Flux-based Style Transformation (using Modal API)
export const transformImageWithFlux = async (imageUrl, styleName, instructions, intensity = 'medium', userId = 'system') => {
    const { modalAPI } = await import("./modal.js");

    const prompt = `Analyze the subject, composition, and mood of the input image and recreate it in the "${styleName}" style. ${instructions}. Match the subject and composition exactly but apply the visual aesthetics of ${styleName}. Intensity: ${intensity}.`;

    logger.info(`[TransformFlux] Calling Modal API with style: ${styleName}, intensity: ${intensity}`);

    try {
        const imageBuffer = await modalAPI.editAndWait({
            prompt,
            image: imageUrl, // Can be URL as per API spec
            num_steps: 4,
            width: 1024,
            height: 1024
        });

        // 4. Process Output (Buffer -> Sharp)
        const { default: sharp } = await import("sharp");
        const sharpImg = sharp(imageBuffer);
        const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();

        // Create Thumbnail
        const thumbBuffer = await sharpImg
            .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // Create LQIP
        const lqipBuffer = await sharpImg
            .resize(20, 20, { fit: 'inside' })
            .webp({ quality: 20 })
            .toBuffer();
        const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

        // Upload to B2
        const baseFolder = `generated/${userId}/transformed_${Date.now()}`;
        const originalFilename = `${baseFolder}.webp`;
        const thumbFilename = `${baseFolder}_thumb.webp`;

        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();

        await Promise.all([
            s3.send(new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: originalFilename,
                Body: webpBuffer,
                ContentType: "image/webp"
            })),
            s3.send(new PutObjectCommand({
                Bucket: B2_BUCKET,
                Key: thumbFilename,
                Body: thumbBuffer,
                ContentType: "image/webp"
            }))
        ]);

        const finalImageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        const finalThumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

        // Save to Firestore 'images' collection
        const imageRef = await db.collection("images").add({
            userId,
            prompt: prompt,
            aspectRatio: "match_input_image",
            modelId: "flux-klein-9b",
            imageUrl: finalImageUrl,
            thumbnailUrl: finalThumbnailUrl,
            lqip,
            isPublic: true,
            createdAt: new Date(),
            type: 'restyled'
        });

        return {
            imageUrl: finalImageUrl,
            thumbnailUrl: finalThumbnailUrl,
            lqip,
            imageId: imageRef.id
        };
    } catch (error) {
        logger.error(`[TransformFlux] Modal API error:`, error);
        throw new Error(`Flux transformation failed: ${error.message}`);
    }
};

export const transformImageWithGemini = async (imageUrl, styleName, instructions, intensity = 'medium', userId = 'system') => {
    // Optionally redirect to Flux if requested or as a default
    // For now, let's keep Gemini as is but keep the Flux option available

    // 1. Fetch Input Image & Convert to Base64
    let inputBase64 = null;
    let mimeType = "image/png";

    try {
        const imgRes = await fetchWithTimeout(imageUrl);
        if (!imgRes.ok) { throw new Error(`Failed to fetch source image: ${imgRes.statusText}`); }
        const arrayBuffer = await imgRes.arrayBuffer();
        inputBase64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = imgRes.headers.get('content-type');
        if (contentType) { mimeType = contentType; }
    } catch (e) {
        logger.error("[Transform] Failed to fetch source image:", e);
        throw new Error("Could not retrieve source image for transformation");
    }

    // 2. Initialize Vertex AI
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    // 3. Construct Prompt
    const prompt = `Analyze the subject, composition, and mood of the input image and recreate it in the "${styleName}" style. ${instructions}. Match the subject and composition exactly but apply the visual aesthetics of ${styleName}. Intensity: ${intensity}.`;

    logger.info(`[Transform] Calling Vertex AI with style: ${styleName}, intensity: ${intensity}`);

    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: inputBase64
                        }
                    },
                    { text: prompt }
                ]
            }
        ]
    };

    let generatedImageBase64 = null;

    try {
        // Reverted to direct call
        logger.info(`[Transform] Executing Vertex AI call for ${styleName}...`);
        const result = await model.generateContent(request as any);

        const response = await result.response;

        const candidate = response.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error("Blocked by Safety Filter");
        }

        // Robust parsing of parts
        const parts = candidate?.content?.parts || [];
        const imagePart = parts.find(p => p.inlineData);
        generatedImageBase64 = imagePart?.inlineData?.data || null;

        if (!generatedImageBase64) {
            throw new Error("No image data returned from Vertex AI");
        }

    } catch (error) {
        logger.error(`[Transform] Vertex AI API error:`, error);
        throw new Error(`Vertex AI call failed: ${error.message}`);
    }

    // 4. Process Output (Base64 -> Buffer -> Sharp)
    const { default: sharp } = await import("sharp");
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();

    // Create Thumbnail
    const thumbBuffer = await sharpImg
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    // Create LQIP
    const lqipBuffer = await sharpImg
        .resize(20, 20, { fit: 'inside' })
        .webp({ quality: 20 })
        .toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

    // Upload to B2
    const baseFolder = `generated/${userId}/transformed_${Date.now()}`;
    const originalFilename = `${baseFolder}.webp`;
    const thumbFilename = `${baseFolder}_thumb.webp`;

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = await getS3Client();

    await Promise.all([
        s3.send(new PutObjectCommand({
            Bucket: B2_BUCKET,
            Key: originalFilename,
            Body: webpBuffer,
            ContentType: "image/webp"
        })),
        s3.send(new PutObjectCommand({
            Bucket: B2_BUCKET,
            Key: thumbFilename,
            Body: thumbBuffer,
            ContentType: "image/webp"
        }))
    ]);

    const finalImageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
    const finalThumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

    // Save to Firestore 'images' collection
    const imageRef = await db.collection("images").add({
        userId,
        prompt: prompt,
        aspectRatio: "match_input_image",
        modelId: "gemini-2.5-flash-image",
        imageUrl: finalImageUrl,
        thumbnailUrl: finalThumbnailUrl,
        lqip,
        isPublic: true,
        createdAt: new Date(),
        type: 'restyled'
    });

    return {
        imageUrl: finalImageUrl,
        thumbnailUrl: finalThumbnailUrl,
        lqip,
        imageId: imageRef.id
    };
};
