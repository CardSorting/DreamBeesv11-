/**
 * Unified Showcase Image Generator
 * 
 * Generates showcase images for models using their respective backend APIs.
 * Uploads to B2 and stores metadata in Firestore.
 * 
 * Usage:
 *   node scripts/generate_showcase_all_models.js --model gemini-2.5-flash-image --count 10
 *   node scripts/generate_showcase_all_models.js --model zit-model --count 10
 *   node scripts/generate_showcase_all_models.js --model wai-illustrious --count 10
 *   node scripts/generate_showcase_all_models.js --model all --count 10
 */

import { initializeApp, cert } from "firebase-admin/app";
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
} catch (e) {
    console.warn("Could not read .env file, assuming env vars are set.");
}

// --- Configuration ---
const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION;
const B2_BUCKET = process.env.B2_BUCKET;
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;

if (!B2_KEY_ID || !B2_APP_KEY) {
    console.error("Missing B2 Credentials in .env");
    process.exit(1);
}

// --- Init Firebase ---
try {
    initializeApp({ projectId: "dreambees-alchemist" });
} catch (e) {
    // Already initialized
}
const db = getFirestore();

// --- S3 Client for B2 ---
const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

// --- Model Endpoints ---
const MODEL_ENDPOINTS = {
    "gemini-2.5-flash-image": { type: "vertex", model: "gemini-2.5-flash-image" },
    "zit-model": { type: "modal", url: "https://mariecoderinc--zit-a10g-fastapi-app.modal.run" },
    "wai-illustrious": { type: "modal", url: "https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run", modelParam: "wai-illustrious" }
};

// --- Prompts by Model ---
const PROMPTS = {
    "gemini-2.5-flash-image": [
        "A hyper-realistic photograph of a futuristic glass house in the Swiss Alps at dusk, warm interior lights, snow, 8k, cinematic lighting",
        "A macro shot of a cyberpunk eye with intricate mechanical details and glowing neon iris, hyper-realistic skin texture, bokeh background",
        "A majestic lion made of colorful nebula gas walking through deep space, stars and galaxies in the background, ethereal, cosmic",
        "A hyper-realistic portrait of an elderly artisan in a dusty workshop, soft window light, every wrinkle visible, cinematic",
        "An underwater shot of a diver discovering a sunken ancient Greek temple, rays of light piercing water, colorful fish, 8k",
        "A steaming cup of artisan coffee on a rustic wooden table, morning sunlight, bokeh, professional food photography",
        "A dramatic thunderstorm over a vast wheat field at sunset, lightning strikes, volumetric clouds, landscape photography",
        "A close-up of a hummingbird mid-flight near a vibrant flower, frozen motion, iridescent feathers, nature photography",
        "A cozy cabin interior with a fireplace, snow visible through windows, warm amber lighting, hygge aesthetic",
        "A futuristic cityscape at night with flying cars and holographic advertisements, cyberpunk, ultra-detailed"
    ],
    "zit-model": [
        "A sleek futuristic electric supercar speeding through neon-lit Tokyo streets at night, motion blur, rain reflections, 8k",
        "A delicious gourmet burger with melting cheese and crispy bacon, macro photography, steam rising, professional food lighting",
        "A fantasy floating island with waterfalls falling into clouds, lush vegetation, exotic birds, ethereal lighting",
        "A cute fluffy baby red panda playing with a butterfly in a sunlit forest, ultra-detailed fur, soft bokeh",
        "A dramatic volcanic eruption at night, glowing lava flowing into the sea, steam and ash clouds, lightning",
        "An astronaut floating in space with Earth in the background, detailed spacesuit, stars, cinematic",
        "A mystical crystal cave with bioluminescent formations, underground lake, magical atmosphere",
        "A photorealistic dragon perched on a mountain peak at sunrise, detailed scales, mist, epic fantasy",
        "A vintage red sports car on an empty desert highway at sunset, golden hour lighting, cinematic",
        "A serene Japanese zen garden with cherry blossoms, koi pond, soft morning mist, peaceful"
    ],
    "wai-illustrious": [
        "A beautiful anime girl with long flowing blue hair sitting on a crescent moon in a starry night sky, ethereal lighting, pastel colors, masterpiece",
        "A detailed anime fantasy cityscape with floating buildings, airships, magical crystals, sunset lighting, vibrant colors",
        "An epic anime battle scene with two powerful characters clashing, energy blasts, dynamic poses, speed lines, ultra-detailed",
        "A serene anime forest with sunbeams filtering through trees, small mossy shrine, bioluminescent flowers, peaceful",
        "A cute anime character eating a large bowl of ramen in a cozy small shop, steam rising, warm lighting, detailed food",
        "An anime-style magical girl transformation sequence, sparkles, ribbons, glowing effects, dynamic pose, vibrant",
        "A detailed anime mecha robot standing in a destroyed city, dramatic lighting, battle damage, heroic pose",
        "An anime witch flying on a broomstick over a moonlit ocean, flowing robes, magical particles, beautiful",
        "A cozy anime bedroom with a sleeping cat, warm lantern light, books scattered, rain on the window",
        "An anime samurai at sunset, cherry blossom petals falling, katana drawn, dramatic composition, masterpiece"
    ]
};

