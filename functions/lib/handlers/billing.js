import { db, FieldValue } from "../firebaseInit.js";
import { handleError, logger } from "../lib/utils.js";
import { createCheckoutSession, createPortalSession } from "../lib/stripe.js";
export const handleCreateStripeCheckout = async (request) => {
    const { priceId, successUrl, cancelUrl, mode } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token.email;
    if (!uid) {
        throw new Error("Unauthenticated");
    }
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const user = userDoc.data() || {};
    const now = new Date();
    const lastCheckout = user.lastCheckoutSessionTime?.toDate ? user.lastCheckoutSessionTime.toDate() : new Date(0);
    if (now.getTime() - lastCheckout.getTime() < 60000) {
        throw new Error("Please wait a minute.");
    }
    await userRef.set({ lastCheckoutSessionTime: now }, { merge: true });
    try {
        const sessionUrl = await createCheckoutSession(uid, email, priceId, successUrl, cancelUrl, mode);
        return { url: sessionUrl };
    }
    catch (error) {
        throw handleError(error, { uid, context: "Stripe Checkout" });
    }
};
export const handleCreateStripePortalSession = async (request) => {
    const { returnUrl } = request.data;
    const uid = request.auth.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userDoc.exists || !userData?.stripeCustomerId) {
        throw new Error("No subscription");
    }
    try {
        const url = await createPortalSession(userData.stripeCustomerId, returnUrl || 'https://dreambees.app');
        return { url };
    }
    catch (error) {
        throw handleError(error, { uid, context: "Stripe Portal" });
    }
};
export const handleClaimFreeCredits = async (request) => {
    const uid = request.auth.uid;
    if (!uid) {
        throw new Error("Unauthenticated");
    }
    const startTime = Date.now();
    logger.info(`[Claim] Starting simplified execution for user ${uid}`);
    const now = new Date();
    const dateId = `claim_${now.getUTCFullYear()}_${now.getUTCMonth() + 1}_${now.getUTCDate()}`;
    const userRef = db.collection('users').doc(uid);
    const dailyClaimRef = userRef.collection('claims').doc(dateId);
    try {
        await db.runTransaction(async (transaction) => {
            const claimDoc = await transaction.get(dailyClaimRef);
            if (claimDoc.exists) {
                throw new Error("ALREADY_CLAIMED");
            }
            transaction.set(dailyClaimRef, {
                claimedAt: FieldValue.serverTimestamp(),
                zapsAwarded: 100,
                status: 'success'
            });
            transaction.update(userRef, {
                zaps: FieldValue.increment(100),
                lastFreeClaimAt: now
            });
        });
        const duration = Date.now() - startTime;
        logger.info(`[Claim] Finished in ${duration}ms for user ${uid}`);
        return {
            success: true,
            zapsAdded: 100,
            message: "Successfully claimed 100 Zaps!"
        };
    }
    catch (error) {
        if (error.message === "ALREADY_CLAIMED") {
            throw new Error("You have already claimed your daily Zaps today. Come back tomorrow!");
        }
        logger.error(`[Claim] Failed for user ${uid}:`, error);
        throw error;
    }
};
//# sourceMappingURL=billing.js.map