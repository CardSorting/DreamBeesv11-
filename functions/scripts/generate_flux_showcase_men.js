
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// --- Configuration ---
const PROJECT_ID = "dreambees-alchemist";
const MODEL_ID = "flux-klein-4b";
const ENDPOINT_URL = "https://mariecoderinc--flux-klein-4b-fastapi-app.modal.run";
const TOTAL_IMAGES = 200; // Adjusted for gender-specific run

// Load Env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

// Local saving paths
const SHOWCASE_DIR = path.resolve(__dirname, "../../public/showcase", MODEL_ID);
const MANIFEST_PATH = path.join(SHOWCASE_DIR, "manifest.json");

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

// Ensure local directory exists
await fs.mkdir(SHOWCASE_DIR, { recursive: true });

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
} catch {
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
        "a strikingly handsome K-pop idol archetype with a sharp jawline and expressive soul-piercing eyes",
        "a rugged and chiseled Viking jarl with weathered skin and a majestic braided beard",
        "an ethereal and angelic male supermodel with porcelain skin and soft flowing hair",
        "a mysterious and sharp-featured noir detective in a dimly lit rainy cityscape",
        "a majestic and powerful ancient Greek god with a perfectly sculpted marble-like physique",
        "a dashing and charming high-society billionaire with a sophisticated and alluring presence",
        "a cool and alluring cyberpunk street-runner with glowing cybernetic enhancements",
        "a heroic and muscular knight in ornate shimmering plate armor",
        "a sophisticated and attractive Italian aristocrat with refined European features",
        "an athletic and perfectly sculpted olympic swimmer with defined muscle transitions",
        "a majestic and beautiful elven prince with pointed ears and an otherworldly grace",
        "a ruggedly handsome cowboy with sun-kissed skin and a determined gaze",
        "a stylish and charismatic fashion influencer with a trend-setting aesthetic",
        "a deeply attractive and intelligent scholar with a focused and profound expression",
        "a gorgeous and masculine celestial warrior with cosmic energy radiating from his core"
    ],
    expressions: [
        "wearing a subtle and alluring smirk that hints at a deep secret",
        "gazing directly into the lens with an intense and soul-piercing look of confidence",
        "radiating warmth with a soft and genuine smile that lights up the entire frame",
        "exhibiting a confident and charismatic expression that commands attention",
        "brooding with a mysterious and thoughtful look, lost in deep contemplation",
        "maintaining direct and captivating eye contact that feels deeply personal",
        "possessing a serene and peaceful expression of absolute tranquility",
        "showing a fierce and determined look of unyielding resolve",
        "portraying an elegant and poised expression of royal dignity"
    ],
    ethnicity: [
        "Asian", "African", "Caucasian", "Latino", "Middle Eastern", "South Asian", "Native American",
        "Polynesian", "Scandinavian", "Mediterranean", "Mixed Heritage", "Brazilian", "Nordic", "East Asian",
        "Greek", "Italian", "Egyptian", "Korean", "Japanese", "Indian", "French", "Spanish"
    ],
    style: [
        "Aesthetic masterpiece photography with a focus on RAW materiality",
        "8k UHD cinematic film still with professional anamorphic lens rendering",
        "Exquisite high-fashion editorial for Vogue, emphasizing luxury and texture",
        "Ultra-detailed digital masterpiece with hyper-realistic surface modeling",
        "Sleek and vibrant modern cyberpunk aesthetic with high-tech glass and neon",
        "Ethereal and magical high-fantasy style with glowing mana and soft bokeh",
        "Moody and artistic masterpiece noir with deep shadows and silvery highlights",
        "Professional commercial beauty advertising photography with flawless finish",
        "National Geographic level of hyper-realism, documenting every fine detail",
        "Hyper-realistic portraiture that captures the very essence of the soul"
    ],
    atmosphere: [
        "surrounded by an ethereal and mystical aura of golden light particles",
        "bathed in a serene and heavenly peace that feels otherworldly",
        "radiating a bold and majestic power that fills the composition",
        "shrouded in an alluring and seductive mystery within a luxurious setting",
        "depicted on a heroic and grand scale with epic backlighting",
        "captured in a dark and moody cinematic vibe with volumetric atmospheric haze",
        "enveloped in a dreamy and magical atmosphere with floating crystalline shards",
        "rendered with crisp and ultra-high-definition clarity in every pixel",
        "vibrant and electrically energetic with dynamic motion blur accents"
    ],
    lighting: [
        "illuminated by the golden hour sun casting long, soft god rays through a window",
        "lit with dramatic cinematic volumetric lighting that creates deep, rich depth",
        "bathed in the soft and warm flicker of a thousand scented candles",
        "drenched in cool blue and vibrant magenta neon lighting with realistic reflections",
        "under professional studio softbox beauty lighting for a flawless and even glow",
        "placed under the mysterious and silvery glow of a full moonlight through mist",
        "highlighted by sharp and clean high-contrast rim lighting to define the silhouette",
        "rendered with dynamic and moody chiaroscuro lighting, emphasizing light and shadow",
        "softened by diffused natural morning light filtering through sheer curtains",
        "embellished with glittering star-light effects and subtle lens flares",
        "artistically hit by rainbow-tinted prism lighting for a spectral aesthetic"
    ],
    materiality: [
        "The skin texture is hyper-realistic, showing microscopic pores, fine hair, and perfect subsurface scattering of light.",
        "Every fabric weave is visible, from the intricate silk thread to the heavy grain of premium leather.",
        "Reflections on the eyes are razor-sharp, mirroring a detailed environment with uncanny accuracy.",
        "Materials like gold and silver have physically accurate luster and micro-scratches for total realism."
    ],
    composition: [
        "The shot uses a masterful rule-of-thirds composition with a shallow depth of field (f/1.4).",
        "A low-angle dramatic perspective emphasizes the grandeur and presence of the subject.",
        "Extreme macro focus on the eyes reveals the intricate details of the iris and pupil.",
        "The background is beautifully blurred into a creamy, high-quality bokeh that isolates the subject.",
        "Cinematic wide-angle framing captures the subject within a vast and detailed environment."
    ],
    clothing: [
        "wearing exquisite Dior haute couture with intricate hand-stitched detailing",
        "in sleek and detailed technical Gucci streetwear with layered high-tech fabrics",
        "draped in luxurious shimmering Versace silk that catches and refracts the light",
        "wearing a sharp and tailored Armani tuxedo with a subtle velvet texture",
        "wearing intricate and detailed royal Chanel armor style with gold filigree",
        "in stylish modern Balenciaga streetwear with bold silhouettes and textures",
        "wearing a cool vintage designer Saint Laurent leather jacket with authentic wear"
    ]
};

