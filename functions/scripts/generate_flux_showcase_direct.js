
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";

// --- Configuration ---
const PROJECT_ID = "dreambees-alchemist";
const MODEL_ID = "flux-klein-4b";
const ENDPOINT_URL = "https://mariecoderinc--flux-klein-4b-fastapi-app.modal.run";
const TOTAL_IMAGES = 400;

// Load Env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

// B2 Config
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

// Init Firebase
try {
    initializeApp({ projectId: PROJECT_ID });
} catch (e) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // console.warn("Init warning (ignore if subsequent ops work):", e.message);
    }
}
const db = getFirestore();

// S3 Client
const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

// --- Prompts ---
const subjects = {
    men: [
        "strikingly handsome K-pop idol archetype", "rugged and chiseled Viking jarl", "ethereal and angelic male supermodel",
        "mysterious and sharp-featured noir detective", "majestic and powerful ancient Greek god",
        "dashing and charming high-society billionaire", "cool and alluring cyberpunk street-runner",
        "heroic and muscular knight in shining armor", "sophisticated and attractive Italian aristocrat",
        "athletic and perfectly sculpted olympic swimmer", "majestic and beautiful elven prince",
        "rugged and handsome cowboy", "stylish and charismatic fashion influencer",
        "deeply attractive and intelligent scholar", "gorgeous and masculine celestial warrior"
    ],
    women: [
        "breathtakingly beautiful K-pop star archetype", "radiant and ethereal elven queen", "stunningly gorgeous Brazilian supermodel",
        "elegant and breathtaking Parisian lady", "fiercely beautiful Amazonian warrior", "majestic and radiant Egyptian queen",
        "captivating and alluring dark-fantasy sorceress", "graceful and stunning prima ballerina",
        "striking and beautiful cyberpunk netrunner", "mystical and radiant celestial goddess",
        "glamorous Golden Age Hollywood starlet", "sophisticated and beautiful high-fashion editor",
        "alluring and divine mermaid queen", "divine and breathtakingly beautiful deity",
        "chic and stunningly gorgeous minimalist muse"
    ],
    expressions: [
        "with a subtle and alluring smirk", "with an intense and soul-piercing gaze", "with a soft and radiant smile",
        "with a confident and charismatic expression", "with a mysterious and brooding look",
        "with a direct and captivating eye contact", "with a serene and peaceful expression",
        "with a fierce and determined look", "with an elegant and poised expression"
    ],
    ethnicity: [
        "Asian", "African", "Caucasian", "Latino", "Middle Eastern", "South Asian", "Native American",
        "Polynesian", "Scandinavian", "Mediterranean", "Mixed Heritage", "Brazilian", "Nordic", "East Asian",
        "Greek", "Italian", "Egyptian", "Korean", "Japanese", "Indian", "French", "Spanish"
    ],
    style: [
        "Aesthetic masterpiece photography", "8k UHD cinematic film still", "Exquisite high-fashion editorial",
        "Ultra-detailed digital masterpiece", "Sleek and vibrant modern cyberpunk", "Ethereal and magical high-fantasy",
        "Moody and artistic masterpiece noir", "Professional commercial beauty advertising",
        "National Geographic level of hyper-realism", "Hyper-realistic portraiture"
    ],
    atmosphere: [
        "ethereal and mystical aura", "serene and heavenly peace", "bold and majestic power", "alluring and seductive mystery",
        "heroic and grand scale", "dark and moody cinematic vibe", "dreamy and magical atmosphere",
        "crisp and ultra-high-definition clarity", "vibrant and electrically energetic"
    ],
    lighting: [
        "golden hour sun with god rays", "dramatic cinematic volumetric lighting", "soft and warm candlelight",
        "cool blue and vibrant magenta neon lighting", "professional studio softbox beauty lighting",
        "mysterious and silvery moonlight", "sharp and clean high-contrast rim lighting",
        "dynamic and moody chiaroscuro lighting", "soft diffused natural morning light",
        "glittering star-light effects", "rainbow-tinted prism lighting"
    ],
    colors: [
        "teal and orange cinematic color grading", "monochromatic and elegant palettes", "analogous soft warm tones",
        "vibrant and saturated neon colors", "muted and sophisticated earth tones", "royal gold and deep purple accents",
        "clean white and minimalist aesthetic", "pastel and dreamy color schemes"
    ],
    setting: [
        "vibrant cyberpunk city at night", "sleek futuristic space station", "magical glowing bioluminescent forest",
        "pristine tropical beach at sunset", "ultra-modern luxury penthouse", "grand ancient medieval castle hall",
        "clean minimalist studio background", "lush blooming flower garden", "majestic misty mountain range",
        "rainy neon-lit urban alleyway", "opulent and grand ballroom", "charming and cozy aesthetic cafe"
    ],
    camera: [
        "shot on Sony A7R IV with 85mm f/1.4 lens", "shot on Canon EOS R5 with 50mm f/1.2 L lens",
        "shot on Hasselblad X2D 100C for extreme detail", "cinematic anamorphic lens look", "macro lens focusing on eyes"
    ],
    features: [
        "perfect facial symmetry with exquisite detail", "mesmerizing irises and intense eyes",
        "flawless and glowing skin with micro-texture", "sharp and perfectly defined masculine jawline",
        "expertly styled and detailed shimmering hair", "highly realistic skin pores and subtle freckles",
        "soft and dewy finish with healthy glow", "perfect face and eyes", "sculpted and aesthetically perfect features"
    ],
    skin: [
        "hyper-realistic skin texture with visible pores", "smooth and glowing skin with high translucency",
        "detailed skin with realistic subsurface scattering", "soft and velvety skin complexion",
        "tanned and glowing skin with realistic sheen"
    ],
    physique: [
        "athletic and aesthetically perfect build", "slender and elegant graceful frame",
        "strong and muscular chiseled body", "tall and majestic imposing stature",
        "graceful and lean aesthetic physique", "broad shoulders and narrow waist",
        "toned and perfectly defined aesthetic muscles"
    ],
    details: [
        "extreme level of intricate detail", "razor-sharp focus", "exquisite background bokeh",
        "perfect rule of thirds composition", "masterful cinematic depth of field",
        "ultra-realistic PBR materials", "unreal engine 5.4 octane render level"
    ],
    clothing: [
        "wearing exquisite Dior haute couture", "in sleek and detailed technical Gucci streetwear",
        "draped in luxurious shimmering Versace silk", "wearing a sharp and tailored Armani tuxedo",
        "in an elegant and breathtaking flowing McQueen gown", "wearing intricate and detailed royal Chanel armor style",
        "in stylish modern Balenciaga streetwear", "wearing a cool vintage designer Saint Laurent leather jacket"
    ]
};

