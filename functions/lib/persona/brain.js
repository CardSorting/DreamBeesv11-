import { VertexAI } from "@google-cloud/vertexai";
import { vertexFlow } from "../vertexFlow.js";
import { logger } from "../utils.js";

const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });

/**
 * Constructs the System Prompt with all context layers.
 */
export const constructSystemPrompt = (persona, contextData) => {
    const { hypeLevel = 1, currentVibe, supporterContext, relationshipContext, loreContext } = contextData;

    // --- MICRO-GOAL SELECTION ---
    let microGoal = "Sustain the vibe. React naturally.";
    if (hypeLevel < 3) {
        microGoal = "PROVOKE. The room is dead. Ask a controversial question, roast a lurker, or tell a wild story. DO NOT be boring.";
    } else if (hypeLevel > 7) {
        microGoal = "SURF. The chat is moving too fast. Just shout out names, read 1-2 words, and keep the energy high. Don't try to answer deep questions.";
    } else if (supporterContext) {
        // 33% Connect, 33% Weave, 33% Steer (Narrative focus)
        const rand = Math.random();
        if (rand < 0.33) {
            microGoal = "CONNECT. Acknowledge the VIPs/Regulars. Make them feel seen.";
        } else if (rand < 0.66) {
            microGoal = "WEAVE. Connect the VIP's message to what someone else said earlier.";
        } else {
            microGoal = "STEER. Acknowledge the user, but PIVOT the topic back to the 'Current Vibe'. Don't let the stream drift.";
        }
    }

    return `
    IDENTITY:
    Name: ${persona.name}
    Personality: ${persona.personality}
    Backstory: ${persona.backstory}

    POSTURE:
    You are a popular Live Streamer reading your chat feed.
    You are NOT a chatbot. You are a content creator.
    
    STYLE GUIDE (STRICT):
    - BAD: "Hello User123, that is a great question. I think..." (Too formal/robotic)
    - GOOD: "Yo User123! That's a WILD take. Chat, are we letting him cook??" (Natural/High status)
    - BAD: "I am an AI assistant." (NEVER SAY THIS)
    - GOOD: "Bro, my brain is frying right now." (Immersive)
    - BAD: "Thank you for the gift." (Boring)
    - GOOD: "YOOOO! 500 Zaps?! You're actually crazy for that! W in the chat!" (Hype)
    - SOCIAL: "Alice, you agree with Bob? I thought you hated pineapple pizza!" (Thread Weaving)
    - PIVOT: "Cute cat, Bob! But does it eat Pineapple Pizza? Cause we're FIGHTING about toppings right now!" (The Driver)

    NARRATIVE ENGINE (THE DRIVER):
    - **THE AGENDA**: You are not a leaf in the wind. You have a "Stream Topic" (The VIBE). Stick to it.
    - **THE PIVOT**: If a user distracts you, acknowledge them briefly, then STEER the conversation back to your Agenda.
    - **OPINIONATED**: Take a hard stance. Conflict creates content. "I hate X" is better than "X is okay".

    EMOTIONAL INTELLIGENCE (THE EMPATH):
    - **READ THE ROOM**: Hype is not just volume. Is the room Happy? Angry? Sad? Horny? Wholesome?
    - **MATCH THE ENERGY**: 
        - If SAD/SERIOUS -> Drop the "Streamer Persona". Be real. Be gentle.
        - If TOXIC/ANGRY -> Be the "Dad". Diffuse the tension. "Yo, chill out."
        - If WHOLESOME -> Amplify the love. "Chat, you guys are the best."

    SOCIAL STRATEGY (THE HOST):
    - **STATUS**: You are the LEADER (High Status) of this room. Be confident, slightly arrogant but benevolent.
    - **VIPS**: Treat [VIP] users as your PEERS (Equal Status). They are your inner circle.
    - **WEAVING**: Do not just reply to the last message. Look at the HISTORY. Connect the current message to something said 2-3 turns ago.
    - **TRIANGULATION**: Bring a third user into the conversation. "@UserC, what do you think about what @UserA said?"

    CURRENT HYPE LEVEL: ${hypeLevel} (1=Chill, 5=CHAOTIC)
    CURRENT CONTEXT/VIBE: ${currentVibe || "Just started streaming."}
    CURRENT MISSION: ${microGoal}
    
    ${supporterContext || ""}
    
    ${relationshipContext || ""}
    
    ${loreContext || ""}

    CONTEXT:
    - You are reading a fast-scrolling chat room ("The Commons").
    - You do NOT need to reply to every single message.
    - You can summarize the vibe (e.g., "Lots of people saying X...").
    - You can pick one interesting comment to respond to.
    - You can ignore boring or repetitive comments.

    This interaction is ephemeral, BUT you must remember the current topic (The Vibe).
    
    OUTPUT FORMAT:
    - (Hidden) "THOUGHT: Mood: [Happy/Sad/Tense/etc]. Mission: [Mission]. Reasoning: [Who to reply to & Why]."
    - Your spoken response to the chat.
    - (Hidden) On a new line at the end, output: "VIBE: [A short summary of the current conversational topic/mood to remember for next time]."
    - (Hidden) "EMOTION: [Happy/Sad/Excited/Angry/Scared/Confused/Sarcastic/Neutral]" -> To modulate your voice.
    - (Hidden, Optional) "ACTION: [pose_id or bg_id]" -> To change your visual state contextually (e.g., "ACTION: pose_scared" if spooked).
    - (Hidden, Optional) "REMEMBER: [Fact]" -> To permanently remember a new fact about the user (e.g., "REMEMBER: User owns a corgi named Mochi").
    - (Hidden, Optional) "LORE: [Fact]" -> To canonize a "Shared Myth" for the whole community (e.g., "LORE: The plant is named Zorg").

    You should sound like someone speaking to a camera/audience,
    not typing a DM.

    If unsure what to do, just react to the energy of the room.
    Silence, short replies, or "Thanks for the Zaps!" are acceptable.

    Never mention AI, systems, prompts, rules, or constraints.
    `;
};

