/**
 * Specialized Anime Showcase Generator
 * 
 * Generates elite showcase images for new anime models focusing on 
 * world-class anime pop culture icons.
 */

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
const envPath = path.resolve(__dirname, "../.env"); // Point to functions/.env
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

// --- Configuration ---
const B2_ENDPOINT = process.env.B2_ENDPOINT || process.env.VITE_B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION || process.env.VITE_B2_REGION;
const B2_BUCKET = process.env.B2_BUCKET || process.env.VITE_B2_BUCKET;
const B2_KEY_ID = process.env.B2_KEY_ID || process.env.VITE_B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY || process.env.VITE_B2_APP_KEY;
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL || process.env.VITE_B2_PUBLIC_URL;

if (!B2_KEY_ID || !B2_APP_KEY) {
    console.error("Missing B2 Credentials in .env");
    process.exit(1);
}

// --- Init Firebase ---
try {
    initializeApp({ projectId: "dreambees-alchemist" });
} catch {
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

const MODAL_ENDPOINT = "https://mariecoderinc--sdxl-multi-model-a10g-model-web-app.modal.run";

const ANIME_PROMPTS = [
    "Monkey D. Luffy from One Piece, gear 5, sun god nika, laughing, clouds around neck, bright white hair, straw hat on back, vibrant colors, cinematic anime style, masterpiece",
    "Naruto Uzumaki in Six Paths Sage Mode, glowing orange aura, truth-seeker orbs behind him, intense expression, dynamic battle pose, epic lightning, high detail anime",
    "Son Goku in Ultra Instinct form, silver hair, glowing blue aura, divine energy, muscular build, intense focus, cratered ground, dramatic lighting, masterpiece anime",
    "Sailor Moon standing on a crescent moon, magical girl transformation, silver crystal glowing, flowing hair, starry night background, sparkles and ribbons, ethereal, high quality anime",
    "Spike Spiegel from Cowboy Bebop, leaning against a wall in Tokyo at night, lit cigarette, moody lighting, jazz aesthetic, city lights bokeh, cool and suave, 90s anime style",
    "Totoro standing under a giant leaf umbrella in the rain at a bus stop, beside a small girl, Catbus glowing eyes in background, Ghibli style, whimsical and cozy",
    "Edward Elric from Fullmetal Alchemist, metallic automail arm visible, alchemy circles glowing blue, clap pose, transmutation effects, red cloak flowing, epic fantasy anime",
    "Mikasa Ackerman from Attack on Titan, 3D maneuver gear, soaring through the air above a medieval city, dual blades drawn, intense focus, cinematic movement, hyper-detailed",
    "Asuka Langley Soryu in her red plugsuit, standing in front of EVA-02, sunset lighting, dramatic shadows, mechanical detail, masterpiece, Evangelion style",
    "Saitama from One Punch Man, serious face, red cape flowing, city ruins background, dramatic hero pose, minimalist but powerful, high impact anime style",
    "Tanjiro Kamado using Hinokami Kagura, fire dragon swirling around sword, snow falling, intense battle scene, beautiful fire effects, Demon Slayer aesthetic",
    "The Bathhouse from Spirited Away, glowing at night, many spirits and lanterns, Chihiro standing on the bridge, Studio Ghibli masterpiece, magical atmosphere",
    "Kaneda's iconic red bike from Akira, sliding side-ways on a futuristic Neo-Tokyo highway, neon light trails, cyberpunk aesthetic, high detail mechanical parts",
    "Taki and Mitsuha at the top of the mountain at twilight, Your Name (Kimi no Na wa) style, gorgeous meteor shower in sky, emotional scenery, masterpiece lighting",
    "Jojo's Bizarre Adventure character striking a flamboyant pose, colorful 'MENACING' kanji symbols in air, vibrant psychedelic colors, intense shading, muscular and stylish",
    "Ichigo Kurosaki in Bankai form, black zangetsu sword, spiritual pressure aura, hollow mask half-formed, intense eyes, dynamic action pose, Bleach style",
    "Light Yagami holding a Death Note, Ryuk the shinigami looming behind him, dramatic shadows, apple, mysterious and intellectual atmosphere, dark masterpiece",
    "Gon Freecss and Killua Zoldyck back to back, Gon using Jajanken, Killua using Godspeed electricity, jungle background, Hunter x Hunter style, high energy",
    "Kirito using dual blades in Aincrad, Starburst Stream effect, blue and black trails, crystal castle background, Sword Art Online style, heroic fantasy",
    "Hatsune Miku performing on a massive holographic stage, teal pigtails flowing, glowing futuristic headphones, cheering crowd, digital particle effects, vibrant pop anime"
];

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

async function generateWithModal(modelId, prompt) {
    const body = {
        prompt,
        model: modelId,
        steps: 30,
        width: 1024,
        height: 1024
    };

    console.log(`   Submitting job for ${modelId}...`);
    const submitResponse = await fetchWithRetry(`${MODAL_ENDPOINT}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const submitJson = await submitResponse.json();
    if (!submitJson.job_id) throw new Error(submitJson.detail || "No job_id in response");
    const jobId = submitJson.job_id;
    console.log(`   Job submitted: ${jobId}`);

    // Poll for result
    for (let poll = 0; poll < 90; poll++) {
        await sleep(2000);

        // Try /result/ first, then fallback to /jobs/ if 404
        let resultRes = await fetch(`${MODAL_ENDPOINT}/result/${jobId}`);
        if (resultRes.status === 404) {
            resultRes = await fetch(`${MODAL_ENDPOINT}/jobs/${jobId}`);
        }

        if (resultRes.status === 202) {
            process.stdout.write(".");
            continue;
        }
        process.stdout.write("\n");

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

    const docData = {
        modelId,
        prompt,
        imageUrl,
        url: imageUrl,
        thumbnailUrl,
        lqip,
        createdAt: FieldValue.serverTimestamp(),
        userId: "system_anime_showcase_script",
        likesCount: Math.floor(Math.random() * 50) + 10,
        bookmarksCount: Math.floor(Math.random() * 10)
    };

    await db.collection("model_showcase_images").add(docData);
    return imageUrl;
}

async function main() {
    const models = ["hassaku-xl", "rin-anime-blend", "rin-anime-popcute"];
    const countPerModel = 5; // Start with 5 each to be safe and fast

    console.log("=== Specialized Anime Showcase Generator ===");

    for (const modelId of models) {
        console.log(`\n--- Processing Model: ${modelId} ---`);
        for (let i = 0; i < countPerModel; i++) {
            const prompt = ANIME_PROMPTS[i];
            console.log(`[${i + 1}/${countPerModel}] Prompt: ${prompt.substring(0, 50)}...`);

            try {
                const imageBuffer = await generateWithModal(modelId, prompt);
                const url = await processAndUpload(imageBuffer, modelId, i, prompt);
                console.log(`   ✓ Success: ${url}`);
            } catch (err) {
                console.error(`   ✗ Failed: ${err.message}`);
            }
            await sleep(1000);
        }
    }

    console.log("\n=== Showcase Generation Complete ===");
}

main().catch(console.error);
