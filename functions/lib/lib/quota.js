import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";
/**
 * Checks if a user has exceeded their quota for a specific action.
 */
export const checkQuota = async (userId, actionType) => {
    if (!userId) {
        return { allowed: false, reason: "No ID provided" };
    }
    const limits = {
        'agent_reply': { max: 60, window: '1m' },
        'image_gen': { max: 5, window: '1m' },
        'tts': { max: 30, window: '1m' }
    };
    const limit = limits[actionType];
    if (!limit) {
        return { allowed: true };
    }
    const now = Date.now();
    const windowKey = Math.floor(now / 60000);
    const quotaRef = db.collection('quotas').doc(`${userId}_${actionType}_${windowKey}`);
    try {
        const doc = await quotaRef.get();
        let currentCount = 0;
        if (doc.exists) {
            currentCount = doc.data().count || 0;
        }
        if (currentCount >= limit.max) {
            logger.warn(`[Quota] Exceeded for ${userId} on ${actionType}. Count: ${currentCount}`);
            return { allowed: false, reason: `Rate limit exceeded. Max ${limit.max}/minute.` };
        }
        await quotaRef.set({
            count: FieldValue.increment(1),
            expireAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return { allowed: true };
    }
    catch (e) {
        logger.error("[Quota] Check Failed", e);
        return { allowed: true };
    }
};
//# sourceMappingURL=quota.js.map