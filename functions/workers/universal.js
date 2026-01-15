import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { processImageTask } from "./image.js";
import { processVideoTask } from "./video.js";
import { processDressUpTask } from "./dressUp.js";
import { processSlideshowTask } from "./slideshow.js";
import { processAnalysisTask, processEnhanceTask } from "./transformation.js";
import { processCleanupTasks } from "./cleanup.js";
import { processShowcaseTask } from "./showcase.js";
import { logger } from "../lib/utils.js";

export const universalWorker = onTaskDispatched(
    {
        retryConfig: {
            maxAttempts: 5,        // Increased for better resilience
            minBackoffSeconds: 10, // Faster recovery from transient errors
            maxDoublings: 4
        },
        rateLimits: {
            maxConcurrentDispatches: 4, // Keeps memory/quota usage stable
            maxDispatchesPerSecond: 10  // Smooths out the arrival rate
        },
        memory: "1GiB",
        timeoutSeconds: 540,
    },
    async (req) => {
        const { taskType, ...data } = req.data;
        const startTime = Date.now();

        logger.info(`[Universal] Start: ${taskType}`, { requestId: data.requestId || 'unknown' });

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
            logger.info(`[Universal] Success: ${taskType} (${duration}ms)`, { requestId: data.requestId, duration });
            return result;

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`[Universal] Failed: ${taskType} (${duration}ms)`, { requestId: data.requestId, duration, error: error.message });
            throw error; // Propagate error for Cloud Task retry
        }
    }
);
