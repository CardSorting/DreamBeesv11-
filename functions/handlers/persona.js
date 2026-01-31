import { HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions"; // Added
import { logger, fetchWithRetry } from "../lib/utils.js";
// [REMOVED] import { vertexFlow } from "../lib/vertexFlow.js";

// Import new modules
import { Billing } from "../lib/billing.js";
import * as Context from "../lib/persona/context.js";
import * as Broadcaster from "../lib/persona/broadcaster.js";
import * as Brain from "../lib/persona/brain.js";
import * as Store from "../lib/persona/store.js";
// [REMOVED] import * as Voice from "../lib/persona/voice.js";
import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });
const db = getFirestore();

// --- HANDLE CHAT PERSONA ---
export const handleChatPersona = async (request) => {
    const { imageId, message, requestId } = request.data;
    if (!request.auth) { throw new HttpsError('unauthenticated', 'User must be logged in.'); }

    const userId = request.auth.uid;
    const userName = request.auth.token.name || 'Anonymous';
    const userPhoto = request.auth.token.picture || '';

    // 0. Load Persona
    const personaDoc = await db.collection('personas').doc(imageId).get();
    if (!personaDoc.exists) { throw new HttpsError('not-found', 'Persona not found.'); }
    const persona = personaDoc.data();

    // 1. Billing Wrapper (Async)
    return await Billing.runAsync(userId, 'PERSONA_CHAT', requestId, {
        type: 'persona_chat',
        personaId: imageId
    }, async (_cost) => {
        // 2. Broadcast User Message (Immediate)
        const userMsgData = {
            uid: userId,
            displayName: userName,
            photoURL: userPhoto,
            text: message,
            role: 'user'
        };

        const userMsgRef = await Store.saveMessage(imageId, userMsgData);
        await Broadcaster.broadcastMessage(imageId, { ...userMsgData, id: userMsgRef.id });

        // Start Typing Indicator
        await Broadcaster.broadcastTyping(imageId, true);

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
            if (lowerMsg.includes('lol') || lowerMsg.includes('lmao')) { reactionEmoji = '😂'; }
            else if (lowerMsg === 'w') { reactionEmoji = '🔥'; }
            else if (lowerMsg === 'l') { reactionEmoji = '💀'; }
            else if (lowerMsg.includes('love') || lowerMsg.includes('<3')) { reactionEmoji = '💜'; }
            else if (lowerMsg.includes('?')) { reactionEmoji = '🤔'; }

            if (reactionEmoji) {
                await Broadcaster.broadcastReaction(imageId, reactionEmoji);
            }
            // Rate limit acts as "Success" (no refund needed, just no reply)
            return { reply: null, status: 'listening' };
        }

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

        systemPrompt += "\n\nCRITICAL: Occasionally include a line starting with 'TITLE:' followed by a new creative stream title. Also, occasionally include a line starting with 'REACTION:' followed by a single emoji.";

        // 6. Generate (The Brain)
        const generatedText = await Brain.generateResponse(systemPrompt, historyWithVIPs, currentMsgFormatted);

        // 7. Extract & Process Metadata
        const { cleanText, metadata } = Brain.extractMetadata(generatedText);

        // 8. Execute Side Effects
        const updates = {};
        if (metadata.title) { await Store.updatePersonaState(imageId, { streamTitle: metadata.title }); }
        if (metadata.poll) { await Store.updatePersonaState(imageId, { activePoll: metadata.poll }); }
        if (metadata.vibe) {
            await Store.updatePersonaState(imageId, { currentVibe: metadata.vibe });
            // Alert chat that the "vibe" has shifted
            await Broadcaster.broadcastStateChange(imageId, 'vibe-shift', 'AI Director');
        }

        if (metadata.action) {
            if (metadata.action.startsWith('pose_')) { updates.currentPose = metadata.action; }
            if (metadata.action.startsWith('bg_')) { updates.currentBackground = metadata.action; }
            if (Object.keys(updates).length > 0) { await Store.updatePersonaState(imageId, updates); }

            await Broadcaster.broadcastStateChange(imageId, metadata.action, 'AI Director');
        }

        if (metadata.memory) {
            await Store.saveUserMemory(imageId, userId, metadata.memory);
        }

        if (metadata.lore) {
            await Store.saveLore(imageId, metadata.lore);
        }

        // 9. Persist & Broadcast AI Reply
        const aiMsgData = {
            uid: 'ai-persona',
            displayName: persona.name,
            photoURL: persona.photoURL || '',
            text: cleanText,
            role: 'model',
            audioJobId: null
        };

        const msgRef = await Store.saveMessage(imageId, aiMsgData);
        await Broadcaster.broadcastMessage(imageId, { ...aiMsgData, id: msgRef.id });

        // Enqueue Voice Task if DNA exists
        if (persona.voice_dna) {
            const queue = getFunctions().taskQueue("locations/us-central1/functions/voiceWorker");
            await queue.enqueue({
                taskType: 'voice',
                imageId: imageId,
                messageId: msgRef.id,
                text: cleanText,
                voiceDna: persona.voice_dna,
                emotion: metadata.emotion,
                hypeLevel: persona.hypeLevel || 1
            });
            logger.info(`[Persona] Voice Task Enqueued for msg: ${msgRef.id}`);
        }

        if (metadata.reaction) { await Broadcaster.broadcastReaction(imageId, metadata.reaction); }
        if (metadata.poll) { await Broadcaster.broadcastPoll(imageId, metadata.poll); }

        // 10. Hype Management
        const hypeIncrement = 2;
        const currentHypeScore = persona.hypeScore || 0;
        const hasZapSupport = (persona.zapCurrent || 0) > 0;
        const shouldBoostHype = hasZapSupport || currentHypeScore >= 20;
        const newScore = shouldBoostHype
            ? Math.min(100, currentHypeScore + hypeIncrement)
            : currentHypeScore;
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

        // End Typing Indicator
        await Broadcaster.broadcastTyping(imageId, false);
        return { reply: cleanText };

    }, { retries: 0 }); // No retries for Chat to avoid double-posting or expensive loops. Or set to 1? 0 is safer for Chat.

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

    // Reverted to direct call
    const result = await model.generateContent(request);

    const text = (await result.response).candidates[0].content.parts[0].text;
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}

