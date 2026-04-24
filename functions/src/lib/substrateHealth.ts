import { db } from '../firebaseInit.js';
import { logger } from './utils.js';

/**
 * SubstrateHealth
 * 
 * Forensic circuit breaker for Zap providers.
 * High-velocity health tracking to prevent Zap leakage during outages.
 */
export class SubstrateHealth {
    private static ERROR_THRESHOLD = 5; // Fail fast after 5 consecutive errors
    private static WINDOW_MS = 5 * 60 * 1000; // 5 minute sliding window

    /**
     * Checks if a specific model provider is healthy.
     * Uses a lightweight metadata doc to avoid full collection scans.
     */
    static async isHealthy(modelId: string): Promise<boolean> {
        try {
            const doc = await db.collection('substrate_health').doc(modelId).get();
            if (!doc.exists) return true;

            const data = doc.data() as any;
            const now = Date.now();

            // If last error was too long ago, we're likely back in service
            if (data.lastErrorAt && (now - data.lastErrorAt.toMillis()) > this.WINDOW_MS) {
                return true;
            }

            if (data.consecutiveErrors >= this.ERROR_THRESHOLD) {
                logger.warn(`[SUBSTRATE][Health] Model ${modelId} is in circuit-break state.`);
                return false;
            }

            return true;
        } catch (e) {
            logger.error("Health Check Failed (Defaulting to Healthy)", e);
            return true;
        }
    }

    /**
     * Record a success for a model (Resets circuit breaker)
     */
    static async recordSuccess(modelId: string) {
        try {
            await db.collection('substrate_health').doc(modelId).set({
                consecutiveErrors: 0,
                lastSuccessAt: new Date(),
                status: 'operational'
            }, { merge: true });
        } catch (e) { /* silent fail for metrics */ }
    }

    /**
     * Record a failure for a model
     */
    static async recordFailure(modelId: string, error: string) {
        try {
            const ref = db.collection('substrate_health').doc(modelId);
            await db.runTransaction(async (t) => {
                const doc = await t.get(ref);
                const data = doc.data() as any || { consecutiveErrors: 0 };
                
                t.set(ref, {
                    consecutiveErrors: (data.consecutiveErrors || 0) + 1,
                    lastErrorAt: new Date(),
                    lastErrorMsg: error,
                    status: 'degraded'
                }, { merge: true });
            });
        } catch (e) { /* silent fail for metrics */ }
    }
}
