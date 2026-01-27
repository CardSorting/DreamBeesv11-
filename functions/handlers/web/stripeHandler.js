import { db, FieldValue } from "../../firebaseInit.js";
import { logger } from "../../lib/utils.js";
import { constructWebhookEvent } from "../../lib/stripe.js";

export const handleStripeWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = constructWebhookEvent(req.rawBody, signature, webhookSecret);
    } catch (err) {
        logger.error("Webhook Error", err);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const customerId = session.customer;
            const mode = session.mode;

            if (mode === 'subscription') {
                console.log(`[Subscription] Activated for user ${userId}`);
                await db.collection('users').doc(userId).update({
                    subscriptionStatus: 'active',
                    subscriptionId: session.subscription,
                    stripeCustomerId: customerId,
                    zaps: FieldValue.increment(500)
                });
            } else if (mode === 'payment') {
                const amount = session.amount_total;
                let zapsToAdd = 0;
                let reelsToAdd = 0;

                if (amount === 500) zapsToAdd = 50;
                else if (amount === 2000) zapsToAdd = 250;
                else if (amount === 499) zapsToAdd = 20;
                else if (amount === 1999) zapsToAdd = 80;
                else if (amount === 4999) zapsToAdd = 200;
                else if (amount === 999) zapsToAdd = 100;
                else if (amount === 600) reelsToAdd = 600;
                else if (amount === 1500) reelsToAdd = 1500;
                else if (amount === 3500) reelsToAdd = 3600;
                else if (amount === 8500) reelsToAdd = 9000;

                if (zapsToAdd > 0) {
                    await db.collection('users').doc(userId).update({ zaps: FieldValue.increment(zapsToAdd), stripeCustomerId: customerId });
                } else if (reelsToAdd > 0) {
                    await db.collection('users').doc(userId).update({ reels: FieldValue.increment(reelsToAdd), stripeCustomerId: customerId });
                }
            }

        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            const customerId = invoice.customer;
            if (invoice.billing_reason === 'subscription_cycle') {
                const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
                if (!userSnapshot.empty) {
                    const userId = userSnapshot.docs[0].id;
                    await db.collection('users').doc(userId).update({ zaps: FieldValue.increment(500), subscriptionStatus: 'active' });
                }
            }
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
            if (!userSnapshot.empty) {
                const userId = userSnapshot.docs[0].id;
                await db.collection('users').doc(userId).update({ subscriptionStatus: 'inactive' });
            }
        }
        res.json({ received: true });
    } catch (err) {
        logger.error("Error processing webhook", err);
        res.status(500).send("Internal Server Error");
    }
};
