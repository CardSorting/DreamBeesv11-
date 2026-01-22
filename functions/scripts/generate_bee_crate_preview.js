import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 120000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

async function generateBeeCrate() {
    console.log("Generating 'Bee Crate' preview image via backend inference...");

    const baseUrl = "https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run";
    const body = {
        prompt: "A professional, premium 3D app preview image for 'Bee Crate'. The scene features an elegant, minimalist wooden crate with a subtle bee logo carved into its side. The crate is overflowing with stylized, high-quality 3D mockups like a clean white t-shirt, a sleek branded box, and a framed art piece. The background is a soft, warm amber studio environment with floating honey droplets and elegant depth of field. 8k, industrial design style, masterpiece.",
        model: "wai-illustrious",
        negative_prompt: "blurry, low quality, messy, complex, text, watermarks, deformed",
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
            timeout: 120000
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

        // --- Upload to B2 ---
        console.log("\nUploading to B2...");

        // Initialize S3 Client
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

        // Load Env Vars from functions/.env
        const envPath = path.resolve(__dirname, "../.env");
        try {
            const envFile = fs.readFileSync(envPath, "utf-8");
            envFile.split("\n").forEach(line => {
                const [key, value] = line.split("=");
                if (key && value && !key.startsWith("#")) process.env[key.trim()] = value.trim();
            });
        } catch (err) {
            console.warn("Using process.env instead of .env file");
        }

        const s3Client = new S3Client({
            endpoint: process.env.B2_ENDPOINT,
            region: process.env.B2_REGION,
            credentials: {
                accessKeyId: process.env.B2_KEY_ID,
                secretAccessKey: process.env.B2_APP_KEY,
            },
        });

        const key = "app-previews/bee-crate.png";

        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.B2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: "image/png"
        }));

        const publicUrl = `${process.env.B2_PUBLIC_URL}/file/${process.env.B2_BUCKET}/${key}`;
        console.log(`\nSuccess! Image uploaded to: ${publicUrl}`);
        process.exit(0);

    } catch (error) {
        console.error(`\nError: ${error.message}`);
        process.exit(1);
    }
}

generateBeeCrate();
