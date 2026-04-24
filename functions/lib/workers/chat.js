import { db } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, AI_CODER_MODEL } from "../lib/constants.js";
/**
 * Worker to process asynchronous chat tasks
 */
export const processChatTask = async (req) => {
    const { requestId, userId, messages } = req.data;
    if (!requestId || !messages) {
        logger.error("[ChatWorker] Missing requestId or messages", { requestId });
        return;
    }
    const docRef = db.collection("chat_tasks").doc(requestId);
    try {
        await docRef.update({ status: "processing", startedAt: new Date() });
        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${AI_CODER_MODEL}`;
        const response = await fetch(cfUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Cloudflare API Failed (${response.status}): ${errText}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error("Cloudflare returned unsuccessful state");
        }
        await docRef.update({
            status: "completed",
            result: result.result,
            completedAt: new Date()
        });
        logger.info(`[ChatWorker] Successfully processed task: ${requestId}`);
    }
    catch (error) {
        logger.error(`[ChatWorker] Task ${requestId} failed: ${error.message}`, error);
        await docRef.update({
            status: "failed",
            error: error.message,
            failedAt: new Date()
        }).catch(() => { });
    }
};
//# sourceMappingURL=chat.js.map