import { fetchWithRetry, logger } from "../utils.js";
import { db, FieldValue, getStorage } from "../../firebaseInit.js";
import { createHash } from 'crypto';
import { getReaction as getReactionData } from "../data/reactions.js";
export const getReaction = getReactionData;
const TTS_API_URL = "https://mariecoderinc--phantom-twitch-tts-fastapi-app.modal.run/v1/tts";
const JOBS_API_URL = "https://mariecoderinc--phantom-twitch-tts-fastapi-app.modal.run/v1/jobs";
const CACHE_COLLECTION = 'tts_cache';
const CACHE_TTL_MS = 20 * 60 * 60 * 1000; // 20 Hours
/**
 * Polls the TTS API for job completion.
 */
export const pollForCompletion = async (jobId, attempts = 30) => {
    for (let i = 0; i < attempts; i++) {
        let delay = 1000;
        if (i < 4) {
            delay = 500;
        }
        else if (i > 14) {
            delay = 2000;
        }
        await new Promise(r => setTimeout(r, delay));
        const res = await fetchWithRetry(`${JOBS_API_URL}/${jobId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') {
                return data;
            }
            if (data.status === 'failed') {
                throw new Error("TTS Job Failed");
            }
        }
    }
    throw new Error("TTS Job Timed Out");
};
/**
 * Injects filler words based on emotion and hype to sound more natural.
 */
const injectFillers = (text, emotion, hypeLevel) => {
    if (Math.random() > 0.3 || text.length < 5) {
        return text;
    }
    const fillers = [];
    switch (emotion) {
        case 'Confused':
            fillers.push("Um...", "Hmm...", "Uh...");
            break;
        case 'Sad':
            fillers.push("*sigh*...", "Well...", "I guess...");
            break;
        case 'Happy':
            fillers.push("You know,", "Like,", "So yeah,");
            break;
        case 'Excited':
            (hypeLevel > 7) ? fillers.push("Yo!", "Oh wow!", "Dude!") : fillers.push("Yes!", "Okay!");
            break;
        default:
            fillers.push("Um,", "Well,");
            break;
    }
    const filler = fillers[Math.floor(Math.random() * fillers.length)];
    return `${filler} ${text}`;
};
/**
 * Modulates the base voice DNA with emotional context and pacing.
 */
export const modulateDna = (baseDna, emotion, hypeLevel = 5, text = "") => {
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
    let pacingMod = "";
    if (hypeLevel >= 7) {
        pacingMod = "spoken with a fast, urgent, and energetic pace";
    }
    else if (hypeLevel <= 3) {
        pacingMod = "spoken with a relaxed, slow, and casual pace";
    }
    let intonationMod = "";
    const cleanText = text.trim();
    const letters = cleanText.replace(/[^a-zA-Z]/g, '');
    const isYelling = letters.length > 4 && letters === letters.toUpperCase();
    if (isYelling) {
        intonationMod = "spoken with a loud, projected, and commanding voice";
    }
    else if (cleanText.endsWith('?')) {
        intonationMod = "spoken with a curious, rising intonation";
    }
    else if (cleanText.endsWith('!')) {
        intonationMod = "spoken with an emphatic, forceful tone";
    }
    const parts = [emotionMod, pacingMod, intonationMod].filter(Boolean);
    if (parts.length === 0) {
        return baseDna;
    }
    return `${baseDna}, ${parts.join(', ')}.`;
};
/**
 * Submits a text-to-speech generation job with Caching.
 */
export const submitTtsJob = async (text, voiceDna, emotion = 'Neutral', hypeLevel = 5) => {
    try {
        if (!text || !voiceDna) {
            return null;
        }
        const finalText = injectFillers(text, emotion, hypeLevel);
        const description = modulateDna(voiceDna, emotion, hypeLevel, finalText);
        const cacheKey = createHash('sha256').update(`${finalText}:${description}`).digest('hex');
        const cacheRef = db.collection(CACHE_COLLECTION).doc(cacheKey);
        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
            const data = cacheDoc.data();
            const age = Date.now() - data.createdAt.toMillis();
            if (age < CACHE_TTL_MS) {
                logger.info(`[Voice] Cache HIT: ${cacheKey}`);
                return data.jobId;
            }
            else {
                logger.info(`[Voice] Cache EXPIRED: ${cacheKey}`);
            }
        }
        const payload = {
            text: finalText,
            voice_description: description,
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
        await cacheRef.set({
            jobId: data.job_id,
            text: finalText,
            description,
            createdAt: FieldValue.serverTimestamp()
        });
        return data.job_id;
    }
    catch (e) {
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
        const personaDoc = await personaRef.get();
        const personaData = personaDoc.exists ? personaDoc.data() : {};
        const savedReactions = personaData.reactions || {};
        if (savedReactions[reactionKey]) {
            logger.info(`[Voice] Reaction cached for ${personaId}: ${reactionKey}`);
            return { url: savedReactions[reactionKey], type: 'static', key: reactionKey };
        }
        logger.info(`[Voice] Generating new reaction for ${personaId}: ${reactionKey}`);
        const jobId = await submitTtsJob(reactionData.textPrompt, voiceDna, reactionData.emotion, 5);
        if (!jobId) {
            throw new Error("Failed to submit TTS job");
        }
        await pollForCompletion(jobId);
        const audioRes = await fetchWithRetry(`${JOBS_API_URL}/${jobId}/audio`);
        if (!audioRes.ok) {
            throw new Error("Failed to download audio");
        }
        const arrayBuffer = await audioRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const bucket = getStorage().bucket();
        const filePath = `persona-assets/${personaId}/reactions/${reactionKey}.wav`;
        const file = bucket.file(filePath);
        await file.save(buffer, {
            metadata: { contentType: 'audio/wav' },
            public: true
        });
        const publicUrl = file.publicUrl();
        await personaRef.update({
            [`reactions.${reactionKey}`]: publicUrl
        });
        return { url: publicUrl, type: 'static', key: reactionKey };
    }
    catch (e) {
        logger.error(`[Voice] Failed to get/create reaction: ${reactionKey}`, e);
        return null;
    }
};
//# sourceMappingURL=voice.js.map