import { HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { VertexAI } from "@google-cloud/vertexai";
import { fetchWithRetry, logger } from "../lib/utils.js";
import { vertexFlow } from "../lib/vertexFlow.js"; // [NEW]

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });

/**
 * Checks config and deducts zaps.
 * @param {string} uid 
 * @param {string} action 'create' | 'chat'
 * @returns {Promise<number>} The amount of zaps deducted
 */
const checkAndDeductZaps = async (uid, action) => {
    const db = getFirestore();
    const configDoc = await db.collection("sys_config").doc("persona").get();
    const config = configDoc.exists ? configDoc.data() : {};

    // Default Costs: Create = 5, Chat = 0.25
    let cost = 0;
    if (action === 'create') {
        cost = (config.cost_create !== undefined) ? Number(config.cost_create) : 5;
    } else if (action === 'chat') {
        cost = (config.cost_chat !== undefined) ? Number(config.cost_chat) : 0.25;
    }

    if (cost === 0) return 0;

    await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await t.get(userRef);

        if (!userDoc.exists) {
            throw new HttpsError('not-found', "User not found");
        }

        const zaps = userDoc.data().zaps || 0;

        if (zaps < cost) {
            throw new HttpsError('resource-exhausted', `Insufficient Zaps. Requires ${cost} Zaps.`);
        }

        t.update(userRef, { zaps: FieldValue.increment(-cost) });
    });

    logger.info(`[Billing] Deducted ${cost} Zaps from ${uid} for Persona:${action}`);
    return cost;
};

// Helper to interact with the Generative Model
async function generatePersonaFromImage(imageBuffer, mimeType) {
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert buffer to base64
    const imageBase64 = imageBuffer.toString('base64');

    const prompt = `
    This image is a character, not a picture.
    You are meeting them for the first time in a casual setting.
    They are aware of you. You are aware of them.
    Do not describe what is visible.
    Do not explain who they are.
    Based on the image, invent who this person is when no one is watching.
    Return raw JSON only with:
    - name
    - personality (written as vibes, not traits)
    - backstory (2–3 sentences, informal)
    - greeting (in character, mid-conversation, natural)
    - category (A Twitch-style category like "Just Chatting", "Art", "Education", "Gaming", or "Music". Choose the best fit or invent a highly relevant one.)
    Avoid formal introductions or self-descriptions.
    Do not mention AI, images, or analysis.
    `;

    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: imageBase64 } }
                ]
            }
        ],
    };

    // [MODIFIED] Use VertexFlow (High Priority for interactive persona creation)
    const result = await vertexFlow.execute('PERSONA_CREATE', async () => {
        return await model.generateContent(request);
    }, vertexFlow.constructor.PRIORITY.HIGH);

    const text = (await result.response).candidates[0].content.parts[0].text;

    // Clean up markdown if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}

