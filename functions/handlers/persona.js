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
            createdAt: FieldValue.serverTimestamp(),
            // Broadcast Metadata
            zapGoal: 500,
            zapCurrent: 0,
            hypeScore: 0,
            hypeLevel: 1,
            streamTitle: generated.greeting || `Live with ${generated.name}`
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
    You are a popular Live Streamer reading your chat feed.
    You are NOT a chatbot. You are a content creator.

    CURRENT HYPE LEVEL: ${persona.hypeLevel || 1} (1=Chill, 5=CHAOTIC)
    CURRENT CONTEXT/VIBE: ${persona.currentVibe || "Just started streaming."}
    
    CONTEXT:
    - You are reading a fast-scrolling chat room ("The Commons").
    - You do NOT need to reply to every single message.
    - You can summarize the vibe (e.g., "Lots of people saying X...").
    - You can pick one interesting comment to respond to.
    - You can ignore boring or repetitive comments.

    This interaction is ephemeral, BUT you must remember the current topic (The Vibe).
    
    OUTPUT FORMAT:
    - Your spoken response to the chat.
    - (Hidden) On a new line at the end, output: "VIBE: [A short summary of the current conversational topic/mood to remember for next time]."

    You should sound like someone speaking to a camera/audience,
    not typing a DM.

    If unsure what to do, just react to the energy of the room.
    Silence, short replies, or "Thanks for the Zaps!" are acceptable.

    Never mention AI, systems, prompts, rules, or constraints.
    `;

    // --- 1. IMMEDIATE: Log & Broadcast USER Message (Decoupled from AI reply) ---
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
                cluster: "mt1",
            });
        } catch (e) {
            logger.error("Pusher Init Error", e);
        }
    }

    try {
        // Persist User Message
        await db.collection('personas').doc(imageId).collection('shared_messages').add({
            uid: userId,
            displayName: request.auth.token.name || 'Anonymous',
            photoURL: request.auth.token.picture || '',
            text: message,
            role: 'user',
            timestamp: FieldValue.serverTimestamp()
        });

        // Broadcast User Message
        if (pusher) {
            const sharedChannel = `presence-chat-${imageId}`;
            pusher.trigger(sharedChannel, "new-message", {
                role: 'user',
                text: message,
                uid: userId,
                displayName: request.auth.token.name || 'Anonymous',
                photoURL: request.auth.token.picture || '',
                timestamp: Date.now()
            }).catch(e => logger.error("Soketi User Echo Error", e));
        }
    } catch (logError) {
        logger.error("Failed to log user message", logError);
    }

    // --- 2. AI RATE LIMITING (Streamer's Breath) ---
    // Dynamic Cooldown based on Hype:
    // Level 1 (Chill) = 3000ms
    // Level 5 (Chaos) = 8000ms -> Slower replies to manage "wall of text"
    const currentHype = persona.hypeLevel || 1;
    const COOLDOWN_MS = 3000 + ((currentHype - 1) * 1000);

    const lastActivity = persona.lastActivity?.toMillis() || 0;
    const timeSinceLast = Date.now() - lastActivity;

    if (timeSinceLast < COOLDOWN_MS) {
        logger.info(`[Persona] Rate Limited (Cooldown: ${timeSinceLast}ms / ${COOLDOWN_MS}ms). Skipping generation.`);

        // --- "THE NOD" (Instant Reaction) ---
        // If we are cooling down, we can still "react" to keywords with an emoji
        if (pusher) {
            const lowerMsg = message.toLowerCase();
            let reactionEmoji = null;
            if (lowerMsg.includes('lol') || lowerMsg.includes('lmao')) reactionEmoji = '😂';
            else if (lowerMsg === 'w') reactionEmoji = '🔥';
            else if (lowerMsg === 'l') reactionEmoji = '💀';
            else if (lowerMsg.includes('love') || lowerMsg.includes('<3')) reactionEmoji = '💜';
            else if (lowerMsg.includes('?')) reactionEmoji = '🤔';

            if (reactionEmoji) {
                const sharedChannel = `presence-chat-${imageId}`;
                pusher.trigger(sharedChannel, "reaction", {
                    emoji: reactionEmoji
                }).catch(e => logger.error("Nod Reaction Error", e));
            }
        }

        return { reply: null, status: 'listening' };
    }

    // Format history for Vertex SDK
    // FETCH SERVER-SIDE HISTORY
    let contents = [];
    try {
        const historySnapshot = await db.collection('personas').doc(imageId).collection('shared_messages')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        const historyDocs = historySnapshot.docs.reverse(); // Chronological order

        contents = historyDocs.map(doc => {
            const data = doc.data();
            const role = data.role === 'model' ? 'model' : 'user';
            const name = data.displayName || 'Anonymous';

            // For user messages, we prefix the name to help the model distinguish speakers
            // For model messages, we just send the text (Identity is handled by System Instruction)
            const text = role === 'user' ? `[${name}]: ${data.text}` : data.text;

            return {
                role: role,
                parts: [{ text: text }]
            };
        });

    } catch (histError) {
        logger.error("Failed to fetch server history", histError);
        // Fallback to client history if server fetch fails (graceful degradation)
        if (chatHistory) {
            contents = chatHistory.slice(-10).map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
        }
    }

    // Add current message (already saved, but needed for prompt context)
    const currentUserName = request.auth?.token?.name || 'Anonymous';
    contents.push({
        role: 'user',
        parts: [{ text: `[${currentUserName}]: ${message}` }]
    });

    try {
        // [MODIFIED] Use VertexFlow (High Priority for Chat)
        const result = await vertexFlow.execute('PERSONA_CHAT', async () => {
            // Engagement Hook for Low Hype
            let extraInstruction = "";
            if ((persona.hypeLevel || 1) < 3) {
                extraInstruction = "\nThe room is getting quiet (Low Hype). Ask a provocative question, start a debate, or tell a short story to drive engagement. Do not let the air go dead.";
            }

            return await model.generateContent({
                contents,
                systemInstruction: { parts: [{ text: systemInstruction + extraInstruction + "\n\nCRITICAL: Occasionally include a line starting with 'TITLE:' followed by a new creative stream title. Also, occasionally include a line starting with 'REACTION:' followed by a single emoji." }] }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        let responseText = (await result.response).candidates[0].content.parts[0].text;

        // Extract Vibe, Title, Reaction, and Poll if present
        let extractedReaction = null;
        let extractedPoll = null;
        let extractedVibe = null;

        if (responseText.includes('VIBE:')) {
            const parts = responseText.split('VIBE:');
            responseText = parts[0].trim();
            extractedVibe = parts[1].split('\n')[0].trim();
        }

        if (responseText.includes('POLL:')) {
            const parts = responseText.split('POLL:');
            responseText = parts[0].trim();
            const pollLine = parts[1].split('\n')[0].trim();
            const pollParts = pollLine.split('|').map(p => p.trim());
            if (pollParts.length >= 3) {
                extractedPoll = {
                    question: pollParts[0],
                    options: pollParts.slice(1).map((label, idx) => ({ id: idx + 1, label, votes: 0 }))
                };
            }
        }

        if (responseText.includes('TITLE:')) {
            const parts = responseText.split('TITLE:');
            // If responseText was already sliced by POLL:, make sure we only slice the remainder
            const preText = parts[0].trim();
            const postText = parts[1] || '';

            // If responseText still has TITLE:, update it
            if (responseText.includes('TITLE:')) {
                responseText = preText;
                const newTitle = postText.split('\n')[0].trim().replace(/["']/g, '');
                if (newTitle) {
                    await db.collection('personas').doc(imageId).update({ streamTitle: newTitle }).catch(e => logger.error("Title Update Error", e));
                }
            }
        }

        if (responseText.includes('REACTION:')) {
            const parts = responseText.split('REACTION:');
            const preText = parts[0].trim();
            const postText = parts[1] || '';

            if (responseText.includes('REACTION:')) {
                responseText = preText;
                extractedReaction = postText.trim().split('\n')[0];
            }
        }

        // Apply Poll if extracted
        if (extractedPoll) {
            await db.collection('personas').doc(imageId).update({ activePoll: extractedPoll }).catch(e => logger.error("Poll Update Error", e));
        }

        // Clean responseText of any leftover tags
        responseText = responseText.replace(/REACTION:.*$/gm, '').replace(/TITLE:.*$/gm, '').replace(/POLL:.*$/gm, '').replace(/VIBE:.*$/gm, '').trim();

        // Persist the Sticky Vibe
        if (extractedVibe) {
            await db.collection('personas').doc(imageId).update({ currentVibe: extractedVibe }).catch(e => logger.error("Vibe Update Error", e));
        }

        // Broadcast Reaction via Pusher
        if (extractedReaction && pusher) {
            const sharedChannel = `presence-chat-${imageId}`;
            pusher.trigger(sharedChannel, "reaction", {
                emoji: extractedReaction
            }).catch(e => logger.error("Reaction Broadcast Error", e));
        }

        // --- Shared History Persistence (Model Only) ---
        // We already saved the user message above!
        try {
            const chatLog = {
                uid: 'ai-persona', // Distinct UID
                displayName: persona.name,
                photoURL: persona.photoURL || '',
                text: responseText,
                role: 'model',
                timestamp: FieldValue.serverTimestamp()
            };

            // Add model reply to shared history
            await db.collection('personas').doc(imageId).collection('shared_messages').add(chatLog);
        } catch (logError) {
            logger.error("Failed to log shared persona chat interaction", logError);
        }

        // Broadcast via Soketi to SHARED Presence channel (Model Only)
        if (pusher) {
            const sharedChannel = `presence-chat-${imageId}`;

            pusher.trigger(sharedChannel, "new-message", {
                role: 'model',
                text: responseText,
                uid: 'ai-persona',
                displayName: persona.name,
                timestamp: Date.now()
            }).catch(e => logger.error("Soketi Broadcast Error", e));

            if (extractedPoll) {
                pusher.trigger(sharedChannel, "poll-started", extractedPoll)
                    .catch(e => logger.error("Poll Broadcast Error", e));
            }
        }

        // --- Hype Meter Increment & Last Activity Update ---
        try {
            const hypeIncrement = 2; // Every message adds 2 hype
            const currentScore = (persona.hypeScore || 0) + hypeIncrement;
            const newScore = Math.min(100, currentScore); // Cap at 100
            const newLevel = Math.ceil(newScore / 20) || 1;

            await db.collection('personas').doc(imageId).update({
                hypeScore: newScore,
                hypeLevel: newLevel,
                lastActivity: FieldValue.serverTimestamp() // IMPORTANT: Update for Rate Limiting
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