function generateRandomPrompt(gender) {
    const s = subjects;
    const subj = s[gender][Math.floor(Math.random() * s[gender].length)];
    const exp = s.expressions[Math.floor(Math.random() * s.expressions.length)];
    const eth = s.ethnicity[Math.floor(Math.random() * s.ethnicity.length)];
    const sty = s.style[Math.floor(Math.random() * s.style.length)];
    const atm = s.atmosphere[Math.floor(Math.random() * s.atmosphere.length)];
    const lig = s.lighting[Math.floor(Math.random() * s.lighting.length)];
    const col = s.colors[Math.floor(Math.random() * s.colors.length)];
    const cam = s.camera[Math.floor(Math.random() * s.camera.length)];
    const set = s.setting[Math.floor(Math.random() * s.setting.length)];
    const feat = s.features[Math.floor(Math.random() * s.features.length)];
    const skin = s.skin[Math.floor(Math.random() * s.skin.length)];
    const phys = s.physique[Math.floor(Math.random() * s.physique.length)];
    const det = s.details[Math.floor(Math.random() * s.details.length)];
    const out = s.clothing[Math.floor(Math.random() * s.clothing.length)];

    // Shot type variety
    const shotTypes = ["breathtaking close-up portrait", "exquisite medium portrait", "stunning full-body fashion shot", "extreme close-up on eyes"];
    const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];

    return `${sty}, a ${shotType} of a ${subj}, ${exp}, ${eth}, ${phys}, ${feat}, ${skin}, ${out}, ${atm}, ${set}, ${lig}, ${col}, ${cam}, ${det}, exceptionally beautiful and handsome, winner of photography awards, masterwork, sharp focus, consistent anatomy, masterpiece`;
}

