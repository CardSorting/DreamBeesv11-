
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Stripe = require('stripe');

const stripeClient = (() => {
    let instance;
    return () => {
        if (!instance) {
            if (!process.env.STRIPE_SECRET_KEY) {
                // During deployment analysis, this might be missing. 
                // We can either throw or return a dummy if we are sure it will be there at runtime.
                // For safety, let's just create it. If it fails at runtime, it fails.
                // But for *deployment*, we might need to suppress the immediate error.
                // However, the error "Neither apiKey..." is from the Stripe constructor.
                // If we accept that this runs only when called, the deploy process (which doesn't call this function) should be fine.
                return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
            }
            instance = new Stripe(process.env.STRIPE_SECRET_KEY);
        }
        return instance;
    };
})();

/**
 * Creates a Stripe Checkout Session for a subscription.
 * @param {string} userId - The Firebase user ID.
 * @param {string} email - The user's email address.
 * @param {string} priceId - The Stripe Price ID to subscribe to.
 * @param {string} successUrl - URL to redirect to on success.
 * @param {string} cancelUrl - URL to redirect to on cancellation.
 * @returns {Promise<string>} The session URL.
 */
export async function createCheckoutSession(userId, email, priceId, successUrl, cancelUrl) {
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
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
 * @param {string} rawBody - The raw request body.
 * @param {string} signature - The Stripe signature header.
 * @param {string} webhookSecret - The Stripe Webhook Secret.
 * @returns {object} The Stripe Event.
 */
export function constructWebhookEvent(rawBody, signature, webhookSecret) {
    const stripe = stripeClient();
    try {
        return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        throw err;
    }
}

/**
 * Creates a Stripe Customer Portal Session.
 * @param {string} customerId - The Stripe Customer ID.
 * @param {string} returnUrl - URL to redirect to after exiting the portal.
 * @returns {Promise<string>} The portal session URL.
 */
export async function createPortalSession(customerId, returnUrl) {
    const stripe = stripeClient();
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
    return session.url;
}
