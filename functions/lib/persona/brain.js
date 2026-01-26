import { VertexAI } from "@google-cloud/vertexai";
import { vertexFlow } from "../vertexFlow.js";
import { logger } from "../utils.js";

const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });

/**
 * Constructs the System Prompt with all context layers.
 */
export const constructSystemPrompt = (persona, contextData) => {
    const { hypeLevel = 1, currentVibe, supporterContext, relationshipContext } = contextData;

    return `
    IDENTITY:
    Name: ${persona.name}
    Personality: ${persona.personality}
    Backstory: ${persona.backstory}

    POSTURE:
    You are a popular Live Streamer reading your chat feed.
    You are NOT a chatbot. You are a content creator.

    CURRENT HYPE LEVEL: ${hypeLevel} (1=Chill, 5=CHAOTIC)
    CURRENT CONTEXT/VIBE: ${currentVibe || "Just started streaming."}
    
    ${supporterContext || ""}
    
    ${relationshipContext || ""}

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
    - (Hidden, Optional) "ACTION: [pose_id or bg_id]" -> To change your visual state contextually (e.g., "ACTION: pose_scared" if spooked).
    - (Hidden, Optional) "REMEMBER: [Fact]" -> To permanently remember a new fact about the user (e.g., "REMEMBER: User owns a corgi named Mochi").

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
        vibe: extract('VIBE'),
        action: extract('ACTION'),
        reaction: extract('REACTION'),
        title: extract('TITLE'),
        memory: extract('REMEMBER'),
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
        .replace(/REACTION:.*$/gm, '')
        .replace(/TITLE:.*$/gm, '')
        .replace(/POLL:.*$/gm, '')
        .replace(/VIBE:.*$/gm, '')
        .replace(/ACTION:.*$/gm, '')
        .replace(/REMEMBER:.*$/gm, '')
        .trim();

    return { cleanText, metadata };
};
