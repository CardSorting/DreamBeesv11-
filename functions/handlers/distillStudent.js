import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "../lib/utils.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as Generation from "./generation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handle Student Compose Request
 * Translates an Aesthetic Pack into a single high-fidelity image prompt
 * and triggers an image generation request.
 * @param {import("firebase-functions/v2/https").CallableRequest} request
 */
export async function handleStudentComposeRequest(request) {
    const { packId, pack, userRequest, modelId, aspectRatio, steps, cfg, seed, scheduler, useTurbo } = request.data;
    const uid = request.auth?.uid;

    logger.info(`[DistillStudent] User ${uid} requested prompt composition and generation. modelId=${modelId}`);

    try {
        // 1. Resolve Aesthetic Pack
        let aestheticPack = pack;

        if (packId) {
            const packPath = path.resolve(__dirname, "../packs", `${packId.replace(/\.json$/, "")}.json`);
            if (fs.existsSync(packPath)) {
                aestheticPack = JSON.parse(fs.readFileSync(packPath, "utf8"));
            } else {
                throw new HttpsError("not-found", `Aesthetic pack '${packId}' not found.`);
            }
        }

        if (!aestheticPack) {
            throw new HttpsError("invalid-argument", "Missing Aesthetic Pack. Provide either 'packId' or 'pack' object.");
        }

        // 2. Load the Student System Prompt from distill-student.md
        const studentMdPath = path.resolve(__dirname, "../../distill-student.md");
        const studentContent = fs.readFileSync(studentMdPath, "utf8");

        // Extract the actual prompt (everything after "SYSTEM PROMPT")
        const systemPrompt = studentContent.replace(/^SYSTEM PROMPT.*?\n/i, "").trim();

        // 3. Initialize Vertex AI
        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            }
        });

        // 4. Enhanced Logic: Inject Variance and Mode selection
        const modes = ["Stabilized", "Variant", "Strain", "Edge"];
        const selectedMode = modes[Math.floor(Math.random() * modes.length)];
        const variationSeed = seed || Math.floor(Math.random() * 1000000);

        // 5. Construct Request for Prompt Composition
        const userPrompt = `
AESTHETIC PACK:
${JSON.stringify(aestheticPack, null, 2)}

INTERNAL DIRECTIVES:
- MODE: ${selectedMode}
- VARIATION_SEED: ${variationSeed}

USER REQUEST:
${userRequest || "Generate a high-fidelity instance of this aesthetic."}
`;

        const genRequest = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        // 5. Execute Gemini Call to Compose Prompt
        const result = await model.generateContent(genRequest);
        const responseText = (await result.response).candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error("No response returned from Gemini");
        }

        // 6. Parse Composition Result
        const studentBundle = JSON.parse(responseText);

        if (studentBundle.error === "request_not_supported") {
            return {
                success: false,
                ...studentBundle
            };
        }

        const composedPrompt = studentBundle.prompt;
        const composedNegativePrompt = studentBundle.negative_prompt;

        if (!composedPrompt) {
            throw new Error("Gemini failed to generate a 'prompt' field.");
        }

        // 7. Trigger Image Generation
        // Construct a mock request object for handleCreateGenerationRequest
        const generationRequest = {
            data: {
                prompt: composedPrompt,
                negative_prompt: composedNegativePrompt,
                modelId: modelId || "wai-illustrious",
                aspectRatio: aspectRatio || "1:1",
                steps,
                cfg,
                seed,
                scheduler,
                useTurbo: !!useTurbo
            },
            auth: request.auth,
            app: request.app,
            rawRequest: request.rawRequest
        };

        logger.info(`[DistillStudent] Triggering generation with prompt: ${composedPrompt.substring(0, 50)}...`);
        let generationResponse = null;
        try {
            generationResponse = await Generation.handleCreateGenerationRequest(generationRequest);
        } catch (genError) {
            logger.warn("[DistillStudent] Generation trigger failed, but composition was successful.", genError);
            generationResponse = {
                success: false,
                error: genError.message,
                code: genError.code || "unknown",
                status: "composition_only"
            };
        }

        return {
            success: true,
            composed: {
                prompt: composedPrompt,
                negative_prompt: composedNegativePrompt,
                style_lock_notes: studentBundle.style_lock_notes,
                pack_name: studentBundle.pack_name
            },
            generation: generationResponse
        };

    } catch (error) {
        logger.error("[DistillStudent] Critical Error:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", error.message || "Failed to compose prompts.");
    }
}
