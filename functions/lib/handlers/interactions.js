import { db, FieldValue } from "../firebaseInit.js";
import { HttpsError } from "firebase-functions/v2/https";
import { handleError, logger } from "../lib/utils.js";
export const handleNudge = async (request) => {
    const uid = request.auth.uid;
    const { targetUid } = request.data;
    if (!uid)
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    if (!targetUid)
        throw new HttpsError('invalid-argument', 'Target user ID required.');
    try {
        const nudgeId = `nudge_${uid}_${targetUid}_${new Date().toISOString().split('T')[0]}`;
        await db.runTransaction(async (t) => {
            const targetRef = db.collection('users').doc(targetUid);
            const targetNudgeRef = targetRef.collection('interactions').doc(nudgeId);
            const nudgeSnap = await t.get(targetNudgeRef);
            if (nudgeSnap.exists) {
                throw new HttpsError('already-exists', 'You have already nudged this friend today!');
            }
            t.set(targetNudgeRef, {
                fromUid: uid,
                type: 'nudge',
                createdAt: FieldValue.serverTimestamp(),
                read: false
            });
            logger.info(`[Interactions] User ${uid} nudged ${targetUid}`);
        });
        return { success: true };
    }
    catch (error) {
        throw handleError(error, { uid, targetUid });
    }
};
export const handleCongratulate = async (request) => {
    const uid = request.auth.uid;
    const { targetUid, eventId } = request.data;
    if (!uid)
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    if (!targetUid)
        throw new HttpsError('invalid-argument', 'Target user ID required.');
    try {
        const congratsId = `congrats_${uid}_${targetUid}_${eventId || 'generic'}`;
        const interactionRef = db.collection('users').doc(targetUid).collection('interactions').doc(congratsId);
        const snap = await interactionRef.get();
        if (snap.exists) {
            return { success: false, alreadyClaimed: true };
        }
        await interactionRef.set({
            fromUid: uid,
            type: 'congratulate',
            eventId,
            createdAt: FieldValue.serverTimestamp(),
            read: false
        });
        logger.info(`[Interactions] User ${uid} congratulated ${targetUid}`);
        return { success: true };
    }
    catch (error) {
        throw handleError(error, { uid, targetUid });
    }
};
//# sourceMappingURL=interactions.js.map