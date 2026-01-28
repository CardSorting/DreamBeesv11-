import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

const api = httpsCallable(functions, 'api');

/**
 * Generates a coloring book page based on the theme and style.
 */
export const generateColoringPage = async (prompt, style) => {
    try {
        const result = await api({ action: 'createColoringPage', prompt, style });
        return result.data.imageUrl;
    } catch (error) {
        console.error("Image Generation Error:", error);
        throw new Error(error.message || "Failed to generate image.");
    }
};
