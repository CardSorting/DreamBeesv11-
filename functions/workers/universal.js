import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { processImageTask } from "./image.js";
import { processVideoTask } from "./video.js";
import { processDressUpTask } from "./dressUp.js";
import { processSlideshowTask } from "./slideshow.js";
import { processAnalysisTask, processEnhanceTask } from "./transformation.js";
import { processCleanupTasks } from "./cleanup.js";
import { logger } from "../lib/utils.js";

export const universalWorker = onTaskDispatched(
    {
        retryConfig: { maxAttempts: 3, minBackoffSeconds: 60 },
        rateLimits: { maxConcurrentDispatches: 10 },
        memory: "1GiB", // Universal worker needs enough memory for the heaviest task (slideshow used 1GB)
        timeoutSeconds: 540,
    },
    async (req) => {
        const { taskType, ...data } = req.data;
        // Reconstruct request object to match what individual workers expect
        // They expect `req.data` to contain the payload.
        // We pass the full `req` object, but modify `req.data` if needed, 
        // OR we just pass a mock request object.
        // The individual workers perform `const { ... } = req.data`.
        // So we can just pass `req` as is, provided `taskType` is ignored by them.

        logger.info(`Universal Worker received task: ${taskType}`, { requestId: data.requestId });

        switch (taskType) {
            case 'image':
                return processImageTask(req);
            case 'video':
                return processVideoTask(req);
            case 'dress-up':
                return processDressUpTask(req);
            case 'slideshow':
                return processSlideshowTask(req);
            case 'analysis':
                return processAnalysisTask(req);
            case 'enhance':
                return processEnhanceTask(req);
            case 'cleanup-resource':
                return processCleanupTasks(req);
            default:
                logger.error(`Unknown task type: ${taskType}`);
                throw new Error(`Unknown task type: ${taskType}`);
        }
    }
);
