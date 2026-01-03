
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    try {
        return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        throw err;
    }
}