function generateRandomPrompt() {
    const s = subjects;
    const subj = s.men[Math.floor(Math.random() * s.men.length)];
    const exp = s.expressions[Math.floor(Math.random() * s.expressions.length)];
    const eth = s.ethnicity[Math.floor(Math.random() * s.ethnicity.length)];
    const sty = s.style[Math.floor(Math.random() * s.style.length)];
    const atm = s.atmosphere[Math.floor(Math.random() * s.atmosphere.length)];
    const lig = s.lighting[Math.floor(Math.random() * s.lighting.length)];
    const mat = s.materiality[Math.floor(Math.random() * s.materiality.length)];
    const comp = s.composition[Math.floor(Math.random() * s.composition.length)];
    const out = s.clothing[Math.floor(Math.random() * s.clothing.length)];

    // Shot type variety
    const shotTypes = ["close-up portrait", "medium portrait", "full-body fashion shot", "extreme macro focus"];
    const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];

    const promptParts = [
        sty + ".",
        `A ${shotType} of ${subj}.`,
        `Subject is ${exp}, identified as ${eth} heritage.`,
        `The scene is ${atm} and ${lig}.`,
        `The subject is ${out}.`,
        mat,
        comp,
        "Exceptionally beautiful and handsome, winner of photography awards, masterwork, sharp focus, consistent anatomy, masterpiece, ultra-high fidelity, Unreal Engine 5.4 render style, path traced, octane render."
    ];

    return promptParts.join(" ");
}

// --- Helpers ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- Rate Limiter (Pacer) ---
class RateLimiter {
    constructor(requestsPerMinute) {
        this.interval = 60000 / requestsPerMinute;
        this.lastRequestTime = 0;
    }

