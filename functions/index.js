import "./firebaseInit.js"; // Ensure Firebase Admin is initialized

import { api } from "./api.js";
import { web, serveSitemap } from "./web.js";
import { urgentWorker, backgroundWorker, voiceWorker } from "./workers/queues.js";
import { onCall } from "firebase-functions/v2/https";
// Main API entry point handles all onCall persona actions

// Export the main services
export {
    api,
    web,
    serveSitemap,
    urgentWorker,
    backgroundWorker,
    voiceWorker
};
