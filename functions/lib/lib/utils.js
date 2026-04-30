import { B2_ENDPOINT, B2_REGION, B2_KEY_ID, B2_APP_KEY } from "./constants.js";
import { HttpsError } from "firebase-functions/v2/https";
// ===========================================
// Structured Logging & Error Handling
// ===========================================
export const logger = {
    info: (message, context = {}) => {
        console.log(JSON.stringify({ severity: 'INFO', message, ...context, timestamp: new Date().toISOString() }));
    },
    warn: (message, context = {}) => {
        console.warn(JSON.stringify({ severity: 'WARNING', message, ...context, timestamp: new Date().toISOString() }));
    },
    error: (message, error, context = {}) => {
        console.error(JSON.stringify({
            severity: 'ERROR',
            message,
            error: error?.message || String(error),
            stack: error?.stack,
            ...context,
            timestamp: new Date().toISOString()
        }));
    }
};
export const handleError = (error, context = {}) => {
    // 1. Log with full context
    logger.error("Operation Failed", error, context);
    // 2. Pass through existing HttpsErrors
    if (error instanceof HttpsError) {
        return error;
    }
    // 3. Classify external errors (e.g., Stripe, AWS, AI Models)
    const msg = error.message?.toLowerCase() || "";
    // Resource Exhausted / Quota
    if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("exhausted")) {
        return new HttpsError('resource-exhausted', "Service temporarily unavailable due to load or limits.", error);
    }
    // Timeouts
    if (msg.includes("timeout") || msg.includes("deadline")) {
        return new HttpsError('deadline-exceeded', "The operation timed out. Please try again.", error);
    }
    // Auth/Permissions (generic catch from libraries)
    if (msg.includes("unauthorized") || msg.includes("forbidden") || msg.includes("permission") || msg.includes("insufficient")) {
        return new HttpsError('permission-denied', "Action not authorized or insufficient permissions.", error);
    }
    // Default to Internal (obfuscated for security, but logged above)
    return new HttpsError('internal', "An unexpected internal error occurred. Our team has been notified.");
};
// S3 Client Singleton (Lazy Loaded)
let s3ClientInstance = null;
export const getS3Client = async () => {
    if (!s3ClientInstance) {
        const { S3Client } = await import("@aws-sdk/client-s3");
        s3ClientInstance = new S3Client({
            endpoint: B2_ENDPOINT,
            region: B2_REGION,
            credentials: {
                accessKeyId: B2_KEY_ID,
                secretAccessKey: B2_APP_KEY,
            },
        });
    }
    return s3ClientInstance;
};
export async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 60000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export async function retryOperation(operation, options = {}) {
    const { retries = 3, backoff = 1000, factor = 2, maxBackoff = 10000, context = "" } = options;
    let attempt = 0;
    while (attempt <= retries) {
        try {
            return await operation();
        }
        catch (error) {
            attempt++;
            if (attempt > retries) {
                throw error;
            }
            const delay = Math.min(backoff * Math.pow(factor, attempt - 1), maxBackoff);
            // Add jitter
            const jitter = Math.random() * 200;
            logger.warn(`Retry (${attempt}/${retries}) for ${context || 'operation'}: ${error.message}. Waiting ${Math.round(delay + jitter)}ms.`);
            await sleep(delay + jitter);
        }
    }
    throw new Error("Retry operation failed unexpectedly");
}
export async function fetchWithRetry(resource, options = {}) {
    const { retries = 3, backoff = 1000, ...fetchOptions } = options;
    return retryOperation(async () => {
        const response = await fetchWithTimeout(resource, fetchOptions);
        // Throw for 5xx errors to trigger retry
        if (response.status >= 500 || response.status === 429) {
            const body = await response.text().catch(() => "No body");
            throw new Error(`Request failed with status ${response.status}: ${body}`);
        }
        return response;
    }, { retries, backoff, context: `fetch ${resource}` });
}
export function slugify(text) {
    if (!text) {
        return "";
    }
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
//# sourceMappingURL=utils.js.map