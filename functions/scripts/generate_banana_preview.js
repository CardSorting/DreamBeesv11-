import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 60000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

async function generateBanana() {
    console.log("Generating 'nano banana' image via backend inference...");

    const baseUrl = "https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run";
    const body = {
        prompt: "A professional, premium preview image for a creative 'Mockup Studio' application. The scene shows a high-end designer's workspace with a sleek computer monitor displaying a 3D mockup design tool. Surrounding the monitor are high-quality physical products like a premium bottle, a branded box, and a clean t-shirt, all perfectly lit. The aesthetic is minimalist, modern, and artistic, with soft depth of field and elegant studio lighting. 8k, industrial design style.",
        model: "wai-illustrious",
        negative_prompt: "blurry, low quality, messy, complex, text, watermarks",
        steps: 30,
        width: 1024,
        height: 1024,
        scheduler: "DPM++ 2M Karras"
    };

    try {
        console.log(`Submitting job to ${baseUrl}...`);
        const submitRes = await fetchWithTimeout(`${baseUrl}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            timeout: 60000
        });

        if (!submitRes.ok) {
            throw new Error(`Submit Failed: ${submitRes.status} ${await submitRes.text()}`);
        }

        const { job_id } = await submitRes.json();
        console.log(`Job ID: ${job_id}. Polling for result...`);

        let buffer = null;
        for (let i = 0; i < 60; i++) {
            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 2000));
            const res = await fetch(`${baseUrl}/result/${job_id}`);

            if (res.status === 202) continue;
            if (!res.ok) throw new Error(`Poll Failed: ${res.status}`);

            const ct = res.headers.get('content-type');
            if (ct && ct.includes('image/')) {
                buffer = Buffer.from(await res.arrayBuffer());
                break;
            }
        }

        if (!buffer) {
            throw new Error("\nTimeout polling for image.");
        }

        const outputPath = path.resolve(__dirname, "../../public/app-previews/mockup-studio.png");

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, buffer);
        console.log(`\nSuccess! Image saved to: ${outputPath}`);
        process.exit(0);

    } catch (error) {
        console.error(`\nError: ${error.message}`);
        process.exit(1);
    }
}

generateBanana();
