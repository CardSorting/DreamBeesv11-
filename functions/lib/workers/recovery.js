import { onSchedule } from "firebase-functions/v2/scheduler";
import { db, FieldValue } from "../firebaseInit.js";
import { logger, retryOperation } from "../lib/utils.js";
import { Wallet } from "../lib/wallet.js";
/**
 * Scheduled function to clean up stale jobs.
 * Runs every 10 minutes.
 */
export const staleJobCleanup = onSchedule("every 10 minutes", async (_event) => {
    logger.info("Starting scheduled stale job cleanup");
    const staleThreshold = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
    const collections = [
        "generation_queue",
        "analysis_queue",
        "enhance_queue"
    ];
    for (const collectionName of collections) {
        try {
            const staleJobs = await db.collection(collectionName)
                .where("status", "in", ["queued", "processing"])
                .where("createdAt", "<=", staleThreshold)
                .limit(50)
                .get();
            if (staleJobs.empty) {
                continue;
            }
            logger.info(`Found ${staleJobs.size} stale jobs in ${collectionName}`);
            const batch = db.batch();
            const refundPromises = [];
            for (const doc of staleJobs.docs) {
                const data = doc.data();
                const requestId = doc.id;
                const userId = data.userId;
                logger.warn(`Cleaning up stale job ${requestId} in ${collectionName}`, { userId, status: data.status });
                batch.update(doc.ref, {
                    status: "failed",
                    error: "Task timed out or worker hung (Automated Recovery)",
                    failedAt: FieldValue.serverTimestamp()
                });
                if (userId && !userId.startsWith('anonymous')) {
                    const cost = data.cost || 0;
                    if (cost > 0) {
                        refundPromises.push(retryOperation(async () => {
                            await Wallet.credit(userId, cost, `refund_stale_${requestId}`, {
                                type: 'refund_stale_job',
                                originalRequestId: requestId,
                                collection: collectionName,
                                reason: 'stale_job_recovery'
                            }, 'zaps');
                        }, { context: `Refund stale job ${requestId}` }));
                    }
                    else if (collectionName === 'generation_queue') {
                        const fallbackCost = 1.0;
                        refundPromises.push(retryOperation(async () => {
                            await Wallet.credit(userId, fallbackCost, `refund_stale_fallback_${requestId}`, {
                                type: 'refund_stale_job_fallback',
                                originalRequestId: requestId,
                                reason: 'stale_job_recovery_fallback'
                            });
                        }, { context: `Refund fallback for ${requestId}` }));
                    }
                }
            }
            await batch.commit();
            if (refundPromises.length > 0) {
                const results = await Promise.allSettled(refundPromises);
                const failures = results.filter((r) => r.status === 'rejected');
                if (failures.length > 0) {
                    logger.error(`Failed to refund ${failures.length} stale jobs`, failures[0].reason);
                }
            }
            logger.info(`Successfully processed ${staleJobs.size} stale jobs in ${collectionName}`);
        }
        catch (error) {
            logger.error(`Error during stale job cleanup for ${collectionName}`, error);
        }
    }
});
//# sourceMappingURL=recovery.js.map