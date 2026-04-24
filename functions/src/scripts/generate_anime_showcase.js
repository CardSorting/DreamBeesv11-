/**
 * Specialized Anime Showcase Generator
 * 
 * Generates elite showcase images for new anime models focusing on 
 * world-class anime pop culture icons with ultra-detailed prompts.
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
// [REMOVED] import { LoadBalancer } from "../workers/image.js";
// [REMOVED] const loadBalancer = new LoadBalancer();

const ENDPOINT = 'https://mariecoderinc--sdxl-multi-model-a100-omniinferencea100-web.modal.run';
const DEFAULT_MODEL_ID = 'rin-anime-blend';

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

const MODEL_OVERRIDE = process.env.MODEL_OVERRIDE || DEFAULT_MODEL_ID;
const CONCURRENCY = 4; // Standard SDXL concurrency

// ========================================
// ELITE ANIME PROMPTS - Ultra High Quality
// ========================================
const PROMPTS_PER_MODEL = {

    // ========================================
    // WORLD-CLASS EROTIC ART - ECCHI, HENTAI & SEDUCTIVE
    // ========================================
    "wai-illustrious-erotic": [
        // ARTISTIC ECCHI - SENSUAL ATMOSPHERE
        "rating_suggestive, 1girl, seductive elf maiden in an enchanted hot spring, steam rising around delicate porcelain skin, wet silver hair cascading down bare shoulders, luminous violet eyes with inviting gaze, soft candlelight reflections on water surface, traditional Japanese onsen architecture, cherry blossoms floating in mist, artistic nudity, high fantasy romance atmosphere, Kyoto Animation softness, romantic lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, beautiful demoness succubus reclining on velvet cushions in a gothic boudoir, crimson eyes glowing with desire, curved horns and flowing black hair, sheer lace lingerie barely concealing, moonlight streaming through stained glass windows, rich burgundy and gold color palette, mature feminine curves, sensual elegance, dark fantasy seduction, atmospheric depth, intricate fabric details, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, alluring kitsune spirit with nine glowing tails, traditional shrine maiden outfit partially open, porcelain skin with mystical markings, golden eyes with vertical pupils, soft sakura petals dancing in evening breeze, torii gate at sunset background, ethereal seduction, yokai romance aesthetic, soft focus background, magical atmosphere, artistic partial nudity, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, mermaid siren on moonlit ocean rocks, bioluminescent scales shimmering on bare skin, flowing aquamarine hair covering strategic areas, hypnotic gaze beckoning sailors, starry night sky reflection on calm waters, romantic tragedy atmosphere, fantasy pin-up elegance, soft blue and silver palette, mystical aquatic beauty, detailed water droplets on skin, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, shy shrine maiden caught in rain, wet white hakama becoming translucent, blushing cheeks and downcast eyes, traditional Japanese temple courtyard, rain droplets on flawless skin, innocent seduction, soft overcast lighting, emotional vulnerability, accidental beauty, delicate fabric cling, artistic atmospheric shot, masterpiece, best quality, very aesthetic",
        // YURI / GIRLS LOVE SENSUAL
        "rating_suggestive, 2girls, intimate moment between two schoolgirls in empty classroom after hours, shared secret, blushing proximity, afternoon light through windows, innocent exploration, romantic tension, yuri aesthetic, emotional intimacy, soft focus, coming of age tenderness, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2girls, elegant ladies sharing a private moment in Victorian boudoir, corsets and flowing hair, whispered confidences, romantic friendship aesthetic, historical yuri, soft pastel palette, intimate feminine space, period detail, emotional closeness, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, athletic women's volleyball team locker room camaraderie, post-game showers and laughter, healthy female bonding, sports anime sensuality, team intimacy, dynamic poses, steam and tile, celebration of feminine strength, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, mystical priestesses performing sacred union ritual, glowing spiritual connection, flowing ceremonial robes, ancient temple setting, spiritual erotica, divine feminine energy, transcendent beauty, golden ethereal lighting, sacred intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2girls, cozy winter cabin with two women sharing body warmth under furs, fireplace glow, intimate conversation, domestic bliss, romantic slice of life, soft warm lighting, emotional security, tender closeness, hygge aesthetic, masterpiece, best quality, very aesthetic",

       ]
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));



async function generateWithSDXL(prompt) {
    console.log(`   [SDXL] Submitting: ${prompt.substring(0, 50)}...`);

    const body = {
        prompt,
        model: DEFAULT_MODEL_ID,
        steps: 30,
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
                console.log("\n   [SDXL] ✓ Received Image Buffer");
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
    const models = MODEL_OVERRIDE ? [MODEL_OVERRIDE] : Object.keys(PROMPTS_PER_MODEL);

    console.log("=== ELITE ANIME SHOWCASE GENERATOR ===");
    console.log(`Models: ${models.join(", ")}`);
    if (MODEL_OVERRIDE) {
        console.log(`[OVERRIDE] Running ALL prompts on model: ${MODEL_OVERRIDE}`);
    }
    const totalPrompts = MODEL_OVERRIDE ?
        Object.values(PROMPTS_PER_MODEL).reduce((sum, p) => sum + p.length, 0) :
        models.reduce((sum, m) => sum + PROMPTS_PER_MODEL[m].length, 0);
    console.log(`Total Prompts: ${totalPrompts}\n`);

    for (const modelId of models) {
        const prompts = MODEL_OVERRIDE ?
            Object.values(PROMPTS_PER_MODEL).flat() :
            PROMPTS_PER_MODEL[modelId];
        console.log(`\n========================================`);
        console.log(`MODEL: ${modelId.toUpperCase()} (${prompts.length} prompts)`);
        console.log(`========================================`);

        // Process in concurrent batches for scale testing
        for (let i = 0; i < prompts.length; i += CONCURRENCY) {
            const batch = prompts.slice(i, i + CONCURRENCY);
            console.log(`Processing batch ${Math.floor(i / CONCURRENCY) + 1} (${batch.length} items)...`);

            await Promise.all(batch.map(async (prompt, idx) => {
                const globalIdx = i + idx;
                try {
                    const imageBuffer = await generateWithSDXL(prompt);
                    const url = await processAndUpload(imageBuffer, modelId, globalIdx, prompt);
                    console.log(`   [${globalIdx + 1}] ✓ ${url}`);
                } catch (err) {
                    console.error(`   [${globalIdx + 1}] ✗ ${err.message}`);
                }
            }));

            // [REMOVED] loadBalancer stats

            await sleep(2000);
        }
    }

    console.log("\n=== SHOWCASE COMPLETE ===");
}

main().catch(console.error);
