import { logger } from "../utils.js";

let pusherInstance = null;

const initPusher = async () => {
    if (pusherInstance) return pusherInstance;
    if (!process.env.SOKETI_APP_ID) return null;

    try {
        const Pusher = (await import("pusher")).default;
        pusherInstance = new Pusher({
            appId: process.env.SOKETI_APP_ID,
            key: process.env.SOKETI_APP_KEY,
            secret: process.env.SOKETI_APP_SECRET,
            host: process.env.SOKETI_HOST || "127.0.0.1",
            port: process.env.SOKETI_PORT || "6001",
            useTLS: process.env.SOKETI_USE_TLS === 'true',
            cluster: "mt1",
        });
        return pusherInstance;
    } catch (e) {
        logger.error("[Broadcaster] Pusher Init Error", e);
        return null;
    }
};

const trigger = async (channel, event, data) => {
    const pusher = await initPusher();
    if (!pusher) return;

    // We use retryOperation to handle transient network issues or Soketi restarts
    const { retryOperation } = await import("../utils.js");
    await retryOperation(async () => {
        return await pusher.trigger(channel, event, data);
    }, { retries: 3, context: `Pusher trigger (${event})` }).catch(e => {
        logger.error(`[Broadcaster] Permanent Trigger Error (${event})`, e);
    });
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
    await trigger(channel, "celebration", data); // e.g. gift
};

export const broadcastAudioUpdate = async (personaId, messageId, audioJobId, audioUrl = null) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "audio-update", { messageId, audioJobId, audioUrl });
};

export const broadcastTyping = async (personaId, isTyping) => {
    const channel = `presence-chat-${personaId}`;
    await trigger(channel, "typing", { isTyping });
};