// --- Helpers ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.status === 429) {
                const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
                console.warn(`   [Rate Limit] 429. Backing off for ${Math.round(waitTime / 1000)}s...`);
                await sleep(waitTime);
                continue;
            }
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res;
        } catch (e) {
            if (i === retries - 1) throw e;
            await sleep(1000 * (i + 1));
        }
    }
}

// --- Generation Functions ---

async function generateWithGemini(prompt) {
    // Use @google/genai SDK with API key instead of Vertex AI (avoids ADC/service account issues)
    const { GoogleGenAI } = await import("@google/genai");

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY not found in environment");
    }

    const ai = new GoogleGenAI({ apiKey });

    console.log("   Calling Gemini API...");

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",  // Use available model with image generation
        contents: prompt,
        config: {
            responseModalities: ["image", "text"],
        }
    });

    // Find the image part in the response
    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart?.inlineData?.data) {
        // Check if blocked by safety
        if (response.candidates?.[0]?.finishReason === "SAFETY") {
            throw new Error("Blocked by Safety Filter");
        }
        throw new Error("No image data returned from Gemini");
    }

    return Buffer.from(imagePart.inlineData.data, "base64");
}

async function generateWithModal(endpoint, prompt, modelParam = null) {
    const body = {
        prompt,
        steps: 30,
        width: 1024,
        height: 1024
    };
    if (modelParam) body.model = modelParam;

    // Submit job
    const submitResponse = await fetchWithRetry(`${endpoint}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const submitJson = await submitResponse.json();
    if (!submitJson.job_id) throw new Error(submitJson.detail || "No job_id in response");
    const jobId = submitJson.job_id;

    // Poll for result
    for (let poll = 0; poll < 90; poll++) {
        await sleep(2000);
        const resultRes = await fetch(`${endpoint}/result/${jobId}`);

        if (resultRes.status === 202) continue;

        const ct = resultRes.headers.get("content-type") || "";
        if (ct.includes("image/")) {
            return Buffer.from(await resultRes.arrayBuffer());
        }

        if (!resultRes.ok) {
            const errJson = await resultRes.json().catch(() => ({}));
            if (errJson.status === "failed") throw new Error(errJson.error || "Generation failed");
        }
    }
    throw new Error("Generation timed out");
}

// --- Main Processing ---

async function processAndUpload(imageBuffer, modelId, index, prompt) {
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
    const thumbBuffer = await sharpImg.resize(512, 512, { fit: "inside" }).webp({ quality: 80 }).toBuffer();
    const lqipBuffer = await sharpImg.resize(20, 20, { fit: "inside" }).webp({ quality: 20 }).toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;

    const timestamp = Date.now();
    const baseKey = `showcase/${modelId}/${timestamp}_${index}`;
    const originalKey = `${baseKey}.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalKey, Body: webpBuffer, ContentType: "image/webp" })),
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" }))
    ]);

    const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalKey}`;
    const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbKey}`;

    // Save to Firestore
    const docData = {
        modelId,
        prompt,
        imageUrl,
        url: imageUrl, // Frontend compatibility - some components use 'url' field
        thumbnailUrl,
        lqip,
        createdAt: FieldValue.serverTimestamp(),
        userId: "system_showcase_script",
        likesCount: Math.floor(Math.random() * 50) + 10,
        bookmarksCount: Math.floor(Math.random() * 10)
    };

    await db.collection("model_showcase_images").add(docData);

    return { imageUrl, thumbnailUrl };
}

async function generateForModel(modelId, count) {
    const config = MODEL_ENDPOINTS[modelId];
    if (!config) {
        console.error(`Unknown model: ${modelId}`);
        return;
    }

    const prompts = PROMPTS[modelId];
    const total = Math.min(count, prompts.length);

    console.log(`\nGenerating ${total} showcase images for ${modelId}...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < total; i++) {
        const prompt = prompts[i];
        console.log(`[${i + 1}/${total}] ${prompt.substring(0, 60)}...`);

        try {
            let imageBuffer;

            if (config.type === "vertex") {
                imageBuffer = await generateWithGemini(prompt);
            } else {
                imageBuffer = await generateWithModal(config.url, prompt, config.modelParam);
            }

            const result = await processAndUpload(imageBuffer, modelId, i, prompt);
            console.log(`   ✓ Saved: ${result.imageUrl}`);
            successCount++;

        } catch (err) {
            console.error(`   ✗ Failed: ${err.message}`);
            failCount++;
        }

        await sleep(1000); // Rate limiting
    }

    console.log(`\n${modelId}: Success=${successCount}, Failed=${failCount}`);
}

// --- Main Entry Point ---

async function main() {
    const args = process.argv.slice(2);
    let modelArg = "all";
    let countArg = 10;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--model" && args[i + 1]) modelArg = args[i + 1];
        if (args[i] === "--count" && args[i + 1]) countArg = parseInt(args[i + 1]);
    }

    console.log(`=== Showcase Image Generator ===`);
    console.log(`Model: ${modelArg}, Count: ${countArg}`);

    if (modelArg === "all") {
        for (const modelId of Object.keys(MODEL_ENDPOINTS)) {
            await generateForModel(modelId, countArg);
        }
    } else if (MODEL_ENDPOINTS[modelArg]) {
        await generateForModel(modelArg, countArg);
    } else {
        console.error(`Unknown model: ${modelArg}`);
        console.log(`Available models: ${Object.keys(MODEL_ENDPOINTS).join(", ")}`);
        process.exit(1);
    }

    console.log("\n=== Done ===");
}

main().catch(console.error);
