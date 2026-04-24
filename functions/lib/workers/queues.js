import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { processChatTask } from "./chat.js";
// --- SECURITY: Define allowed task types to prevent injection attacks ---
const SAFE_TASK_TYPES = [
    'image',
    'analysis',
    'enhance',
    'cleanup-resource',
    'showcase',
    'chat'
];
// ----------------------------------------------------------------------
import { processImageTask } from "./image.js";
import { processAnalysisTask, processEnhanceTask } from "./transformation.js";
import { processCleanupTasks } from "./cleanup.js";
import { processShowcaseTask } from "./showcase.js";
import { logger } from "../lib/utils.js";
/**
 * Shared Processor Logic
 */
const processTask = async (req, workerName) => {
    const { taskType, ...data } = req.data;
    const startTime = Date.now();
    logger.info(`[${workerName}] Start: ${taskType}`, { requestId: data.requestId || 'unknown' });
    try {
        let result;
        // --- SECURITY: Validate task type to prevent injection attacks ---
        if (!SAFE_TASK_TYPES.includes(taskType)) {
            logger.error(`[${workerName}] Unauthorized task type: ${taskType}`, { taskType, requestId: data.requestId });
            throw new Error(`Unauthorized task type: ${taskType}`);
        }
        // ---------------------------------------------------------------
        switch (taskType) {
            case 'image':
                result = await processImageTask(req);
                break;
            case 'analysis':
                result = await processAnalysisTask(req);
                break;
            case 'enhance':
                result = await processEnhanceTask(req);
                break;
            case 'cleanup-resource':
                result = await processCleanupTasks(req);
                break;
            case 'showcase':
                result = await processShowcaseTask(req);
                break;
            case 'chat':
                result = await processChatTask(req);
                break;
            default:
                throw new Error(`Unknown task type: ${taskType}`);
        }
        const duration = Date.now() - startTime;
        logger.info(`[${workerName}] Success: ${taskType} (${duration}ms)`, { requestId: data.requestId, duration });
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${workerName}] Failed: ${taskType} (${duration}ms)`, { requestId: data.requestId, duration, error: error.message });
        throw error;
    }
};
/**
 * Urgent Worker (High Priority)
 */
export const urgentWorker = onTaskDispatched({
    retryConfig: {
        maxAttempts: 3,
        minBackoffSeconds: 5,
        maxDoublings: 2
    },
    rateLimits: {
        maxConcurrentDispatches: 20,
        maxDispatchesPerSecond: 50
    },
    memory: "1GiB",
    timeoutSeconds: 540,
}, (req) => processTask(req, "UrgentWorker"));
/**
 * Background Worker (Low Priority)
 */
export const backgroundWorker = onTaskDispatched({
    retryConfig: {
        maxAttempts: 5,
        minBackoffSeconds: 30,
        maxDoublings: 4
    },
    rateLimits: {
        maxConcurrentDispatches: 2,
        maxDispatchesPerSecond: 2
    },
    memory: "1GiB",
    timeoutSeconds: 900,
}, (req) => processTask(req, "BackgroundWorker"));
//# sourceMappingURL=queues.js.map