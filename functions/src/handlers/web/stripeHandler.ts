import { db } from "../../firebaseInit.js";
import { logger } from "../../lib/utils.js";
import { constructWebhookEvent } from "../../lib/stripe.js";
import { Wallet } from "../../lib/wallet.js";
import Stripe from "stripe";

export const handleStripeWebhook = async (req: any, res: any) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;
    try {
        event = constructWebhookEvent(req.rawBody, signature, webhookSecret);
    } catch (err: any) {
        logger.error("Webhook Error", err);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const customerId = session.customer as string;
            const mode = session.mode;

            if (!userId) {
                logger.error("No userId in session metadata", session.id);
                return res.json({ received: true });
            }

            await db.runTransaction(async (t) => {
                const requestId = `stripe_evt_${event.id}`;

                if (mode === 'subscription') {
                    // Subscription Activation - 500 Zaps Bonus
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

                    if (amount === 500) { zapsToAdd = 50; }
                    else if (amount === 2000) { zapsToAdd = 250; }
                    else if (amount === 499) { zapsToAdd = 20; }
                    else if (amount === 1999) { zapsToAdd = 80; }
                    else if (amount === 4999) { zapsToAdd = 200; }
                    else if (amount === 999) { zapsToAdd = 100; }

                    if (zapsToAdd > 0) {
                        await Wallet.credit(
                            userId,
                            zapsToAdd,
                            requestId,
                            { type: 'purchase', currency: 'zaps', amount: amount },
                            'zaps',
                            t
                        );
                        t.update(db.collection('users').doc(userId), { stripeCustomerId: customerId });
                    }
                }
            });

        } else if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;
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
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
            if (!userSnapshot.empty) {
                const userId = userSnapshot.docs[0].id;
                await db.collection('users').doc(userId).update({ subscriptionStatus: 'inactive' });
            }
        }
        res.json({ received: true });
    } catch (err: any) {
        logger.error("Error processing webhook", err);
        res.status(500).send("Internal Server Error");
    }
};
