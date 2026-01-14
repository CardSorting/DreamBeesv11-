
import "./firebaseInit.js"; // Ensure Firebase Admin is initialized

import { api, stripeWebhook, serveSitemap } from "./api.js";
import { workers } from "./workers.js";
import { triggers } from "./triggers.js";

// Export the grouped functions
export {
    api,
    stripeWebhook,
    serveSitemap,
    workers,
    triggers
};
