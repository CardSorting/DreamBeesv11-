import { db, FieldValue } from "../firebaseInit.js";
import { handleError, logger } from "../lib/utils.js";
import { createCheckoutSession, createPortalSession } from "../lib/stripe.js";
import { RequestWithAuth } from "../types/functions.js";
import { HttpsError } from "firebase-functions/v2/https";

export const handleCreateStripeCheckout = async (request: RequestWithAuth<any>) => {
    const { priceId, successUrl, cancelUrl, mode } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token.email;
    if (!uid) { throw new Error("Unauthenticated"); }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const user = (userDoc.data() as any) || {};
    const now = new Date();
    const lastCheckout = user.lastCheckoutSessionTime?.toDate ? user.lastCheckoutSessionTime.toDate() : new Date(0);

    if (now.getTime() - lastCheckout.getTime() < 60000) {
        throw new Error("Please wait a minute.");
    }

    await userRef.set({ lastCheckoutSessionTime: now }, { merge: true });
    try {
        const sessionUrl = await createCheckoutSession(uid, email, priceId, successUrl, cancelUrl, mode);
        return { url: sessionUrl };
    } catch (error) {
        throw handleError(error, { uid, context: "Stripe Checkout" });
    }
};

export const handleCreateStripePortalSession = async (request: RequestWithAuth<any>) => {
    const { returnUrl } = request.data;
    const uid = request.auth.uid;
    if (!uid) { throw new Error("Unauthenticated"); }
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() as any;
    if (!userDoc.exists || !userData?.stripeCustomerId) {
        throw new Error("No subscription");
    }
    try {
        const url = await createPortalSession(userData.stripeCustomerId, returnUrl || 'https://dreambees.app');
        return { url };
    } catch (error) {
        throw handleError(error, { uid, context: "Stripe Portal" });
    }
};

export const handleClaimDailyZaps = async (request: RequestWithAuth<any>) => {
    const uid = request.auth.uid;
    if (!uid) { throw new Error("Unauthenticated"); }

    const startTime = Date.now();
    logger.info(`[Claim] Starting hyper-streamlined execution for user ${uid}`);

    const now = new Date();
    const dateId = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}`;
    
    const userRef = db.collection('users').doc(uid);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) { throw new Error("USER_NOT_FOUND"); }
            
            const userData = userDoc.data() as any;
            if (userData.lastDailyClaimId === dateId) {
                throw new Error("ALREADY_CLAIMED");
            }

            transaction.update(userRef, {
                zaps: FieldValue.increment(100),
                lastFreeClaimAt: now,
                lastDailyClaimId: dateId
            });
        });

        const duration = Date.now() - startTime;
        logger.info(`[Claim] Hyper-streamlined finish in ${duration}ms for user ${uid}`);

        return {
            success: true,
            zapsAdded: 100,
            message: "Successfully claimed 100 Zaps!"
        };

    } catch (error: any) {
        if (error.message === "ALREADY_CLAIMED") {
            throw new Error("You have already claimed your daily Zaps today. Come back tomorrow!");
        }
        logger.error(`[Claim] Failed for user ${uid}:`, error);
        throw error;
    }
};