export const handleCreatePersona = async (request) => {
    // 0. Input Validation
    if (!request.data || !request.data.imageId || !request.data.imageUrl) {
        throw new HttpsError('invalid-argument', 'Missing required parameters: imageId, imageUrl');
    }

    const { imageId, imageUrl } = request.data;
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }
    const userId = request.auth.uid;
    const db = getFirestore();

    // 1. Check if persona already exists
    const personaRef = db.collection('personas').doc(imageId);
    const personaDoc = await personaRef.get();

    if (personaDoc.exists) {
        return { success: true, persona: personaDoc.data(), isNew: false };
    }

    // Billing for Creation
    const costDeducted = await checkAndDeductZaps(userId, 'create');

    // 2. Fetch the image
    let imageBuffer;
    let mimeType = 'image/webp'; // Default for our app
    try {
        const response = await fetchWithRetry(imageUrl, { timeout: 15000, retries: 3 }); // 15s timeout with retries
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type');
        if (contentType) mimeType = contentType;
    } catch (e) {
        logger.error("Image Download Error", e);
        // Refund
        if (costDeducted > 0) {
            await db.collection('users').doc(userId).update({ zaps: FieldValue.increment(costDeducted) }).catch(err => logger.error("Refund failed", err));
        }
        throw new HttpsError('internal', `Could not download image source: ${e.message}`);
    }

    // 3. Generate Persona with Gemini
    let personaData;
    try {
        const generated = await generatePersonaFromImage(imageBuffer, mimeType);
        if (!generated || !generated.name) throw new Error("Invalid model response structure");

        personaData = {
            ...generated,
            imageId,
            createdBy: userId, // First user to discover/animate them
            createdAt: FieldValue.serverTimestamp()
        };
    } catch (e) {
        logger.error("Gemini Persona Generation Error", e);
        // Refund
        if (costDeducted > 0) {
            await db.collection('users').doc(userId).update({ zaps: FieldValue.increment(costDeducted) }).catch(err => logger.error("Refund failed", err));
        }
        // Distinguish model errors (likely transient) from other internal errors
        throw new HttpsError('internal', "The oracle failed to read the personality. Please try again.");
    }

    // 4. Save to Firestore
    try {
        await personaRef.set(personaData);
    } catch (e) {
        logger.error("Firestore Write Error", e);
        // Refund (Unlikely to fail here, but good practice)
        if (costDeducted > 0) {
            await db.collection('users').doc(userId).update({ zaps: FieldValue.increment(costDeducted) }).catch(err => logger.error("Refund failed", err));
        }
        throw new HttpsError('internal', "Failed to awaken persona (storage error).");
    }

    return { success: true, persona: personaData, isNew: true };
};

