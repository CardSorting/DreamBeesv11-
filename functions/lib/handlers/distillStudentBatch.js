import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "../lib/utils.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as Generation from "./generation.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Handle Student Batch Compose Request
 */
export async function handleStudentBatchComposeRequest(request) {
    const { packId, pack, userRequest, batchCount = 10, modelId, aspectRatio, steps, cfg, seed, scheduler, useTurbo, triggerGeneration = false } = request.data;
    const uid = request.auth?.uid;
    logger.info(`[StudentBatch] User ${uid} requested batch composition. count=${batchCount}, modelId=${modelId}, triggerGeneration=${triggerGeneration}`);
    try {
        let aestheticPack = pack;
        if (packId) {
            const packPath = path.resolve(__dirname, "../packs", `${packId.replace(/\.json$/, "")}.json`);
            if (fs.existsSync(packPath)) {
                aestheticPack = JSON.parse(fs.readFileSync(packPath, "utf8"));
            }
            else {
                throw new HttpsError("not-found", `Aesthetic pack '${packId}' not found.`);
            }
        }
        if (!aestheticPack) {
            throw new HttpsError("invalid-argument", "Missing Aesthetic Pack. Provide either 'packId' or 'pack' object.");
        }
        const studentBatchMdPath = path.resolve(__dirname, "../../distill-student-batch.md");
        const studentContent = fs.readFileSync(studentBatchMdPath, "utf8");
        const systemPrompt = studentContent.replace(/^SYSTEM PROMPT.*?\n/i, "").trim();
        const { VertexAI } = await import("@google-cloud/vertexai");
        const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }]
            }
        });
        const userPrompt = `
AESTHETIC PACK:
${JSON.stringify(aestheticPack, null, 2)}

BATCH_COUNT: ${batchCount}

USER REQUEST:
${userRequest || "Generate a high-fidelity batch of instances for this aesthetic."}
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
        const resultJson = JSON.parse(responseText);
        const batch = resultJson.batch || [];
        if (batch.length === 0) {
            throw new Error("Gemini returned an empty batch.");
        }
        const promptPacksDir = path.resolve(__dirname, "../prompt_packs");
        if (!fs.existsSync(promptPacksDir)) {
            fs.mkdirSync(promptPacksDir, { recursive: true });
        }
        const sanitizedPackName = (resultJson.pack_name || "unknown_pack").toLowerCase().replace(/[^a-z0-9]/g, "_");
        const promptPackFilename = `${sanitizedPackName}_batch_${Date.now()}.json`;
        const promptPackPath = path.join(promptPacksDir, promptPackFilename);
        try {
            fs.writeFileSync(promptPackPath, JSON.stringify(resultJson, null, 2));
            logger.info(`[StudentBatch] Prompt batch saved to ${promptPackPath}`);
        }
        catch (saveError) {
            logger.error(`[StudentBatch] Failed to save prompt batch:`, saveError);
        }
        if (!triggerGeneration) {
            return {
                success: true,
                pack_name: resultJson.pack_name,
                batch: batch.map((b) => ({
                    prompt: b.prompt,
                    negative_prompt: b.negative_prompt,
                    style_lock_notes: b.style_lock_notes,
                    internal_mode: b.internal_mode
                }))
            };
        }
        logger.info(`[StudentBatch] Triggering ${batch.length} generations...`);
        const generationPromises = batch.map(async (bundle) => {
            const generationRequest = {
                data: {
                    prompt: bundle.prompt,
                    negative_prompt: bundle.negative_prompt,
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
            try {
                const response = await Generation.handleCreateGenerationRequest(generationRequest);
                return {
                    success: true,
                    prompt: bundle.prompt,
                    generation: response
                };
            }
            catch (err) {
                logger.warn(`[StudentBatch] Single generation failed`, err);
                return {
                    success: false,
                    prompt: bundle.prompt,
                    error: err.message
                };
            }
        });
        const generationResults = await Promise.all(generationPromises);
        return {
            success: true,
            pack_name: resultJson.pack_name,
            batch_count: batch.length,
            results: generationResults
        };
    }
    catch (error) {
        logger.error("[StudentBatch] Critical Error:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", error.message || "Failed to compose batch prompts.");
    }
}
//# sourceMappingURL=distillStudentBatch.js.map