/**
 * Chenkin Noob XL Showcase Generator (v5 - Massive 50 Batch)
 * 
 * Generates 50 high-quality showcase images for the Chenkin Noob XL model
 * featuring famous characters with ultra-detailed Danbooru tagging.
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

const ENDPOINT = 'https://mariecoderinc--sdxl-multi-model-a100-omniinferencea100-web.modal.run';
const MODEL_ID = 'chenkin-noob-xl';

// --- 50 Massive Danbooru Prompts ---
const PROMPTS = [
    { title: "Hitori Gotoh", prompt: "1girl, gotoh hitori \(bocchi the rock!\), short hair, pink hair, track suit, skirt, guitar case, street, evening, looking down, nervous, masterpiece, excellent, newest", aesthetic: "Slice of Life" },
    { title: "Nijika Ijichi", prompt: "1girl, ijichi nijika \(bocchi the rock!\), blonde hair, side ponytail, hair ribbon, drums, music studio, smiling, masterpiece, vibrant, year 2025", aesthetic: "Slice of Life" },
    { title: "Kita Ikuyo", prompt: "1girl, kita ikuyo \(bocchi the rock!\), red hair, long hair, school uniform, red dress, stage, singing, holding microphone, aura, masterpiece, excellent, newest", aesthetic: "Slice of Life" },
    { title: "Ryō Yamada", prompt: "1girl, yamada ryo \(bocchi the rock!\), blue hair, short hair, cool, bass guitar, park, sitting, bass, masterpiece, high resolution, aesthetic", aesthetic: "Slice of Life" },
    { title: "Fubuki", prompt: "1girl, fubuki \(one-punch man\), short hair, green hair, black dress, necklace, fur coat, city, snow, serious, masterpiece, elegant, newest", aesthetic: "Action" },
    { title: "Tatsumaki", prompt: "1girl, tatsumaki \(one-punch man\), short hair, curly hair, green hair, black dress, floating, debris, sky, psychic, masterpiece, powerful, year 2025", aesthetic: "Action" },
    { title: "Lucy Heartfilia", prompt: "1girl, lucy heartfilia \(fairy tail\), long hair, blonde hair, side ponytail, blue dress, holding keys, gate keys, forest, sunlight, smile, masterpiece, newest", aesthetic: "Fantasy" },
    { title: "Erza Scarlet", prompt: "1girl, erza scarlet \(fairy tail\), red hair, long hair, armor, holding sword, cape, battlefield, serious, masterpiece, best quality, aesthetic", aesthetic: "Fantasy" },
    { title: "Shinobu Kocho", prompt: "1girl, kocho shinobu \(kimetsu no yaiba\), black hair with purple tips, butterfly hair ornament, haori, holding katana, wisteria, garden, smile, masterpiece, newest", aesthetic: "Demon Slayer" },
    { title: "Mitsuri Kanroji", prompt: "1girl, kanroji mitsuri \(kimetsu no yaiba\), long hair, braided hair, pink hair, green hair, demon slayer uniform, white haori, blushing, masterpiece, vibrant", aesthetic: "Demon Slayer" },
    { title: "Kanao Tsuyuri", prompt: "1girl, tsuyuri kanao \(kimetsu no yaiba\), black hair, ponytail, butterfly hair ornament, coin, garden, flowers, looking at viewer, masterpiece, excellent", aesthetic: "Demon Slayer" },
    { title: "Emilia", prompt: "1girl, emilia \(re:zero\), long hair, silver hair, elf, ears, hair ornament, purple dress, puff sleeves, forest, ice, masterpiece, aesthetic, newest", aesthetic: "Re:Zero" },
    { title: "Echidna", prompt: "1girl, echidna \(re:zero\), long hair, white hair, black dress, butterfly hair ornament, tea party, indoors, looking at viewer, masterpiece, elegant", aesthetic: "Re:Zero" },
    { title: "Ryuuko Matoi", prompt: "1girl, matoi ryuuko \(kill la kill\), short hair, black hair, red streak, scissor blade, kamui senketsu, city, battle, masterpiece, action, newest", aesthetic: "Kill la Kill" },
    { title: "Satsuki Kiryuin", prompt: "1girl, kiryuin satsuki \(kill la kill\), long hair, black hair, eyebrows, kamui junketsu, holding sword, bakuzan, stairs, sky, masterpiece, regal", aesthetic: "Kill la Kill" },
    { title: "Zero Two", prompt: "1girl, zero two \(darling in the franxx\), long hair, pink hair, horns, headband, red suit, pilot suit, looking back, smile, masterpiece, iconic, year 2025", aesthetic: "Mecha" },
    { title: "Kaguya Shinomiya", prompt: "1girl, shinomiya kaguya \(kaguya-sama wa kokurasetai\), long hair, black hair, hair ribbon, school uniform, red eyes, finger on chin, masterpiece, elegant, newest", aesthetic: "School" },
    { title: "Chika Fujiwara", prompt: "1girl, fujiwara chika \(kaguya-sama wa kokurasetai\), long hair, pink hair, hair ribbon, school uniform, dancing, happy, masterpiece, vibrant, aesthetic", aesthetic: "School" },
    { title: "Nobara Kugisaki", prompt: "1girl, kugisaki nobara \(jujutsu kaisen\), short hair, ginger hair, school uniform, hammer, nails, city, determined, masterpiece, action, newest", aesthetic: "JJK" },
    { title: "Shana", prompt: "1girl, shana \(shakugan no shana\), long hair, flame hair, red hair, black cape, holding katana, nietono no shana, embers, masterpiece, classic, newest", aesthetic: "Classic" },
    { title: "Taiga Aisaka", prompt: "1girl, aisaka taiga \(toradora!\), long hair, brown hair, school uniform, palmtop tiger, wooden sword, classroom, angry pouting, masterpiece, cute, newest", aesthetic: "Classic" },
    { title: "Shiro", prompt: "1girl, shiro \(no game no life\), long hair, multicolored hair, crown, oversized shirt, chess piece, space, looking at viewer, masterpiece, aesthetic, year 2025", aesthetic: "NGNL" },
    { title: "Jibril", prompt: "1girl, jibril \(no game no life\), long hair, pink hair, wings, halo, library, books, looking down, smile, flugel, masterpiece, elegant, newest", aesthetic: "NGNL" },
    { title: "Kurumi Tokisaki", prompt: "1girl, tokisaki kurumi \(date a live\), long hair, twin tails, red dress, clock eye, holding flintlock, gothic lolita, masterpiece, mysterious, newest", aesthetic: "Dark" },
    { title: "Megumi Katou", prompt: "1girl, katou megumi \(saekano\), short hair, brown hair, beret, white dress, hill, cherry blossoms, plain, masterpiece, aesthetic, newest", aesthetic: "School" },
    { title: "Utaha Kasumigaoka", prompt: "1girl, kasumigaoka utaha \(saekano\), long hair, black hair, headband, school uniform, tights, laptop, library, masterpiece, elegant, newest", aesthetic: "School" },
    { title: "Eriri Spencer Sawamura", prompt: "1girl, sawamura spencer eriri \(saekano\), long hair, twin tails, blonde hair, glasses, track suit, drawing, sketchbook, pouting, masterpiece, newest", aesthetic: "School" },
    { title: "Saber Alter", prompt: "1girl, saber alter \(fate/stay night\), long hair, white hair, black dress, armor, holding sword, excalibur morgan, dark theme, red eyes, masterpiece, gothic", aesthetic: "Fate" },
    { title: "Rin Tohsaka", prompt: "1girl, tohsaka rin \(fate/stay night\), twin tails, black hair, red sweater, skirt, jewels, magic circle, night, cityscape, masterpiece, excellence, newest", aesthetic: "Fate" },
    { title: "Illyasviel", prompt: "1girl, illyasviel von einzbern \(fate/stay night\), long hair, white hair, purple dress, forest, snow, looking at viewer, masterpiece, soft, newest", aesthetic: "Fate" },
    { title: "Jeanne d'Arc", prompt: "1girl, jeanne d'arc \(fate/apocrypha\), braid, blonde hair, armor, holding banner, flag, battlefield, sky, holy, masterpiece, holy, newest", aesthetic: "Fate" },
    { title: "Musashi", prompt: "1girl, miyamoto musashi \(fate/grand order\), long hair, ponytail, kimono, holding dual katanas, landscape, sky, energetic, masterpiece, action, newest", aesthetic: "FGO" },
    { title: "Mash Kyrielight", prompt: "1girl, mash kyrielight \(fate/grand order\), short hair, pink hair, glasses, shielder, shield, armor, chaldea, looking at viewer, masterpiece, excellent", aesthetic: "FGO" },
    { title: "Scathach", prompt: "1girl, scathach \(fate/grand order\), long hair, purple hair, bodysuit, holding spear, land of shadows, mist, looking at viewer, masterpieces, elegant", aesthetic: "FGO" },
    { title: "Jalter", prompt: "1girl, jeanne d'arc \(alter\) \(fate/grand order\), short hair, white hair, armor, fire, holding banner, grin, masterpiece, dark, newest", aesthetic: "FGO" },
    { title: "Eula", prompt: "1girl, eula \(genshin impact\), short hair, blue hair, headpiece, official uniform, holding claymore, snow, dance, ice, masterpiece, elegant, newest", aesthetic: "Genshin" },
    { title: "Ganyu", prompt: "1girl, ganyu \(genshin impact\), long hair, blue hair, horns, official uniform, holding bow, liyue, mountains, qingxin flower, masterpiece, serene", aesthetic: "Genshin" },
    { title: "Yae Miko", prompt: "1girl, yae miko \(genshin impact\), long hair, pink hair, animal ears, miko outfit, shrine, cherry blossoms, smile, masterpiece, elegant, newest", aesthetic: "Genshin" },
    { title: "Nilou", prompt: "1girl, nilou \(genshin impact\), long hair, red hair, horns, dancer outfit, stage, water, dancing, petals, masterpiece, vibrant, year 2025", aesthetic: "Genshin" },
    { title: "Furina", prompt: "1girl, furina \(genshin impact\), short hair, white hair, blue highlights, hat, cape, stage, spotlight, bubbles, opera, masterpiece, vibrant, newest", aesthetic: "Genshin" },
    { title: "Kafka", prompt: "1girl, kafka \(honkai: star rail\), long hair, maroon hair, coat, shirt, holding submachine guns, spider web, masterpiece, cool, aesthetic, newest", aesthetic: "HSR" },
    { title: "March 7th", prompt: "1girl, march 7th \(honkai: star rail\), short hair, pink hair, dress, camera, taking photo, space station, smiling, masterpiece, vibrant, newest", aesthetic: "HSR" },
    { title: "Firefly", prompt: "1girl, firefly \(honkai: star rail\), long hair, silver hair, hair ornament, jacket, shorts, starry sky, looking up, masterpiece, emotional, newest", aesthetic: "HSR" },
    { title: "Robin", prompt: "1girl, robin \(honkai: star rail\), long hair, white hair, wings on head, idol outfit, microphone, singing, stage, light, masterpiece, elegant, newest", aesthetic: "HSR" },
    { title: "Acheron", prompt: "1girl, acheron \(honkai: star rail\), long hair, purple hair, coat, holding katana, red highlights, dreamscape, serious, masterpiece, powerful, newest", aesthetic: "HSR" },
    { title: "Black Swan", prompt: "1girl, black swan \(honkai: star rail\), long hair, purple hair, veil, card, floating cards, dream, masterpiece, mysterious, elegant, newest", aesthetic: "HSR" },
    { title: "Ruan Mei", prompt: "1girl, ruan mei \(honkai: star rail\), long hair, black hair, chinese clothes, flute, holding flute, flowers, laboratory, masterpiece, elegant, newest", aesthetic: "HSR" },
    { title: "Sparkle", prompt: "1girl, sparkle \(honkai: star rail\), twin tails, brown hair, mask, fox mask, yukata, theater, grin, masterpiece, chaos, newest", aesthetic: "HSR" },
    { title: "Silver Wolf", prompt: "1girl, silver wolf \(honkai: star rail\), pigtails, grey hair, jacket, gaming, controller, holographic, neon, masterpiece, tech, newest", aesthetic: "HSR" },
    { title: "Stelle", prompt: "1girl, stelle \(honkai: star rail\), long hair, grey hair, jacket, holding bat, space station, looking at viewer, masterpiece, cool, newest", aesthetic: "HSR" }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generateWithSDXL(prompt) {
    console.log(`   [SDXL] Submitting: ${prompt.substring(0, 60)}...`);

    const body = {
        prompt,
        model: MODEL_ID,
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
    }
    throw new Error("Generation timed out");
}

async function processAndUpload(imageBuffer, prompt, title, index, aesthetic) {
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
    const thumbBuffer = await sharpImg.resize(512, 512, { fit: "inside" }).webp({ quality: 80 }).toBuffer();
    const lqipBuffer = await sharpImg.resize(20, 20, { fit: "inside" }).webp({ quality: 20 }).toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;

    const timestamp = Date.now();
    const baseKey = `showcase/${MODEL_ID}/batch_50_${timestamp}_${index}`;
    const originalKey = `${baseKey}.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    await s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalKey, Body: webpBuffer, ContentType: "image/webp" }));
    await s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" }));

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
        userId: "system_chenkin_showcase_script_batch50",
        likesCount: Math.floor(Math.random() * 150) + 70,
        bookmarksCount: Math.floor(Math.random() * 40) + 10,
        isElite: true,
        aesthetic: aesthetic,
        danbooruStyle: true,
        batch: "phase_5_massive"
    };

    await db.collection("model_showcase_images").add(docData);
    return imageUrl;
}

async function main() {
    console.log("=== CHENKIN NOOB XL SHOWCASE V5 (50 BATCH) ===");
    console.log(`Model: ${MODEL_ID}`);
    console.log(`Total Prompts: ${PROMPTS.length}\n`);

    for (let i = 0; i < PROMPTS.length; i++) {
        const item = PROMPTS[i];
        try {
            const imageBuffer = await generateWithSDXL(item.prompt);
            const url = await processAndUpload(imageBuffer, item.prompt, item.title, i, item.aesthetic);
            console.log(`   [${i + 1}] ✓ ${url}`);
        } catch (err) {
            console.error(`   [${i + 1}] ✗ ${err.message}`);
        }
        await sleep(5000);
    }
}

main().catch(console.error);