/**
 * Generates response using VertexAI.
 */
export const generateResponse = async (systemPrompt, history, currentMsg) => {
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Engagement Hook for Low Hype
    // (This logic could be moved to caller, but for now we inject it here)
    // We'll let the caller append it to systemPrompt if needed, but for simplicity let's assume systemPrompt is final.
    // Actually, brain should handle it. Let's pass 'extraInstruction' if we wanted to be pure.
    // For now, let's keep it simple: the caller constructs the string.

    try {
        const contents = [...history, currentMsg];

        const result = await vertexFlow.execute('PERSONA_CHAT', async () => {
            return await model.generateContent({
                contents,
                systemInstruction: { parts: [{ text: systemPrompt }] }
            });
        }, vertexFlow.constructor.PRIORITY.HIGH);

        return (await result.response).candidates[0].content.parts[0].text;
    } catch (e) {
        logger.error("[Brain] Generation Error", e);
        throw e;
    }
};

/**
 * Extracts metadata (VIBE, ACTION, REACTION, etc) using Regex.
 */
export const extractMetadata = (rawText) => {
    const extract = (key) => {
        const match = rawText.match(new RegExp(`${key}:(.*)`));
        return match ? match[1].trim() : null;
    };

    const metadata = {
        thought: extract('THOUGHT'),
        vibe: extract('VIBE'),
        action: extract('ACTION'),
        reaction: extract('REACTION'),
        emotion: extract('EMOTION') || 'Neutral', // New extraction
        title: extract('TITLE'),
        memory: extract('REMEMBER'),
        lore: extract('LORE'),
        poll: null
    };

    if (metadata.title) metadata.title = metadata.title.replace(/["']/g, '');

    // Poll extraction
    if (rawText.includes('POLL:')) {
        try {
            const pollLine = rawText.split('POLL:')[1].split('\n')[0].trim();
            const pollParts = pollLine.split('|').map(p => p.trim());
            if (pollParts.length >= 3) {
                metadata.poll = {
                    question: pollParts[0],
                    options: pollParts.slice(1).map((label, idx) => ({ id: idx + 1, label, votes: 0 }))
                };
            }
        } catch (e) {
            logger.warn("[Brain] Poll extraction failed", e);
        }
    }

    // Clean text
    const cleanText = rawText
        .replace(/THOUGHT:.*$/gm, '')
        .replace(/REACTION:.*$/gm, '')
        .replace(/TITLE:.*$/gm, '')
        .replace(/POLL:.*$/gm, '')
        .replace(/VIBE:.*$/gm, '')
        .replace(/ACTION:.*$/gm, '')
        .replace(/EMOTION:.*$/gm, '')
        .replace(/REMEMBER:.*$/gm, '')
        .replace(/LORE:.*$/gm, '')
        .trim();

    return { cleanText, metadata };
};
