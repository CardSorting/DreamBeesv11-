import { db, FieldValue } from "../firebaseInit.js";
export class ImpactService {
    /**
     * Tracks the impact of a creation and awards milestones.
     */
    static async trackCreationImpact(jobId, type) {
        const jobRef = db.collection('jobs').doc(jobId);
        await db.runTransaction(async (t) => {
            const jobDoc = await t.get(jobRef);
            if (!jobDoc.exists)
                return;
            const jobData = jobDoc.data();
            const creatorUid = jobData.uid;
            if (!creatorUid)
                return;
            // Log-scaled weight addition
            const weightDelta = type === 'zap' ? 10 : type === 'remix' ? 5 : 1;
            const currentWeight = (jobData.impactWeight || 0) + weightDelta;
            const remixCount = (jobData.remixCount || 0) + (type === 'remix' ? 1 : 0);
            // Scaled Score (log10 based buckets)
            // 10 weight -> Score 10, 100 weight -> Score 20, 1000 weight -> Score 30
            const impactScore = Math.floor(Math.log10(Math.max(1, currentWeight)) * 10);
            t.update(jobRef, {
                impactWeight: currentWeight,
                impactScore: impactScore,
                remixCount: remixCount,
                lastProcessedAt: FieldValue.serverTimestamp()
            });
        });
    }
}
//# sourceMappingURL=impact.js.map