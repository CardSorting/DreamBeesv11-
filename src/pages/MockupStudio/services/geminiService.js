import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebase"; // Adjust path if needed: src/pages/MockupStudio/services -> src/firebase

// Helper to convert File to Base64
export const fileToGenerativePart = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const generateMockup = async (imageFile, userInstruction, options = { quality: 'high' }) => {
    try {
        const base64Image = await fileToGenerativePart(imageFile);

        // Call Cloud Function
        const generateMockupFn = httpsCallable(functions, 'api');

        // Payload matches what the backend handler expects
        const result = await generateMockupFn({
            action: 'generateMockup',
            image: base64Image,
            instruction: userInstruction,
            options
        });

        if (result.data && result.data.image) {
            return result.data.image;
        }

        throw new Error("No image returned from server.");

    } catch (error) {
        console.error("Mockup Generation API Error:", error);
        throw error;
    }
};
