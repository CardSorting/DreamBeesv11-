import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";
import * as Broadcaster from "../lib/persona/broadcaster.js";
import * as Voice from "../lib/persona/voice.js";
import { normalizeForTts } from "../lib/persona/textNormalizer.js";

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

        // 0. Check Reaction Bank (Use original text for pattern matching)
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
                // Fallback: Reaction generation failed, proceed to standard TTS path
                logger.warn(`[VoiceWorker] Reaction generation failed, falling back to standard TTS.`);
                // audioUrl remains null, so the standard TTS path below will execute
            }
        }

        // If no reaction audio was found or reaction generation failed, proceed with standard TTS
        if (!audioUrl) {
            // 1. Normalize Text for TTS
            const normalizedText = normalizeForTts(text);

            // 2. Submit to TTS API (With Hype Pacing & Normalization)
            const submitStart = Date.now();
            audioJobId = await Voice.submitTtsJob(normalizedText, voiceDna, emotion, hypeLevel);
            if (!audioJobId) {
                logger.error(`[VoiceWorker] Failed to get audioJobId for msg: ${messageId}`);
                return;
            }
            const submitDuration = Date.now() - submitStart;
            logger.info(`[VoiceWorker] TTS Submitted: ${audioJobId} in ${submitDuration}ms. Polling for completion...`);

            // 2a. Poll for completion to get the final audio (blocking worker)
            const pollStart = Date.now();
            try {
                const jobResult = await Voice.pollForCompletion(audioJobId);
                if (jobResult && jobResult.status === 'completed') {
                    // The Modal API usually returns audio at /v1/jobs/{job_id}/audio
                    audioUrl = `https://mariecoderinc--phantom-twitch-tts-fastapi-app-dev.modal.run/v1/jobs/${audioJobId}/audio`;
                    const pollDuration = Date.now() - pollStart;
                    const totalDuration = Date.now() - submitStart;
                    logger.info(`[VoiceWorker] TTS Ready: ${audioJobId}. Poll:${pollDuration}ms Total:${totalDuration}ms`);
                }
            } catch (pollErr) {
                logger.error(`[VoiceWorker] Polling failed for job: ${audioJobId}`, pollErr);
            }
        }

        // 2. Update Firestore Message
        const updateData = { updatedAt: FieldValue.serverTimestamp() };
        if (audioJobId) {updateData.audioJobId = audioJobId;}
        if (audioUrl) {updateData.audioUrl = audioUrl;}

        const msgRef = db.collection('personas').doc(imageId).collection('messages').doc(messageId);
        await msgRef.update(updateData);

        // 3. Broadcast Update
        await Broadcaster.broadcastAudioUpdate(imageId, messageId, audioJobId, audioUrl);

    } catch (e) {
        logger.error(`[VoiceWorker] Error processing task`, e);
        throw e; // Retry
    }
};
