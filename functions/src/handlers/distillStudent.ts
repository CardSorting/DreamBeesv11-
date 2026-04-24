import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "../lib/utils.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as Generation from "./generation.js";
import { RequestWithAuth } from "../types/functions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handle Student Compose Request
 */
export async function handleStudentComposeRequest(request: RequestWithAuth<{ packId?: string, pack?: any, userRequest?: string, modelId?: string, aspectRatio?: string, steps?: number, cfg?: number, seed?: number, scheduler?: string, useTurbo?: boolean }>) {
    const { packId, pack, userRequest, modelId, aspectRatio, steps, cfg, seed, scheduler, useTurbo } = request.data;
    const uid = request.auth?.uid;

    logger.info(`[DistillStudent] User ${uid} requested prompt composition and generation. modelId=${modelId}`);

    try {
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

        const studentMdPath = path.resolve(__dirname, "../../distill-student.md");
        const studentContent = fs.readFileSync(studentMdPath, "utf8");

        const systemPrompt = studentContent.replace(/^SYSTEM PROMPT.*?\n/i, "").trim();

        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }]
            } as any
        });

        const modes = ["Stabilized", "Variant", "Strain", "Edge"];
        const selectedMode = modes[Math.floor(Math.random() * modes.length)];
        const variationSeed = seed || Math.floor(Math.random() * 1000000);

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

        const result = await model.generateContent(genRequest);
        const responseText = (await result.response).candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error("No response returned from Gemini");
        }

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

        const generationRequest: RequestWithAuth<any> = {
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
        } as any;

        logger.info(`[DistillStudent] Triggering generation with prompt: ${composedPrompt.substring(0, 50)}...`);
        let generationResponse = null;
        try {
            generationResponse = await Generation.handleCreateGenerationRequest(generationRequest);
        } catch (genError: any) {
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

    } catch (error: any) {
        logger.error("[DistillStudent] Critical Error:", error);
        if (error instanceof HttpsError) { throw error; }
        throw new HttpsError("internal", error.message || "Failed to compose prompts.");
    }
}