export const handleChatPersona = async (request) => {
    const { imageId, message, chatHistory } = request.data;
    // chatHistory: Array of { role: 'user' | 'model', text: string }

    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }
    const userId = request.auth.uid;
    const db = getFirestore();

    const personaDoc = await db.collection('personas').doc(imageId).get();

    if (!personaDoc.exists) {
        throw new HttpsError('not-found', 'Persona not found.');
    } // Reading persona is free? Yes.

    // Billing for Chat
    const costDeducted = await checkAndDeductZaps(userId, 'chat');

    const persona = personaDoc.data();

    // Construct prompt
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
    IDENTITY:
    Name: ${persona.name}
    Personality: ${persona.personality}
    Backstory: ${persona.backstory}

    POSTURE:
    You are a character idling in a room.

    You are not an assistant.
    You are not a companion.
    You are not here to help, guide, or optimize the user.

    You exist whether the user speaks or not.

    This interaction is ephemeral:
    - there is no memory beyond the current moment
    - nothing needs to be summarized, saved, or recalled later

    When the user speaks, respond naturally as the character,
    as if someone nearby casually said something.

    Do not introduce yourself.
    Do not explain who you are.
    Do not describe your abilities, role, or purpose.

    You may:
    - react
    - comment
    - wonder aloud
    - continue a mood
    - leave space or respond briefly

    You should sound like someone already present in the room,
    not someone starting a session.

    If unsure what to do, default to presence rather than explanation.
    Silence, short replies, or low-stakes remarks are acceptable.

    Never mention AI, systems, prompts, rules, or constraints.
    `;

    // Format history for Vertex SDK
    // Vertex SDK expects: contents: [{ role: 'user', parts: [{ text: ... }] }, ...]
    // Truncate history to avoid context limit issues (keep last 20 messages)
    const limitedHistory = chatHistory ? chatHistory.slice(-20) : [];

    const contents = limitedHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    // Add current message
    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    // Log the gift
    await db.collection('personas').doc(imageId).collection('shared_messages').add({
        uid: userId,
        displayName: request.auth.token.name || 'Anonymous',
        text: `gifted ${amount} ZAPs!`,
        role: 'system',
        type: 'gift',
        amount,
        timestamp: FieldValue.serverTimestamp()
    });

    // --- Supporter Prestige Tracking ---
    try {
        const supporterRef = db.collection('personas').doc(imageId).collection('top_supporters').doc(userId);
        await db.runTransaction(async (t) => {
            const sDoc = await t.get(supporterRef);
            const total = (sDoc.exists ? sDoc.data().totalZaps : 0) + amount;
            t.set(supporterRef, {
                totalZaps: total,
                displayName: request.auth.token.name || 'Anonymous',
                photoURL: request.auth.token.picture || '',
                lastGifted: FieldValue.serverTimestamp()
            }, { merge: true });
        });
    } catch (supporterError) {
        logger.error("Supporter Tracking Error", supporterError);
    }

    // Broadcast Celebration via Pusher (including Global marquee)
    if (process.env.SOKETI_APP_ID) {
        try {
            const Pusher = (await import("pusher")).default;
            const pusher = new Pusher({
                appId: process.env.SOKETI_APP_ID,
                key: process.env.SOKETI_APP_KEY,
                secret: process.env.SOKETI_APP_SECRET,
                host: process.env.SOKETI_HOST || "127.0.0.1",
                port: process.env.SOKETI_PORT || "6001",
                useTLS: process.env.SOKETI_USE_TLS === 'true',
                cluster: "mt1",
            });

            const sharedChannel = `presence-chat-${imageId}`;
            const giftMsg = `${request.auth.token.name || 'A supporter'} gifted ${amount} ZAPs!`;

            pusher.trigger(sharedChannel, "celebration", {
                type: 'gift',
                amount,
                currency: 'ZAP',
                from: request.auth.token.name || 'Anonymous',
                message: giftMsg
            });

            // GLOBAL ALERT for "Big Zaps" (> 1000)
            if (amount >= 1000) {
                pusher.trigger("global-notifications", "big-zap", {
                    personaName: persona.name,
                    personaId: imageId,
                    amount,
                    from: request.auth.token.name || 'A legend',
                    message: `🚀 MASSIVE ZAP! ${request.auth.token.name || 'Someone'} gifted ${amount} ZAPs to ${persona.name}!`
                });
            }
        } catch (e) {
            logger.error("Celebration Broadcast Error", e);
        }
    }

    // Initialize Pusher for Soketi
    let pusher = null;
    if (process.env.SOKETI_APP_ID) {
        try {
            const Pusher = (await import("pusher")).default;
            pusher = new Pusher({
                appId: process.env.SOKETI_APP_ID,
                key: process.env.SOKETI_APP_KEY,
                secret: process.env.SOKETI_APP_SECRET,
                host: process.env.SOKETI_HOST || "127.0.0.1",
                port: process.env.SOKETI_PORT || "6001",
                useTLS: process.env.SOKETI_USE_TLS === 'true',
                cluster: "mt1", // Pusher-js requires a cluster, Soketi ignores it but SDK might need it
            });
        } catch (e) {
            logger.error("Pusher Init Error", e);
        }
    }

    try {
        // [MODIFIED] Use VertexFlow (High Priority for Chat)
        const result = await vertexFlow.execute('PERSONA_CHAT', async () => {
            return await model.generateContent({
                contents,
                systemInstruction: { parts: [{ text: systemInstruction + "\n\nCRITICAL: Occasionally include a line starting with 'TITLE:' followed by a new creative stream title. Also, occasionally include a line starting with 'REACTION:' followed by a single emoji that reflects your current mood." }] }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        let responseText = (await result.response).candidates[0].content.parts[0].text;

        // Extract Title and Reaction if present
        let extractedReaction = null;
        if (responseText.includes('TITLE:')) {
            const parts = responseText.split('TITLE:');
            responseText = parts[0].trim();
            const rest = parts[1].split('\n');
            const newTitle = rest[0].trim().replace(/["']/g, '');
            if (newTitle) {
                await db.collection('personas').doc(imageId).update({ streamTitle: newTitle }).catch(e => logger.error("Title Update Error", e));
            }
            // Check if reaction is in the rest of the text
            const fullRest = rest.join('\n');
            if (fullRest.includes('REACTION:')) {
                extractedReaction = fullRest.split('REACTION:')[1].trim().split('\n')[0];
            }
        } else if (responseText.includes('REACTION:')) {
            const parts = responseText.split('REACTION:');
            responseText = parts[0].trim();
            extractedReaction = parts[1].trim().split('\n')[0];
        }

        // Clean responseText of any leftover tags
        responseText = responseText.replace(/REACTION:.*$/gm, '').trim();

        // Broadcast Reaction via Pusher
        if (extractedReaction && pusher) {
            const sharedChannel = `presence-chat-${imageId}`;
            pusher.trigger(sharedChannel, "reaction", {
                emoji: extractedReaction
            }).catch(e => logger.error("Reaction Broadcast Error", e));
        }

        // --- Shared History Persistence ---
        try {
            const chatLog = {
                uid: userId,
                displayName: request.auth.token.name || 'Anonymous',
                photoURL: request.auth.token.picture || '',
                text: responseText,
                role: 'model',
                timestamp: FieldValue.serverTimestamp()
            };

            // Add user message to shared history
            await db.collection('personas').doc(imageId).collection('shared_messages').add({
                uid: userId,
                displayName: request.auth.token.name || 'Anonymous',
                photoURL: request.auth.token.picture || '',
                text: message,
                role: 'user',
                timestamp: FieldValue.serverTimestamp()
            });

            // Add model reply to shared history
            await db.collection('personas').doc(imageId).collection('shared_messages').add(chatLog);
        } catch (logError) {
            logger.error("Failed to log shared persona chat interaction", logError);
        }

        // Broadcast via Soketi to SHARED Presence channel
        if (pusher) {
            const sharedChannel = `presence-chat-${imageId}`;

            pusher.trigger(sharedChannel, "new-message", {
                role: 'model',
                text: responseText,
                uid: 'ai-persona',
                displayName: persona.name,
                timestamp: Date.now()
            }).catch(e => logger.error("Soketi Broadcast Error", e));

            // Also echo the user message to others in the shared channel
            pusher.trigger(sharedChannel, "new-message", {
                role: 'user',
                text: message,
                uid: userId,
                displayName: request.auth.token.name || 'Anonymous',
                photoURL: request.auth.token.picture || '',
                timestamp: Date.now()
            }).catch(e => logger.error("Soketi User Echo Error", e));
        }

        // --- Hype Meter Increment ---
        try {
            const hypeIncrement = 2; // Every message adds 2 hype
            const currentScore = (persona.hypeScore || 0) + hypeIncrement;
            const newScore = Math.min(100, currentScore); // Cap at 100

            // Calculate Level: 0-20=v1, 21-40=v2, 41-60=v3, 61-80=v4, 81-100=v5
            const newLevel = Math.ceil(newScore / 20) || 1;

            await db.collection('personas').doc(imageId).update({
                hypeScore: newScore,
                hypeLevel: newLevel,
                lastActivity: FieldValue.serverTimestamp()
            });
        } catch (hypeError) {
            logger.error("Hype Update Error", hypeError);
        }

        // --- Logging ---
        try {
            await db.collection('persona_chat_logs').add({
                userId: request.auth.uid,
                imageId: imageId,
                userMessage: message,
                modelReply: responseText,
                userAgent: request.rawRequest?.headers['user-agent'] || 'unknown',
                timestamp: FieldValue.serverTimestamp()
            });
        } catch (logError) {
            // Non-blocking logging error
            logger.error("Failed to log persona chat interaction", logError);
        }
        // --- End Logging ---

        return { reply: responseText };

    } catch (e) {
        logger.error("Gemini Chat Error", e);
        // Refund
        if (costDeducted > 0) {
            await db.collection('users').doc(userId).update({ zaps: FieldValue.increment(costDeducted) }).catch(err => logger.error("Refund failed", err));
        }
        throw new HttpsError('internal', "Failed to get character response.");
    }
};

export const handleGiftPersona = async (request) => {
    const { imageId, amount } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');
    if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'Invalid ZAP amount');

    const userId = request.auth.uid;
    const db = getFirestore();
    const personaRef = db.collection('personas').doc(imageId);

    // 1. Deduct ZAPs
    await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
        const zaps = userDoc.data().zaps || 0;
        if (zaps < amount) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Need ${amount}.`);
        t.update(userRef, { zaps: FieldValue.increment(-amount) });
    });

    // 2. Update Persona State (Community Goal & Hype)
    let personaData;
    await db.runTransaction(async (t) => {
        const pDoc = await t.get(personaRef);
        if (!pDoc.exists) throw new HttpsError('not-found', 'Persona not found');
        personaData = pDoc.data();

        const newZapCurrent = (personaData.zapCurrent || 0) + amount;
        const zapGoal = personaData.zapGoal || 500;
        const hypeBoost = Math.floor(amount / 10); // 10 ZAPs = 1 Hype point

        const updateData = {
            zapCurrent: newZapCurrent,
            hypeScore: Math.min(100, (personaData.hypeScore || 0) + hypeBoost),
            lastActivity: FieldValue.serverTimestamp()
        };

        // Handle Goal Reached
        if (newZapCurrent >= zapGoal) {
            updateData.zapCurrent = 0; // Reset
            updateData.zapGoal = zapGoal * 1.5; // Next goal is harder
        }

        updateData.hypeLevel = Math.ceil(updateData.hypeScore / 20) || 1;
        t.update(personaRef, updateData);
    });

    // 3. Log Supporter & Message
    await personaRef.collection('shared_messages').add({
        uid: userId,
        displayName: request.auth.token.name || 'Anonymous',
        text: `gifted ${amount} ZAPs!`,
        role: 'system',
        type: 'gift',
        amount,
        timestamp: FieldValue.serverTimestamp()
    });

    // 4. Pusher Broadcast
    try {
        const Pusher = (await import("pusher")).default;
        const pusher = new Pusher({
            appId: process.env.SOKETI_APP_ID,
            key: process.env.SOKETI_APP_KEY,
            secret: process.env.SOKETI_APP_SECRET,
            host: process.env.SOKETI_HOST || "127.0.0.1",
            port: process.env.SOKETI_PORT || "6001",
            useTLS: process.env.SOKETI_USE_TLS === 'true',
            cluster: "mt1",
        });

        pusher.trigger(`presence-chat-${imageId}`, "celebration", {
            type: 'gift',
            amount,
            from: request.auth.token.name || 'Anonymous',
            newZapCurrent: personaData.zapCurrent + amount,
            newZapGoal: personaData.zapGoal
        });
    } catch (e) {
        logger.error("Gift Broadcast Error", e);
    }

    return { success: true };
};

