
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
    women: [
        "a powerful Elven High Priestess with glowing runes etched into her pale skin and eyes that shine with ancient wisdom",
        "a battle-hardened Human Paladin with a scarred face, commanding presence, and a halo of divine light",
        "a mysterious Tiefling Warlock with curling horns, violet skin, and an aura of crackling eldritch energy",
        "a stoic Dwarven Forge-Cleric with braided copper hair, soot-stained skin, and eyes like burning embers",
        "an elegant Vampire Aristocrat with porcelain skin, crimson eyes, and a predatory, seductive grace",
        "an ethereal Merfolk Oracle with iridescent scales, flowing fin-like hair, and a gaze that sees the future",
        "a radiant Celestial being with wings of living light, golden skin, and an intimidatingly beautiful divine presence",
        "a dark and alluring Necromancer Queen with skeletal minions in the background and a crown of bone",
        "a fierce Druidic Guardian with bark-like skin in patches, leaves in her wild hair, and eyes distinct with nature's wrath",
        "a cunning Drow Rogue with obsidian skin, white hair, and a smirk that promises a quick and silent death",
        "a majestic Dragonborn Sorceress with shimmering scales, eyes full of elemental power, and a regal stance",
        "a mystical Dryad spirit merging with a grand oak tree, her form composed of vines, flowers, and soft bioluminescence",
        "a rugged Human Ranger with camouflage paint, piercing eagle-like eyes, and a bond with the wild",
        "a regal High Elf Wizard reading from a floating arcane tome, surrounded by geometric magical sigils",
        "a corrupted Dark Paladin with jagged black armor, pale skin, and eyes weeping black ichor"
    ],
    expressions: [
        "chanting a powerful spell with intense focus and glowing eyes",
        "glaring with fierce determination and readying a weapon for combat",
        "smiling mysteriously while holding a glowing magical artifact",
        "looking up at a massive, looming monster with a mix of fear and resolve",
        "meditating deeply, levitating slightly off the ground with peaceful energy",
        "laughing maniacally while unleashing chaotic magical energy",
        "studying an ancient map with a furrowed brow and intense concentration",
        "gazing sorrowfully at a fallen comrade or a ruined city",
        "screaming a war cry, face contorted with rage and adrenaline",
        "whispering to a small magical familiar perched on her shoulder"
    ],
    ethnicity: [
        // Mixing standard ethnicities to ensure human diversity even in fantasy settings, plus some fantasy-specific descriptors handled in subjects or here
        "distinctly Nubian features", "classic Nordic features", "sharp angular Elven features", "soft and round Hobbit-like features",
        "distinctly Asian features", "rugged Celtic features", "ethereal Fey features", "Amazonian features",
        "Mediterranean features", "South Asian features", "Middle Eastern features", "Native American features",
        "Deep Gnome features", "infernal Tiefling features with ridges", "celestial Aasimar features"
    ],
    style: [
        "flat color illustration, clean vector lines, cel shaded, vibrant punchy colors",
        "classic ink and watercolor illustration, washing tones, expressive line art",
        "digital graphic novel style, bold outlines, dynamic shading, comic book aesthetic",
        "concept art sketch, rough charcoal lines mixed with digital paint, artistic and raw",
        "tarot card aesthetic, Art Nouveau influence, decorative borders, flat perspective",
        "storybook illustration, whimsical and detailed, muted pastel palette, intricate pen work",
        "stained glass art style, geometric shapes, glowing colors, heavy lead lines",
        "Japanese woodblock print style (Ukiyo-e), flat composition, elegant curves, traditional texture",
        "poster art style, minimal colors, high contrast, bold silhouette",
        "oil pastel drawing, textured strokes, vibrant blending, artistic impressionism"
    ],
    atmosphere: [
        "inside a dusty, candlelit wizard's tower filled with floating books and potions",
        "standing in a lush, bioluminescent enchanted forest at twilight",
        "on a chaotic battlefield with magical explosions and arrow volleys in the background",
        "in the dark, damp depths of a dungeon with flickering torchlight",
        "at the altar of a grand, sunlit cathedral with stained glass casting colored light",
        "in a bustling medieval tavern full of smoke, laughter, and warm hearth light",
        "on a windswept mountain peak overlooking a vast fantasy kingdom",
        "in a misty graveyard shrouded in fog and necromantic energy",
        "underwater in a coral city with rays of sunlight filtering down",
        "in a void of swirling arcane energy and geometric shapes"
    ],
    lighting: [
        "stylized flat lighting with minimal shadows, emphasizing color and form",
        "graphic deep shadows creating a high-contrast noir effect",
        "soft ambient occlusion lighting, even and diffused",
        "dramatic rim lighting outlining the silhouette in neon colors",
        "warm golden hour wash, flat and illustrative",
        "cool moonlight blue, simplified values",
        "underlighting from a magical source, creating dramatic upward shadows",
        "flat sunlight, bright and cheerful",
        "mottled forest light, dappled effects stylized as brushstrokes",
        "single directional light source for strong comic-book style shadows"
    ],
    materiality: [
        "visible paper grain texture, cold press watercolor paper feel",
        "canvas texture overlay, feeling of traditional oil on canvas",
        "smooth digital ink finish, crisp and clean edges",
        "rough charcoal texture, sketchy and artistic",
        "matte finish, no gloss, gouache painting aesthetic"
    ],
    composition: [
        "dynamic action pose, rule of thirds, Dutch angle for tension",
        "statuesque hero pose, low angle looking up, epic scale",
        "intimate close-up, focus on eyes and expression, abstract background",
        "wide shot establishing the character in a grand environment",
        "symmetrical composition, religious icon aesthetic, centered subject"
    ],
    clothing: [
        "wearing ornate plate armor with gold filigree and a flowing cape",
        "clad in tattered, hooded wizard robes covered in starry patterns",
        "wearing tight leather rogue armor with many buckles and hidden daggers",
        "dressed in simple, roughspun tunic and trousers of a peasant hero",
        "adorned in the silk and jewelry of a high-fantasy noble courtier",
        "wearing druidic armor made of hardened bark, leaves, and vines",
        "clad in dark, spiked armor radiating menacing energy",
        "wearing ceremonial priestly vestments with embroidered holy symbols",
        "dressed in exotic, flowing silks from a desert kingdom",
        "wearing practical adventurer's gear, backpack, and travel cloak"
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

    // Shot type variety renamed to Art Type variety
    const artTypes = ["character portrait", "full body illustration", "splash art", "conceptual design sketch"];
    const artType = artTypes[Math.floor(Math.random() * artTypes.length)];

    const promptParts = [
        sty + ".",
        `A ${artType} of ${subj}.`,
        `She is ${exp}, displaying ${eth}.`,
        `The setting is ${atm} and ${lig}.`,
        `She is ${out}.`,
        mat,
        comp,
        "illustration, 2d, painting, drawing, sketch, vector art, flat design, no photorealism, no 3d render, artistic, stylized, trending on ArtStation."
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
    console.log(`Starting generation of ${TOTAL_IMAGES} images (WOMEN) for ${MODEL_ID}...`);

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
