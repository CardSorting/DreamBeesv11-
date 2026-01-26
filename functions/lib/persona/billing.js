import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "../utils.js";

/**
 * Checks config and deducts zaps.
 * @param {string} uid 
 * @param {string} action 'create' | 'chat'
 * @returns {Promise<number>} The amount of zaps deducted
 */
export const checkAndDeductZaps = async (uid, action, customAmount = null) => {
    const db = getFirestore();
    const configDoc = await db.collection("sys_config").doc("persona").get();
    const config = configDoc.exists ? configDoc.data() : {};

    // Default Costs: Create = 5, Chat = 0.25
    let cost = 0;
    if (customAmount !== null) {
        cost = customAmount;
    } else if (action === 'create') {
        cost = (config.cost_create !== undefined) ? Number(config.cost_create) : 5;
    } else if (action === 'chat') {
        cost = (config.cost_chat !== undefined) ? Number(config.cost_chat) : 0.25;
    }

    if (cost === 0) return 0;

    await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await t.get(userRef);

        if (!userDoc.exists) {
            throw new HttpsError('not-found', "User not found");
        }

        const zaps = userDoc.data().zaps || 0;

        if (zaps < cost) {
            throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${cost} Zaps.`);
        }

        t.update(userRef, { zaps: FieldValue.increment(-cost) });
    });

    logger.info(`[Billing] Deducted ${cost} Zaps from ${uid} for Persona:${action}`);
    return cost;
};

/**
 * Refunds zaps in case of error.
 * @param {string} uid 
 * @param {number} amount 
 */
export const refundZaps = async (uid, amount) => {
    if (amount <= 0) return;
    const db = getFirestore();
    try {
        await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(amount) });
        logger.info(`[Billing] Refunded ${amount} Zaps to ${uid}`);
    } catch (err) {
        logger.error(`[Billing] Refund failed for ${uid}`, err);
    }
};
