import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from functions directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function testFlux() {
    console.log("Testing Flux 2 Dev endpoint via Node.js fetch...");
    console.log("Account ID:", CLOUDFLARE_ACCOUNT_ID ? "PRESENT" : "MISSING");
    console.log("API Token:", CLOUDFLARE_API_TOKEN ? "PRESENT" : "MISSING");

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        console.error("Missing credentials in .env");
        return;
    }

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-dev`;

    const formData = new FormData();
    formData.append('prompt', 'a cute robot testing a new ai model');
    formData.append('steps', '20');
    formData.append('width', '512');
    formData.append('height', '512');

    try {
        const response = await fetch(cfUrl, {
            method: "POST",
            headers: { "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}` },
            body: formData
        });

        console.log("Response Status:", response.status);
        const contentType = response.headers.get("content-type") || "";
        console.log("Content-Type:", contentType);

        if (!response.ok) {
            const errText = await response.text();
            console.error("Error Response:", errText);
            return;
        }

        if (contentType.includes("image/")) {
            console.log("Received binary image data.");
            // We won't save it here, just confirming success
        } else {
            const json = await response.json();
            if (json.result && json.result.image) {
                console.log("Received base64 image data in JSON response.");
                console.log("Base64 Length:", json.result.image.length);
            } else {
                console.log("Unexpected JSON response:", JSON.stringify(json).substring(0, 200));
            }
        }
        console.log("✓ Test PASSED");
    } catch (error) {
        console.error("Test FAILED with error:", error);
    }
}

testFlux();
