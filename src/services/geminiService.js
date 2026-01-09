import { getFunctions, httpsCallable } from "firebase/functions";

const getApi = () => {
    const functions = getFunctions();
    return httpsCallable(functions, 'api');
};

export const generateLrcFromAudio = async (audioBase64, mimeType) => {
    try {
        const api = getApi();
        const response = await api({
            action: 'generateLyrics',
            mode: 'audio',
            audioBase64,
            mimeType
        });

        return response.data.text;
    } catch (error) {
        console.error("Error generating lyrics from audio:", error);
        throw error;
    }
};

export const generateLrcFromText = async (rawText, songDuration) => {
    try {
        const api = getApi();
        const response = await api({
            action: 'generateLyrics',
            mode: 'text',
            rawText,
            songDuration
        });

        return response.data.text;
    } catch (error) {
        console.error("Error generating lyrics from text:", error);
        throw error;
    }
};
