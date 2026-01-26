import { fetchWithRetry, logger } from "../utils.js";

const TTS_API_URL = "https://mariecoderinc--phantom-twitch-tts-fastapi-app-dev.modal.run/v1/tts";

/**
 * Modulates the base voice DNA with emotional context.
 * 
 * @param {string} baseDna - The character's core voice description.
 * @param {string} emotion - The detected emotion (e.g., "Happy", "Angry", "Sad", "Neutral").
 * @returns {string} - The modulated voice description.
 */
export const modulateDna = (baseDna, emotion) => {
    if (!emotion || emotion === 'Neutral') return baseDna;

    const modifiers = {
        'Happy': 'spoken with a cheerful, upbeat, and energetic tone',
        'Excited': 'spoken rapidly with high energy and excitement',
        'Angry': 'spoken with a sharp, tense, and slightly aggressive tone',
        'Sad': 'spoken softly, slowly, and with a melancholic undertone',
        'Scared': 'spoken with a shaky, nervous, and breathless tone',
        'Confused': 'spoken with a rising inflection and uncertain pacing',
        'Sarcastic': 'spoken with a dry, drawling, and mocking tone'
    };

    const modifier = modifiers[emotion] || `spoken in a ${emotion.toLowerCase()} tone`;
    return `${baseDna}, ${modifier}.`;
};

/**
 * Submits a text-to-speech generation job.
 * 
 * @param {string} text - The text to speak.
 * @param {string} voiceDna - The character's voice description.
 * @param {string} emotion - Optional emotion to modulate the voice.
 * @returns {Promise<string|null>} - The job ID if successful, or null on failure.
 */
export const submitTtsJob = async (text, voiceDna, emotion = 'Neutral') => {
    try {
        if (!text || !voiceDna) return null;

        const description = modulateDna(voiceDna, emotion);

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
        // API returns { job_id: "...", ... }
        return data.job_id;

    } catch (e) {
        logger.error("[Voice] TTS Error", e);
        return null;
    }
};
