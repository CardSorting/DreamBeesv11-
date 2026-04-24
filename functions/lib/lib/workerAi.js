import { db, getFunctions } from "../firebaseInit.js";
import { logger, fetchWithTimeout } from "./utils.js";
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, AI_CODER_MODEL } from "./constants.js";
import { CostManager } from "./costs.js";
import { Wallet } from "./wallet.js";
const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant focused on providing accurate and concise answers.";
export class WorkerAiService {
    static getCFUrl(model) {
        const m = model || AI_CODER_MODEL;
        return `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${m}`;
    }
    /**
     * Prepend default system prompt if not present
     */
    static ensureSystemPrompt(messages) {
        const hasSystem = messages.some(m => m.role === 'system');
        if (hasSystem)
            return messages;
        return [
            { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
            ...messages
        ];
    }
    /**
     * Deduct Zaps based on usage
     */
    static async deductUsage(uid, action, requestId, tokens = 0) {
        try {
            const baseCost = await CostManager.get(action);
            const tokenRate = await CostManager.get('WORKER_AI_TOKEN_RATE');
            const usageCost = (tokens / 1000) * tokenRate;
            const totalCost = baseCost + usageCost;
            if (totalCost > 0) {
                logger.info(`[WorkerAiService] Deducting ${totalCost.toFixed(4)} Zaps from ${uid} (Action: ${action}, Base: ${baseCost}, Tokens: ${tokens})`);
                await Wallet.debit(uid, totalCost, requestId, {
                    action,
                    service: 'worker_ai',
                    tokens,
                    tokenRate,
                    baseCost
                });
            }
        }
        catch (e) {
            logger.error(`[WorkerAiService] Usage deduction failed`, e);
        }
    }
    /**
     * Precision token estimation using js-tiktoken (GPT-4o/o1 encoder)
     */
    static async estimateTokensAsync(text) {
        if (!text)
            return 0;
        try {
            // Lazy load for ESM compatibility and cold start efficiency
            const { getEncoding } = await import("js-tiktoken");
            const encoder = getEncoding("o200k_base");
            return encoder.encode(text).length;
        }
        catch (e) {
            return Math.ceil(text.length / 3.8);
        }
    }
    /**
     * Synchronous fallback for legacy paths
     */
    static estimateTokens(text) {
        return Math.ceil(text.length / 3.8);
    }
    /**
     * Synchronous Chat Completion (WorkerAI API)
     */
    static async chatCompletion(messages, options = {}) {
        const { tools, ...fetchOptions } = options;
        const currentMessages = this.ensureSystemPrompt(messages);
        const executeRequest = async (retryCount = 0) => {
            try {
                const url = this.getCFUrl(options.model);
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        // Strip internal attachmentUrl before sending to standard CF models
                        messages: currentMessages.map(({ attachmentUrl, ...rest }) => rest),
                        ...(tools ? { tools } : {}),
                        ...fetchOptions
                    })
                });
                if (!response.ok) {
                    const errText = await response.text();
                    if (response.status >= 500 && retryCount < 3) {
                        const delay = Math.pow(2, retryCount) * 1000;
                        logger.warn(`[WorkerAiService] Retrying fetch (${retryCount + 1}) after ${delay}ms...`);
                        await new Promise(r => setTimeout(r, delay));
                        return executeRequest(retryCount + 1);
                    }
                    throw new Error(`Cloudflare API Failed: ${response.status} - ${errText}`);
                }
                const result = await response.json();
                if (!result.success)
                    throw new Error('Cloudflare returned unsuccessful state');
                // Extract or estimate usage
                const prompt_tokens = result.usage?.prompt_tokens || await this.estimateTokensAsync(JSON.stringify(currentMessages));
                const completion_tokens = result.usage?.completion_tokens || await this.estimateTokensAsync(result.result?.response || "");
                return {
                    result: result.result,
                    usage: {
                        prompt_tokens,
                        completion_tokens,
                        total_tokens: prompt_tokens + completion_tokens
                    }
                };
            }
            catch (error) {
                if (retryCount < 3) {
                    const delay = Math.pow(2, retryCount) * 1000;
                    return new Promise(resolve => setTimeout(() => resolve(executeRequest(retryCount + 1)), delay));
                }
                logger.error(`[WorkerAiService] chatCompletion final error`, error);
                throw error;
            }
        };
        return executeRequest();
    }
    /**
     * Stream Chat Completion
     * Supports intelligent routing: Gemini natively for multimodal streams, or Cloudflare Workers AI for standard text logic.
     */
    static async streamChatCompletion(messages, onChunk, options = {}) {
        const { tools, ...fetchOptions } = options;
        const currentMessages = this.ensureSystemPrompt(messages);
        const targetModel = options.model || AI_CODER_MODEL;
        // Route to Google Vertex AI if it's a Gemini model
        if (targetModel.startsWith('gemini-')) {
            logger.info(`[WorkerAiService] Routing stream to Vertex AI (${targetModel})`);
            // Lazy load Vertex to keep boot times fast for CF requests
            const { VertexAI } = await import("@google-cloud/vertexai");
            const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
            // Convert CF style models (gemini-3.1-pro-preview) to vertex ones if they don't exactly match
            const actualModel = targetModel === 'gemini-3.1-pro-preview' ? 'gemini-1.5-pro' : targetModel;
            const model = vertexAI.getGenerativeModel({ model: actualModel });
            const vertexContents = [];
            let systemInstructionText = "";
            for (const msg of currentMessages) {
                if (msg.role === 'system') {
                    systemInstructionText += msg.content + "\\n";
                    continue;
                }
                const parts = [];
                if (msg.content)
                    parts.push({ text: msg.content });
                // Vision / Multimodal Attachment Resolution
                if (msg.attachmentUrl) {
                    try {
                        logger.info(`[WorkerAiService] Fetching media attachment: ${msg.attachmentUrl}`);
                        const imgRes = await fetchWithTimeout(msg.attachmentUrl);
                        const arrayBuffer = await imgRes.arrayBuffer();
                        const imageBase64 = Buffer.from(arrayBuffer).toString('base64');
                        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                        parts.push({
                            inlineData: {
                                mimeType: contentType,
                                data: imageBase64
                            }
                        });
                    }
                    catch (e) {
                        logger.error("[WorkerAiService] Failed to resolve media attachment for Vertex stream", e);
                        parts.push({ text: "\\n[System: Attached media failed to load.]" });
                    }
                }
                vertexContents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts
                });
            }
            const reqOpts = { contents: vertexContents };
            // Provide system instruction if present
            if (systemInstructionText) {
                reqOpts.systemInstruction = {
                    role: 'system',
                    parts: [{ text: systemInstructionText }]
                };
            }
            const streamingResp = await model.generateContentStream(reqOpts);
            let assistantContent = "";
            for await (const chunk of streamingResp.stream) {
                const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunkText) {
                    assistantContent += chunkText;
                    onChunk(chunkText);
                }
            }
            return {
                role: "assistant",
                content: assistantContent
            };
        }
        // Default Route: Cloudflare Workers AI
        logger.info(`[WorkerAiService] Streaming chat request via Cloudflare (${targetModel})`);
        const url = this.getCFUrl(targetModel);
        // Strip internal attachmentUrl properties before sending to Cloudflare
        const safeMessages = currentMessages.map(({ attachmentUrl, ...rest }) => rest);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: safeMessages,
                stream: true,
                ...(tools ? { tools } : {}),
                ...fetchOptions
            })
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Cloudflare Stream Failed: ${response.status} - ${err}`);
        }
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader)
            throw new Error("No response body");
        let accumulatedToolCalls = [];
        let assistantContent = "";
        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === "[DONE]")
                        continue;
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.response) {
                            assistantContent += parsed.response;
                            onChunk(parsed.response);
                        }
                        if (parsed.tool_calls) {
                            for (const tc of parsed.tool_calls) {
                                const existing = accumulatedToolCalls.find(e => e.index === tc.index);
                                if (existing) {
                                    if (tc.name)
                                        existing.name = (existing.name || "") + tc.name;
                                    if (tc.arguments)
                                        existing.arguments = (existing.arguments || "") + tc.arguments;
                                }
                                else {
                                    accumulatedToolCalls.push(tc);
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Normally shouldn't happen with full line buffering unless JSON is actually malformed by API
                    }
                }
            }
        }
        // Parse accumulated tool call arguments if they are strings
        accumulatedToolCalls = accumulatedToolCalls.map(tc => {
            if (typeof tc.arguments === 'string') {
                try {
                    tc.arguments = JSON.parse(tc.arguments);
                }
                catch { /* ignore if partial or malformed */ }
            }
            return tc;
        });
        return {
            role: "assistant",
            content: assistantContent,
            tool_calls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined
        };
    }
    /**
     * Create Asynchronous Cloud Task
     */
    static async createAsyncTask(userId, messages) {
        logger.info(`[WorkerAiService] Creating async task for ${userId}`);
        const finalMessages = this.ensureSystemPrompt(messages);
        const taskRef = db.collection("chat_tasks").doc();
        const taskId = taskRef.id;
        await taskRef.set({
            userId,
            messages: finalMessages,
            status: 'queued',
            createdAt: new Date(),
            type: 'worker_ai'
        });
        const queue = getFunctions().taskQueue("locations/us-central1/functions/urgentWorker");
        await queue.enqueue({
            taskType: 'chat',
            requestId: taskId,
            userId,
            messages: finalMessages
        });
        return { taskId };
    }
    /**
     * Retrieve Task Status/Result
     */
    static async getTask(taskId) {
        const doc = await db.collection("chat_tasks").doc(taskId).get();
        if (!doc.exists)
            return null;
        return { id: doc.id, ...doc.data() };
    }
}
//# sourceMappingURL=workerAi.js.map