// --- Helpers ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res;
        } catch (e) {
            if (i === retries - 1) throw e;
            await sleep(1000 * (i + 1));
        }
    }
}

// --- Main Loop ---
async function main() {
    console.log(`Starting generation of ${TOTAL_IMAGES} images for ${MODEL_ID}...`);

    let successCount = 0;
    let failCount = 0;

    // We'll generate men and women
    // Loop 1 to TOTAL_IMAGES
    for (let i = 0; i < TOTAL_IMAGES; i++) {
        const gender = i % 2 === 0 ? 'men' : 'women';
        const prompt = generateRandomPrompt(gender);

        console.log(`[${i + 1}/${TOTAL_IMAGES}] Generating (${gender}): ${prompt.substring(0, 50)}...`);

        try {
            // 1. Submit generation job
            const submitResponse = await fetchWithRetry(`${ENDPOINT_URL}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt,
                    height: 1024,
                    width: 1024
                })
            });

            const submitJson = await submitResponse.json();
            if (!submitJson.job_id) throw new Error("No job_id in response");

            const jobId = submitJson.job_id;
            console.log(`   Submitted job: ${jobId}, polling...`);

            // 2. Poll for result (max 60 seconds)
            let imageBuffer = null;
            const maxPolls = 30;
            for (let poll = 0; poll < maxPolls; poll++) {
                await sleep(2000); // Wait 2 seconds between polls

                const resultResponse = await fetch(`${ENDPOINT_URL}/result/${jobId}`);
                const contentType = resultResponse.headers.get('content-type') || '';

                if (contentType.includes('image/')) {
                    // Got the image!
                    const arrayBuffer = await resultResponse.arrayBuffer();
                    imageBuffer = Buffer.from(arrayBuffer);
                    break;
                } else {
                    // Still processing, check status
                    const statusJson = await resultResponse.json();
                    if (statusJson.status === 'failed') {
                        throw new Error(statusJson.error || 'Generation failed');
                    }
                    // Otherwise keep polling
                }
            }

            if (!imageBuffer) throw new Error("Timeout waiting for image generation");


            // 2. Process (WebP + Thumb)
            const sharpImg = sharp(imageBuffer);
            const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
            const thumbBuffer = await sharpImg.resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer();
            const lqipBuffer = await sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer();
            const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

            // 3. Upload
            const timestamp = Date.now();
            const baseKey = `showcase/${MODEL_ID}/${timestamp}_${i}`;
            const originalKey = `${baseKey}.webp`;
            const thumbKey = `${baseKey}_thumb.webp`;

            await Promise.all([
                s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalKey, Body: webpBuffer, ContentType: "image/webp" })),
                s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" }))
            ]);

            const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalKey}`;
            const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbKey}`;

            // 4. Save to Firestore
            // We use 'admin' as userId for showcase items or a specific showcase logic? 
            // Looking at ModelContext, it queries 'model_showcase_images'.
            // Let's create a doc there.

            await db.collection('model_showcase_images').add({
                modelId: MODEL_ID,
                prompt: prompt,
                imageUrl: imageUrl,
                thumbnailUrl: thumbnailUrl,
                lqip: lqip,
                createdAt: FieldValue.serverTimestamp(),
                userId: 'system_seed_script',
                likesCount: Math.floor(Math.random() * 50) + 10, // Fake initial likes
                bookmarksCount: Math.floor(Math.random() * 10),
                tags: prompt.toLowerCase().split(' '), // simplistic tagging
                subject: { gender: gender === 'men' ? 'male' : 'female' },
                vibe: 'cinematic'
            });

            console.log(`   ✓ Saved: ${imageUrl}`);
            successCount++;

        } catch (err) {
            console.error(`   ✗ Failed: ${err.message}`);
            failCount++;
        }

        // Small delay to be nice to endpoints
        await sleep(500);
    }

    console.log(`\nDone. Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);
