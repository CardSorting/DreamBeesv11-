
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
} catch (e) {
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
    women: [
        "a breathtakingly radiant K-pop star with glass skin and sultry, heavy-lidded eyes that sparkle with a hint of forbidden desire",
        "an ethereal elven queen of transcendent beauty, radiating a magnetic and irresistible allure that borders on the divine",
        "a stunningly gorgeous Brazilian supermodel with sun-kissed, bronze skin and a gaze that promises unspoken temptation",
        "an elegant Parisian muse of timeless allure, possessing a sophisticated and deeply seductive presence that is impossible to ignore",
        "a fiercely beautiful Amazonian warrior with a powerful, athletic grace and striking, piercing eyes that burn with a primal hunger",
        "a majestic and radiant Egyptian queen with golden-flecked skin and a presence that exudes a powerful, hypnotic sexuality",
        "a captivating dark-fantasy sorceress of lethal beauty, with a sultry and dangerous allure swirling in her deep violet gaze",
        "a graceful prima ballerina of exquisite poise, with a delicate neck and a look that whispers of hidden, passionate depths",
        "a striking cyberpunk netrunner with holographic data-streams reflecting in her seductive, neon-lit feline eyes",
        "a mystical celestial goddess with skin like moonstone and an alluring, ethereal presence that pulls the soul toward her",
        "a glamorous Golden Age Hollywood icon with seductive feline eyes, perfectly sculpted scarlet lips, and a gaze of pure, classic desire",
        "a sophisticated high-fashion muse with a sharp, modern aesthetic and an irresistible, enigmatic presence that teases and tempts",
        "an alluring mermaid queen with iridescent scales and a hypnotic, siren-like gaze that draws men into the depths",
        "a divine and breathtakingly beautiful deity from a lost sun-temple, radiating an intense, sultry warmth and ancient, forbidden grace",
        "a chic, minimalist beauty with porcelain skin and a look of profound, haunting elegance that leaves a lingering ache of desire"
    ],
    expressions: [
        "wearing a subtle and incredibly seductive smirk that hints at a playful and dangerous secret",
        "gazing directly into the lens with an intense, soul-piercing look of magnetic and irresistible confidence",
        "radiating breathtaking warmth with a soft, genuine smile that feels like an intimate invitation",
        "exhibiting a poised and charismatic expression that exerts an irresistible and tempting pull on the viewer",
        "looking enigmatic and sultry, with a mysterious depth in her gaze that speaks of deep-seated desire",
        "maintaining direct, captivating eye contact that feels deeply intimate, personal, and profoundly seductive",
        "possessing a serene and divine expression of absolute, ethereal tranquility that masks a hidden, passionate core",
        "showing a fierce, determined look of unyielding resolve tempered by a soft, feminine, and tempting grace",
        "portraying an elegant and regal expression of supreme dignity, combined with a subtle, alluring invitation"
    ],
    ethnicity: [
        "Asian", "African", "Caucasian", "Latino", "Middle Eastern", "South Asian", "Native American",
        "Polynesian", "Scandinavian", "Mediterranean", "Mixed Heritage", "Brazilian", "Nordic", "East Asian",
        "Greek", "Italian", "Egyptian", "Korean", "Japanese", "Indian", "French", "Spanish"
    ],
    style: [
        "Aesthetic masterpiece photography with a focus on RAW materiality, soft skin bloom, and a suggestive, intimate mood",
        "8k UHD cinematic film still with professional anamorphic lens rendering, focusing on her most alluring and tempting features",
        "Exquisite high-fashion editorial for Vogue Global, emphasizing luxury textures and an atmosphere of high-end seduction",
        "Ultra-detailed digital masterpiece with hyper-realistic surface modeling and an aura of soft-focus, irresistible allure",
        "Sleek and vibrant modern cyberpunk aesthetic with high-tech glass and flattering neon rim-light that accentuates her silhouette",
        "Ethereal and magical high-fantasy style with glowing mana and a dreamlike haze that heightens the sense of forbidden desire",
        "Moody and artistic masterpiece noir with deep shadows that accentuate her perfect, seductive silhouette and magnetic presence",
        "Professional commercial beauty advertising photography with a flawless, radiant finish and an undeniable sense of attraction",
        "National Geographic level of hyper-realism, capturing every fine detail with an artistic and deeply alluring grace",
        "Hyper-realistic portraiture that captures the very essence of a beautiful, tempting, and profound soul"
    ],
    atmosphere: [
        "surrounded by an ethereal and mystical aura of golden light particles, petals, and a sense of sweet, lingering temptation",
        "bathed in a serene, heavenly peace that feels otherworldly, divine, and heavy with unspoken desire",
        "radiating a bold, majestic power that fills the composition with an irresistible, feminine grace",
        "shrouded in an alluring and seductive mystery within a luxurious, velvet-draped, and dimly lit boudoir setting",
        "depicted on a heroic and grand scale with epic, flattering backlighting that highlights her most desirable attributes",
        "captured in a dark and moody cinematic vibe with volumetric atmospheric haze and soft shadows that tease the eye",
        "enveloped in a dreamy, magical atmosphere with floating crystalline shards and a sense of hypnotic, ethereal allure",
        "rendered with crisp, ultra-high-definition clarity that highlights her flawless beauty and magnetic, tempting presence",
        "vibrant and electrically energetic with dynamic motion blur and a sense of high-fashion life and intoxicating desire"
    ],
    lighting: [
        "illuminated by the golden hour sun casting long, soft god rays and a warm, flattering, and deeply seductive glow",
        "lit with dramatic cinematic volumetric lighting that creates rich depth and emphasizes her most alluring features",
        "bathed in the soft, warm flicker of a thousand scented candles, creating an intimate atmosphere of romance and temptation",
        "drenched in cool blue and vibrant magenta neon lighting that reflects beautifully on her skin, creating a high-tech allure",
        "under professional studio softbox beauty lighting for a flawless, airbrushed, and even glow that emphasizes her perfection",
        "placed under the mysterious and silvery glow of a full moonlight, creating a mystical and seductive silver rim-light",
        "highlighted by sharp and clean high-contrast rim lighting to define her elegant and irresistible silhouette",
        "rendered with dynamic and moody chiaroscuro lighting, emphasizing light, shadow, mystery, and deep-seated desire",
        "softened by diffused natural morning light filtering through sheer, delicate curtains in an intimate, private setting",
        "embellished with glittering star-light effects and subtle, soft lens flares for a magical and alluring touch",
        "artistically hit by rainbow-tinted prism lighting for a spectral, ethereal, and temptingly beautiful aesthetic"
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
        "wearing exquisite Dior haute couture with intricate hand-stitched detailing, silk lace, and a suggestive silhouette",
        "in sleek and detailed technical Gucci streetwear with layered high-tech, shimmering fabrics that cling to her form",
        "draped in luxurious shimmering Versace silk that catches and refracts the light like water, highlighting every curve",
        "in an elegant and breathtaking flowing McQueen gown with layers of fine, ethereal lace and a daring, seductive design",
        "wearing intricate and detailed royal Chanel style with gold filigree, pearls, and a presence that demands adoration",
        "in stylish modern Balenciaga streetwear with bold, avant-garde silhouettes that tease and tempt the viewer",
        "wearing a sheer, flowing goddess gown made of woven starlight and fine gossamer that reveals a hint of forbidden beauty"
    ]
};

