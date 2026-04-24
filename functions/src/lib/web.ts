"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.web = void 0;
const https_1 = require("firebase-functions/v2/https");
const stripeHandler_js_1 = require("./handlers/web/stripeHandler.js");
const pusherHandler_js_1 = require("./handlers/web/pusherHandler.js");
const sitemapHandler_js_1 = require("./handlers/web/sitemapHandler.js");
const appHandler_js_1 = require("./handlers/web/appHandler.js");
/**
 * Unified 'web' entry point.
 * Handles App Metadata (SEO), Sitemap generation, Stripe Webhooks, and Pusher Auth.
 * Memory and timeout are boosted to accommodate sitemap generation for large collections.
 */
exports.web = (0, https_1.onRequest)({
    memory: "512MiB",
    cors: true,
    timeoutSeconds: 60
}, async (req, res) => {
    const path = req.path;
    // 1. Stripe Webhooks
    if (path === '/stripe-webhook') {
        return (0, stripeHandler_js_1.handleStripeWebhook)(req, res);
    }
    // 2. Pusher/Soketi Authentication
    if (path === '/pusher/auth') {
        return (0, pusherHandler_js_1.handlePusherAuth)(req, res);
    }
    // 3. XML Sitemap handling
    if (path === '/sitemap.xml' || path === '/sitemap') {
        return (0, sitemapHandler_js_1.handleSitemap)(req, res);
    }
    // 4. Default: Handle as App Metadata / SEO Injection
    return (0, appHandler_js_1.handleApp)(req, res);
});
//# sourceMappingURL=web.js.map