
import { onRequest } from "firebase-functions/v2/https";
import { db, FieldValue } from "./firebaseInit.js";
import { logger } from "./lib/utils.js";
import { constructWebhookEvent } from "./lib/stripe.js";

const handleStripeWebhook = async (req, res) => {
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

const handleSitemap = async (req, res) => {
    try {
        const baseUrl = 'https://dreambeesai.com';
        const now = new Date().toISOString();

        // Static pages with priorities
        const staticPages = [
            { path: '', priority: '1.0', changefreq: 'daily' },
            { path: '/generate', priority: '0.9', changefreq: 'daily' },
            { path: '/discovery', priority: '0.9', changefreq: 'daily' },
            { path: '/models', priority: '0.8', changefreq: 'weekly' },
            { path: '/pricing', priority: '0.8', changefreq: 'weekly' },
            { path: '/apps', priority: '0.7', changefreq: 'weekly' },
            { path: '/blog', priority: '0.7', changefreq: 'weekly' },
            { path: '/about', priority: '0.5', changefreq: 'monthly' },
            { path: '/features', priority: '0.6', changefreq: 'monthly' },
            { path: '/contact', priority: '0.5', changefreq: 'monthly' },
        ];

        let urls = staticPages.map(page => ({
            loc: `${baseUrl}${page.path}`,
            changefreq: page.changefreq,
            priority: page.priority,
            lastmod: now
        }));

        // Dynamic model pages from Firestore
        const modelsSnapshot = await db.collection('models').get();
        modelsSnapshot.forEach(doc => {
            urls.push({
                loc: `${baseUrl}/model/${doc.id}`,
                changefreq: 'weekly',
                priority: '0.7',
                lastmod: doc.data().updatedAt?.toDate?.()?.toISOString() || now
            });
        });

        // Blog posts
        const blogPosts = [{ id: 'prompt-director-drift-evaluation', date: '2026-01-03' }];
        blogPosts.forEach(post => {
            urls.push({
                loc: `${baseUrl}/blog/${post.id}`,
                changefreq: 'monthly',
                priority: '0.7',
                lastmod: new Date(post.date).toISOString()
            });
        });

        // Generate XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        urls.forEach(url => {
            xml += `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
        });
        xml += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.status(200).send(xml);
    } catch (error) {
        logger.error("Error generating sitemap", error);
        res.status(500).send("Error generating sitemap");
    }
};

// Dedicated sitemap function for Firebase Hosting rewrite
export const serveSitemap = onRequest({ memory: "256MiB", cors: true }, handleSitemap);

export const web = onRequest({ memory: "256MiB", cors: true }, async (req, res) => {
    const path = req.path;

    if (path === '/stripe-webhook') {
        return handleStripeWebhook(req, res);
    }

    // Sitemap can be requested via /sitemap.xml or other paths we might alias
    if (path === '/sitemap.xml' || path === '/sitemap') {
        return handleSitemap(req, res);
    }

    res.status(404).send("Not Found");
});

