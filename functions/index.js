import "./firebaseInit.js"; // Ensure Firebase Admin is initialized

import { api } from "./api.js";
import { web } from "./web.js";
import { urgentWorker, backgroundWorker, voiceWorker } from "./workers/queues.js";
import { staleJobCleanup } from "./workers/recovery.js";
import { walletGuard } from "./triggers/walletGuard.js";
// [REMOVED] import { onCall } from "firebase-functions/v2/https";
// Main API entry point handles all onCall persona actions

// Export the main services
export {
    api,
    web,
    urgentWorker,
    backgroundWorker,
    voiceWorker,

    staleJobCleanup,
    walletGuard
};
