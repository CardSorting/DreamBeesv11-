import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

const api = httpsCallable(functions, 'api');

/**
 * Generates a list of 30 distinct coloring book page concepts based on a theme.
 */
export const generateBookConcepts = async (theme, style) => {
    try {
        const result = await api({ action: 'createBookConcepts', theme, style });
        return result.data.pages; // Expecting { pages: [...] } from backend
    } catch (error) {
        console.error("Concept Generation Error:", error);
        throw new Error(error.message || "Failed to brainstorm book concepts.");
    }
};

/**
 * Generates a coloring book page based on the theme and style.
 */
export const generateColoringPage = async (prompt, style) => {
    try {
        const result = await api({ action: 'createColoringPage', prompt, style });
        // Backend returns object with imageUrl, thumbnailUrl.
        // If frontend expects base64, we might need to adjust, but URL is better.
        // The original app used base64 for immediate display.
        // Let's assume for now we use the image URL.
        return result.data.imageUrl;
    } catch (error) {
        console.error("Image Generation Error:", error);
        throw new Error(error.message || "Failed to generate image.");
    }
};
