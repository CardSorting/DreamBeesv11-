import { db, FieldValue } from "../firebaseInit.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "./utils.js";

/**
 * Atomically deducts Zaps from a user's account with idempotency protection.
 * @param {string} uid - User ID
 * @param {number} amount - Amount to deduct
 * @param {string} requestId - Unique ID for the operation (idempotency key)
 * @param {string} queueCollection - The collection where the request document will be stored
 * @returns {Promise<{success: true, idempotent: boolean}>}
 */
export async function deductZapsAtomic(uid, amount, requestId, queueCollection = 'generation_queue') {
    if (!uid) {throw new HttpsError('unauthenticated', "User must be authenticated");}
    if (amount <= 0) {return { success: true, idempotent: false };}

    const userRef = db.collection('users').doc(uid);
    const queueRef = db.collection(queueCollection).doc(requestId);

    return await db.runTransaction(async (t) => {
        // 1. Check Idempotency
        const existingJob = await t.get(queueRef);
        if (existingJob.exists) {
            logger.info("Idempotent request detected", { uid, requestId, queueCollection });
            return { success: true, idempotent: true };
        }

        // 2. Check Balance
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) {throw new HttpsError('not-found', "User not found");}

        const userData = userDoc.data();
        const currentBalance = userData.zaps || 0;

        if (currentBalance < amount) {
            throw new HttpsError('resource-exhausted', `Insufficient Zaps. Need ${amount}, have ${currentBalance.toFixed(1)}`);
        }

        // 3. Deduct
        t.update(userRef, {
            zaps: FieldValue.increment(-amount),
            lastActionTime: FieldValue.serverTimestamp()
        });

        return { success: true, idempotent: false };
    });
}

/**
 * Atomically deducts Reels from a user's account with idempotency protection.
 * @param {string} uid - User ID
 * @param {number} amount - Amount to deduct
 * @param {string} requestId - Unique ID for the operation
 * @param {string} queueCollection - Default 'video_queue'
 */
export async function deductReelsAtomic(uid, amount, requestId, queueCollection = 'video_queue') {
    if (!uid) {throw new HttpsError('unauthenticated', "User must be authenticated");}
    if (amount <= 0) {return { success: true, idempotent: false };}

    const userRef = db.collection('users').doc(uid);
    const queueRef = db.collection(queueCollection).doc(requestId);

    return await db.runTransaction(async (t) => {
        const existingJob = await t.get(queueRef);
        if (existingJob.exists) {return { success: true, idempotent: true };}

        const userDoc = await t.get(userRef);
        if (!userDoc.exists) {throw new HttpsError('not-found', "User not found");}

        const reels = userDoc.data().reels || 0;
        if (reels < amount) {throw new HttpsError('resource-exhausted', "Insufficient Reels.");}

        t.update(userRef, { reels: FieldValue.increment(-amount) });
        return { success: true, idempotent: false };
    });
}
