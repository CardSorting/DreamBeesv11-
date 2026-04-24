import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";
export class SocialQuestService {
    /**
     * Updates progress for a collaborative quest when one participant earns EXP.
     */
    static async trackProgress(uid, expGained) {
        try {
            const questsRef = db.collection('collaborative_quests');
            const activeQuests = await questsRef
                .where('participants', 'array-contains', uid)
                .where('status', '==', 'active')
                .get();
            const batch = db.batch();
            activeQuests.forEach(doc => {
                const data = doc.data();
                const newExp = data.currentExp + expGained;
                if (newExp >= data.targetExp) {
                    batch.update(doc.ref, {
                        currentExp: data.targetExp,
                        status: 'completed',
                        completedAt: FieldValue.serverTimestamp()
                    });
                    // Award collaborative rewards to all participants
                    data.participants.forEach(pUid => {
                        const pRef = db.collection('users').doc(pUid);
                        batch.update(pRef, {
                            karma: FieldValue.increment(1000),
                            completedCollaborativeQuests: FieldValue.increment(1)
                        });
                    });
                }
                else {
                    batch.update(doc.ref, {
                        currentExp: newExp
                    });
                }
            });
            await batch.commit();
        }
        catch (error) {
            logger.error(`[SocialQuestService] Failed to track progress for ${uid}`, error);
        }
    }
}
//# sourceMappingURL=socialQuests.js.map