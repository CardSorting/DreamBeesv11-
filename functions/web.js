import { onRequest } from "firebase-functions/v2/https";
import { handleStripeWebhook } from "./handlers/web/stripeHandler.js";
import { handlePusherAuth } from "./handlers/web/pusherHandler.js";
import { handleSitemap } from "./handlers/web/sitemapHandler.js";
import { handleApp } from "./handlers/web/appHandler.js";

/**
 * Unified 'web' entry point.
 * Handles App Metadata (SEO), Sitemap generation, Stripe Webhooks, and Pusher Auth.
 * Memory and timeout are boosted to accommodate sitemap generation for large collections.
 */
export const web = onRequest({
    memory: "512MiB",
    cors: true,
    timeoutSeconds: 60
}, async (req, res) => {
    const path = req.path;

    // 1. Stripe Webhooks
    if (path === '/stripe-webhook') {
        return handleStripeWebhook(req, res);
    }

    // 2. Pusher/Soketi Authentication
    if (path === '/pusher/auth') {
        return handlePusherAuth(req, res);
    }

    // 3. XML Sitemap handling
    if (path === '/sitemap.xml' || path === '/sitemap') {
        return handleSitemap(req, res);
    }

    // 4. Default: Handle as App Metadata / SEO Injection
    return handleApp(req, res);
});
