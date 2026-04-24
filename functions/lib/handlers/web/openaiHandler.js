import { validateApiKey } from "../../lib/apiKey.js";
import { WorkerAiService } from "../../lib/workerAi.js";
import { OpenAiFormatter } from "../../lib/openai.js";
import { logger } from "../../lib/utils.js";
import crypto from 'crypto';
/**
 * Handle OpenAI-compatible Chat Completions
 * POST /v1/chat/completions
 */
export const handleOpenAiChat = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: "Method not allowed", type: "invalid_request_error" } });
    }
    // 1. Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: { message: "Missing or invalid Authorization header", type: "invalid_request_error" } });
    }
    const apiKey = authHeader.split(' ')[1];
    const apiAuth = await validateApiKey(apiKey);
    if (!apiAuth) {
        return res.status(401).json({ error: { message: "Invalid API Key", type: "invalid_request_error" } });
    }
    // Check scope (OpenAI compat usually implies ai:chat)
    if (!apiAuth.scope.includes('ai:chat') && !apiAuth.scope.includes('default')) {
        return res.status(403).json({ error: { message: "API Key lacks required scope: ai:chat", type: "insufficient_scope" } });
    }
    // 2. Parse Request
    const { messages, model, stream } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: { message: "Messages must be an array", type: "invalid_request_error" } });
    }
    const uid = apiAuth.uid;
    // Generate a requestId for idempotency
    const requestId = crypto.createHash('md5')
        .update(JSON.stringify(messages) + uid + new Date().toISOString().slice(0, 13)) // Hourly idempotency
        .digest('hex');
    logger.info(`[OpenAIHandler] Request from user ${uid} via SDK`);
    try {
        // 3. Deduct Zaps
        await WorkerAiService.deductUsage(uid, 'WORKER_AI_CHAT', `wai-openai-${requestId}`);
        // 4. Execute (Sync by default for OpenAI SDK)
        // Note: WorkerAiService.chatCompletion now handles ensureSystemPrompt
        const result = await WorkerAiService.chatCompletion(messages);
        // 5. Format & Respond
        const formatted = OpenAiFormatter.formatChatCompletion(result, model || "glm-4.7-flash");
        return res.json(formatted);
    }
    catch (error) {
        logger.error(`[OpenAIHandler] Error`, error);
        // Handle Insufficient Funds specifically for OpenAI SDK
        if (error.code === 'resource-exhausted' || error.message?.includes('Insufficient zaps')) {
            return res.status(402).json({
                error: {
                    message: "Insufficient Zaps. Please recharge your account.",
                    type: "insufficient_credits"
                }
            });
        }
        return res.status(500).json({
            error: {
                message: error.message || "Internal WorkerAI error",
                type: "api_error"
            }
        });
    }
};
//# sourceMappingURL=openaiHandler.js.map