function generateRandomPrompt() {
    const s = subjects;
    const subj = s.women[Math.floor(Math.random() * s.women.length)];
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
        } catch (e) {
            if (i === retries - 1) throw e;
            const waitTime = 1000 * (i + 1);
            await sleep(waitTime);
        }
    }
}

// --- Main Loop ---
async function main() {
    console.log(`Starting generation of ${TOTAL_IMAGES} images (WOMEN) for ${MODEL_ID}...`);

    let successCount = 0;
    let failCount = 0;

    // Load or init manifest
    let manifest = [];
    try {
        const manifestData = await fs.readFile(MANIFEST_PATH, "utf-8");
        manifest = JSON.parse(manifestData);
    } catch (e) {
        manifest = [];
    }

    for (let i = 0; i < TOTAL_IMAGES; i++) {
        const gender = 'women';
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
                    } catch (e) { }
                }
            }

            if (!imageBuffer) throw new Error("Timeout waiting for image generation");

            // 2. Process (WebP + Thumb)
            const sharpImg = sharp(imageBuffer);
            const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
            const thumbBuffer = await sharpImg.resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer();
            const lqipBuffer = await sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer();
            const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

            // 3. Save Locally
            const timestamp = Date.now();
            const localFileName = `${timestamp}_women_${i}.webp`;
            const localThumbName = `${timestamp}_women_${i}_thumb.webp`;

            await fs.writeFile(path.join(SHOWCASE_DIR, localFileName), webpBuffer);
            await fs.writeFile(path.join(SHOWCASE_DIR, localThumbName), thumbBuffer);

            // 4. Upload to B2
            const baseKey = `showcase/${MODEL_ID}/${timestamp}_women_${i}`;
            const originalKey = `${baseKey}.webp`;
            const thumbKey = `${baseKey}_women_${i}_thumb.webp`;

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
                subject: { gender: 'female' },
                vibe: 'cinematic',
                localPath: `/showcase/${MODEL_ID}/${localFileName}`,
                localThumbPath: `/showcase/${MODEL_ID}/${localThumbName}`
            };

            await db.collection('model_showcase_images').add(docData);

            // 6. Update Manifest
            manifest.push({
                ...docData,
                createdAt: new Date().toISOString()
            });
            await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

            console.log(`   ✓ Saved Locally & B2: ${localFileName}`);
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
