import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { processImageTask } from "./image.js";
import { processVideoTask } from "./video.js";
import { processDressUpTask } from "./dressUp.js";
import { processSlideshowTask } from "./slideshow.js";
import { processAnalysisTask, processEnhanceTask } from "./transformation.js";
import { processCleanupTasks } from "./cleanup.js";
import { processShowcaseTask } from "./showcase.js";
import { logger } from "../lib/utils.js";

// --- Shared Processor Logic ---
const processTask = async (req, workerName) => {
    // console.log(`[Diagnostic] ${workerName} Triggered. Task Details:`, JSON.stringify(req.data));
    const { taskType, ...data } = req.data;
    const startTime = Date.now();

    logger.info(`[${workerName}] Start: ${taskType}`, { requestId: data.requestId || 'unknown' });

    try {
        let result;
        switch (taskType) {
            case 'image':
                result = await processImageTask(req);
                break;
            case 'video':
                result = await processVideoTask(req);
                break;
            case 'dress-up':
                result = await processDressUpTask(req);
                break;
            case 'slideshow':
                result = await processSlideshowTask(req);
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
            default:
                throw new Error(`Unknown task type: ${taskType}`);
        }

        const duration = Date.now() - startTime;
        logger.info(`[${workerName}] Success: ${taskType} (${duration}ms)`, { requestId: data.requestId, duration });
        return result;

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${workerName}] Failed: ${taskType} (${duration}ms)`, { requestId: data.requestId, duration, error: error.message });
        throw error;
    }
};

// --- Urgent Worker (High Priority) ---
// For interactive User tasks: Image Generation, Video Generation
export const urgentWorker = onTaskDispatched(
    {
        retryConfig: {
            maxAttempts: 3,
            minBackoffSeconds: 5,
            maxDoublings: 2
        },
        rateLimits: {
            maxConcurrentDispatches: 20, // Higher concurrency for user tasks!
            maxDispatchesPerSecond: 50
        },
        memory: "1GiB",
        timeoutSeconds: 540,
    },
    (req) => processTask(req, "UrgentWorker")
);

// --- Background Worker (Low Priority) ---
// For batch tasks: Showcase Analysis, Cleanup, heavy storage ops
export const backgroundWorker = onTaskDispatched(
    {
        retryConfig: {
            maxAttempts: 5,
            minBackoffSeconds: 30, // Slower retry for background stuff
            maxDoublings: 4
        },
        rateLimits: {
            maxConcurrentDispatches: 2, // Keep it LOW to avoid starving DB/Quota
            maxDispatchesPerSecond: 2
        },
        memory: "1GiB",
        timeoutSeconds: 900, // Longer timeout for deep analysis
    },
    (req) => processTask(req, "BackgroundWorker")
);
