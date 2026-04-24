import { db, FieldValue } from "../../firebaseInit.js";
import { logger } from "../utils.js";
/**
 * Saves a message to the shared history (The Commons).
 */
export const saveMessage = async (personaId, messageData) => {
    try {
        const docRef = await db.collection('personas').doc(personaId).collection('shared_messages').add({
            ...messageData,
            timestamp: FieldValue.serverTimestamp()
        });
        return docRef;
    }
    catch (e) {
        logger.error(`[Store] Failed to save message for ${personaId}`, e);
        throw e;
    }
};
/**
 * Updates the persona's volatile state (pose, background, vibe, hype, title, poll).
 */
export const updatePersonaState = async (personaId, updates) => {
    try {
        await db.collection('personas').doc(personaId).update(updates);
    }
    catch (e) {
        logger.warn(`[Store] Failed to update persona state for ${personaId}`, e);
    }
};
/**
 * Saves a fact to the User's "Deep Memory" dossier.
 */
export const saveUserMemory = async (personaId, userId, fact) => {
    try {
        await db.collection('personas').doc(personaId).collection('memories').doc(userId).set({
            facts: FieldValue.arrayUnion(fact),
            lastUpdated: FieldValue.serverTimestamp()
        }, { merge: true });
        logger.info(`[Store] Memorized fact for user ${userId}`);
    }
    catch (e) {
        logger.error(`[Store] Failed to save user memory`, e);
    }
};
/**
 * Logs the interaction for analytics/debugging.
 */
export const logInteraction = async (data) => {
    try {
        await db.collection('persona_chat_logs').add({
            ...data,
            timestamp: FieldValue.serverTimestamp()
        });
    }
    catch (e) {
        logger.error(`[Store] Failed to log interaction`, e);
    }
};
/**
 * Saves a Global Lore fact (Shared Mythology).
 */
export const saveLore = async (personaId, fact) => {
    try {
        await db.collection('personas').doc(personaId).collection('lore').add({
            fact,
            timestamp: FieldValue.serverTimestamp()
        });
        logger.info(`[Store] Canonized Lore for ${personaId}: ${fact}`);
    }
    catch (e) {
        logger.error(`[Store] Failed to save lore`, e);
    }
};
//# sourceMappingURL=store.js.map