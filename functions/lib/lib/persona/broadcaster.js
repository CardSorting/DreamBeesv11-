import { logger, retryOperation } from "../utils.js";
import { getDatabase, ServerValue } from "firebase-admin/database";
/**
 * Realtime Database Broadcaster
 * Replaces Soketi/Pusher with Firebase Realtime Database for lower latency and better stability.
 */
const trigger = async (channel, event, data) => {
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
    }
    catch (e) {
        logger.error(`[Broadcaster] Permanent Trigger Error (${event})`, e);
    }
};
export const broadcastMessage = async (personaId, msgData) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "new-message", {
        ...msgData,
        timestamp: Date.now()
    });
};
export const broadcastReaction = async (personaId, emoji) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "reaction", { emoji });
};
export const broadcastStateChange = async (personaId, actionId, from) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "state-change", {
        actionId,
        from,
        timestamp: Date.now()
    });
};
export const broadcastPoll = async (personaId, poll) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "poll-started", poll);
};
export const broadcastCelebration = async (personaId, data) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "celebration", data);
};
export const broadcastAudioUpdate = async (personaId, messageId, audioJobId, audioUrl = null) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "audio-update", { messageId, audioJobId, audioUrl });
};
export const broadcastAudioFailed = async (personaId, messageId, error) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "audio-failed", { messageId, error });
};
export const broadcastWorkerAiChunk = async (userId, requestId, chunk, isFinal = false) => {
    const channel = `private-workerai-${userId}`;
    await trigger(channel, "ai-chunk", {
        requestId,
        chunk,
        isFinal,
        timestamp: Date.now()
    });
};
export const broadcastTyping = async (userId, isTyping) => {
    const channel = `private-typing-${userId}`;
    await trigger(channel, "typing", { isTyping });
};
//# sourceMappingURL=broadcaster.js.map