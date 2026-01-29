import { GalmixClient } from '../lib/GalmixClient.js';
import path from 'path';
import fs from 'fs/promises';
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
} catch { }

async function debugGalmix() {
    console.log("=== DEBUG GALMIX GENERATION ===");
    const client = new GalmixClient();

    try {
        console.log("Submitting request...");
        const _result = await client.generateImage("A cute glowing futuristic bee, 8k resolution, cinematic lighting", {
            steps: 20,
            poll_interval: 2000
        });
        console.log("Generation Complete!");
        // console.log("Result keys:", Object.keys(result));
    } catch (e) {
        console.error("Debug failed:", e.message);
    }
}

debugGalmix();
