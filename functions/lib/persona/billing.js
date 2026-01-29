import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "../utils.js";
import { ZAP_COSTS } from "../costs.js";

/**
 * Checks config and deducts zaps with idempotency support.
 * @param {string} uid 
 * @param {string} action 'create' | 'chat' | 'gift' | actionId
 * @param {number} customAmount 
 * @param {string} requestId Optional request ID for idempotency
 * @returns {Promise<number>} The amount of zaps deducted
 */
export const checkAndDeductZaps = async (uid, action, customAmount = null, requestId = null) => {
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

    if (isNaN(cost) || (cost === 0 && !requestId)) {
        logger.info(`[Billing] Skipping deduction for ${uid} on Persona:${action} (cost is 0 or NaN: ${cost})`);
        return 0;
    }

    const logRef = requestId ? db.collection('action_logs').doc(requestId) : null;

    let alreadyDeducted = false;
    await db.runTransaction(async (t) => {
        if (logRef) {
            const existing = await t.get(logRef);
            if (existing.exists) {
                alreadyDeducted = true;
                return;
            }
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await t.get(userRef);

        if (!userDoc.exists) {
            throw new HttpsError('not-found', "User not found");
        }

        const zaps = userDoc.data().zaps || 0;

        if (zaps < cost) {
            throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${cost} Zaps.`);
        }

        if (cost > 0) {
            t.update(userRef, { zaps: FieldValue.increment(-cost) });
        }

        if (logRef) {
            t.set(logRef, {
                type: `persona_${action}`,
                userId: uid,
                cost,
                createdAt: FieldValue.serverTimestamp()
            });
        }
    });

    if (alreadyDeducted) {
        logger.info(`[Billing] Idempotent request for ${uid} on Persona:${action}`);
        return 0; // Or return original cost if needed, but 0 indicates no NEW deduction
    }

    logger.info(`[Billing] Deducted ${cost} Zaps from ${uid} for Persona:${action}`);
    return cost;
};

/**
 * Refunds zaps in case of error.
 * @param {string} uid 
 * @param {number} amount 
 */
export const refundZaps = async (uid, amount) => {
    if (amount <= 0) {return;}
    const db = getFirestore();
    try {
        await db.collection('users').doc(uid).update({ zaps: FieldValue.increment(amount) });
        logger.info(`[Billing] Refunded ${amount} Zaps to ${uid}`);
    } catch (err) {
        logger.error(`[Billing] Refund failed for ${uid}`, err);
    }
};
