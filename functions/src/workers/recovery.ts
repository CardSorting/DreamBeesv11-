import { onSchedule } from "firebase-functions/v2/scheduler";
import { db, FieldValue, getFunctions } from "../firebaseInit.js";
import { logger, retryOperation } from "../lib/utils.js";
import { Wallet } from "../lib/wallet.js";

/**
 * Scheduled function to clean up stale jobs and RESUSCITATE stuck jobs.
 * Runs every 5 minutes for high-velocity health.
 */
export const staleJobCleanup = onSchedule("every 5 minutes", async (_event) => {
    logger.info("Starting scheduled stale job and resuscitation cleanup");

    const staleThreshold = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
    const resuscitationThreshold = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago
    const collections = [
        "generation_queue",
        "analysis_queue",
        "enhance_queue"
    ];

    for (const collectionName of collections) {
        try {
            // 1. STALE CLEANUP (Hard failure & Refund)
            const staleJobs = await db.collection(collectionName)
                .where("status", "in", ["queued", "processing"])
                .where("createdAt", "<=", staleThreshold)
                .limit(50)
                .get();

            // 2. RESUSCITATION (Re-enqueue stuck 'queued' jobs)
            // Only for generation_queue currently to prevent double-transforms
            const resuscitateJobs = collectionName === 'generation_queue' 
                ? await db.collection(collectionName)
                    .where("status", "==", "queued")
                    .where("createdAt", "<=", resuscitationThreshold)
                    .where("createdAt", ">", staleThreshold)
                    .limit(50)
                    .get()
                : { empty: true, docs: [] as any[] };

            if (staleJobs.empty) {
                continue;
            }

            logger.info(`Found ${staleJobs.size} stale jobs in ${collectionName}`);

            const batch = db.batch();
            const refundPromises: Promise<any>[] = [];

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
                        refundPromises.push(
                            retryOperation(async () => {
                                await Wallet.credit(userId, cost, `refund_stale_${requestId}`, {
                                    auditType: 'stale_recovery_refund',
                                    originalRequestId: requestId,
                                    collection: collectionName,
                                    reason: 'stale_job_recovery'
                                }, 'zaps');
                            }, { context: `Refund stale job ${requestId}` })
                        );
                    } else if (collectionName === 'generation_queue') {
                        const fallbackCost = 1.0;
                        refundPromises.push(
                            retryOperation(async () => {
                                await Wallet.credit(userId, fallbackCost, `refund_stale_fallback_${requestId}`, {
                                    auditType: 'stale_recovery_refund_fallback',
                                    originalRequestId: requestId,
                                    reason: 'stale_job_recovery_fallback'
                                });
                            }, { context: `Refund fallback for ${requestId}` })
                        );
                    }
                }
            }

            await batch.commit();

            if (refundPromises.length > 0) {
                const results = await Promise.allSettled(refundPromises);
                const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
                if (failures.length > 0) {
                    logger.error(`Failed to refund ${failures.length} stale jobs`, failures[0].reason);
                }
            }

            // --- PROCESS RESUSCITATION ---
            if (!resuscitateJobs.empty) {
                logger.info(`Resuscitating ${resuscitateJobs.docs.length} stuck jobs in ${collectionName}`);
                const queue = getFunctions().taskQueue('locations/us-central1/functions/urgentWorker');
                
                for (const doc of resuscitateJobs.docs) {
                    const data = doc.data();
                    const requestId = doc.id;
                    
                    logger.info(`[RESUSCITATE] Re-enqueuing job ${requestId}`, { userId: data.userId });
                    
                    await queue.enqueue({
                        taskType: 'image',
                        requestId,
                        userId: data.userId,
                        prompt: data.prompt,
                        negative_prompt: data.negative_prompt,
                        modelId: data.modelId,
                        steps: data.steps,
                        cfg: data.cfg,
                        aspectRatio: data.aspectRatio,
                        scheduler: data.scheduler,
                        resuscitated: true
                    }).catch(err => logger.error(`Resuscitation failed for ${requestId}`, err));

                    // Update doc to show resuscitation attempt
                    await doc.ref.update({
                        resuscitationCount: FieldValue.increment(1),
                        lastResuscitatedAt: FieldValue.serverTimestamp()
                    }).catch(() => {});
                }
            }

            logger.info(`Successfully processed ${collectionName} maintenance cycle`);
        } catch (error: any) {
            logger.error(`Error during stale job cleanup for ${collectionName}`, error);
        }
    }
});