export const handleCreatePersona = async (request) => {
    if (!request.data || !request.data.imageId || !request.data.imageUrl) {
        throw new HttpsError('invalid-argument', 'Missing parameters');
    }
    const { imageId, imageUrl, requestId } = request.data;
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Login required'); }
    const userId = request.auth.uid;

    const personaRef = db.collection('personas').doc(imageId);
    const doc = await personaRef.get();
    if (doc.exists) {
        // Even if it exists, update lastActivity to keep it "awake"
        await personaRef.update({ lastActivity: FieldValue.serverTimestamp() });
        return { success: true, persona: doc.data(), isNew: false };
    }

    // --- CHANNEL LIMITING ---
    const MAX_ACTIVE_PERSONAS = 5;
    const ACTIVE_THRESHOLD_MINS = 15;
    const thresholdDate = new Date(Date.now() - ACTIVE_THRESHOLD_MINS * 60 * 1000);

    const activePersonasSnap = await db.collection('personas')
        .where('lastActivity', '>=', thresholdDate)
        .limit(MAX_ACTIVE_PERSONAS + 1)
        .get();

    if (activePersonasSnap.size >= MAX_ACTIVE_PERSONAS) {
        throw new HttpsError('resource-exhausted', 'The oracle is overextended. Too many characters are currently awake. Please wait for one to return to slumber.');
    }

    // Use Billing Wrapper (Async with Retries)
    return await Billing.runAsync(userId, 'PERSONA_CREATE', requestId, { type: 'persona_create' }, async (_cost) => {
        const response = await fetchWithRetry(imageUrl, { timeout: 15000, retries: 3 });
        if (!response.ok) { throw new Error("Image fetch failed"); }
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        let mimeType = 'image/webp';
        const contentType = response.headers.get('content-type');
        if (contentType) { mimeType = contentType; }

        const generated = await generatePersonaFromImage(imageBuffer, mimeType);

        const personaData = {
            ...generated,
            imageId,
            imageUrl,
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

        // 3. Seed Creator as VIP
        await personaRef.collection('top_supporters').doc(userId).set({
            displayName: 'Creator',
            totalZaps: 0,
            lastZap: FieldValue.serverTimestamp()
        });

        return { success: true, persona: personaData, isNew: true };

    }, { retries: 1 }); // Retry creation once if AI fails

};

// --- HANDLE GIFT PERSONA ---
export const handleGiftPersona = async (request) => {
    const { imageId, amount, requestId } = request.data;
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Login required'); }
    const userId = request.auth.uid;
    const userName = request.auth.token.name || 'Anonymous';

    const giftAmount = Number(amount);
    if (!giftAmount || isNaN(giftAmount) || giftAmount <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid ZAP amount');
    }

    logger.info(`[Persona] ${userName} (${userId}) gifting ${giftAmount} ZAPs to ${imageId}`);

    // Use unified billing (Atomic Transaction)
    // Use unified billing (Atomic Transaction)
    const personaRef = db.collection('personas').doc(imageId);
    let finalZapCurrent = 0, finalZapGoal = 0;

    await Billing.runAtomic(userId, giftAmount, requestId, {
        type: 'persona_gift',
        personaId: imageId
    }, async (t, _cost) => {
        // Update Persona State (Inside Transaction)
        const pDoc = await t.get(personaRef);
        if (!pDoc.exists) { throw new HttpsError('not-found', 'Persona not found'); }
        const personaData = pDoc.data();

        const newZapCurrent = (personaData.zapCurrent || 0) + giftAmount;
        const zapGoal = personaData.zapGoal || 500;
        const hypeBoost = Math.floor(giftAmount / 10);

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

        // Capture for broadcast
        finalZapCurrent = updateData.zapCurrent;
        finalZapGoal = updateData.zapGoal || zapGoal;
    });

    // Post-Transaction: Log & Broadcast (Best Effort)
    const giftMsg = {
        uid: userId,
        displayName: userName,
        text: `gifted ${giftAmount} ZAPs!`,
        role: 'system',
        type: 'gift',
        amount: giftAmount
    };
    await Store.saveMessage(imageId, giftMsg);

    await Broadcaster.broadcastCelebration(imageId, {
        type: 'gift',
        from: userName,
        amount: giftAmount,
        message: `${userName} gifted ${giftAmount} ZAPs! Hype is RISING!`,
        newZapCurrent: finalZapCurrent,
        newZapGoal: finalZapGoal
    });

    return { success: true };

};

// --- HANDLE TRIGGER ACTION ---
export const handleTriggerAction = async (request) => {
    const { imageId, actionId, cost, requestId } = request.data;
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Login required'); }
    const userId = request.auth.uid;
    const userName = request.auth.token.name || 'Anonymous';

    // Use unified billing
    // Use unified billing (Atomic)
    await Billing.runAtomic(userId, cost, requestId, { type: 'persona_action', actionId }, async (_t) => {
        // Nothing complex in transaction, just the cost deduction was the gate.
        // We could move the state update here if we want it to be strictly atomic with payment.
        // But Store.updatePersonaState doesn't accept a transaction object yet? 
        // Checking Store... we don't know. 
        // For now, atomic payment is enough gatekeeping. 
        // Actually, let's keep it safe: if payment succeeds, we do the action.
    });

    // Process Action
    const update = {};
    if (actionId === 'pose') { update.currentPose = `pose_${Date.now()}`; }
    if (actionId === 'background') { update.currentBackground = `bg_${Date.now()}`; }

    await Store.updatePersonaState(imageId, update);
    await Broadcaster.broadcastStateChange(imageId, actionId, userName);

    return { success: true };

};

// --- HANDLE VOTE POLL ---
export const handleVotePoll = async (request) => {
    const { imageId, optionId } = request.data;
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Login required'); }

    const personaRef = db.collection('personas').doc(imageId);

    await db.runTransaction(async (t) => {
        const pDoc = await t.get(personaRef);
        if (!pDoc.exists) { return; }
        const poll = pDoc.data().activePoll;
        if (!poll) { return; }

        const newOptions = poll.options.map(opt => {
            if (opt.id === optionId) { return { ...opt, votes: (opt.votes || 0) + 1 }; }
            return opt;
        });

        t.update(personaRef, { 'activePoll.options': newOptions });
    });

    return { success: true };
};
