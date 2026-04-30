import "./firebaseInit.js"; // Ensure Firebase Admin is initialized

import { api } from "./api.js";
import { web } from "./web.js";
import { admin_diag } from "./admin_diag.js";
import { urgentWorker, backgroundWorker } from "./workers/queues.js";
import { staleJobCleanup } from "./workers/recovery.js";
import { walletGuard } from "./triggers/walletGuard.js";
// Export the main services
export {
    api,
    web,
    admin_diag,
    urgentWorker,
    backgroundWorker,
    staleJobCleanup,
    walletGuard
};
