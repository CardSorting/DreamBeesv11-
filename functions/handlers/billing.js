import { db } from "../firebaseInit.js";
import { handleError } from "../lib/utils.js";
import { createCheckoutSession, createPortalSession } from "../lib/stripe.js";

export const handleCreateStripeCheckout = async (request) => {
    const { priceId, successUrl, cancelUrl, mode } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token.email;
    if (!uid) throw new Error("Unauthenticated");

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const user = userDoc.data() || {};
    const now = new Date();
    const lastCheckout = user.lastCheckoutSessionTime?.toDate ? user.lastCheckoutSessionTime.toDate() : new Date(0);
    if (now - lastCheckout < 60000) throw new Error("Please wait a minute.");

    await userRef.set({ lastCheckoutSessionTime: now }, { merge: true });
    try {
        const sessionUrl = await createCheckoutSession(uid, email, priceId, successUrl, cancelUrl, mode);
        return { url: sessionUrl };
    } catch (error) {
        throw handleError(error, { uid, context: "Stripe Checkout" });
    }
};

export const handleCreateStripePortalSession = async (request) => {
    const { returnUrl } = request.data;
    const uid = request.auth.uid;
    if (!uid) throw new Error("Unauthenticated");
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || !userDoc.data().stripeCustomerId) throw new Error("No subscription");
    try {
        const url = await createPortalSession(userDoc.data().stripeCustomerId, returnUrl || 'https://dreambees.app');
        return { url };
    } catch (error) {
        throw handleError(error, { uid, context: "Stripe Portal" });
    }
};
