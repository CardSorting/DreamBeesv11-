
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";
import { hashKey } from "../lib/apiKey.js";
import crypto from "crypto";

// --- CREATE API KEY ---
export const handleCreateApiKey = async (request) => {
    const { name, scope } = request.data;
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Login required'); }
    // const validScopes = ['default', 'agent:read', 'agent:write']; // Allowable scopes

    // Generate Secure Random Key
    const randomBytes = crypto.randomBytes(24).toString('hex'); // 48 chars
    const prefix = 'sk_live_';
    const rawKey = `${prefix}${randomBytes}`;

    // Hash it for identifying the document
    const hash = hashKey(rawKey);
    const docId = `sk_live_${hash}`;

    const newKeyData = {
        uid: request.auth.uid,
        name: name || "Unnamed Key",
        prefix: prefix,
        lastChars: rawKey.slice(-4), // For UI display
        scope: scope || ['default'],
        createdAt: new Date(),
        status: 'active',
        lastUsed: null
    };

    // Save to global collection
    await db.collection('api_keys').doc(docId).set(newKeyData);

    logger.info(`[Auth] Generated new API Key for ${request.auth.uid}: ${name}`);

    // Return the RAW key only once
    return {
        success: true,
        key: rawKey,
        meta: newKeyData
    };
};

// --- LIST API KEYS ---
export const handleListApiKeys = async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Login required'); }

    // Query keys where uid matches
    // NOTE: This requires a composite index or simple index on `uid`
    const snapshot = await db.collection('api_keys')
        .where('uid', '==', request.auth.uid)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .get();

    const keys = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
            id: doc.id,
            name: d.name,
            prefix: d.prefix,
            lastChars: d.lastChars,
            createdAt: d.createdAt,
            lastUsed: d.lastUsed,
            scope: d.scope
        };
    });

    return { keys };
};

// --- REVOKE API KEY ---
export const handleRevokeApiKey = async (request) => {
    const { keyId } = request.data; // This is the DOC ID (sk_live_HASH), not the raw key
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Login required'); }

    const keyRef = db.collection('api_keys').doc(keyId);
    const doc = await keyRef.get();

    if (!doc.exists) {
        throw new HttpsError('not-found', 'Key not found');
    }

    if (doc.data().uid !== request.auth.uid) {
        throw new HttpsError('permission-denied', 'Not your key');
    }

    await keyRef.update({ status: 'revoked', revokedAt: new Date() });

    logger.info(`[Auth] Revoked API Key ${keyId} for user ${request.auth.uid}`);

    return { success: true };
};
