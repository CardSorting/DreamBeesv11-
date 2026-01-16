
import "./firebaseInit.js"; // Ensure Firebase Admin is initialized

import { api } from "./api.js";
import { web } from "./web.js";
// Export the main services
export {
    api,
    web,
    urgentWorker,
    backgroundWorker,
};

