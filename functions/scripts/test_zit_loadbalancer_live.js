
/**
 * Live Load Balancer Test
 * 
 * Similar to generate_anime_showcase.js, this script tests the LoadBalancer 
 * in workers/image.js by simulating actual processImageTask calls.
 */

import { processImageTask, loadBalancer } from '../workers/image.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load Environment ---
const envPath = path.resolve(__dirname, "../.env");
try {
    const envFile = await fs.readFile(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value && !key.startsWith("#")) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch {
    console.warn("Could not read .env file, assuming env vars are set.");
}

async function runLiveTest() {
    console.log("=== LIVE LOAD BALANCER INTEGRATION TEST ===");

    // We mock the least amount possible to let processImageTask run
    // Note: processImageTask expects a real Firestore environment.
    // If you don't have it set up, this will fail on db.collection(...).get()

    const sampleRequest = {
        data: {
            requestId: `test_lb_${Date.now()}`,
            userId: "test_user_lb",
            modelId: "zit-model",
            prompt: "A beautiful futuristic bee-themed laboratory, cinematic lighting, 8k",
            steps: 30,
            aspectRatio: "1:1"
        }
    };

    console.log(`Submitting test request: ${sampleRequest.data.requestId}`);

    try {
        await processImageTask(sampleRequest);
        console.log("✓ Request processed successfully through LoadBalancer.");
    } catch (err) {
        if (err.message.includes("app/no-app")) {
            console.error("✗ Firebase not initialized. Please ensure GOOGLE_APPLICATION_CREDENTIALS is set.");
            console.log("\nNOTE: Since this is an integration test, it requires a valid Firebase context.");
            console.log("To test the logic ONLY, please run: node scripts/simulate_loadbalancer.js");
        } else {
            console.error(`✗ Error: ${err.message}`);
        }
    }

    console.log("\n=== LOAD BALANCER CURRENT STATE ===");
    console.table(loadBalancer.getHealthSummary());
}

runLiveTest().catch(console.error);
