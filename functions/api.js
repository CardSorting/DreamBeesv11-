import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "./firebaseInit.js";
import { handleError, logger } from "./lib/utils.js";

import {
    checkIpThrottle,
    checkUserAbuseStatus,
    checkUserQuota,
    checkTokenBucket,
    checkAbuseScore,
    recordViolation
} from "./lib/abuse.js";

// -- Imports from Handlers --
import * as Generation from "./handlers/generation.js";
import * as Transformation from "./handlers/transformation.js";
import * as Data from "./handlers/data.js";
import * as Billing from "./handlers/billing.js";
import * as Persona from "./handlers/persona.js";
import * as Mockup from "./handlers/mockup.js";
import * as Meme from "./handlers/meme.js";
import * as Ecommerce from "./handlers/ecommerce.js";
import * as Avatar from "./handlers/avatars.js";
import * as ColorCraft from "./handlers/colorCraft.js";

// ============================================================================

// Main API Dispatcher
// ============================================================================

export const api = onCall({ memory: "512MiB", timeoutSeconds: 300 }, async (request) => {
    logger.info(`[API] Incoming request: action=${request.data?.action}, uid=${request.auth?.uid}`);

    // Basic App Check logging (Warn Mode)
    if (!process.env.FUNCTIONS_EMULATOR && request.app == undefined) {
        logger.warn("App Check verification failed. Proceeding (Warn Mode).", { uid: request.auth?.uid });
    }

    const { action } = request.data;
    const uid = request.auth?.uid;
    const clientIp = request.rawRequest?.ip || "unknown";

    console.log(`[API_DEBUG] action=${action}, uid=${uid}, IP=${clientIp}`);

    try {
        // --- 0. Pre-Flight Actions (Bypass Abuse Checks) ---
        if (action === 'initializeUser') {
            if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in.');

            try {
                console.log(`[INIT_DEBUG] Step 1: Creating reference to users/${uid}`);
                const userRef = db.collection('users').doc(uid);

                console.log(`[INIT_DEBUG] Step 2: Attempting to read document...`);
                const userSnap = await userRef.get();
                console.log(`[INIT_DEBUG] Step 3: Read successful. Exists: ${userSnap.exists}`);

                if (!userSnap.exists) {
                    console.log(`[INIT_DEBUG] Step 4: Creating user doc for ${uid}`);
                    await userRef.set({
                        uid,
                        email: request.auth.token.email || "",
                        displayName: request.auth.token.name || "",
                        photoURL: request.auth.token.picture || "",
                        birthday: request.data.birthday || null,
                        createdAt: new Date(),
                        zaps: 10,
                        reels: 0,
                        subscriptionStatus: 'inactive',
                        role: 'user'
                    });
                    console.log(`[INIT_DEBUG] Step 5: User doc created successfully`);
                } else {
                    console.log(`[INIT_DEBUG] User doc already exists for ${uid}`);
                }
                return { success: true };
            } catch (initError) {
                console.error(`[INIT_DEBUG] FAILED at Firestore operation:`, {
                    errorMessage: initError.message,
                    errorCode: initError.code,
                    errorName: initError.name,
                    projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'unknown'
                });
                throw initError;
            }
        }

        // --- 1. IP Level Protection ---
        await checkIpThrottle(clientIp);

        // --- 2. User Level Protection ---
        // --- 2. User Level Protection & JIT Init ---
        if (uid) {
            // JIT User Initialization (replaces auth trigger)
            // We use a latch-like check: if abuse score check passes, we assume user exists or we check lightly.
            // But to be safe, let's just do a merge set on critical actions or just check existence efficiently.
            // Optimally, we only need to do this once.

            // To avoid reading user doc on EVERY call if possible, we could rely on client, 
            // but for safety and trigger-removal, we should ensure it exists.
            // Since we often read user doc in handlers anyway (allowance etc), let's rely on handlers 
            // OR do a quick check here if it's a new user. 
            // Actually, `checkUserAbuseStatus` reads the user doc! 
            // Let's modify `checkUserAbuseStatus` or handle it here.

            // Let's ensure user doc exists precisely here
            const userRef = db.collection('users').doc(uid);
            // We can't afford a GET on every request just for this if we can help it, 
            // but `checkUserAbuseStatus` likely fetches it.
            // Let's just do a set({ ... }, { merge: true }) for basic fields if we suspect they are new? 
            // No, that's too many writes.

            // BETTER STRATEGY: 
            // `checkUserAbuseStatus` in `lib/abuse.js` reads the doc. 
            // If it returns null/empty, we init the user.

            // Let's Peek at `checkUserAbuseStatus`... 
            // For now, I will implement a safe idempotent init here.
            const userSnap = await userRef.get();
            if (!userSnap.exists) {
                logger.info(`[JIT] User ${uid} not found. Creating new user document...`);
                try {
                    await userRef.set({
                        uid,
                        email: request.auth.token.email || "",
                        displayName: request.auth.token.name || "",
                        photoURL: request.auth.token.picture || "",
                        createdAt: new Date(),
                        zaps: 10,
                        reels: 0,
                        subscriptionStatus: 'inactive',
                        role: 'user'
                    });
                    logger.info(`[JIT] User ${uid} created successfully.`);
                } catch (creationError) {
                    logger.error(`[JIT] Failed to create user ${uid}:`, creationError);
                    throw creationError;
                }
            } else {
                // logger.debug(`[JIT] User ${uid} already exists.`);
            }

            await checkUserAbuseStatus(uid); // This might re-read, but it's safe.
            await checkAbuseScore(uid);

            // Token Bucket checks
            const isExpensive = ['createVideoGenerationRequest', 'createSlideshowGeneration'].includes(action);
            const bucketCapacity = isExpensive ? 3 : 10;
            const refillRate = isExpensive ? 0.05 : 0.5;
            await checkTokenBucket(`tb:${uid}:${action}`, 1, bucketCapacity, refillRate);

            await checkUserQuota(uid, action);
        }

        switch (action) {
            // Generation
            case 'createGenerationRequest': return Generation.handleCreateGenerationRequest(request);
            case 'createVideoGenerationRequest': return Generation.handleCreateVideoGenerationRequest(request);
            case 'dressUp': return Generation.handleCreateDressUpRequest(request);
            case 'createSlideshowGeneration': return Generation.handleCreateSlideshowGeneration(request);
            case 'generateVideoPrompt': return Generation.handleGenerateVideoPrompt(request);

            // Transformation & AI
            case 'createAnalysisRequest': return Transformation.handleCreateAnalysisRequest(request);
            case 'createEnhanceRequest': return Transformation.handleCreateEnhanceRequest(request);
            case 'transformPrompt': return Transformation.handleTransformPrompt(request);
            case 'transformImage': return Transformation.handleTransformImage(request);
            case 'generateLyrics': return Transformation.handleGenerateLyrics(request);
            case 'meowaccTransform': return Transformation.handleMeowaccTransform(request);

            // Billing
            case 'createStripeCheckout': return Billing.handleCreateStripeCheckout(request);
            case 'createStripePortalSession': return Billing.handleCreateStripePortalSession(request);

            // Mockup Studio
            case 'generateMockup': return Mockup.handleGenerateMockup(request);
            case 'gachaSpin': return Mockup.handleGachaSpin(request);
            case 'generateMockupItem': return Mockup.handleGenerateMockupItem(request);

            // Meme Formatter
            case 'formatMeme': return Meme.handleFormatMeme(request);

            // Ecommerce / AutoCSV
            case 'analyzeProductImage': return Ecommerce.handleAnalyzeProductImage(request);

            // ColorCraft
            case 'createBookConcepts': return ColorCraft.handleCreateBookConcepts(request);
            case 'createColoringPage': return ColorCraft.handleCreateColoringPage(request);

            // Avatar Forge
            case 'generateAvatarCollection': return Avatar.handleGenerateAvatarCollection(request);
            case 'mintRandomAvatar': return Avatar.handleMintRandomAvatar(request);

            // Data & Ratings
            case 'getGenerationHistory': return Data.handleGetGenerationHistory(request);
            case 'getImageDetail': return Data.handleGetImageDetail(request);
            case 'getUserImages': return Data.handleGetUserImages(request);
            case 'rateGeneration': return Data.handleRateGeneration(request);
            case 'moderationVote': return Data.handleModerationVote(request);
            case 'appealGeneration': return Data.handleAppealGeneration(request);
            case 'rateShowcaseImage': return Data.handleRateShowcaseImage(request);
            case 'deleteImage': return Data.handleDeleteImage(request);
            case 'deleteImagesBatch': return Data.handleDeleteImagesBatch(request);
            case 'createPersona': return Persona.handleCreatePersona(request);
            case 'chatPersona': return Persona.handleChatPersona(request);
            case 'giftPersona': return Persona.handleGiftPersona(request);
            case 'triggerAction': return Persona.handleTriggerAction(request);
            case 'votePoll': return Persona.handleVotePoll(request);

            case 'toggleBookmark': return Data.handleToggleBookmark(request);
            case 'toggleLike': return Data.handleToggleLike(request);

            default:
                throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
        }
    } catch (error) {
        console.error("[CRITICAL_BACKEND_ERROR]", {
            message: error.message,
            code: error.code,
            details: error.details,
            metadata: error.metadata ? error.metadata.getMap() : null,
            stack: error.stack
        });
        if (error.code === 'resource-exhausted' && uid) {
            recordViolation(uid, 'rate_limit_exceeded').catch(e => logger.error("Failed to record violation", e));
        }
        throw handleError(error, { action, uid });
    }
});

// ============================================================================
// Webhooks & HTTP Triggers (Kept here for now)
// ============================================================================

// Webhooks & HTTP Triggers are now in `web.js`