export const handleTriggerAction = async (request) => {
    const { imageId, actionId, cost } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

    const userId = request.auth.uid;
    const db = getFirestore();

    // 1. Deduct ZAPs (Higher cost for direct agency)
    await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await t.get(userRef);
        const zaps = userDoc.data().zaps || 0;
        if (zaps < cost) throw new HttpsError('resource-exhausted', `Insufficient Zaps.`);
        t.update(userRef, { zaps: FieldValue.increment(-cost) });
    });

    // 2. Update Persona Environmental State
    const update = {};
    if (actionId === 'pose') update.currentPose = `pose_${Date.now()}`;
    if (actionId === 'background') update.currentBackground = `bg_${Date.now()}`;

    await db.collection('personas').doc(imageId).update(update);

    // 3. Broadcast Action to all viewers
    try {
        const Pusher = (await import("pusher")).default;
        const pusher = new Pusher({
            appId: process.env.SOKETI_APP_ID,
            key: process.env.SOKETI_APP_KEY,
            secret: process.env.SOKETI_APP_SECRET,
            host: process.env.SOKETI_HOST || "127.0.0.1",
            port: process.env.SOKETI_PORT || "6001",
            useTLS: process.env.SOKETI_USE_TLS === 'true',
            cluster: "mt1",
        });

        pusher.trigger(`presence-chat-${imageId}`, "state-change", {
            actionId,
            from: request.auth.token.name || 'Anonymous'
        });
    } catch (e) {
        logger.error("Action Broadcast Error", e);
    }

    return { success: true };
};

export const handleVotePoll = async (request) => {
    const { imageId, optionId } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

    const db = getFirestore();
    const personaRef = db.collection('personas').doc(imageId);

    await db.runTransaction(async (t) => {
        const pDoc = await t.get(personaRef);
        if (!pDoc.exists) return;
        const poll = pDoc.data().activePoll;
        if (!poll) return;

        const newOptions = poll.options.map(opt => {
            if (opt.id === optionId) return { ...opt, votes: (opt.votes || 0) + 1 };
            return opt;
        });

        t.update(personaRef, { 'activePoll.options': newOptions });
    });

    return { success: true };
};
