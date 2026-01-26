import "./firebaseInit.js"; // Ensure Firebase Admin is initialized

import { api } from "./api.js";
import { web, serveSitemap } from "./web.js";
import { urgentWorker, backgroundWorker, voiceWorker } from "./workers/queues.js";
import { onCall } from "firebase-functions/v2/https";
import { handleCreatePersona, handleChatPersona, handleGiftPersona, handleTriggerAction, handleVotePoll } from "./handlers/persona.js";

export const createPersona = onCall({
    timeoutSeconds: 300,
}, handleCreatePersona);

export const chatPersona = onCall({
    timeoutSeconds: 300,
}, handleChatPersona);

export const giftPersona = onCall({
    timeoutSeconds: 30,
}, handleGiftPersona);

export const triggerAction = onCall({
    timeoutSeconds: 30,
}, handleTriggerAction);

export const votePoll = onCall({
    timeoutSeconds: 30,
}, handleVotePoll);

// Export the main services
export {
    api,
    web,
    serveSitemap,
    urgentWorker,
    backgroundWorker,
    voiceWorker
};
