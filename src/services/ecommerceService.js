import { getFunctions, httpsCallable } from 'firebase/functions';

export const analyzeProductImage = async (imageBase64, mimeType) => {
    const functions = getFunctions();
    const analyzeProductImageFn = httpsCallable(functions, 'api');

    try {
        const result = await analyzeProductImageFn({
            action: 'analyzeProductImage',
            imageBase64,
            mimeType
        });
        return result.data;
    } catch (error) {
        console.error("Error calling analyzeProductImage:", error);
        throw error;
    }
};
