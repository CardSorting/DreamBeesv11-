import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "./utils.js";

/**
 * Checks if a user or IP has exceeded a rate limit.
 * Uses a Fixed Window counter strategy in Firestore.
 * 
 * @param {string} key - Unique identifier for the limit (e.g., "ip:127.0.0.1" or "user:abc:gen_img")
 * @param {number} limit - Maximum number of requests allowed in the window
 * @param {number} windowSeconds - Duration of the window in seconds
 * @returns {Promise<void>} - Resolves if within limit, throws HttpsError if exceeded
 */
export async function checkRateLimit(key, limit, windowSeconds) {
    const db = getFirestore();
    const docId = `ratelimit_${key.replace(/[:.]/g, '_')}`;
    const docRef = db.collection('rate_limits').doc(docId);
    const now = Date.now();
    const windowMillis = windowSeconds * 1000;

    // We use a transaction to ensure atomic read-modify-write
    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(docRef);
            const data = doc.data() || {};

            let count = data.count || 0;
            let resetTime = data.resetTime || 0;

            if (now > resetTime) {
                // Window expired, reset counter
                count = 1;
                resetTime = now + windowMillis;
            } else {
                // Within window, increment
                count++;
            }

            if (count > limit) {
                throw new HttpsError('resource-exhausted', `Rate limit exceeded. Try again later.`);
            }

            t.set(docRef, {
                count: count,
                resetTime: resetTime,
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });
        });
    } catch (e) {
        // Re-throw our HttpsError, log others
        if (e.code === 'resource-exhausted') {throw e;}
        logger.error(`Rate limit system error for ${key}`, e);
        // Fail open if system errors (don't block user due to DB error)? 
        // Or fail closed? For security, maybe fail closed, but for UX, fail open is better.
        // Let's rethrow for now to be safe.
        throw new HttpsError('internal', "Rate limit check failed");
    }
}

/**
 * Checks if an IP is in the global blocklist or temporary throttle list.
 * @param {string} ip - The client's IP address
 */
export async function checkIpThrottle(ip) {
    if (!ip) {return;} // Should not happen in cloud function context, but safe guard

    const db = getFirestore();
    const cleanIp = ip.replace(/[:.]/g, '_');

    // Check specific IP blacklist (cached or DB)
    // For high scale, this should be in-memory or Redis, but Firestore is okay for now.
    const ipRef = db.collection('abuse_ip_blacklist').doc(cleanIp);
    const ipDoc = await ipRef.get();

    if (ipDoc.exists) {
        const data = ipDoc.data();
        if (data.blocked) {
            throw new HttpsError('permission-denied', "Access denied from this network.");
        }
    }

    // Global IP Rate Limit (e.g., 100 req/min/IP)
    await checkRateLimit(`global_ip:${cleanIp}`, 60, 60);
}

/**
 * Checks user-specific restrictions (shadow bans, account locks).
 * @param {string} uid - User ID
 */
export async function checkUserAbuseStatus(uid) {
    if (!uid) {return;}

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {return;} // Should handle newUser logic elsewhere

    const userData = userSnap.data();

    if (userData.isBanned) {
        throw new HttpsError('permission-denied', "Account suspended.");
    }

    if (userData.shadowBanned) {
        // Artificial delay for shadow-banned users (Penalty Box)
        // They think system is slow, preventing them from realizing they are banned
        const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3s delay
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        // Optionally fail randomly
        if (Math.random() > 0.8) {
            throw new HttpsError('unavailable', "System overload, please try again.");
        }
    }
}

/**
 * Returns the rate limit config for a specific action
 * @param {string} action 
 * @param {boolean} isPremium 
 */
export function getActionLimits(action, isPremium) {
    // Default: 20 req/min
    const limits = { limit: 20, window: 60 };

    switch (action) {
        case 'createGenerationRequest':
        case 'createVideoGenerationRequest':
        case 'createSlideshowGeneration':
            // Expensive generation actions
            limits.limit = isPremium ? 10 : 3; // 3/min for free, 10/min for premium
            limits.window = 60;
            break;

        case 'transformImage':
        case 'dressUp':
        case 'analyzeProductImage':
            limits.limit = isPremium ? 12 : 5;
            limits.window = 60;
            break;

        case 'getGenerationHistory':
        case 'getUserImages':
            // Read actions - higher limits
            limits.limit = 60;
            limits.window = 60;
            break;

        default:
            break;
    }

    return limits;
}

/**
 * Checks if user has exceeded their daily quota.
 * @param {string} uid - User ID
 * @param {string} action - The action being performed
 */
