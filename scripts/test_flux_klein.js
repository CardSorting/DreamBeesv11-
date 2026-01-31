/**
 * Verification script for testing the Flux-Klein-4B Modal API integration.
 * This script bypasses Firebase auth/DB and calls the Modal API via our wrapper.
 */
import { ModalAPI } from '../functions/lib/modal.js';

// Mock logger to avoid dependency issues if needed, 
// but since we are importing from functions/lib, we need to handle potential relative imports.
// Note: This script should be run from the root of the project.

async function testFluxKlein() {
    console.log("Starting Flux-Klein-4B Integration Test...");

    const api = new ModalAPI();
    const testImage = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"; // Pikachu
    const testPrompt = "Make Pikachu into a realistic cyberpunk detective in a rainy city neon light, high detail";

    try {
        console.log("Submitting job...");
        const jobId = await api.submitEdit({
            prompt: testPrompt,
            image: testImage,
            num_steps: 4
        });
        console.log(`Job submitted. ID: ${jobId}`);

        console.log("Polling for result (this may take 20-40 seconds)...");
        const imageBuffer = await api.pollResult(jobId);

        console.log(`Success! Received image buffer of size: ${imageBuffer.length} bytes`);
        console.log("Verification PASSED.");
    } catch (error) {
        console.error("Verification FAILED:", error.message);
        process.exit(1);
    }
}

testFluxKlein();
