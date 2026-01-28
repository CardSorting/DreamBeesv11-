
import fetch from "node-fetch";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCF() {
    const envPath = path.resolve(__dirname, "../.env");
    const envFile = await fs.readFile(envPath, "utf-8");
    const env = {};
    envFile.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value && !key.startsWith("#")) {
            env[key.trim()] = value.trim();
        }
    });

    const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
    const API_TOKEN = env.CLOUDFLARE_API_TOKEN;

    console.log("Testing Cloudflare flux-2-dev connection...");

    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

    // Use a very safe prompt
    // Use the prompt from the documentation provided by the user
    const safePrompt = "A small wooden chair";

    // Attempt 2: FormData body
    console.log(`Attempting with FormData body. Prompt: "${safePrompt}"`);
    try {
        const formData = new FormData();
        formData.append('prompt', safePrompt);
        formData.append('steps', "25");
        formData.append('width', "1024");
        formData.append('height', "1024");

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_TOKEN}`
            },
            body: formData
        });

        console.log(`Status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        console.log(`Content-Type: ${contentType}`);

        if (res.ok) {
            if (contentType && contentType.includes("image/")) {
                const buffer = await res.arrayBuffer();
                console.log(`✓ Success! Received binary image. Size: ${buffer.byteLength} bytes`);
            } else {
                const text = await res.text();
                console.log("Received non-image response:", text.substring(0, 500));
                try {
                    const json = JSON.parse(text);
                    console.log("JSON Result keys:", Object.keys(json));
                    if (json.result) {
                        const base64 = json.result.image || json.result;
                        if (typeof base64 === 'string') {
                            console.log(`✓ Success! Received Base64 image (starts with ${base64.substring(0, 20)}...)`);
                        }
                    }
                } catch (pe) { }
            }
        } else {
            const text = await res.text();
            console.error("Error from CF:", text);
        }
    } catch (e) {
        console.error("Request failed:", e.message);
    }

    // Attempt 3: Nested JSON body
    console.log(`Attempting with Nested JSON body. Prompt: "${safePrompt}"`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: safePrompt,
                steps: 25,
                width: 1024,
                height: 1024
            })
        });

        console.log(`Status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        console.log(`Content-Type: ${contentType}`);

        if (res.ok) {
            if (contentType && contentType.includes("image/")) {
                const buffer = await res.arrayBuffer();
                console.log(`✓ Success! Received binary image. Size: ${buffer.byteLength} bytes`);
            } else {
                const text = await res.text();
                console.log("Received response:", text.substring(0, 500));
            }
        } else {
            const text = await res.text();
            console.error("Error from CF:", text);

            // Try wrapping in multipart if it failed with specific error
            if (text.includes("required properties at '/' are 'multipart'")) {
                console.log("Retrying with 'multipart' wrapper...");
                const res2 = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${API_TOKEN}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        multipart: {
                            prompt: safePrompt,
                            steps: 25
                        }
                    })
                });
                console.log(`Status (Attempt 4): ${res2.status}`);
                console.log(await res2.text());
            }
        }
    } catch (e) {
        console.error("Request failed:", e.message);
    }
}

testCF();
