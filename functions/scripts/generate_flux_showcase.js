
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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
    console.warn("Could not read .env file");
}

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const B2_ENDPOINT = process.env.B2_ENDPOINT || process.env.VITE_B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION || process.env.VITE_B2_REGION;
const B2_BUCKET = process.env.B2_BUCKET || process.env.VITE_B2_BUCKET;
const B2_KEY_ID = process.env.B2_KEY_ID || process.env.VITE_B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY || process.env.VITE_B2_APP_KEY;
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL || process.env.VITE_B2_PUBLIC_URL;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error("Missing Cloudflare Credentials");
    process.exit(1);
}

try {
    initializeApp({ projectId: "dreambees-alchemist" });
} catch { }
const db = getFirestore();

const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

const PROMPTS = [
    {
        prompt: "A neon sign saying 'DREAM BEES' in a rainy cyberpunk city, highly detailed, cinematic lighting, 8k",
        category: "text"
    },
    {
        prompt: "A cinematic portrait of an elderly fisherman with detailed wrinkles, stormy ocean background, photorealistic, 8k, masterpiece",
        category: "portrait"
    },
    {
        prompt: "A miniature world inside a lightbulb, highly detailed, macro photography, moss, tiny house, magical atmosphere",
        category: "macro"
    },
    {
        prompt: "A majestic dragon made of stained glass, cathedral lighting, vibrant colors, intricate details, fantasy art",
        category: "art"
    },
    {
        prompt: "A delicious gourmet burger with melting cheese, steam rising, professional food photography, studio lighting, advertising quality",
        category: "food"
    }
];

async function generateFluxImage(prompt) {
    console.log(`Generating: "${prompt.substring(0, 30)}..."`);

    // FormData for Cloudflare
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('num_steps', "25"); // Higher quality for showcase
    formData.append('guidance', "3.5");

    const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-dev`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`
        },
        body: formData
    });

    if (!cfResponse.ok) {
        throw new Error(`Cloudflare Error: ${await cfResponse.text()}`);
    }

    const cfJson = await cfResponse.json();
    let base64Img = cfJson.result?.image || cfJson.result;

    if (!base64Img) throw new Error("No image data");

    return Buffer.from(base64Img, 'base64');
}

async function uploadAndRecord(imageBuffer, prompt, index) {
    // Process Images
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
    const thumbBuffer = await sharpImg.resize(512, 512, { fit: "inside" }).webp({ quality: 80 }).toBuffer();
    const lqipBuffer = await sharpImg.resize(20, 20, { fit: "inside" }).webp({ quality: 20 }).toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;

    const timestamp = Date.now();
    const baseKey = `showcase/flux-2-dev/${timestamp}_${index}`;
    const originalKey = `${baseKey}.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    // Upload
    await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalKey, Body: webpBuffer, ContentType: "image/webp" })),
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" }))
    ]);

    const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalKey}`;
    const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbKey}`;

    // Save to Firestore
    await db.collection("model_showcase_images").add({
        modelId: "flux-2-dev",
        prompt: prompt.prompt,
        imageUrl,
        url: imageUrl,
        thumbnailUrl,
        lqip,
        createdAt: FieldValue.serverTimestamp(),
        userId: "system_flux_showcase",
        category: prompt.category,
        likesCount: Math.floor(Math.random() * 50) + 10,
        width: 1024,
        height: 1024
    });

    console.log(`✓ Uploaded: ${imageUrl}`);
}

async function main() {
    console.log("=== FLUX 2 DEV SHOWCASE GENERATOR ===");

    for (let i = 0; i < PROMPTS.length; i++) {
        try {
            const buffer = await generateFluxImage(PROMPTS[i].prompt);
            await uploadAndRecord(buffer, PROMPTS[i], i);
        } catch (e) {
            console.error(`Error on item ${i}:`, e.message);
        }
    }
}

main();
