import { processImageTask } from "./image.js";
import { processVideoTask } from "./video.js";
import { processDressUpTask } from "./dressUp.js";
import { processSlideshowTask } from "./slideshow.js";
import { processShowcaseTask } from "./showcase.js";

export const workers = {
    processImageTask,
    processVideoTask,
    processDressUpTask,
    processSlideshowTask,
    processShowcaseTask
};