    async wait() {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.interval) {
            const waitTime = this.interval - elapsed;
            console.log(`   [Pacing] Waiting ${Math.round(waitTime)}ms to maintain rate limit...`);
            await sleep(waitTime);
        }
        this.lastRequestTime = Date.now();
    }
}

const pacer = new RateLimiter(50); // Be slightly conservative (50/min when server is 60/min)

async function fetchWithRetry(url, options, retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);

            if (res.status === 429) {
                const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
                console.warn(`   [Rate Limit] 429 received. Backing off for ${Math.round(waitTime / 1000)}s...`);
                await sleep(waitTime);
                continue;
            }

            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res;
        } catch {
            if (i === retries - 1) throw e;
            const waitTime = 1000 * (i + 1);
            await sleep(waitTime);
        }
    }
}

// --- Main Loop ---
async function main() {
    console.log(`Starting generation of ${TOTAL_IMAGES} images (MEN) for ${MODEL_ID}...`);

    let successCount = 0;
    let failCount = 0;

    // Load or init manifest
    try {
        await fs.readFile(MANIFEST_PATH, "utf-8");
        // manifest variable removed as it was unused
    } catch {
        // ignore
    }


    for (let i = 0; i < TOTAL_IMAGES; i++) {
        const gender = 'men';
        let prompt = generateRandomPrompt();

        // Enforce 1500 char limit (Model validation)
        if (prompt.length > 1500) {
            prompt = prompt.substring(0, 1497) + "...";
        }

        console.log(`[${i + 1}/${TOTAL_IMAGES}] Generating (${gender}) [Len: ${prompt.length}]: ${prompt.substring(0, 50)}...`);

        try {
            // 0. Wait for pacer
            await pacer.wait();

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
            if (!submitJson.job_id) {
                console.error("   Full Response:", submitJson);
                throw new Error(submitJson.detail || "No job_id in response");
            }

            const jobId = submitJson.job_id;
            console.log(`   Submitted job: ${jobId}, polling...`);

            // 2. Poll for result (max 120 seconds)
            let imageBuffer = null;
            const maxPolls = 60;
            for (let poll = 0; poll < maxPolls; poll++) {
                await sleep(2000); // Wait 2 seconds between polls

                const resultResponse = await fetch(`${ENDPOINT_URL}/result/${jobId}`);
                if (resultResponse.status === 404) {
                    continue;
                }

                const contentType = resultResponse.headers.get('content-type') || '';

                if (contentType.includes('image/')) {
                    const arrayBuffer = await resultResponse.arrayBuffer();
                    imageBuffer = Buffer.from(arrayBuffer);
                    break;
                } else {
                    try {
                        const statusJson = await resultResponse.json();
                        if (statusJson.status === 'failed') {
                            throw new Error(statusJson.error || 'Generation failed');
                        }
                    } catch { }
                }
            }

            if (!imageBuffer) throw new Error("Timeout waiting for image generation");

            // 2. Process (WebP + Thumb)
            const sharpImg = sharp(imageBuffer);
            const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
            const thumbBuffer = await sharpImg.resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer();
            const lqipBuffer = await sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer();
            const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

            // 3. Skip Local Save - Upload directly to B2

            // 4. Upload to B2
            const baseKey = `showcase/${MODEL_ID}/${timestamp}_men_${i}`;
            const originalKey = `${baseKey}.webp`;
            const thumbKey = `${baseKey}_thumb.webp`;

            await Promise.all([
                s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalKey, Body: webpBuffer, ContentType: "image/webp" })),
                s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" }))
            ]);

            const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalKey}`;
            const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbKey}`;

            // 5. Save to Firestore
            const docData = {
                modelId: MODEL_ID,
                prompt: prompt,
                imageUrl: imageUrl,
                thumbnailUrl: thumbnailUrl,
                lqip: lqip,
                createdAt: FieldValue.serverTimestamp(),
                userId: 'system_seed_script_local',
                likesCount: Math.floor(Math.random() * 50) + 10,
                bookmarksCount: Math.floor(Math.random() * 10),
                subject: { gender: 'male' },
                vibe: 'cinematic'
            };

            await db.collection('model_showcase_images').add(docData);

            console.log(`   ✓ Saved to B2 & Firestore: ${originalKey}`);
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
