import { onRequest } from "firebase-functions/v2/https";
import { handleStripeWebhook } from "./handlers/web/stripeHandler.js";
import { handlePusherAuth } from "./handlers/web/pusherHandler.js";
import { handleSitemap } from "./handlers/web/sitemapHandler.js";
import { handleApp } from "./handlers/web/appHandler.js";

// Dedicated sitemap function for Firebase Hosting rewrite (high memory)
export const serveSitemap = onRequest({
    memory: "512MiB",
    cors: true,
    timeoutSeconds: 60
}, handleSitemap);

// Dedicated app function for fallback metadata injection
export const serveApp = onRequest({
    memory: "256MiB",
    cors: true
}, handleApp);

// Dedicated pusher auth function (standard memory)
export const servePusherAuth = onRequest({
    memory: "256MiB",
    cors: true
}, handlePusherAuth);

/**
 * Main 'web' entry point function.
 * Routes requests based on path to specific specialized handlers.
 */
export const web = onRequest({
    memory: "256MiB",
    cors: true
}, async (req, res) => {
    const path = req.path;

    if (path === '/stripe-webhook') {
        return handleStripeWebhook(req, res);
    }

    if (path === '/pusher/auth') {
        return handlePusherAuth(req, res);
    }

    if (path === '/sitemap.xml' || path === '/sitemap') {
        return handleSitemap(req, res);
    }

    // Default to handling as the main application (for metadata/SEO injection)
    return handleApp(req, res);
});
