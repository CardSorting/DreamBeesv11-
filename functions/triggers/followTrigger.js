
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
    const isCreate = !event.data.before.exists && event.data.after.exists;
    const isDelete = event.data.before.exists && !event.data.after.exists;

    if (!isCreate && !isDelete) { return; } // No change in existence

    const personaRef = db.collection('personas').doc(personaId);

    try {
        if (isCreate) {
            // User Followed
            await personaRef.update({
                followerCount: FieldValue.increment(1),
                hypeScore: FieldValue.increment(50) // Bonus hype for follow
            });
            logger.info(`[Follow] Persona ${personaId} gained a follower.`);
        } else if (isDelete) {
            // User Unfollowed
            await personaRef.update({
                followerCount: FieldValue.increment(-1),
                hypeScore: FieldValue.increment(-50)
            });
            logger.info(`[Unfollow] Persona ${personaId} lost a follower.`);
        }
    } catch (error) {
        logger.error(`[Follow] Failed to update persona stats for ${personaId}`, error);
    }
});
