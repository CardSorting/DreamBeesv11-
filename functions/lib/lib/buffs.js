import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";
export class BuffService {
    /**
     * Applies a temporary buff to a user.
     */
    static async applyBuff(uid, type, durationMs, multiplier) {
        const userRef = db.collection('users').doc(uid);
        const expiresAt = new Date(Date.now() + durationMs);
        try {
            await userRef.update({
                [`activeBuffs.${type}`]: {
                    type,
                    multiplier,
                    expiresAt: FieldValue.serverTimestamp() // We'll use a real timestamp in the update
                }
            });
            // Re-update with the actual timestamp for precision
            await userRef.update({
                [`activeBuffs.${type}.expiresAt`]: expiresAt
            });
            logger.info(`[BuffService] Applied ${type} (${multiplier}x) to ${uid} for ${durationMs}ms`);
        }
        catch (error) {
            logger.error(`[BuffService] Failed to apply buff ${type} to ${uid}`, error);
        }
    }
    /**
     * Calculates the cumulative buff multiplier for a user.
     */
    static getActiveMultiplier(userData, type) {
        if (!userData?.activeBuffs)
            return 1.0;
        const now = Date.now();
        let totalMultiplier = 1.0;
        for (const key in userData.activeBuffs) {
            const buff = userData.activeBuffs[key];
            if (buff.expiresAt.toMillis() > now) {
                // Currently all buffs are EXP buffs in this phase
                if (type === 'exp') {
                    totalMultiplier *= buff.multiplier;
                }
            }
        }
        return totalMultiplier;
    }
}
//# sourceMappingURL=buffs.js.map