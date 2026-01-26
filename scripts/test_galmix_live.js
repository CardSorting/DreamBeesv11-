
/* global process */
import { GalmixClient } from '../src/utils/GalmixClient.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Live test for Galmix API.
 * Run this with: node scripts/test_galmix_live.js
 */
async function runLiveTest() {
    // Replace with the actual URL from tunnel.log if needed
    const API_URL = process.env.GALMIX_API_URL || "https://api.dreambeesai.com";
    console.log(`Connecting to Galmix API at: ${API_URL}`);

    const client = new GalmixClient(API_URL);

    try {
        console.log("Submitting test image generation...");
        console.log("Prompt: 'A beautiful futuristic bee-themed laboratory, cinematic lighting, 8k'");

        const startTime = Date.now();
        const result = await client.generateImage(
            "A beautiful futuristic bee-themed laboratory, cinematic lighting, 8k",
            {
                steps: 20,
                poll_interval: 2000
            }
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✓ Generation successful in ${duration}s!`);

        const outputPath = path.join(__dirname, 'galmix_test_output.png');
        await client.saveBase64Image(result.result, outputPath);
        console.log(`✓ Image saved to: ${outputPath}`);
        console.log("Done!");
    } catch (e) {
        console.error(`✗ Test failed: ${e.message}`);
        if (e.message.includes('fetch is not defined')) {
            console.log("Tip: Ensure you are using Node.js 18 or higher.");
        } else if (e.message.includes('ECONNREFUSED')) {
            console.log(`Tip: Is the Galmix API server running at ${API_URL}?`);
            console.log("Check Galmix API Documentation & SDK.md for more info.");
        }
    }
}

runLiveTest();
