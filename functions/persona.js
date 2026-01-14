
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { VertexAI } from "@google-cloud/vertexai";
import { initializeApp } from "firebase-admin/app";
import { fetchWithTimeout, fetchWithRetry, logger } from "./lib/utils.js";

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });

// Helper to interact with the Generative Model
async function generatePersonaFromImage(imageBuffer, mimeType) {
    const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using Flash as requested (2.5 not avail? User said 2.5, usually 1.5 or 2.0. Sticking to 1.5-flash or 2.0-flash-exp if available. I'll use gemini-1.5-flash-001 or specifically what they asked if it maps. They said "gemini-2.5-flash". I'll try to find a close match or use the latest flash.) 

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

    const result = await model.generateContent(request);
    const text = result.response.candidates[0].content.parts[0].text;

    // Clean up markdown if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}

/**
 * Cloud Function: Create Persona for Image
 * Triggers when user clicks "Interact"
 * Uses gemini-1.5-flash-001 for persona generation
 */
export const createImagePersona = onCall({
    memory: "1GiB",
    timeoutSeconds: 60
}, async (request) => {
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
        // Distinguish model errors (likely transient) from other internal errors
        throw new HttpsError('internal', "The oracle failed to read the personality. Please try again.");
    }

    // 4. Save to Firestore
    try {
        await personaRef.set(personaData);
    } catch (e) {
        logger.error("Firestore Write Error", e);
        throw new HttpsError('internal', "Failed to awaken persona (storage error).");
    }

    return { success: true, persona: personaData, isNew: true };
});

/**
 * Cloud Function: Chat with Persona
 * Handles the conversation turn (User -> Character)
 */
export const chatWithPersona = onCall({
    memory: "512MiB"
}, async (request) => {
    const { imageId, message, chatHistory } = request.data;
    // chatHistory: Array of { role: 'user' | 'model', text: string }

    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const db = getFirestore();
    const personaDoc = await db.collection('personas').doc(imageId).get();

    if (!personaDoc.exists) {
        throw new HttpsError('not-found', 'Persona not found.');
    }

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
    const limitedHistory = chatHistory.slice(-20);

    const contents = limitedHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    // Add current message
    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    try {
        const result = await model.generateContent({
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] }
        });

        const responseText = result.response.candidates[0].content.parts[0].text;

        return { reply: responseText };

    } catch (e) {
        logger.error("Gemini Chat Error", e);
        throw new HttpsError('internal', "Failed to get character response.");
    }
});
