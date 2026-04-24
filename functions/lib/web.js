import { onRequest } from "firebase-functions/v2/https";
import { handleStripeWebhook } from "./handlers/web/stripeHandler.js";
import { handleSitemap } from "./handlers/web/sitemapHandler.js";
import { handleApp } from "./handlers/web/appHandler.js";
import { handleOpenAiChat } from "./handlers/web/openaiHandler.js";
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
    // 3. OpenAI Chat Completions SDK Compatibility
    if (path === '/v1/chat/completions') {
        return handleOpenAiChat(req, res);
    }
    // 3.5. Production Hardened Proxy for Discord Bot (GCE Instance)
    if (path.startsWith('/tasks/')) {
        // ENFORCED SECURITY: Only POST methods are allowed for task processing
        if (req.method !== 'POST') {
            return res.status(405).send({ error: "Method Not Allowed", detail: "Cloud Task callbacks must be POST" });
        }
        const upstreamBase = process.env.BOT_UPSTREAM_URL || 'http://34.56.215.150:8080';
        const botUrl = `${upstreamBase}${path}`;
        logger.info(`[Proxy] Forwarding task to bot`, { path, upstream: upstreamBase });
        try {
            // HEADER SCRUBBING: Forward only identity and content headers to minimize exposure
            const headers = {};
            if (req.headers['authorization'])
                headers['authorization'] = req.headers['authorization'];
            if (req.headers['content-type'])
                headers['content-type'] = req.headers['content-type'];
            if (req.headers['x-cloudtasks-queuename'])
                headers['x-cloudtasks-queuename'] = req.headers['x-cloudtasks-queuename'];
            const response = await fetchWithTimeout(botUrl, {
                method: 'POST',
                headers,
                // Re-serializing the already-parsed body ensures clean delivery to the bot
                body: JSON.stringify(req.body),
                timeout: 30000 // 30s Hard Timeout for upstream bot
            });
            res.status(response.status);
            const contentType = response.headers.get('content-type');
            if (contentType)
                res.setHeader('content-type', contentType);
            return res.send(await response.text());
        }
        catch (err) {
            logger.error(`[Proxy] Upstream delivery failure`, err, { botUrl });
            return res.status(502).send({
                error: "Upstream Bot Unreachable",
                message: "The Hive Node is currently disconnected or overloaded.",
                detail: err.message
            });
        }
    }
    // 4. Default: Handle as App Metadata / SEO Injection
    return handleApp(req, res);
});
//# sourceMappingURL=web.js.map