import { getFirestore } from "firebase-admin/firestore";
import { logger } from "../utils.js";

const db = getFirestore();

/**
 * Fetches recent Global Lore (Shared Mythology).
 */
export const fetchLore = async (imageId) => {
    try {
        const snap = await db.collection('personas').doc(imageId).collection('lore')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        if (snap.empty) {return "";}

        const facts = snap.docs.map(d => d.data().fact);
        return `SHARED MYTHOLOGY (LORE):\n${facts.map(f => `- ${f}`).join('\n')}`;
    } catch (e) {
        logger.warn(`[Context] Failed to fetch lore`, e);
        return "";
    }
};

/**
 * Fetches server-side shared history (The Commons).
 */
export const fetchServerHistory = async (personaId) => {
    try {
        const historySnapshot = await db.collection('personas').doc(personaId).collection('shared_messages')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        const historyDocs = historySnapshot.docs.reverse(); // Chronological order

        return historyDocs.map(doc => {
            const data = doc.data();
            return {
                role: data.role === 'model' ? 'model' : 'user',
                text: data.text,
                displayName: data.displayName || 'Anonymous',
                uid: data.uid
            };
        });
    } catch (e) {
        logger.error(`[Context] Failed to fetch history for ${personaId}`, e);
        return [];
    }
};

/**
 * Fetches "Community Memory" (Top Supporters).
 * Returns a set of VIP UIDs and a context string.
 */
export const fetchSupporters = async (personaId) => {
    let context = "";
    const vipIds = new Set();
    try {
        const supportersSnap = await db.collection('personas').doc(personaId).collection('top_supporters')
            .orderBy('totalZaps', 'desc').limit(10).get();

        if (!supportersSnap.empty) {
            const lines = supportersSnap.docs.map(doc => {
                const s = doc.data();
                vipIds.add(doc.id);
                return `- ${s.displayName} (${s.totalZaps} Zaps)`;
            });
            context = `COMMUNITY LEGENDS (VIPs):\n${lines.join('\n')}\n(Recognize these people! They are the backbone of the stream.)`;
        }
    } catch (e) {
        logger.error("[Context] Supporter Fetch Error", e);
    }
    return { vipIds, context };
};

/**
 * Fetches "Deep Memory" (Specific facts about a user).
 */
export const fetchUserMemory = async (personaId, userId, userName) => {
    let context = "";
    try {
        const memoryDoc = await db.collection('personas').doc(personaId).collection('memories').doc(userId).get();
        if (memoryDoc.exists) {
            const facts = memoryDoc.data().facts || [];
            if (facts.length > 0) {
                context = `YOU KNOW ${userName || 'this user'}:\n- ${facts.join('\n- ')}\n(Use this to bond with them!)`;
            }
        }
    } catch (e) {
        logger.error("[Context] Memory Fetch Error", e);
    }
    return context;
};
