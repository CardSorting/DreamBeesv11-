import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";
/**
 * Trigger: onFollowChange
 * Listens to: users/{userId}/follows/{personaId}
 * Action: Updates 'followerCount' and 'hypeScore' on the persona document.
 */
export const onFollowChange = onDocumentWritten("users/{userId}/follows/{personaId}", async (event) => {
    const { personaId } = event.params;
    if (!event.data) {
        return;
    }
    const isCreate = !event.data.before.exists && event.data.after.exists;
    const isDelete = event.data.before.exists && !event.data.after.exists;
    if (!isCreate && !isDelete) {
        return;
    }
    const personaRef = db.collection('personas').doc(personaId);
    try {
        if (isCreate) {
            await personaRef.update({
                followerCount: FieldValue.increment(1),
                hypeScore: FieldValue.increment(50)
            });
            logger.info(`[Follow] Persona ${personaId} gained a follower.`);
        }
        else if (isDelete) {
            await personaRef.update({
                followerCount: FieldValue.increment(-1),
                hypeScore: FieldValue.increment(-50)
            });
            logger.info(`[Unfollow] Persona ${personaId} lost a follower.`);
        }
    }
    catch (error) {
        logger.error(`[Follow] Failed to update persona stats for ${personaId}`, error);
    }
});
//# sourceMappingURL=followTrigger.js.map