export async function checkUserQuota(uid, action) {
    if (!uid) {return;}

    // Different from rate limit (burst protection), this is cost protection.
    // Daily Window: Reset at UTC midnight or just sliding 24h.
    // Sliding 24h is easier with existing checkRateLimit.

    // Default Quotas (Daily)
    let dailyLimit = 100; // Default generous limit
    const isHighCost = ['createVideoGenerationRequest', 'createSlideshowGeneration', 'dressUp', 'analyzeProductImage'].includes(action);

    if (isHighCost) {
        dailyLimit = 20; // Stricter for expensive ops
    }

    // Check strict daily limit
    // Key: quota:uid:action
    // Window: 86400 seconds (24 hours)
    try {
        await checkRateLimit(`quota:${uid}:${action}`, dailyLimit, 86400);
    } catch (e) {
        if (e.code === 'resource-exhausted') {
            throw new HttpsError('resource-exhausted', `Daily limit reached for ${action}. Please try again tomorrow or upgrade.`);
        }
        throw e;
    }
}


/**
 * Checks the user's abuse score.
 * @param {string} uid - User ID
 */
export async function checkAbuseScore(uid) {
    if (!uid) {return;}
    const db = getFirestore();
    const scoreRef = db.collection('abuse_scores').doc(uid);
    const scoreDoc = await scoreRef.get();

    if (scoreDoc.exists) {
        const data = scoreDoc.data();
        if (data.score < 0) { // arbitrary threshold
            // If score is too low, maybe block specific high-risk actions or subject to stricter limits
            // for now, just a placeholder check logic
            if (data.score < -50) {
                throw new HttpsError('permission-denied', "Account restricted due to low trust score.");
            }
        }
    }
}

/**
 * Token Bucket Rate Limiter
 * @param {string} key - Bucket ID (e.g. "tb:user:123:gen")
 * @param {number} cost - Tokens to consume
 * @param {number} capacity - Max tokens in bucket
 * @param {number} refillRate - Tokens added per second
 */
export async function checkTokenBucket(key, cost, capacity, refillRate) {
    const db = getFirestore();
    const docRef = db.collection('rate_limits').doc(`token_bucket_${key.replace(/[:.]/g, '_')}`);
    const now = Date.now();

    await db.runTransaction(async (t) => {
        const doc = await t.get(docRef);
        const data = doc.data() || {};

        let tokens = data.tokens !== undefined ? data.tokens : capacity;
        const lastRefill = data.lastRefill || now;

        const delta = (now - lastRefill) / 1000;
        const tokensToAdd = delta * refillRate;

        tokens = Math.min(capacity, tokens + tokensToAdd);

        if (tokens < cost) {
            throw new HttpsError('resource-exhausted', "Rate limit exceeded. Please wait.");
        }

        t.set(docRef, {
            tokens: tokens - cost,
            lastRefill: now,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
    });
}

/**
 * Records a violation (e.g. rate limit hit)
 * @param {string} uid 
 * @param {string} type 
 */
export async function recordViolation(uid, type) {
    if (!uid) {return;}
    const db = getFirestore();
    await db.collection('abuse_logs').add({
        userId: uid,
        type: type,
        timestamp: FieldValue.serverTimestamp()
    });
}

/**
 * Checks and increments a cumulative limit (e.g. for cost tracking).
 * @param {string} key - Unique identifier (e.g., "cost:global:2023-10-27")
 * @param {number} increment - Amount to add (e.g., 0.05)
 * @param {number} limit - Max allowed value
 * @param {number} windowSeconds - Duration for the bucket (used for expiry)
 */
export async function checkCumulativeLimit(key, increment, limit, windowSeconds) {
    const db = getFirestore();
    const docId = `cumulative_${key.replace(/[:.]/g, '_')}`;
    const docRef = db.collection('rate_limits').doc(docId);

    // We use a transaction to ensure atomic read-modify-write
    await db.runTransaction(async (t) => {
        const doc = await t.get(docRef);
        const data = doc.data() || {};

        const currentTotal = data.total || 0;

        if (currentTotal + increment > limit) {
            throw new HttpsError('resource-exhausted', `Daily limit reached for ${key}. Limit: $${limit.toFixed(2)}`);
        }

        const now = Date.now();
        t.set(docRef, {
            total: currentTotal + increment,
            lastUpdated: FieldValue.serverTimestamp(),
            expireAt: new Date(now + windowSeconds * 1000)
        }, { merge: true });
    });
}

