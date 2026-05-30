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
    let user = (request as any).cachedUserData;
    if (!user) {
        const userDoc = await userRef.get();
        user = (userDoc.data() as any) || {};
    }
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
    let userData = (request as any).cachedUserData;
    if (!userData) {
        const userDoc = await db.collection('users').doc(uid).get();
        userData = userDoc.data() as any;
        if (!userDoc.exists) {
            throw new Error("No subscription");
        }
    }
    if (!userData?.stripeCustomerId) {
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
    const claimRef = db.collection('daily_zap_claims').doc(`${uid}_${dateId}`);
    const cachedUserData = (request as any).cachedUserData;

    try {
        if (cachedUserData?.lastDailyClaimId === dateId) {
            throw new Error("ALREADY_CLAIMED");
        }

        const batch = db.batch();
        batch.create(claimRef, {
            uid,
            dateId,
            createdAt: FieldValue.serverTimestamp()
        });
        batch.update(userRef, {
            zaps: FieldValue.increment(100),
            lastFreeClaimAt: now,
            lastDailyClaimId: dateId
        });
        await batch.commit();

        const duration = Date.now() - startTime;
        logger.info(`[Claim] Hyper-streamlined finish in ${duration}ms for user ${uid}`);

        return {
            success: true,
            zapsAdded: 100,
            message: "Successfully claimed 100 Zaps!"
        };

    } catch (error: any) {
        if (error.message === "ALREADY_CLAIMED" || error.code === 6 || error.code === 'already-exists') {
            throw new Error("You have already claimed your daily Zaps today. Come back tomorrow!");
        }
        logger.error(`[Claim] Failed for user ${uid}:`, error);
        throw error;
    }
};
