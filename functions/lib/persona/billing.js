import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "../utils.js";
import { ZAP_COSTS } from "../costs.js";

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

    // Default Costs
    let cost = 0;
    if (customAmount !== null && customAmount !== undefined) {
        cost = Number(customAmount);
    } else if (action === 'create') {
        cost = (config.cost_create !== undefined) ? Number(config.cost_create) : ZAP_COSTS.PERSONA_CREATE;
    } else if (action === 'chat') {
        cost = (config.cost_chat !== undefined) ? Number(config.cost_chat) : ZAP_COSTS.PERSONA_CHAT;
    }

    if (isNaN(cost) || cost === 0) {
        logger.info(`[Billing] Skipping deduction for ${uid} on Persona:${action} (cost is 0 or NaN: ${cost})`);
        return 0;
    }

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
