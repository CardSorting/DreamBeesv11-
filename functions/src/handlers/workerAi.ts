import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "../lib/utils.js";
import { RequestWithAuth } from "../types/functions.js";
import { WorkerAiService, ChatMessage } from "../lib/workerAi.js";
import { OpenAiFormatter } from "../lib/openai.js";
import crypto from 'crypto';
import { getDatabase, ServerValue } from "firebase-admin/database";
import { retryOperation } from "../lib/utils.js";
import { BroccoliFirebase, BroccoliPersona } from "../services/broccoli.js";

const trigger = async (channel: string, event: string, data: any) => {
    try {
        const db = getDatabase();
        const safeChannel = channel.replace(/\./g, '_');
        const messageRef = db.ref(`messages/${safeChannel}`);

        await retryOperation(async () => {
            return await messageRef.set({
                event,
                data,
                timestamp: ServerValue.TIMESTAMP
            });
        }, { retries: 3, context: `RTDB trigger (${event})` });
    } catch (e: any) {
        logger.error(`[Broadcaster] Permanent Trigger Error (${event})`, e);
    }
};

const broadcastWorkerAiChunk = async (userId: string, requestId: string, chunk: string, isFinal: boolean = false) => {
    const channel = `private-workerai-${userId}`;
    await trigger(channel, "ai-chunk", {
        requestId,
        chunk,
        isFinal,
        timestamp: Date.now()
    });
};

/**
 * Handle WorkerAI Chat request (Sync)
 */
export const handleWorkerAiChat = async (request: RequestWithAuth<{ messages: ChatMessage[], characterId?: string, previewIdentity?: any }>) => {
    const { messages, characterId, previewIdentity } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    if (!messages || !Array.isArray(messages)) throw new HttpsError('invalid-argument', 'Messages must be an array');

    const uid = request.auth.uid;
    const requestId = crypto.createHash('md5')
        .update(JSON.stringify(messages) + uid + new Date().toISOString().slice(0, 13))
        .digest('hex');

    try {
        let characterIdentity = "";
        let characterName = "Assistant";

        if (characterId === 'preview' && previewIdentity) {
            characterName = previewIdentity.name || "Assistant";
            characterIdentity = `
CHARACTER_NAME: ${previewIdentity.name}
${previewIdentity.speakingStyle ? `SPEAKING_STYLE: ${previewIdentity.speakingStyle}` : ''}
${previewIdentity.exampleDialogue ? `EXAMPLE_DIALOGUE: \n${previewIdentity.exampleDialogue}` : ''}
CORE_INSTRUCTION: ${previewIdentity.systemPrompt}
`;
        }

        const enrichedMessages = characterIdentity ? [
            { role: 'system', content: `CHARACTER_IDENTITY: ${characterIdentity}\nMISSION: Maintain character voice.` },
            ...messages
        ] : messages;

        // 1. Run Chat
        const { result, usage } = await WorkerAiService.chatCompletion(enrichedMessages as ChatMessage[]);

        // 2. Deduct Zaps
        await WorkerAiService.deductUsage(uid, characterId === 'preview' ? 'PREVIEW_CHAT' : 'WORKER_AI_CHAT', `wai-sync-${requestId}`, usage.total_tokens);

        return {
            success: true,
            result: result,
            openai: OpenAiFormatter.formatChatCompletion(result, usage),
            usage
        };
    } catch (error: any) {
        logger.error(`[WorkerAI] Sync Error`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || 'WorkerAI sync failed');
    }
};

