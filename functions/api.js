import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "./firebaseInit.js";
import { handleError, logger } from "./lib/utils.js";
import { constructWebhookEvent } from "./lib/stripe.js";
import {
    checkIpThrottle,
    checkUserAbuseStatus,
    checkUserQuota,
    checkTokenBucket,
    checkAbuseScore,
    recordViolation
} from "./lib/abuse.js";

// -- Imports from Handlers --
import * as Generation from "./handlers/generation.js";
import * as Transformation from "./handlers/transformation.js";
import * as Data from "./handlers/data.js";
import * as Billing from "./handlers/billing.js";

// ============================================================================
// Main API Dispatcher
// ============================================================================

export const api = onCall(async (request) => {
    // Basic App Check logging (Warn Mode)
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        logger.warn("App Check verification failed. Proceeding (Warn Mode).", { uid: request.auth?.uid });
    }

    const { action } = request.data;
    const uid = request.auth?.uid;
    const clientIp = request.rawRequest.ip;

    try {
        // --- 1. IP Level Protection ---
        await checkIpThrottle(clientIp);

        // --- 2. User Level Protection ---
        if (uid) {
            await checkUserAbuseStatus(uid);
            await checkAbuseScore(uid);

            // Token Bucket checks
            const isExpensive = ['createVideoGenerationRequest', 'createSlideshowGeneration'].includes(action);
            const bucketCapacity = isExpensive ? 3 : 10;
            const refillRate = isExpensive ? 0.05 : 0.5;
            await checkTokenBucket(`tb:${uid}:${action}`, 1, bucketCapacity, refillRate);

            await checkUserQuota(uid, action);
        }

        switch (action) {
            // Generation
            case 'createGenerationRequest': return Generation.handleCreateGenerationRequest(request);
            case 'createVideoGenerationRequest': return Generation.handleCreateVideoGenerationRequest(request);
            case 'dressUp': return Generation.handleCreateDressUpRequest(request);
            case 'createSlideshowGeneration': return Generation.handleCreateSlideshowGeneration(request);
            case 'generateVideoPrompt': return Generation.handleGenerateVideoPrompt(request);

            // Transformation & AI
            case 'createAnalysisRequest': return Transformation.handleCreateAnalysisRequest(request);
            case 'createEnhanceRequest': return Transformation.handleCreateEnhanceRequest(request);
            case 'transformPrompt': return Transformation.handleTransformPrompt(request);
            case 'transformImage': return Transformation.handleTransformImage(request);
            case 'generateLyrics': return Transformation.handleGenerateLyrics(request);

            // Billing
            case 'createStripeCheckout': return Billing.handleCreateStripeCheckout(request);
            case 'createStripePortalSession': return Billing.handleCreateStripePortalSession(request);

            // Data & Ratings
            case 'getGenerationHistory': return Data.handleGetGenerationHistory(request);
            case 'getImageDetail': return Data.handleGetImageDetail(request);
            case 'getUserImages': return Data.handleGetUserImages(request);
            case 'rateGeneration': return Data.handleRateGeneration(request);
            case 'rateShowcaseImage': return Data.handleRateShowcaseImage(request);
            case 'deleteImage': return Data.handleDeleteImage(request);
            case 'deleteImagesBatch': return Data.handleDeleteImagesBatch(request);
            case 'toggleBookmark': return Data.handleToggleBookmark(request);

            default:
                throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
        }
    } catch (error) {
        if (error.code === 'resource-exhausted' && uid) {
            recordViolation(uid, 'rate_limit_exceeded').catch(e => logger.error("Failed to record violation", e));
        }
        throw handleError(error, { action, uid });
    }
});

// ============================================================================
// Webhooks & HTTP Triggers (Kept here for now)
// ============================================================================

export const stripeWebhook = onRequest(async (req, res) => {
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
});

export const serveSitemap = onRequest({ cors: true, memory: "256MiB" }, async (req, res) => {
    try {
        const baseUrl = 'https://dreambeesai.com';
        const staticPages = ['', '/generate', '/models', '/gallery', '/pricing', '/blog', '/about', '/features', '/contact', '/auth'];
        let urls = staticPages.map(path => ({ loc: `${baseUrl}${path}`, changefreq: 'daily', priority: path === '' ? '1.0' : '0.8' }));

        const modelsSnapshot = await db.collection('models').get();
        modelsSnapshot.forEach(doc => { urls.push({ loc: `${baseUrl}/model/${doc.id}`, changefreq: 'weekly', priority: '0.7', lastmod: new Date().toISOString() }); });

        const blogPosts = [{ id: 'prompt-director-drift-evaluation', date: '2026-01-03' }];
        blogPosts.forEach(post => { urls.push({ loc: `${baseUrl}/blog/${post.id}`, changefreq: 'monthly', priority: '0.7', lastmod: new Date(post.date).toISOString() }); });

        let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        urls.forEach(url => { xml += `<url><loc>${url.loc}</loc><lastmod>${url.lastmod || new Date().toISOString()}</lastmod><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`; });
        xml += `</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.status(200).send(xml);
    } catch (error) {
        logger.error("Error generating sitemap", error);
        res.status(500).send("Error generating sitemap");
    }
});
