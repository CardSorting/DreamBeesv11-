import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";
import * as Broadcaster from "../lib/persona/broadcaster.js";
import * as Voice from "../lib/persona/voice.js";
import { normalizeForTts } from "../lib/persona/textNormalizer.js";
/**
 * Processes a voice generation task.
 */
export const processVoiceTask = async (req) => {
    const { imageId, messageId, text, voiceDna, emotion, hypeLevel } = req.data;
    logger.info(`[VoiceWorker] Processing TTS for msg: ${messageId}`, { imageId, emotion, hypeLevel });
    try {
        if (!text || !voiceDna) {
            logger.warn(`[VoiceWorker] Missing text or voiceDna. Skipping.`);
            return;
        }
        const msgRef = db.collection('personas').doc(imageId).collection('messages').doc(messageId);
        await msgRef.update({
            audioStatus: 'processing',
            updatedAt: FieldValue.serverTimestamp()
        });
        const reactionMatch = Voice.getReaction(text);
        let audioJobId = null;
        let audioUrl = null;
        if (reactionMatch) {
            logger.info(`[VoiceWorker] Processing Reaction: ${reactionMatch.key}`);
            const result = await Voice.getOrCreateReaction(imageId, voiceDna, reactionMatch.key, reactionMatch);
            if (result) {
                audioUrl = result.url;
            }
            else {
                logger.warn(`[VoiceWorker] Reaction generation failed, falling back to standard TTS.`);
            }
        }
        if (!audioUrl) {
            const normalizedText = normalizeForTts(text);
            const submitStart = Date.now();
            audioJobId = await Voice.submitTtsJob(normalizedText, voiceDna, emotion, hypeLevel);
            if (!audioJobId) {
                throw new Error("Failed to get audioJobId from TTS provider");
            }
            const submitDuration = Date.now() - submitStart;
            logger.info(`[VoiceWorker] TTS Submitted: ${audioJobId} in ${submitDuration}ms. Polling for completion...`);
            const pollStart = Date.now();
            const jobResult = await Voice.pollForCompletion(audioJobId);
            if (jobResult && jobResult.status === 'completed') {
                audioUrl = `https://mariecoderinc--phantom-twitch-tts-fastapi-app.modal.run/v1/jobs/${audioJobId}/audio`;
                const pollDuration = Date.now() - pollStart;
                const totalDuration = Date.now() - submitStart;
                logger.info(`[VoiceWorker] TTS Ready: ${audioJobId}. Poll:${pollDuration}ms Total:${totalDuration}ms`);
            }
            else {
                throw new Error(`TTS Job failed with status: ${jobResult?.status}`);
            }
        }
        const updateData = {
            updatedAt: FieldValue.serverTimestamp(),
            audioStatus: 'completed'
        };
        if (audioJobId) {
            updateData.audioJobId = audioJobId;
        }
        if (audioUrl) {
            updateData.audioUrl = audioUrl;
        }
        await msgRef.update(updateData);
        await Broadcaster.broadcastAudioUpdate(imageId, messageId, audioJobId || '', audioUrl || '');
    }
    catch (e) {
        logger.error(`[VoiceWorker] Task Failed for msg: ${messageId}`, e);
        try {
            const msgRef = db.collection('personas').doc(imageId).collection('messages').doc(messageId);
            await msgRef.update({
                audioStatus: 'failed',
                audioError: e.message,
                updatedAt: FieldValue.serverTimestamp()
            });
            await Broadcaster.broadcastAudioFailed(imageId, messageId, e.message);
        }
        catch (dbError) {
            logger.error(`[VoiceWorker] Critical DB Error during failure handling`, dbError);
        }
    }
};
//# sourceMappingURL=voice.js.map