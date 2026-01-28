import { HttpsError } from "firebase-functions/v2/https";
import { logger, fetchWithTimeout } from "../lib/utils.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handle Distill Request
 * Extracts aesthetic packs from a batch of images.
 * @param {import("firebase-functions/v2/https").CallableRequest} request
 */
export async function handleDistillRequest(request) {
    const { images } = request.data;
    const uid = request.auth?.uid;

    if (!images || !Array.isArray(images) || images.length === 0) {
        throw new HttpsError("invalid-argument", "The 'images' field must be a non-empty array of image URLs.");
    }

    logger.info(`[Distill] User ${uid} requested distillation for ${images.length} images.`);

    try {
        // 1. Load the System Prompt from distill.md
        const distillMdPath = path.resolve(__dirname, "../../distill.md");
        const distillContent = fs.readFileSync(distillMdPath, "utf8");

        // Extract the actual prompt (everything after "SYSTEM PROMPT ...")
        const systemPrompt = distillContent.replace(/^SYSTEM PROMPT.*?\n/i, "").trim();

        // 2. Initialize Vertex AI
        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            }
        });

        // 3. Prepare Image Parts for Gemini
        const imageParts = await Promise.all(images.map(async (url) => {
            try {
                const imgRes = await fetchWithTimeout(url);
                if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                const arrayBuffer = await imgRes.arrayBuffer();
                const mimeType = imgRes.headers.get("content-type") || "image/png";
                return {
                    inlineData: {
                        mimeType,
                        data: Buffer.from(arrayBuffer).toString("base64")
                    }
                };
            } catch (e) {
                logger.error(`[Distill] Failed to fetch image ${url}:`, e);
                return null;
            }
        }));

        const validImageParts = imageParts.filter(part => part !== null);

        if (validImageParts.length === 0) {
            throw new HttpsError("internal", "Could not retrieve any of the provided images for analysis.");
        }

        // 4. Construct Request
        const promptText = "Analyze these images and output a single consolidated JSON aesthetic pack representing their center of gravity, as per your system instructions.";

        const genRequest = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        ...validImageParts,
                        { text: promptText }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        // 5. Execute Gemini Call
        const result = await model.generateContent(genRequest);
        const responseText = (await result.response).candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error("No response returned from Gemini");
        }

        // 6. Parse, Save and Return
        const aestheticPack = JSON.parse(responseText);

        // Sanitize aesthetic_name for filename
        const packName = aestheticPack.aesthetic_name || `pack_${Date.now()}`;
        const sanitizedName = packName.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const filename = `${sanitizedName}.json`;
        const packPath = path.resolve(__dirname, "../packs", filename);

        try {
            fs.writeFileSync(packPath, JSON.stringify(aestheticPack, null, 2));
            logger.info(`[Distill] Aesthetic pack saved to ${packPath}`);
        } catch (saveError) {
            logger.error(`[Distill] Failed to save pack to ${packPath}:`, saveError);
            // We still return success since the AI generation worked
        }

        return {
            success: true,
            aestheticPack,
            filename: filename // Return filename so client knows where it's stored
        };

    } catch (error) {
        logger.error("[Distill] Critical Error:", error);
        throw new HttpsError("internal", error.message || "Failed to distill images.");
    }
}
