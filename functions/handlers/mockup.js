import { logger } from "../lib/utils.js";
import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex AI
// Note: Ensure the service account has permission to use Vertex AI
const project = process.env.GCLOUD_PROJECT || "dream-bees-v11"; // Fallback if env not set
const location = "us-central1"; // Standard region
const vertexAI = new VertexAI({ project: project, location: location });

// Helper to instantiate the model
// Using gemini-2.5-flash-image as requested in the plan (although original code used that string, 
// likely this maps to a specific model version in Vertex, e.g., 'gemini-1.5-flash-001' or similar. 
// For now, I will use 'gemini-1.5-flash-001' which is the standard Flash model available on Vertex 
// as of early 2025/late 2024, or 'gemini-2.0-flash-exp' if available. 
// However, the user specifically mentioned 'gemini-2.5-flash-image'. 
// If that is a custom model or a very new preview, I should use it. 
// Given the conversation context "gemini-2.5-flash-image" might be a specific internal name 
// or I should stick to 'gemini-1.5-flash-001' if 2.5 isn't standard yet.
// Wait, in Step 18 `geminiService.ts` used `gemini-2.5-flash-image`. 
// I will trust the user knows what they are doing with that model name 
// OR simpler: use 'gemini-1.5-pro-001' or 'gemini-1.5-flash-001' since 2.5 might not be on Vertex Public API yet.
// Actually, let's use the exact string from the user's codebase if it was working there, 
// BUT "gemini-2.5-flash-image" sounds like an AI Studio model name. 
// On Vertex, it is usually `gemini-1.5-flash-001`. 
// I'll stick to `gemini-1.5-flash-001` to be safe for Vertex, unless I see evidence otherwise.
// Wait, conversation 9fab7e5e... explicitly mentions "Add Gemini Image Model" -> `gemini-2.5-flash-image`.
// So I MUST use that model name.

const MODEL_NAME = "gemini-2.5-flash-image";

const getModel = () => {
    return vertexAI.getGenerativeModel({
        model: MODEL_NAME,
        // safetySettings: ... // Add if needed
    });
};

/**
 * Generates a mockup image based on an input design and instruction.
 * @param {object} request - The callable request object
 * @returns {object} - { success: true, image: "data:image/png;base64,..." }
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

        // Construct Prompts (Ported from geminiService.ts)
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
                    { inlineData: { mimeType: 'image/png', data: base64Data } }, // Assuming PNG for simplicity, passing source bytes
                    { text: fullPrompt }
                ]
            }],
        };

        const result = await generativeModel.generateContent(requestPayload);
        const response = await result.response;

        // Extract the First Candidate
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from Vertex AI.");
        }

        // Vertex AI returns inlineData somewhat differently in Node SDK?
        // Usually `candidates[0].content.parts[0]`
        // Verify structure. For images, we typically see it in the parts.

        const candidate = candidates[0];
        let outputImageBase64 = null;

        // Check parts for image
        if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    outputImageBase64 = part.inlineData.data;
                    // MimeType is usually provided too
                }
            }
        }

        if (!outputImageBase64) {
            throw new Error("No image generated by Vertex AI.");
        }

        return {
            success: true,
            image: `data:image/png;base64,${outputImageBase64}`
        };

    } catch (error) {
        logger.error("Mockup Generation Error:", error);
        throw new Error(`Mockup generation failed: ${error.message}`);
    }
};
