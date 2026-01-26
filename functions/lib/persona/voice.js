import { fetchWithRetry, logger } from "../utils.js";
import { db, FieldValue, getStorage } from "../../firebaseInit.js"; // Import DB
import { createHash } from 'crypto';
import { getReaction as getReactionData } from "../data/reactions.js";

export const getReaction = getReactionData;

const TTS_API_URL = "https://mariecoderinc--phantom-twitch-tts-fastapi-app-dev.modal.run/v1/tts";
const JOBS_API_URL = "https://mariecoderinc--phantom-twitch-tts-fastapi-app-dev.modal.run/v1/jobs";
const CACHE_COLLECTION = 'tts_cache';
const CACHE_TTL_MS = 20 * 60 * 60 * 1000; // 20 Hours (Safety for 24h cleanup)

/**
 * Polls the TTS API for job completion.
 */
const pollForCompletion = async (jobId, attempts = 10) => {
    for (let i = 0; i < attempts; i++) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s
        const res = await fetchWithRetry(`${JOBS_API_URL}/${jobId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') return data;
            if (data.status === 'failed') throw new Error("TTS Job Failed");
        }
    }
    throw new Error("TTS Job Timed Out");
};

/**
 * Modulates the base voice DNA with emotional context and pacing.
 * 
 * @param {string} baseDna - The character's core voice description.
 * @param {string} emotion - The detected emotion (e.g., "Happy").
 * @param {number} hypeLevel - Thread hype (1-10).
 * @returns {string} - The modulated voice description.
 */
export const modulateDna = (baseDna, emotion, hypeLevel = 5) => {
    // 1. Emotion Modifier
    const modifiers = {
        'Happy': 'spoken with a cheerful, upbeat, and energetic tone',
        'Excited': 'spoken rapidly with high energy and excitement',
        'Angry': 'spoken with a sharp, tense, and slightly aggressive tone',
        'Sad': 'spoken softly, slowly, and with a melancholic undertone',
        'Scared': 'spoken with a shaky, nervous, and breathless tone',
        'Confused': 'spoken with a rising inflection and uncertain pacing',
        'Sarcastic': 'spoken with a dry, drawling, and mocking tone'
    };
    const emotionMod = modifiers[emotion] || (emotion && emotion !== 'Neutral' ? `spoken in a ${emotion.toLowerCase()} tone` : '');

    // 2. Pacing Modifier
    let pacingMod = "";
    if (hypeLevel >= 7) {
        pacingMod = "spoken with a fast, urgent, and energetic pace";
    } else if (hypeLevel <= 3) {
        pacingMod = "spoken with a relaxed, slow, and casual pace";
    }

    // Combine
    const parts = [emotionMod, pacingMod].filter(Boolean);
    if (parts.length === 0) return baseDna;

    return `${baseDna}, ${parts.join(', ')}.`;
};

/**
 * Submits a text-to-speech generation job with Caching.
 * 
 * @param {string} text - The text to speak.
 * @param {string} voiceDna - The character's voice description.
 * @param {string} emotion - Optional emotion.
 * @param {number} hypeLevel - Optional hype level (1-10).
 * @returns {Promise<string|null>} - The job ID.
 */
export const submitTtsJob = async (text, voiceDna, emotion = 'Neutral', hypeLevel = 5) => {
    try {
        if (!text || !voiceDna) return null;

        const description = modulateDna(voiceDna, emotion, hypeLevel);

        // --- 1. Check Cache ---
        const cacheKey = createHash('sha256').update(`${text}:${description}`).digest('hex');
        const cacheRef = db.collection(CACHE_COLLECTION).doc(cacheKey);

        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
            const data = cacheDoc.data();
            const age = Date.now() - data.createdAt.toMillis();
            if (age < CACHE_TTL_MS) {
                logger.info(`[Voice] Cache HIT: ${cacheKey}`);
                return data.jobId;
            } else {
                logger.info(`[Voice] Cache EXPIRED: ${cacheKey}`);
            }
        }

        // --- 2. Call API ---
        const payload = {
            text: text,
            voice_description: description, // Matches API expected param
            language: "English"
        };

        const response = await fetchWithRetry(TTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            logger.error(`[Voice] TTS Submission Failed: ${response.status}`, errText);
            return null;
        }

        const data = await response.json();

        // --- 3. Save to Cache ---
        await cacheRef.set({
            jobId: data.job_id,
            text,
            description,
            createdAt: FieldValue.serverTimestamp()
        });

        // API returns { job_id: "...", ... }
        return data.job_id;

    } catch (e) {
        logger.error("[Voice] TTS Error", e);
        return null;
    }
};

/**
 * Gets or creates a permanent reaction asset for a persona.
 */
export const getOrCreateReaction = async (personaId, voiceDna, reactionKey, reactionData) => {
    try {
        const personaRef = db.collection('personas').doc(personaId);

        // 1. Check if Reaction uses exist in Persona doc
        const personaDoc = await personaRef.get();
        const personaData = personaDoc.exists ? personaDoc.data() : {};
        const savedReactions = personaData.reactions || {};

        // Return if exists
        if (savedReactions[reactionKey]) {
            logger.info(`[Voice] Reaction cached for ${personaId}: ${reactionKey}`);
            return { url: savedReactions[reactionKey], type: 'static', key: reactionKey };
        }

        logger.info(`[Voice] Generating new reaction for ${personaId}: ${reactionKey}`);

        // 2. Generate Audio (Reactions are hype-neutral -> 5)
        const jobId = await submitTtsJob(reactionData.textPrompt, voiceDna, reactionData.emotion, 5);
        if (!jobId) throw new Error("Failed to submit TTS job");

        // 3. Poll for Completion
        await pollForCompletion(jobId);

        // 4. Download Audio
        const audioRes = await fetchWithRetry(`${JOBS_API_URL}/${jobId}/audio`);
        if (!audioRes.ok) throw new Error("Failed to download audio");
        const arrayBuffer = await audioRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 5. Upload to Firebase Storage
        const bucket = getStorage().bucket(); // Default bucket
        const filePath = `persona-assets/${personaId}/reactions/${reactionKey}.wav`;
        const file = bucket.file(filePath);

        await file.save(buffer, {
            metadata: { contentType: 'audio/wav' },
            public: true
        });

        // 6. Save to Persona Document
        const publicUrl = file.publicUrl();
        await personaRef.update({
            [`reactions.${reactionKey}`]: publicUrl
        });

        return { url: publicUrl, type: 'static', key: reactionKey };

    } catch (e) {
        logger.error(`[Voice] Failed to get/create reaction: ${reactionKey}`, e);
        return null;
    }
};