export const handleWorkerAiStream = async (request: RequestWithAuth<{ messages: ChatMessage[], requestId?: string, chatId?: string, characterId?: string, previewIdentity?: any }>) => {
    const { messages, requestId: customRequestId, chatId, characterId, previewIdentity } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    if (!messages || !Array.isArray(messages)) throw new HttpsError('invalid-argument', 'Messages must be an array');

    const uid = request.auth.uid;
    const requestId = customRequestId || crypto.randomUUID();

    try {
        // 1. Resolve Character Identity
        let characterIdentity = "";
        let characterName = "Assistant";

        if (characterId === 'preview' && previewIdentity) {
            characterName = previewIdentity.name || "Assistant";
            characterIdentity = `
CHARACTER_NAME: ${previewIdentity.name}
${previewIdentity.speakingStyle ? `SPEAKING_STYLE: ${previewIdentity.speakingStyle}` : ''}
${previewIdentity.exampleDialogue ? `EXAMPLE_DIALOGUE: \n${previewIdentity.exampleDialogue}` : ''}
CORE_INSTRUCTION: ${previewIdentity.systemPrompt}
`;
        } else if (characterId) {
            // Looking at CharacterLibrary.tsx: collection(db, 'characters') -> Firestore.
            const { getFirestore } = await import("firebase-admin/firestore");
            const charDoc = await getFirestore().collection('characters').doc(characterId).get();

            if (charDoc.exists) {
                const char = charDoc.data()!;
                characterName = char.name;
                characterIdentity = `
CHARACTER_NAME: ${char.name}
CHARACTER_BIO: ${char.description}
${char.speakingStyle ? `SPEAKING_STYLE: ${char.speakingStyle}` : ''}
${char.exampleDialogue ? `EXAMPLE_DIALOGUE: \n${char.exampleDialogue}` : ''}
CORE_INSTRUCTION: ${char.systemPrompt}
`;

                // Update usage metadata in background
                const { FieldValue } = await import("firebase-admin/firestore");
                charDoc.ref.update({
                    lastActiveAt: FieldValue.serverTimestamp(),
                    messageCount: (char.messageCount || 0) + 1
                }).catch(e => logger.error("[WorkerAI] Failed to update character stats", e));
            }
        }

        // 2. Initialize Backend Broccoli
        const broccoli = new BroccoliFirebase(`user-${uid}`);
        const persona = new BroccoliPersona(broccoli, uid);

        // 3. Prepare Context (Semantic Recall + Persona)
        const userQuery = messages[messages.length - 1].content;
        const memorySummary = await persona.getPersonaContext();
        const relevantPast = await persona.findRelevantContext(userQuery);

        const enrichedMessages: ChatMessage[] = [
            {
                role: 'system',
                content: `SOVEREIGN_BOUNDARY_ACTIVE: This session is strictly isolated to UserID: ${uid}. 
                ${characterId ? `CHARACTER_IDENTITY: ${characterIdentity}` : ''}
                ${memorySummary ? `GLOBAL_CONTEXT: ${memorySummary}` : ''}
                ${relevantPast ? `RELEVANT_PAST_INSIGHTS: ${relevantPast}` : ''}
                MISSION: Provide high-fidelity assistance as ${characterName} using the user's private memory DAG. 
                Maintain character voice at all times.`
            },
            ...messages
        ];

        // 4. Run Stream & Broadcast
        const result = await WorkerAiService.streamChatCompletion(enrichedMessages, async (chunk) => {
            await broadcastWorkerAiChunk(uid, requestId, chunk, false);
        }, { model: 'gemini-1.5-pro' }); // Use pro for higher fidelity character play

        // 5. Estimate usage & Deduct
        const promptTokens = await WorkerAiService.estimateTokensAsync(JSON.stringify(enrichedMessages));
        const completionTokens = await WorkerAiService.estimateTokensAsync(result.content);
        const totalTokens = promptTokens + completionTokens;
        await WorkerAiService.deductUsage(
            uid,
            characterId ? 'PERSONA_CHAT' : 'WORKER_AI_CHAT',
            `wai-stream-${requestId}`,
            totalTokens
        );

        // 6. Final chunk
        await broadcastWorkerAiChunk(uid, requestId, "", true);

        // 7. Background: Anonymous Memory Update
        if (chatId) {
            persona.reconcile(messages.concat([{ role: 'assistant', content: result.content }]), requestId)
                .then(() => broccoli.checkpoint('main', uid))
                .catch(e => logger.error("[WorkerAI] Backend Memory Update Failed", e));
        }

        return {
            success: true,
            requestId,
            usage: {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: totalTokens
            }
        };
    } catch (error: any) {
        logger.error(`[WorkerAI] Stream Error`, error);
        await broadcastWorkerAiChunk(uid, requestId, "\n\n[Network Execution Failed: Sovereign Authority interrupted.]", true);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || 'WorkerAI streaming failed');
    }
};

/**
 * Handle WorkerAI Task creation (Async)
 */
