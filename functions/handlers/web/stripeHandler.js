import { db, FieldValue } from "../../firebaseInit.js";
import { logger } from "../../lib/utils.js";
import { constructWebhookEvent } from "../../lib/stripe.js";
import { Wallet } from "../../lib/wallet.js";

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

            await db.runTransaction(async (t) => {
                const requestId = `stripe_evt_${event.id}`;

                if (mode === 'subscription') {
                    // Subscription Activation - 500 Zaps Bonus
                    // Use Wallet for credits + Atomic User Update
                    const creditResult = await Wallet.credit(
                        userId,
                        500,
                        requestId,
                        { type: 'subscription_activation', stripeSessionId: session.id },
                        'zaps',
                        t
                    );

                    if (!creditResult.idempotent) {
                        logger.info(`[Subscription] Activated for user ${userId}. Credited 500 Zaps.`);
                        t.update(db.collection('users').doc(userId), {
                            subscriptionStatus: 'active',
                            subscriptionId: session.subscription,
                            stripeCustomerId: customerId
                        });
                    } else {
                        logger.info(`[Subscription] Already processed event ${event.id}`);
                    }

                } else if (mode === 'payment') {
                    // One-time Payment
                    const amount = session.amount_total;
                    let zapsToAdd = 0;
                    let reelsToAdd = 0;

                    if (amount === 500) { zapsToAdd = 50; }
                    else if (amount === 2000) { zapsToAdd = 250; }
                    else if (amount === 499) { zapsToAdd = 20; }
                    else if (amount === 1999) { zapsToAdd = 80; }
                    else if (amount === 4999) { zapsToAdd = 200; }
                    else if (amount === 999) { zapsToAdd = 100; }
                    else if (amount === 600) { reelsToAdd = 600; }
                    else if (amount === 1500) { reelsToAdd = 1500; }
                    else if (amount === 3500) { reelsToAdd = 3600; }
                    else if (amount === 8500) { reelsToAdd = 9000; }

                    if (zapsToAdd > 0) {
                        await Wallet.credit(
                            userId,
                            zapsToAdd,
                            requestId,
                            { type: 'purchase', currency: 'zaps', amount: amount },
                            'zaps',
                            t
                        );
                        // Also ensure customerId is synced
                        t.update(db.collection('users').doc(userId), { stripeCustomerId: customerId });

                    } else if (reelsToAdd > 0) {
                        await Wallet.credit(
                            userId,
                            reelsToAdd,
                            requestId,
                            { type: 'purchase', currency: 'reels', amount: amount },
                            'reels',
                            t
                        );
                        // Also ensure customerId is synced
                        t.update(db.collection('users').doc(userId), { stripeCustomerId: customerId });
                    }
                }
            });

        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            const customerId = invoice.customer;
            const requestId = `stripe_evt_${event.id}`;

            if (invoice.billing_reason === 'subscription_cycle') {
                await db.runTransaction(async (t) => {
                    // Find user by stripeCustomerId
                    const userSnapshot = await t.get(db.collection('users').where('stripeCustomerId', '==', customerId).limit(1));

                    if (!userSnapshot.empty) {
                        const userDoc = userSnapshot.docs[0];
                        const userId = userDoc.id;

                        const creditResult = await Wallet.credit(
                            userId,
                            500,
                            requestId,
                            { type: 'subscription_cycle', invoiceId: invoice.id },
                            'zaps',
                            t
                        );

                        if (!creditResult.idempotent) {
                            t.update(userDoc.ref, { subscriptionStatus: 'active' });
                            logger.info(`[Invoice] Renewed subscription for ${userId}`);
                        }
                    }
                });
            }
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            // This is less critical for race conditions, but good to be consistent.
            // Since we don't use Wallet here (no credits), we can keep it simple or wrap in transaction.
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
