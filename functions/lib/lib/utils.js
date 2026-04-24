import { B2_ENDPOINT, B2_REGION, B2_BUCKET, B2_KEY_ID, B2_APP_KEY, B2_PUBLIC_URL } from "./constants.js";
import crypto from 'crypto';
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
/**
 * Tries multiple URLs in order, falling back to the next one if the current one is busy (429) or fails (5xx).
 * Returns the successful response and the URL that succeeded.
 */
export async function fetchWithFallback(urls, options = {}) {
    if (!urls || !urls.length) {
        throw new Error("No URLs provided for fallback");
    }
    const { retries = 3, ...fetchOptions } = options;
    let lastErr;
    for (let i = 0; i < urls.length; i++) {
        try {
            // For all but the last URL, try once (with retries=1) to fail over quickly
            const tryRetries = (i === urls.length - 1) ? retries : 1;
            const response = await fetchWithRetry(urls[i], { ...fetchOptions, retries: tryRetries });
            return { response, url: urls[i] };
        }
        catch (err) {
            lastErr = err;
            const isTransient = err.message.includes("429") || err.message.includes("5xx") || err.message.includes("status 5") || err.message.includes("timeout") || err.message.includes("Request failed");
            if (isTransient && i < urls.length - 1) {
                logger.warn(`Fallback: URL ${urls[i]} failed or busy. Trying next endpoint.`, { error: err.message });
                continue;
            }
            throw err;
        }
    }
    throw lastErr;
}
export async function verifyB2FilesExist(originalFilename, thumbFilename) {
    const result = { imageUrl: null, thumbnailUrl: null };
    try {
        const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();
        if (originalFilename) {
            try {
                await s3.send(new HeadObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename }));
                result.imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
            }
            catch { /* ignore */ }
        }
        if (thumbFilename) {
            try {
                await s3.send(new HeadObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename }));
                result.thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;
            }
            catch { /* ignore */ }
        }
    }
    catch (error) {
        logger.error("B2 Verification Failed", error);
    }
    return result;
}
export const detectImageFormat = (buffer) => {
    if (buffer.length < 4) {
        return null;
    }
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    // WebP: RIFF...WEBP
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
    }
    return null;
};
export const readFirstBytes = async (responseToRead, numBytes = 12) => {
    const arrayBuffer = await responseToRead.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return null;
    }
    const buffer = Buffer.from(arrayBuffer);
    return buffer.slice(0, Math.min(numBytes, buffer.length));
};
export function getPromptHash(prompt) {
    return crypto.createHash('sha256').update(prompt.trim().toLowerCase()).digest('hex');
}
export function getPromptMetadata(prompt) {
    const clean = prompt.trim();
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = clean.match(emojiRegex) || [];
    return {
        length: clean.length,
        wordCount: clean.split(/\s+/).filter(Boolean).length,
        emojiCount: emojis.length,
        hasNegativeModifiers: /low quality|bad|ugly|deformed/i.test(clean)
    };
}
export function findPrimaryUrl(output) {
    if (!output) {
        return null;
    }
    // 1. Direct string
    if (typeof output === 'string') {
        const cleanOutput = output.trim();
        if (cleanOutput.startsWith('http')) {
            // Check for common media extensions or replicate/s3 patterns
            if (cleanOutput.includes('replicate.delivery') ||
                cleanOutput.match(/\.(webp|png|jpg|jpeg|gif)/i) ||
                cleanOutput.includes('b2.content') ||
                cleanOutput.includes('amazonaws.com')) {
                return cleanOutput;
            }
        }
    }
    // 2. Array: recurse on all elements until a URL is found
    if (Array.isArray(output) && output.length > 0) {
        for (const item of output) {
            const found = findPrimaryUrl(item);
            if (found) {
                return found;
            }
        }
        return null; // None found in array
    }
    // 3. Object: recurse on known properties first, then exhaustive scan
    if (typeof output === 'object') {
        const keys = Object.keys(output);
        // Known keys strategy (prioritize common keys)
        const priorityKeys = ['output', 'url', 'result', 'data'];
        for (const key of priorityKeys) {
            if (output[key]) {
                const found = findPrimaryUrl(output[key]);
                if (found) {
                    return found;
                }
            }
        }
        // Exhaustive scan (fallback)
        for (const key of keys) {
            if (!priorityKeys.includes(key)) {
                const found = findPrimaryUrl(output[key]);
                if (found) {
                    return found;
                }
            }
        }
    }
    return null;
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