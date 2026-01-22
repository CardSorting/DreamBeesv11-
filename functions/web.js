
import { onRequest } from "firebase-functions/v2/https";
import { db, FieldValue } from "./firebaseInit.js";
import { logger } from "./lib/utils.js";
import { constructWebhookEvent } from "./lib/stripe.js";

const slugify = (text) => {
    if (!text) return 'artwork';
    return text.toString().toLowerCase().trim()
        .replace(/&/g, '-and-')
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

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

        const urls = staticPages.map(page => ({
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
        const blogPostsData = [{ id: 'prompt-director-drift-evaluation', date: '2026-01-03' }];
        blogPostsData.forEach(post => {
            urls.push({
                loc: `${baseUrl}/blog/${post.id}`,
                changefreq: 'monthly',
                priority: '0.7',
                lastmod: new Date(post.date).toISOString()
            });
        });

        // 4. TOP SHOWCASE IMAGES (Official)
        const showcaseSnapshot = await db.collection('model_showcase_images')
            .orderBy('createdAt', 'desc')
            .limit(200)
            .get();

        showcaseSnapshot.forEach(doc => {
            const data = doc.data();
            const slug = slugify(data.prompt?.slice(0, 40) || 'artwork');
            urls.push({
                loc: `${baseUrl}/discovery/${slug}-${doc.id}`,
                changefreq: 'monthly',
                priority: '0.6',
                lastmod: data.createdAt?.toDate?.()?.toISOString() || now
            });
        });

        // 5. RECENT PUBLIC GENERATIONS
        const generationsSnapshot = await db.collection('generations')
            .where('isPublic', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(300)
            .get();

        generationsSnapshot.forEach(doc => {
            const data = doc.data();
            const slug = slugify(data.prompt?.slice(0, 40) || 'artwork');
            urls.push({
                loc: `${baseUrl}/discovery/${slug}-${doc.id}`,
                changefreq: 'monthly',
                priority: '0.5',
                lastmod: data.createdAt?.toDate?.()?.toISOString() || now
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

const handleApp = async (req, res) => {
    const path = req.path;
    const baseUrl = 'https://dreambeesai.com';
    let title = "AI Image Generator - Text to Image Online";
    let desc = "Generate high-quality AI art directly on the web. No Discord required.";
    let image = `${baseUrl}/dreambees_icon.png`;
    let structuredData = null;

    try {
        // 1. DISCOVERY / IMAGES
        if (path.startsWith('/discovery/')) {
            const rawId = path.split('/').pop();
            // Support slugified IDs (...-ID)
            const id = (rawId && rawId.includes('-')) ? rawId.split('-').pop() : rawId;

            if (id && id !== 'discovery') {
                let docSnap = await db.collection('model_showcase_images').doc(id).get();
                if (!docSnap.exists) {
                    docSnap = await db.collection('generations').doc(id).get();
                }

                if (docSnap.exists) {
                    const data = docSnap.data();
                    const prompt = data.prompt || "AI Artwork";
                    title = `${prompt.slice(0, 60)}... | DreamBeesAI`;
                    desc = prompt;
                    image = data.thumbnailUrl || data.url || data.imageUrl || image;
                    structuredData = {
                        "@context": "https://schema.org",
                        "@type": "VisualArtwork",
                        "name": prompt.slice(0, 100),
                        "image": image,
                        "creator": { "@type": "Person", "name": data.userDisplayName || "AI Creator" }
                    };
                }
            }
        }
        // 2. BLOG
        else if (path.startsWith('/blog/')) {
            const id = path.split('/').pop();
            // Note: Blog posts are currently static in the app, but we can hardcode or fetch metadata
            if (id === 'prompt-director-drift-evaluation') {
                title = "Prompt Director Drift Evaluation | DreamBeesAI";
                desc = "Evaluating the impact of prompt director models on image variance and quality.";
            }
        }
        // 3. MODELS
        else if (path.startsWith('/model/')) {
            const id = path.split('/').pop();
            const modelSnap = await db.collection('models').doc(id).get();
            if (modelSnap.exists) {
                const data = modelSnap.data();
                title = `${data.name} AI Model - DreamBeesAI`;
                desc = data.description || `Instagram-style showcase feed for the ${data.name} AI model.`;
                image = data.image || image;
            }
        }

        // Generate the injected HTML
        // For simplicity and speed in functions, we use a template frame. 
        // In a real production setup, you'd read 'index.html' from dist, but we'll use a robust fallback here.
        const metaTags = `
  <!-- INJECTED BY FIREBASE FUNCTION -->
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${image.startsWith('http') ? image : baseUrl + image}" />
  <meta property="og:url" content="${baseUrl}${path}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${image.startsWith('http') ? image : baseUrl + image}" />
  ${structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>` : ''}
`;

        // Check if we are already in SSR mode to avoid infinite redirect loops
        const isSSR = req.query?.ssr === '1';

        if (isSSR) {
            res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metaTags}
</head>
<body>
    <div id="root"></div>
    <p style="text-align:center; margin-top: 50vh; color: #666; font-family: sans-serif;">Loading DreamBeesAI...</p>
    <script type="module" src="/src/main.jsx"></script>
    <script>
        // Clean up the URL by removing ssr=1 from history after load
        window.addEventListener('load', () => {
            const url = new URL(window.location);
            url.searchParams.delete('ssr');
            window.history.replaceState({}, '', url);
        });
    </script>
</body>
</html>
            `);
            return;
        }

        res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metaTags}
    <meta http-equiv="refresh" content="0;url=${baseUrl}${path}?ssr=1">
    <script>window.location.href = "${baseUrl}${path}?ssr=1"</script>
</head>
<body>
    <p>Redirecting to DreamBeesAI...</p>
</body>
</html>
        `);
    } catch (err) {
        console.error("Error in serveApp:", err);
        res.redirect(baseUrl + path);
    }
};

// Dedicated sitemap function for Firebase Hosting rewrite
export const serveSitemap = onRequest({ memory: "256MiB", cors: true }, handleSitemap);
export const serveApp = onRequest({ memory: "256MiB", cors: true }, handleApp);

export const web = onRequest({ memory: "256MiB", cors: true }, async (req, res) => {
    const path = req.path;

    if (path === '/stripe-webhook') {
        return handleStripeWebhook(req, res);
    }

    if (path === '/sitemap.xml' || path === '/sitemap') {
        return handleSitemap(req, res);
    }

    // Default: handoff to handleApp for meta injection on specific routes
    return handleApp(req, res);
});

