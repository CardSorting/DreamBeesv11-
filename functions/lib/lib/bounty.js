import { db, FieldValue } from "../firebaseInit.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "./utils.js";
export class BountyService {
    /**
     * Unified executor for all reward-bearing actions.
     * Prevents double-claims and enforces rate limits.
     */
    static async execute(request) {
        const { uid, bountyId, type, rewardZaps = 0, rewardKarma = 0 } = request;
        return await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists)
                throw new HttpsError('not-found', 'User not found');
            const userData = userDoc.data();
            const claimedBounties = userData.claimedBounties || {};
            // 1. Idempotency Check
            if (claimedBounties[bountyId]) {
                return { success: true, alreadyClaimed: true };
            }
            // 2. Rate Limiting (for recurring types like social_share)
            if (type === 'social_share') {
                const now = Date.now();
                const lastClaim = userData.lastShareAt?.toMillis() || 0;
                if (now - lastClaim < 15 * 60 * 1000) {
                    throw new HttpsError('resource-exhausted', 'Rate limit exceeded for social sharing.');
                }
            }
            // 3. Update User Data
            const updateProps = {
                [`claimedBounties.${bountyId}`]: FieldValue.serverTimestamp()
            };
            if (rewardZaps > 0)
                updateProps.zaps = FieldValue.increment(rewardZaps);
            if (rewardKarma > 0)
                updateProps.karma = FieldValue.increment(rewardKarma);
            if (type === 'social_share') {
                updateProps.lastShareAt = FieldValue.serverTimestamp();
            }
            t.update(userRef, updateProps);
            logger.info(`[BountyService] Executed ${type} bounty for ${uid}: ${bountyId}`);
            return { success: true, rewardZaps, rewardKarma };
        });
    }
    /**
     * Executes multiple reward-bearing actions in a single transaction.
     */
    static async executeBatch(uid, requests) {
        if (requests.length === 0)
            return { success: true, count: 0 };
        return await db.runTransaction(async (t) => {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists)
                throw new HttpsError('not-found', 'User not found');
            const userData = userDoc.data();
            const claimedBounties = userData.claimedBounties || {};
            let totalZaps = 0;
            let totalKarma = 0;
            const results = [];
            const updateProps = {};
            for (const request of requests) {
                const { bountyId, type, rewardZaps = 0, rewardKarma = 0 } = request;
                // 1. Idempotency Check
                if (claimedBounties[bountyId] || updateProps[`claimedBounties.${bountyId}`]) {
                    results.push({ bountyId, success: true, alreadyClaimed: true });
                    continue;
                }
                // 2. Rate Limiting (for recurring types like social_share)
                if (type === 'social_share') {
                    const now = Date.now();
                    const lastClaim = userData.lastShareAt?.toMillis() || 0;
                    if (now - lastClaim < 15 * 60 * 1000) {
                        results.push({ bountyId, success: false, error: 'Rate limit exceeded' });
                        continue;
                    }
                    updateProps.lastShareAt = FieldValue.serverTimestamp();
                }
                // 3. Queue Updates
                updateProps[`claimedBounties.${bountyId}`] = FieldValue.serverTimestamp();
                if (rewardZaps > 0)
                    totalZaps += rewardZaps;
                if (rewardKarma > 0)
                    totalKarma += rewardKarma;
                results.push({ bountyId, success: true, rewardZaps, rewardKarma });
            }
            if (totalZaps > 0)
                updateProps.zaps = FieldValue.increment(totalZaps);
            if (totalKarma > 0)
                updateProps.karma = FieldValue.increment(totalKarma);
            if (Object.keys(updateProps).length > 0) {
                t.update(userRef, updateProps);
            }
            logger.info(`[BountyService] Executed batch of ${requests.length} bounties for ${uid}`);
            return { success: true, count: results.filter(r => r.success && !r.alreadyClaimed).length, results };
        });
    }
}
//# sourceMappingURL=bounty.js.map