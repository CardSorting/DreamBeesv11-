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
    const { images, basePack } = request.data;
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
        const imageParts = await Promise.all(images.map(async (imageInput) => {
            try {
                let buffer;
                let mimeType = "image/png";

                if (typeof imageInput === "string" && imageInput.startsWith("http")) {
                    // It's a URL
                    const imgRes = await fetchWithTimeout(imageInput);
                    if (!imgRes.ok) {throw new Error(`HTTP ${imgRes.status}`);}
                    const arrayBuffer = await imgRes.arrayBuffer();
                    buffer = Buffer.from(arrayBuffer);
                    mimeType = imgRes.headers.get("content-type") || "image/png";
                } else if (typeof imageInput === "string" && imageInput.startsWith("data:image")) {
                    // It's a data URL
                    const match = imageInput.match(/^data:(image\/[a-z]+);base64,(.+)$/);
                    if (!match) {throw new Error("Invalid base64 format");}
                    mimeType = match[1];
                    buffer = Buffer.from(match[2], "base64");
                } else {
                    // Assume it's a local path
                    const absolutePath = path.isAbsolute(imageInput)
                        ? imageInput
                        : path.resolve(__dirname, "../../", imageInput);

                    if (fs.existsSync(absolutePath)) {
                        buffer = fs.readFileSync(absolutePath);
                        const ext = path.extname(absolutePath).toLowerCase();
                        if (ext === ".jpg" || ext === ".jpeg") {mimeType = "image/jpeg";}
                        else if (ext === ".png") {mimeType = "image/png";}
                        else if (ext === ".webp") {mimeType = "image/webp";}
                    } else {
                        throw new Error(`File not found: ${absolutePath}`);
                    }
                }

                return {
                    inlineData: {
                        mimeType,
                        data: buffer.toString("base64")
                    }
                };
            } catch (e) {
                logger.error(`[Distill] Failed to process image input:`, e);
                return null;
            }
        }));

        const validImageParts = imageParts.filter(part => part !== null);

        if (validImageParts.length === 0) {
            throw new HttpsError("internal", "Could not retrieve any of the provided images for analysis.");
        }

        // 4. Construct Request
        let promptText = "Analyze these images and output a single consolidated JSON aesthetic pack representing their center of gravity, as per your system instructions.";
        let parts = [...validImageParts];

        if (basePack) {
            promptText = "You are in Refinement Mode. I have provided an existing 'basePack' JSON below. Analyze these new images and update the basePack to reflect the shared aesthetic more accurately. Provide the FINAL updated JSON.";
            parts = [
                { text: `BASE_PACK: ${JSON.stringify(basePack, null, 2)}` },
                ...validImageParts,
                { text: promptText }
            ];
        } else {
            parts.push({ text: promptText });
        }

        const genRequest = {
            contents: [
                {
                    role: 'user',
                    parts: parts
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        // 5. Execute Gemini Call
        const totalSize = validImageParts.reduce((acc, part) => acc + part.inlineData.data.length, 0);
        logger.info(`[Distill] Sending ${validImageParts.length} images to Gemini. Total base64 size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);

        const result = await model.generateContent(genRequest);
        const response = await result.response;

        logger.info(`[Distill] Gemini response received: ${JSON.stringify(response, null, 2)}`);
        const candidate = response.candidates?.[0];

        const responseText = candidate?.content?.parts?.[0]?.text;

        if (!responseText) {
            if (response.promptFeedback?.blockReason === 'PROHIBITED_CONTENT') {
                throw new Error(`Gemini blocked the prompt due to prohibited content: ${response.promptFeedback.blockReasonMessage}`);
            }
            if (candidate?.finishReason === 'SAFETY') {
                throw new Error("Gemini blocked the response due to safety filters.");
            }
            throw new Error(`No response returned from Gemini. FinishReason: ${candidate?.finishReason}`);
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
