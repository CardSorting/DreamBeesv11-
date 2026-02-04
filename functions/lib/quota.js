
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "./utils.js";

const db = getFirestore();

/**
 * Checks if a user has exceeded their quota for a specific action.
 * @param {string} userId - The user ID (or Agent ID).
 * @param {'agent_reply'|'image_gen'|'tts'} actionType 
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
export const checkQuota = async (userId, actionType) => {
    if (!userId) { return { allowed: false, reason: "No ID provided" }; }

    const limits = {
        'agent_reply': { max: 60, window: '1m' }, // 60 per minute
        'image_gen': { max: 5, window: '1m' },    // 5 per minute
        'tts': { max: 30, window: '1m' }          // 30 per minute
    };

    const limit = limits[actionType];
    if (!limit) { return { allowed: true }; } // Unknown action, allow

    const now = Date.now();
    const windowKey = Math.floor(now / 60000); // Minute bucket
    const quotaRef = db.collection('quotas').doc(`${userId}_${actionType}_${windowKey}`);

    try {
        // Atomic Increment
        // We use a simplified approach: just increment and check content.
        // For high scale, we'd use distributed counters, but this is fine for per-user limits.
        const doc = await quotaRef.get();
        let currentCount = 0;

        if (doc.exists) {
            currentCount = doc.data().count || 0;
        }

        if (currentCount >= limit.max) {
            logger.warn(`[Quota] Exceeded for ${userId} on ${actionType}. Count: ${currentCount}`);
            return { allowed: false, reason: `Rate limit exceeded. Max ${limit.max}/minute.` };
        }

        // Increment (Fire and forget-ish, or await if strict)
        // We use set with merge for creating implicitly
        await quotaRef.set({
            count: FieldValue.increment(1),
            expireAt: FieldValue.serverTimestamp() // Could use TTL policy in Firestore
        }, { merge: true });

        return { allowed: true };

    } catch (e) {
        logger.error("[Quota] Check Failed", e);
        // Fail Open to prevent blocking users on db error
        return { allowed: true };
    }
};
