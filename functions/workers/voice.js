import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";
import * as Broadcaster from "../lib/persona/broadcaster.js";
import * as Voice from "../lib/persona/voice.js";

/**
 * Processes a voice generation task.
 * 
 * @param {Object} req - The task request object.
 */
export const processVoiceTask = async (req) => {
    const { imageId, messageId, text, voiceDna, emotion, hypeLevel } = req.data;

    logger.info(`[VoiceWorker] Processing TTS for msg: ${messageId}`, { imageId, emotion, hypeLevel });

    try {
        if (!text || !voiceDna) {
            logger.warn(`[VoiceWorker] Missing text or voiceDna. Skipping.`);
            return;
        }

        // 0. Check Reaction Bank
        const reactionMatch = Voice.getReaction(text);
        let audioJobId = null;
        let audioUrl = null;

        if (reactionMatch) {
            // Lazy-load the permanent reaction asset
            logger.info(`[VoiceWorker] Processing Reaction: ${reactionMatch.key}`);
            const result = await Voice.getOrCreateReaction(imageId, voiceDna, reactionMatch.key, reactionMatch);
            if (result) {
                audioUrl = result.url;
            } else {
                // Fallback to generating standard TTS if reaction gen fails
                logger.warn(`[VoiceWorker] Reaction generation failed, falling back to standard TTS.`);
                // Reactions are hype-neutral -> 5
                audioJobId = await Voice.submitTtsJob(text, voiceDna, emotion, 5);
            }
        } else {
            // 1. Submit to TTS API (With Hype Pacing)
            audioJobId = await Voice.submitTtsJob(text, voiceDna, emotion, hypeLevel);
            if (!audioJobId) {
                logger.error(`[VoiceWorker] Failed to get audioJobId for msg: ${messageId}`);
                return;
            }
            logger.info(`[VoiceWorker] TTS Job Submitted: ${audioJobId}`);
        }

        // 2. Update Firestore Message
        const updateData = { updatedAt: FieldValue.serverTimestamp() };
        if (audioJobId) updateData.audioJobId = audioJobId;
        if (audioUrl) updateData.audioUrl = audioUrl;

        const msgRef = db.collection('personas').doc(imageId).collection('messages').doc(messageId);
        await msgRef.update(updateData);

        // 3. Broadcast Update
        await Broadcaster.broadcastAudioUpdate(imageId, messageId, audioJobId, audioUrl);

    } catch (e) {
        logger.error(`[VoiceWorker] Error processing task`, e);
        throw e; // Retry
    }
};
