export class OpenAiFormatter {
    /**
     * Format Cloudflare AI Result to OpenAI Chat Completion Format
     */
    static formatChatCompletion(result: any, usage?: { prompt_tokens: number, completion_tokens: number, total_tokens: number }, model: string = "glm-4.7-flash") {
        return {
            id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [
                {
                    index: 0,
                    message: {
                        role: "assistant",
                        content: result.response || result
                    },
                    finish_reason: "stop"
                }
            ],
            usage: usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            }
        };
    }

    /**
     * Format Async Task Creation to OpenAI-ish Response
     * (OpenAI doesn't have an async task standard, so we use a custom 'task' object)
     */
    static formatTaskResponse(taskId: string, model: string = "glm-4.7-flash") {
        return {
            id: taskId,
            object: "chat.task",
            created: Math.floor(Date.now() / 1000),
            model: model,
            status: "queued"
        };
    }
}
