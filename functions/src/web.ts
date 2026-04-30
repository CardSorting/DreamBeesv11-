import { onRequest } from "firebase-functions/v2/https";
import { handleStripeWebhook } from "./handlers/web/stripeHandler.js";
import { handleSitemap } from "./handlers/web/sitemapHandler.js";
import { handleApp } from "./handlers/web/appHandler.js";

import { logger, fetchWithTimeout } from "./lib/utils.js";

/**
 * Unified 'web' entry point.
 * Handles App Metadata (SEO), Sitemap generation, Stripe Webhooks, and OpenAI SDK compat.
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

    // 2. XML Sitemap handling
    if (path === '/sitemap.xml' || path === '/sitemap') {
        return handleSitemap(req, res);
    }


    


    // 4. Default: Handle as App Metadata / SEO Injection
    return handleApp(req, res);
});
