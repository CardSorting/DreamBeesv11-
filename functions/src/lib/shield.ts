import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";

export class UserShieldService {
    /**
     * Monitors user activity for anomalies (e.g., massive EXP spikes).
     */
    static async auditExpGain(uid: string, expGained: number, currentExp: number): Promise<void> {
        // Thresholds
        const SUSPICIOUS_GAIN = 1000;
        const VELOCITY_THRESHOLD = 5000;
        const CRITICAL_VELOCITY = 20000;

        const now = Date.now();
        const windowKey = `velocity_${uid}_${Math.floor(now / (5 * 60 * 1000))}`;
        const shieldRef = db.collection('audit_shield').doc(windowKey);

        try {
            await db.runTransaction(async (t) => {
                const shieldSnap = await t.get(shieldRef);
                const shieldData = shieldSnap.data() as any;
                const windowTotal = (shieldData?.totalExp || 0) + expGained;

                const isCritical = windowTotal > CRITICAL_VELOCITY || expGained >= 5000;
                const userRef = db.collection('users').doc(uid);

                if (isCritical) {
                    logger.error(`[UserShield] CRITICAL ANOMALY: Blocking user ${uid}. Total Gain: ${windowTotal}`, new Error('CRITICAL_EXP_ANOMALY'));
                    t.update(userRef, {
                        isBlocked: true,
                        blockReason: 'CRITICAL_EXP_ANOMALY',
                        blockedAt: FieldValue.serverTimestamp()
                    });
                } else if (expGained > SUSPICIOUS_GAIN || windowTotal > VELOCITY_THRESHOLD) {
                    logger.warn(`[UserShield] Suspicious activity detected for ${uid}. Exp Gain: ${expGained}`, { windowTotal });

                    t.update(userRef, {
                        isFlagged: true,
                        flagReason: 'EXP_ANOMALY',
                        lastFlaggedAt: FieldValue.serverTimestamp()
                    });
                }

                if (isCritical || expGained > SUSPICIOUS_GAIN || windowTotal > VELOCITY_THRESHOLD) {
                    t.set(db.collection('audit_incidents').doc(), {
                        uid,
                        type: isCritical ? 'CRITICAL_EXP_ANOMALY' : 'EXP_ANOMALY',
                        expGained,
                        windowTotal,
                        createdAt: FieldValue.serverTimestamp()
                    });
                }

                t.set(shieldRef, {
                    totalExp: windowTotal,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
            });
        } catch (error) {
            logger.error(`[UserShield] Audit failed for ${uid}`, error);
        }
    }
}
