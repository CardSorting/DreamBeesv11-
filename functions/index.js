
import "./firebaseInit.js"; // Ensure Firebase Admin is initialized

import { api } from "./api.js";
import { web } from "./web.js";
import { universalWorker } from "./workers/universal.js";

// Export the 3 main services
export {
    api,
    web,
    universalWorker,
};

