
import { db } from "../firebaseInit.js";
import { logger } from "./utils.js";
import crypto from "crypto";

/**
 * Hashes an API Key for storage.
 * Uses SHA-256.
 * @param {string} key - The full key (e.g. sk_live_123...)
 * @returns {string} - The hex hash
 */
export function hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validates an API Key provided in headers.
 * Looks for keys in the `api_keys` collection.
 * 
 * We assume the storage model:
 * Collection: `api_keys`
 * Doc ID: `sk_live_<HASH>` (To allow O(1) lookup preventing full scans)
 * Fields: { uid: string, status: 'active', ... }
 * 
 * @param {string} apiKey - The raw API key (e.g. sk_live_12345)
 * @returns {Promise<{uid: string, scope: string[]}>} - The user context
 */
export async function validateApiKey(apiKey) {
    if (!apiKey) { return null; }

    // 1. Basic format check
    if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
        logger.warn(`[Auth] Invalid API Key format.`);
        return null;
    }

    try {
        // 2. Hash the input key to find the document
        // Strategy: We store the key as doc ID "prefix + hash"
        const prefix = apiKey.split('_')[1]; // live or test
        const hash = hashKey(apiKey);
        const docId = `sk_${prefix}_${hash}`;

        const keyDoc = await db.collection('api_keys').doc(docId).get();

        if (!keyDoc.exists) {
            logger.warn(`[Auth] API Key not found (Hash mismatch).`);
            return null;
        }

        const data = keyDoc.data();

        if (data.status !== 'active') {
            logger.warn(`[Auth] API Key is ${data.status}.`);
            return null;
        }

        // Update usage stats (fire and forget)
        keyDoc.ref.update({ lastUsed: new Date() }).catch(() => { });

        logger.info(`[Auth] API Key authenticated for user: ${data.uid}`);

        return {
            uid: data.uid,
            scope: data.scope || ['default']
        };

    } catch (error) {
        logger.error(`[Auth] Error validating API Key:`, error);
        return null;
    }
}
