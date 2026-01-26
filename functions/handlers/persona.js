import { HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions"; // Added
import { logger, fetchWithRetry } from "../lib/utils.js";
import { vertexFlow } from "../lib/vertexFlow.js"; // Kept for creation logic

// Import new modules
import * as Billing from "../lib/persona/billing.js";
import * as Context from "../lib/persona/context.js";
import * as Broadcaster from "../lib/persona/broadcaster.js";
import * as Brain from "../lib/persona/brain.js";
import * as Store from "../lib/persona/store.js";
import * as Voice from "../lib/persona/voice.js";
import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });
const db = getFirestore();

// --- HANDLE CHAT PERSONA ---
export const handleChatPersona = async (request) => {
    const { imageId, message, chatHistory } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

    const userId = request.auth.uid;
    const userName = request.auth.token.name || 'Anonymous';
    const userPhoto = request.auth.token.picture || '';

    // 0. Load Persona
    const personaDoc = await db.collection('personas').doc(imageId).get();
    if (!personaDoc.exists) throw new HttpsError('not-found', 'Persona not found.');
    const persona = personaDoc.data();

    // 1. Billing
    const costDeducted = await Billing.checkAndDeductZaps(userId, 'chat');

    try {
        // 2. Broadcast User Message (Immediate)
        const userMsgData = {
            uid: userId,
            displayName: userName,
            photoURL: userPhoto,
            text: message,
            role: 'user'
        };

        await Store.saveMessage(imageId, userMsgData);
        await Broadcaster.broadcastMessage(imageId, userMsgData);

        // 3. Rate Limiting (Streamer Breath)
        const currentHype = persona.hypeLevel || 1;
        const COOLDOWN_MS = 3000 + ((currentHype - 1) * 1000);
        const lastActivity = persona.lastActivity?.toMillis() || 0;
        const timeSinceLast = Date.now() - lastActivity;

        if (timeSinceLast < COOLDOWN_MS) {
            logger.info(`[Persona] Rate Limited. Skipping generation.`);

            // "The Nod" (Instant Reaction)
            const lowerMsg = message.toLowerCase();
            let reactionEmoji = null;
            if (lowerMsg.includes('lol') || lowerMsg.includes('lmao')) reactionEmoji = '😂';
            else if (lowerMsg === 'w') reactionEmoji = '🔥';
            else if (lowerMsg === 'l') reactionEmoji = '💀';
            else if (lowerMsg.includes('love') || lowerMsg.includes('<3')) reactionEmoji = '💜';
            else if (lowerMsg.includes('?')) reactionEmoji = '🤔';

            if (reactionEmoji) {
                await Broadcaster.broadcastReaction(imageId, reactionEmoji);
            }
            return { reply: null, status: 'listening' };
        }

        // 4. Gather Context
        // 4. Gather Context
        const [serverHistory, supporterData, relationshipContext, loreContext] = await Promise.all([
            Context.fetchServerHistory(imageId),
            Context.fetchSupporters(imageId),
            Context.fetchUserMemory(imageId, userId, userName),
            Context.fetchLore(imageId)
        ]);

        const historyWithVIPs = serverHistory.map(msg => {
            // Apply VIP tags locally for the prompt model
            let text = msg.text;
            if (msg.role === 'user' && supporterData.vipIds.has(msg.uid)) {
                text = `[VIP] ${text}`;
            }
            // Prefix name for User role to help model distinguish
            if (msg.role === 'user') {
                text = `[${msg.displayName}]: ${text}`;
            }
            return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text }] };
        });

        // Formatted current message
        const currentMsgFormatted = {
            role: 'user',
            parts: [{ text: `[${userName}]: ${message}` }]
        };

        // 5. Construct Prompt
        let systemPrompt = Brain.constructSystemPrompt(persona, {
            hypeLevel: currentHype,
            currentVibe: persona.currentVibe,
            supporterContext: supporterData.context,
            relationshipContext,
            loreContext
        });

        // Engagement Hook
        // Engagement Hook (MOVED TO BRAIN.JS via CURRENT MISSION)
        // We still keep the CRITICAL instructions for formatting relative to tool usage instructions,
        // although brain.js output format should cover it. Let's keep the tool instructions just in case
        // but remove the "Ask a provocative question" part since the MicroGoal covers it.

        systemPrompt += "\n\nCRITICAL: Occasionally include a line starting with 'TITLE:' followed by a new creative stream title. Also, occasionally include a line starting with 'REACTION:' followed by a single emoji.";

        // 6. Generate (The Brain)
        const generatedText = await Brain.generateResponse(systemPrompt, historyWithVIPs, currentMsgFormatted);

        // 7. Extract & Process Metadata
        const { cleanText, metadata } = Brain.extractMetadata(generatedText);

        // 8. Execute Side Effects
        const updates = {};
        if (metadata.title) await Store.updatePersonaState(imageId, { streamTitle: metadata.title });
        if (metadata.poll) await Store.updatePersonaState(imageId, { activePoll: metadata.poll });
        if (metadata.vibe) {
            await Store.updatePersonaState(imageId, { currentVibe: metadata.vibe });
            // Alert chat that the "vibe" has shifted
            await Broadcaster.broadcastStateChange(imageId, 'vibe-shift', 'AI Director');
        }

        if (metadata.action) {
            if (metadata.action.startsWith('pose_')) updates.currentPose = metadata.action;
            if (metadata.action.startsWith('bg_')) updates.currentBackground = metadata.action;
            if (Object.keys(updates).length > 0) await Store.updatePersonaState(imageId, updates);

            await Broadcaster.broadcastStateChange(imageId, metadata.action, 'AI Director');
        }

        if (metadata.memory) {
            await Store.saveUserMemory(imageId, userId, metadata.memory);
        }

        if (metadata.lore) {
            await Store.saveLore(imageId, metadata.lore);
        }

        // 9. Persist & Broadcast AI Reply
        // DECOUPLED: Voice generation is now an async background task (VoiceWorker)
        const aiMsgData = {
            uid: 'ai-persona',
            displayName: persona.name,
            photoURL: persona.photoURL || '',
            text: cleanText,
            role: 'model',
            audioJobId: null // Client waits for update
        };

        const msgRef = await Store.saveMessage(imageId, aiMsgData);
        await Broadcaster.broadcastMessage(imageId, aiMsgData);

        // Enqueue Voice Task if DNA exists
        if (persona.voice_dna) {
            const queue = getFunctions().taskQueue("locations/us-central1/functions/voiceWorker");
            await queue.enqueue({
                taskType: 'voice',
                imageId: imageId,
                messageId: msgRef.id,
                text: cleanText,
                voiceDna: persona.voice_dna,
                emotion: metadata.emotion
            });
            logger.info(`[Persona] Voice Task Enqueued for msg: ${msgRef.id}`);
        }

        if (metadata.reaction) await Broadcaster.broadcastReaction(imageId, metadata.reaction);
        if (metadata.poll) await Broadcaster.broadcastPoll(imageId, metadata.poll);

        // 10. Hype Management
        const hypeIncrement = 2;
        const newScore = Math.min(100, (persona.hypeScore || 0) + hypeIncrement);
        const newLevel = Math.ceil(newScore / 20) || 1;
        await Store.updatePersonaState(imageId, {
            hypeScore: newScore,
            hypeLevel: newLevel,
            lastActivity: FieldValue.serverTimestamp()
        });

        await Store.logInteraction({
            userId,
            imageId,
            userMessage: message,
            modelReply: cleanText,
            thought: metadata.thought || null
        });

        return { reply: cleanText };

    } catch (e) {
        logger.error("Chat Error", e);
        if (costDeducted > 0) await Billing.refundZaps(userId, costDeducted);
        throw new HttpsError('internal', "Failed to get character response.");
    }
};

