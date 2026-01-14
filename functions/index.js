
import "./firebaseInit.js"; // Ensure Firebase Admin is initialized

import { api, stripeWebhook, serveSitemap } from "./api.js";
import { workers } from "./workers/index.js";
import { triggers } from "./triggers.js";
import { createImagePersona, chatWithPersona } from "./persona.js";

// Export the grouped functions
export {
    api,
    stripeWebhook,
    serveSitemap,
    workers,
    triggers,
    createImagePersona,
    chatWithPersona
};
