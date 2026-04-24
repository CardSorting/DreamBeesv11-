import { db, FieldValue } from "../firebaseInit.js";
/**
 * ReputationService
 *
 * Handles all logic for user reputation, trust tiers, and moderation power.
 * Isolated from the Zap/Billing system.
 */
export class ReputationService {
    /**
     * Moderation Tiers based on reputation score
     */
    static TIERS = {
        GOLD: { min: 200, label: 'Gold', color: '#fbbf24' },
        SILVER: { min: 50, label: 'Silver', color: '#94a3b8' },
        BRONZE: { min: 0, label: 'Bronze', color: '#78350f' }
    };
    /**
     * Calculates the trust tier for a given reputation score
     */
    static getTrustLevel(reputation) {
        if (reputation >= this.TIERS.GOLD.min)
            return this.TIERS.GOLD;
        if (reputation >= this.TIERS.SILVER.min)
            return this.TIERS.SILVER;
        return this.TIERS.BRONZE;
    }
    /**
     * Calculates mathematical vote power based on reputation
     */
    static calculateVotePower(reputation, confidence = 1) {
        const basePower = 1 + Math.floor(Math.sqrt(Math.max(0, reputation)) / 2);
        const confidenceMultiplier = 1 + (Math.min(3, Math.max(1, confidence)) - 1) * 0.25;
        return Math.round(basePower * confidenceMultiplier);
    }
    /**
     * Awards reputation for quality moderation actions
     */
    static async awardModerationReputation(uid, quantity) {
        if (quantity === 0)
            return;
        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            reputation: FieldValue.increment(quantity),
            totalReviews: FieldValue.increment(1),
            lastReputationAwardAt: FieldValue.serverTimestamp()
        });
        return quantity;
    }
    /**
     * Deducts reputation for poor quality actions (if needed)
     */
    static async deductReputation(uid, quantity) {
        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            reputation: FieldValue.increment(-Math.abs(quantity))
        });
    }
}
//# sourceMappingURL=reputation.js.map