// --- HANDLE CREATE PERSONA ---
async function generatePersonaFromImage(imageBuffer, mimeType) {
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const imageBase64 = imageBuffer.toString('base64');

    const promptFull = `
    This image is a character, not a picture.
    You are meeting them for the first time in a casual setting.
    They are aware of you. You are aware of them.
    Do not describe what is visible.
    Do not explain who they are.
    Based on the image, invent who this person is when no one is watching.
    Return raw JSON only with:
    - name
    - personality (written as vibes, not traits)
    - backstory (2 to 3 sentences, informal)
    - greeting (in character, mid-conversation, natural)
    - category (A Twitch-style category like "Just Chatting", "Art", "Education", "Gaming", or "Music". Choose the best fit or invent a highly relevant one.)
    - voice_dna (A detailed description of their voice including timbre, pitch, speed, and accent for a TTS model. Example: "A deep, resonant male voice with a slight British accent.")
    Avoid formal introductions or self-descriptions.
    Do not mention AI, images, or analysis.
    `;

    const request = {
        contents: [{ role: 'user', parts: [{ text: promptFull }, { inlineData: { mimeType: mimeType, data: imageBase64 } }] }]
    };

    const result = await vertexFlow.execute('PERSONA_CREATE', async () => {
        return await model.generateContent(request);
    }, vertexFlow.constructor.PRIORITY.HIGH);

    const text = (await result.response).candidates[0].content.parts[0].text;
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}