export const handleCreateWorkerAiTask = async (request: RequestWithAuth<{ messages: ChatMessage[] }>) => {
    const { messages } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    if (!messages || !Array.isArray(messages)) throw new HttpsError('invalid-argument', 'Messages must be an array');

    const uid = request.auth.uid;

    try {
        // 1. Pre-generate task to get ID
        const { taskId } = await WorkerAiService.createAsyncTask(uid, messages);

        // 2. Deduct Zaps (use taskId as requestId for perfect idempotency)
        // For async tasks, we deduct the base task cost immediately.
        await WorkerAiService.deductUsage(uid, 'WORKER_AI_TASK', `wai-task-${taskId}`);

        return {
            success: true,
            taskId,
            openai: OpenAiFormatter.formatTaskResponse(taskId)
        };
    } catch (error: any) {
        logger.error(`[WorkerAI] Async Error`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || 'WorkerAI task creation failed');
    }
};

/**
 * Character Alchemy: AI-powered personality generation
 */
export const handleCharacterAlchemy = async (request: RequestWithAuth<{ name: string, description?: string, isInstant?: boolean }>) => {
    const { name, description, isInstant } = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    if (!name) throw new HttpsError('invalid-argument', 'Name or seed required');

    const uid = request.auth.uid;

    try {
        const alchemyPrompt = isInstant ? `
You are the Genesis Forge, a primordial engine of identity. 
USER_SEED: "${name}"

FORGE_INSTRUCTIONS:
1. Synthesize a legendary persona that feels unique, cohesive, and logically consistent.
2. The 'systemPrompt' MUST be a high-fidelity blueprint (200-400 words) defining:
   - Ontological constraints (who they ARE vs what they KNOW)
   - Cognitive biases and psychological triggers
   - Interaction taboos and strictly enforced boundaries
3. 'speakingStyle' should define rhythmic patterns, vocabulary tiers, and stylistic tics.
4. 'exampleDialogue' must demonstrate the persona's internal logic and reactive depth.

RESPOND ONLY WITH RAW JSON:
{
  "name": "Sovereign Identity Name",
  "description": "Evocative 2-sentence character essence.",
  "systemPrompt": "The architectural source code for this identity.",
  "speakingStyle": "The behavioral acoustics of their voice.",
  "exampleDialogue": "3 dialectic samples showing reactive range.",
  "tags": ["archetype-tag", "tonal-tag", "domain-tag"]
}
` : `
You are the Alchemist Forge. Expand this character matrix into a production-grade identity.
NAME: ${name}
CORE_CONCEPT: ${description}

EXPANSION_PROTOCOL:
1. Deepen the narrative weight of this identity.
2. Provide a 'systemPrompt' that functions as a recursive behavioral loop, ensuring the AI never breaks character.
3. Define 'speakingStyle' with specific focus on syntax, pacing, and emotional resonance.
4. Forge 'exampleDialogue' that showcases the character's reaction to complex user prompts.

RESPOND ONLY WITH RAW JSON:
{
  "name": "${name}",
  "systemPrompt": "Production-hardened instructions.",
  "speakingStyle": "Voice behavioral constraints.",
  "exampleDialogue": "High-fidelity voice samples.",
  "tags": ["new-aligned-tag1", "new-aligned-tag2"]
}
`;

        const result = await WorkerAiService.chatCompletion([
            { role: 'system', content: "You are a professional character architect. You excel at synthesizing deep, complex personalities." },
            { role: 'user', content: alchemyPrompt }
        ], { model: 'gemini-1.5-flash' });

        let characterData;
        try {
            const content = result.result.content || result.result.response;
            characterData = JSON.parse(content.replace(/```json|```/g, '').trim());
        } catch (e) {
            logger.error("[CharacterAlchemy] Failed to parse AI response", result.result);
            throw new HttpsError('internal', 'Alchemy produced unstable results. Try again.');
        }

        // Deduct alchemy cost (fixed fee)
        await WorkerAiService.deductUsage(uid, 'PERSONA_CREATE', `alchemy-${crypto.randomUUID()}`);

        return {
            success: true,
            result: characterData
        };
    } catch (error: any) {
        logger.error(`[CharacterAlchemy] Error`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Sovereign Forge failed to alchemize identity.');
    }
};
