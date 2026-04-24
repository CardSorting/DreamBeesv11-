import Stripe from "stripe";
import { logger } from "./utils.js";
const stripeClient = (() => {
    let instance;
    return () => {
        if (!instance) {
            if (!process.env.STRIPE_SECRET_KEY) {
                // During deployment analysis, this might be missing.
                return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
                    apiVersion: "2023-10-16"
                });
            }
            instance = new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: "2023-10-16"
            });
        }
        return instance;
    };
})();
/**
 * Creates a Stripe Checkout Session for a subscription.
 */
export async function createCheckoutSession(userId, email, priceId, successUrl, cancelUrl, mode = 'subscription') {
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.create({
        mode: mode,
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        metadata: {
            userId: userId,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
    });
    return session.url;
}
/**
 * Constructs a Stripe Webhook Event from the request.
 */
export function constructWebhookEvent(rawBody, signature, webhookSecret) {
    const stripe = stripeClient();
    try {
        return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
    catch (err) {
        logger.error(`Webhook signature verification failed: ${err.message}`, err);
        throw err;
    }
}
/**
 * Creates a Stripe Customer Portal Session.
 */
export async function createPortalSession(customerId, returnUrl) {
    const stripe = stripeClient();
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
    return session.url;
}
//# sourceMappingURL=stripe.js.map