export const handleCreatePersona = async (request) => {
    if (!request.data || !request.data.imageId || !request.data.imageUrl) {
        throw new HttpsError('invalid-argument', 'Missing parameters');
    }
    const { imageId, imageUrl } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const userId = request.auth.uid;

    const personaRef = db.collection('personas').doc(imageId);
    const doc = await personaRef.get();
    if (doc.exists) return { success: true, persona: doc.data(), isNew: false };

    const cost = await Billing.checkAndDeductZaps(userId, 'create');

    try {
        let imageBuffer;
        let mimeType = 'image/webp';

        const response = await fetchWithRetry(imageUrl, { timeout: 15000, retries: 3 });
        if (!response.ok) throw new Error("Image fetch failed");
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type');
        if (contentType) mimeType = contentType;

        const generated = await generatePersonaFromImage(imageBuffer, mimeType);

        const personaData = {
            ...generated,
            imageId,
            createdBy: userId,
            createdAt: FieldValue.serverTimestamp(),
            zapGoal: 500,
            zapCurrent: 0,
            hypeScore: 0,
            hypeLevel: 1,
            streamTitle: generated.greeting || `Live with ${generated.name}`
        };

        await personaRef.set(personaData);

        // --- SEEDING (Database Correctness) ---
        // 1. Seed Lore (The Backstory is the first Canon Myth)
        const initialLore = `Origin: ${generated.backstory.replace(/\n/g, ' ')}`;
        await Store.saveLore(imageId, initialLore);

        // 2. Seed History (Welcome Message)
        const welcomeMsg = {
            uid: 'system',
            displayName: 'System',
            text: `Stream started! Say hi to ${generated.name}!`,
            role: 'system',
            type: 'system'
        };
        await Store.saveMessage(imageId, welcomeMsg);

        // 3. Seed Creator as VIP (First Supporter)
        // We write to 'top_supporters' manually to seed the collection
        await personaRef.collection('top_supporters').doc(userId).set({
            displayName: 'Creator', // Request didn't provide creator name, default to Creator or fetch from auth if available? 
            // Actually, we don't have creator name easily here without parsing header token again or passing it. 
            // Let's skip name update since fetchSupporters handles it, or just set it to 'Creator' for now.
            // Better: 'Stream God' (Flavor).
            totalZaps: 0,
            lastZap: FieldValue.serverTimestamp()
        });

        return { success: true, persona: personaData, isNew: true };

    } catch (e) {
        logger.error("Create persona failed", e);
        if (cost > 0) await Billing.refundZaps(userId, cost);
        throw new HttpsError('internal', "Failed to create persona.");
    }
};

// --- HANDLE GIFT PERSONA ---
export const handleGiftPersona = async (request) => {
    const { imageId, amount } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const userId = request.auth.uid;
    const userName = request.auth.token.name || 'Anonymous';

    if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'Invalid ZAP amount');

    // Manually handle billing since amount is variable
    await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new HttpsError('not-found', "User not found");
        const zaps = userDoc.data().zaps || 0;
        if (zaps < amount) throw new HttpsError('resource-exhausted', `Insufficient Zaps. Need ${amount}.`);
        t.update(userRef, { zaps: FieldValue.increment(-amount) });
    });

    // Update Persona State
    const personaRef = db.collection('personas').doc(imageId);
    let personaData;

    await db.runTransaction(async (t) => {
        const pDoc = await t.get(personaRef);
        if (!pDoc.exists) throw new HttpsError('not-found', 'Persona not found');
        personaData = pDoc.data();

        const newZapCurrent = (personaData.zapCurrent || 0) + amount;
        const zapGoal = personaData.zapGoal || 500;
        const hypeBoost = Math.floor(amount / 10);

        const updateData = {
            zapCurrent: newZapCurrent,
            hypeScore: Math.min(100, (personaData.hypeScore || 0) + hypeBoost),
            lastActivity: FieldValue.serverTimestamp()
        };

        if (newZapCurrent >= zapGoal) {
            updateData.zapCurrent = 0;
            updateData.zapGoal = zapGoal * 1.5;
        }

        updateData.hypeLevel = Math.ceil(updateData.hypeScore / 20) || 1;
        t.update(personaRef, updateData);
    });

    // Log & Broadcast
    const giftMsg = {
        uid: userId,
        displayName: userName,
        text: `gifted ${amount} ZAPs!`,
        role: 'system',
        type: 'gift',
        amount
    };
    await Store.saveMessage(imageId, giftMsg);

    await Broadcaster.broadcastCelebration(imageId, {
        type: 'gift',
        from: userName,
        amount,
        message: `${userName} gifted ${amount} ZAPs! Hype is RISING!`,
        newZapCurrent: (personaData.zapCurrent || 0) + amount,
        newZapGoal: personaData.zapGoal || 500
    });

    return { success: true };
};

// --- HANDLE TRIGGER ACTION ---
export const handleTriggerAction = async (request) => {
    const { imageId, actionId, cost } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const userId = request.auth.uid;
    const userName = request.auth.token.name || 'Anonymous';

    // Manual billing for action cost
    await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await t.get(userRef);
        const zaps = userDoc.data().zaps || 0;
        if (zaps < cost) throw new HttpsError('resource-exhausted', `Insufficient Zaps.`);
        t.update(userRef, { zaps: FieldValue.increment(-cost) });
    });

    // Process Action
    const update = {};
    if (actionId === 'pose') update.currentPose = `pose_${Date.now()}`;
    if (actionId === 'background') update.currentBackground = `bg_${Date.now()}`;

    await Store.updatePersonaState(imageId, update);
    await Broadcaster.broadcastStateChange(imageId, actionId, userName);

    return { success: true };
};

// --- HANDLE VOTE POLL ---
export const handleVotePoll = async (request) => {
    const { imageId, optionId } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

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
