/**
 * Kawaii Cosplay Showcase Generator
 * 
 * Generates elite showcase images for the "Digitally Enhanced Kawaii Cosplay Portrait" pack
 * using the Z-Image Base (zit-base-model) model.
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

const ENDPOINT = 'https://mariecoderinc--zit-h100-stable-base-fastapi-app.modal.run';
const MODEL_ID = 'zit-base-model';
const CONCURRENCY = 1; // Sequential to maximize stability for this model

// ========================================
// PROMPT LOADING LOGIC
// ========================================

async function loadPrompts() {
    const args = process.argv.slice(2);
    const packFilePath = args.find(arg => arg.startsWith("--pack="))?.split("=")[1];

    if (packFilePath) {
        console.log(`[Showcase] Loading prompts from pack: ${packFilePath}`);
        const absolutePath = path.resolve(packFilePath);
        try {
            const data = JSON.parse(await fs.readFile(absolutePath, "utf-8"));
            if (data.batch) {
                return data.batch.map((item, idx) => ({
                    title: `${data.pack_name || "Pack"} - ${item.internal_mode || "Prompt"} ${idx + 1}`,
                    prompt: item.prompt
                }));
            }
        } catch (err) {
            console.error(`[Showcase] Failed to load pack from ${absolutePath}:`, err.message);
        }
    }

    // Default Hardcoded Prompts
    return [
        {
            title: "Bunny Cosplay Stairwell",
            prompt: "A young East Asian woman in a fluffy bunny costume with a sheer frilly outfit and black choker, kneeling gracefully on concrete steps of a modern stairwell, soft diffused light, digitally enhanced kawaii aesthetic, high fidelity, 8k."
        },
        {
            title: "Maid in Restaurant",
            prompt: "Adorable maid in a frilly black and white maid outfit with lace cuffs, seated at a restaurant booth, holding a Starbucks cup near her face, oversized eyes, defined lips, softbox lighting, urban restaurant vibes."
        },
        {
            title: "Devil Horns Neon",
            prompt: "Kawaii girl with devil horns headband and sheer fabric choker, standing in the middle of Dotonbori at night, vibrant neon city lights, blurred background, cinematic lighting, ultra-detailed digitally smoothed skin."
        },
        {
            title: "Oversized Knit Cafe",
            prompt: "East Asian female wearing an oversized knit sweater, long dark hair with bangs, hand resting on her cheek, sitting at a wooden table in a cozy cafe, soft morning window light, smooth skin, premium art style."
        },
        {
            title: "Crown & Lace",
            prompt: "Digital portrait of a princess wearing a delicate crown and lace ruffled off-shoulder top, cross pendant necklace, defined lips, ethereal glow on subject, plain wall background, masterpiece quality, soft sheer fabric textures."
        },
        {
            title: "Sailor High Angle",
            prompt: "High-angle shot looking down at a student in a sailor uniform, seated on the floor, direct gaze at camera, long acrylic nails, soft pastel palette, clean lines, digitally enhanced kawaii portrait."
        },
        {
            title: "Sports Urban Bridge",
            prompt: "Cool girl in a sports bra, athletic shorts and leather jacket, standing on a bridge at night, city lights bokeh, rebellious and cute, high contrast on subject, Z-Image Base style."
        },
        {
            title: "Fluffy Ear Hood",
            prompt: "Close-up portrait of a girl in a fluffy white ear hood, soft diffused frontal light, intimate direct eye contact, pastel tones, ethereal and precious aesthetic, smooth skin texture."
        },
        {
            title: "Off-shoulder Summer",
            prompt: "Beautiful woman in a pink off-shoulder top and denim jeans, leaning against a textured wall, subtle facial embellishments under eyes, soft ring light, high fidelity, modern kawaii cosplay mood."
        },
        {
            title: "Bar Atmosphere",
            prompt: "Cute girl drinking from a wine glass at a sophisticated bar, tufted leather couch in background, dark wood paneling, sophisticated kawaii style, warm atmospheric lighting on the subject."
        },
        {
            title: "Bunny Gaming Room Stabilized",
            prompt: "Full-body portrait, East Asian female, wearing a fluffy bunny costume, long dark hair styled in pigtails, oversized eyes, defined lips, seated on a sleek white chair in a futuristic gaming room, subtle neon blue and purple lights glowing from background panels, softbox lighting, frontal illumination, eye-level perspective, subject dominating 70% of frame, pastel pinks and whites, black costume accents, smooth skin, clean polished surfaces, direct gaze at camera."
        },
        {
            title: "Bunny Gaming Room Close-up",
            prompt: "Close-up portrait, East Asian female, bunny girl costume, bangs, oversized eyes, defined lips, wearing a choker, hand near mouth, in a futuristic gaming room with blurred electric blue and purple neon light strips, ring light on subject, high-angle perspective, subject centered and dominating 90% of frame, vibrant reds and blacks, white costume accents, smooth synthetic leather texture, smooth skin, moderate saturation on clothing and makeup."
        },
        {
            title: "Bunny Gaming Room Desk",
            prompt: "Half-body portrait, East Asian female, fluffy bunny costume with ribbon accents, long dark hair, oversized eyes, defined lips, seated at a minimalistic, glowing desk within a futuristic gaming room, large diffused light source overhead, eye-level perspective, subject slightly off-center, occupying 60% of frame, pastel mint, white, black, and subtle digital green hues in environment, faux fur trim, smooth skin, clean uniform surfaces, direct gaze at camera."
        }
    ];
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generateWithZImage(prompt) {
    console.log(`   [ZIT-BASE] Submitting: ${prompt.substring(0, 50)}...`);

    const body = {
        prompt,
        steps: 30, // High quality, verified stable in sequential mode
        width: 1024,
        height: 1024
    };

    const res = await fetch(`${ENDPOINT}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Modal Submission Failed: ${res.status}`);
    const { job_id } = await res.json();

    // Poll for result
    for (let poll = 0; poll < 120; poll++) {
        await sleep(4000);
        let resultRes = await fetch(`${ENDPOINT}/result/${job_id}`);
        if (resultRes.status === 404) resultRes = await fetch(`${ENDPOINT}/jobs/${job_id}`);

        if (resultRes.status === 202) {
            process.stdout.write(".");
            continue;
        }

        if (resultRes.ok) {
            const ct = resultRes.headers.get("content-type") || "";
            if (ct.includes("image/")) {
                console.log("\n   [ZIT-BASE] ✓ Received Image Buffer");
                return Buffer.from(await resultRes.arrayBuffer());
            } else if (ct.includes("application/json")) {
                const statusJson = await resultRes.json();
                if (['generating', 'queued', 'processing'].includes(statusJson.status)) {
                    process.stdout.write(".");
                    continue;
                }
                if (statusJson.status === 'failed') {
                    throw new Error(`Generation failed: ${statusJson.error || 'Unknown error'}`);
                }
            }
        }

        if (resultRes.status !== 202) {
            const err = await resultRes.json().catch(() => ({}));
            throw new Error(`Polling failed: ${JSON.stringify(err)}`);
        }
    }
    throw new Error("Generation timed out after 8 minutes");
}

async function processAndUpload(imageBuffer, prompt, title, index) {
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
    const thumbBuffer = await sharpImg.resize(512, 512, { fit: "inside" }).webp({ quality: 80 }).toBuffer();
    const lqipBuffer = await sharpImg.resize(20, 20, { fit: "inside" }).webp({ quality: 20 }).toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;

    const timestamp = Date.now();
    const baseKey = `showcase/${MODEL_ID}/${timestamp}_${index}`;
    const originalKey = `${baseKey}.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalKey, Body: webpBuffer, ContentType: "image/webp" })),
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" }))
    ]);

    const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalKey}`;
    const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbKey}`;

    const docData = {
        modelId: MODEL_ID,
        prompt,
        title,
        imageUrl,
        url: imageUrl,
        thumbnailUrl,
        lqip,
        createdAt: FieldValue.serverTimestamp(),
        userId: "system_kawaii_showcase_script",
        likesCount: Math.floor(Math.random() * 50) + 15,
        bookmarksCount: Math.floor(Math.random() * 10) + 2,
        isElite: true,
        aesthetic: "Kawaii Cosplay"
    };

    await db.collection("model_showcase_images").add(docData);
    return imageUrl;
}

async function main() {
    console.log("=== KAWAII COSPLAY SHOWCASE GENERATOR ===");
    console.log(`Model: ${MODEL_ID}`);

    const prompts = await loadPrompts();
    console.log(`Total Prompts: ${prompts.length}\n`);

    for (let i = 0; i < prompts.length; i += CONCURRENCY) {
        const batch = prompts.slice(i, i + CONCURRENCY);
        console.log(`\nProcessing batch ${Math.floor(i / CONCURRENCY) + 1} (${batch.length} items)...`);

        await Promise.all(batch.map(async (item, idx) => {
            const globalIdx = i + idx;
            try {
                const imageBuffer = await generateWithZImage(item.prompt);
                const url = await processAndUpload(imageBuffer, item.prompt, item.title, globalIdx);
                console.log(`   [${globalIdx + 1}] ✓ ${url}`);
            } catch (err) {
                console.error(`   [${globalIdx + 1}] ✗ ${err.message}`);
            }
        }));

        if (i + CONCURRENCY < SHOWCASE_PROMPTS.length) {
            console.log("Waiting between batches...");
            await sleep(5000);
        }
    }

    console.log("\n=== SHOWCASE COMPLETE ===");
}

main().catch(console.error);
