import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
// import { initializeApp } from "firebase-admin/app"; // Unused
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants (populated in main)
let CLOUDFLARE_ACCOUNT_ID;
let CLOUDFLARE_API_TOKEN;
let B2_BUCKET;
let B2_PUBLIC_URL;
let s3Client;
let db;

const PROMPTS = [
    { prompt: "Abstract flowing liquid gold and midnight blue silk, ripples and waves, luxurious texture, 8k vertical wallpaper", category: "abstract" },
    { prompt: "Minimalist single mountain peak at sunrise, soft pastel colors, clean lines, serene atmosphere, high resolution mobile wallpaper", category: "nature" },
    { prompt: "Cyberpunk street in the rain at night, neon reflections in puddles, pink and teal color palette, ultra-detailed vertical composition", category: "synthwave" },
    { prompt: "Close-up of a single iridescent butterfly wing, macro photography, scales reflecting rainbow colors, bokeh background", category: "macro" },
    { prompt: "A floating crystalline island in an endless purple nebula, magical stars, ethereal lighting, fantasy wallpaper", category: "fantasy" },
    { prompt: "Dreamy Lo-fi bedroom window overlooking a rainy city, cozy vibes, soft lighting, anime aesthetic", category: "anime" },
    { prompt: "Geometric 3D shapes floating in a gradient space, soft shadows, glassmorphism effect, modern minimalist wallpaper", category: "abstract" },
    { prompt: "An ancient forest with bioluminescent mushrooms glowing in the dark, mystical fog, emerald green tones", category: "nature" },
    { prompt: "Futuristic space station interior looking out at Saturn's rings, cinematic lighting, sleek sci-fi design", category: "sci-fi" },
    { prompt: "Macro shot of a single drop of water on a blade of grass, morning dew, sun flare, refreshing green background", category: "macro" },
    { prompt: "Surreal desert with giant planet hanging in the sky, sand dunes at golden hour, epic scale, cinematic", category: "fantasy" },
    { prompt: "A lone astronaut sitting on a moon rock, looking at Earth, tranquil atmosphere, starry background", category: "sci-fi" },
    { prompt: "Fluid acrylic pour art, vibrant swirls of orange, magenta, and gold, high contrast, artistic wallpaper", category: "art" },
    { prompt: "Japanese torii gate in the middle of a calm snowy lake, minimalist composition, blue hour lighting", category: "nature" },
    { prompt: "Intricate clockwork gears and cogs made of brass and silver, steampunk aesthetic, macro detail", category: "art" },
    { prompt: "A cozy cabin in the woods during a snowstorm, warm light glowing from windows, pine trees, winter vibes", category: "nature" },
    { prompt: "Holographic jellyfish floating in a digital ocean, neon circuit lines, futuristic aesthetic", category: "sci-fi" },
    { prompt: "A cascading waterfall in a tropical jungle, lush greenery, mist, vibrant parrots flying, 8k", category: "nature" },
    { prompt: "Vaporwave sunset with palm tree silhouettes, 80s aesthetic, purple and pink gradients, glitch effects", category: "synthwave" },
    { prompt: "A majestic phoenix rising from embers, fire and sparks, dramatic lighting, fantasy art", category: "fantasy" },
    { prompt: "Minimalist line art of a face merged with botanical leaves, beige background, elegant and modern", category: "art" },
    { prompt: "Macro photography of an iris flower, deep velvet purple, crystalline dew drops on petals", category: "macro" },
    { prompt: "A futuristic skyscraper reaching above the clouds, sunset sky, glass reflections, architectural masterpiece", category: "architecture" },
    { prompt: "Ghibli style summer field with fluffy clouds, blue sky, sunflowers, nostalgic atmosphere", category: "anime" },
    { prompt: "Abstract geometric patterns inspired by Islamic art, intricate gold lines on deep emerald background", category: "art" },
    { prompt: "A quiet street in Kyoto at night, lantern light, traditional wooden houses, peaceful atmosphere", category: "architecture" },
    { prompt: "Deep ocean abyss with glowing anglerfish and mysterious ruins, dark and moody, cinematic", category: "nature" },
    { prompt: "A magical library with books flying through the air, enchanted candles, warm mahogany tones", category: "fantasy" },
    { prompt: "Close-up of a cat's eye reflecting a galaxy, ultra-detailed fur, mystical animal", category: "animal" },
    { prompt: "Smooth marble texture with gold veins, elegant and minimalist, high-end interior feel", category: "minimalist" },
    { prompt: "A field of lavender under a starry night sky, Milky Way visible, purple tones, dreamy", category: "nature" },
    { prompt: "Futuristic city with flying cars and neon billboards, Blade Runner aesthetic, vertical perspective", category: "sci-fi" },
    { prompt: "A dragon's eye close-up, slit pupil, iridescent scales, smoldering heat, fantasy detail", category: "fantasy" },
    { prompt: "Cybernetic hand holding a delicate holographic flower, contrast between machine and nature", category: "sci-fi" },
    { prompt: "Minimalist wave of sand in the Sahara, perfect curve, deep shadows, warm orange light", category: "nature" },
    { prompt: "Enchanted underwater garden with coral reefs and glowing sea creatures, vibrant colors", category: "nature" },
    { prompt: "A steam locomotive traveling through a pine forest, steam blending with fog, cinematic mood", category: "landscape" },
    { prompt: "Abstract 3D crystalline structure, refracting light into rainbows, dark background, sharp edges", category: "abstract" },
    { prompt: "A cozy bookstore corner with a rainy window, stack of books, steaming tea, soft bokeh", category: "interior" },
    { prompt: "Portrait of a majestic lion with a mane made of stars and nebulae, celestial creature", category: "animal" },
    { prompt: "Japanese garden with a koi pond, red bridge, cherry blossoms, peaceful zen atmosphere", category: "nature" },
    { prompt: "A futuristic motorcycle speeding through a neon tunnel, light trails, motion blur, synthwave", category: "vehicle" },
    { prompt: "Macro shot of a snowflake on a dark wool mitten, perfect hexagonal symmetry, winter detail", category: "macro" },
    { prompt: "A floating city in the sky with waterfalls falling into the clouds, fantasy architecture", category: "fantasy" },
    { prompt: "Minimalist black and white photography of a staircase, geometric shadows, architectural", category: "architecture" },
    { prompt: "A glowing forest path at night with fireflies, ancient trees, mystical and inviting", category: "nature" },
    { prompt: "Abstract smoke trails in vibrant colors against a black background, fluid and graceful", category: "abstract" },
    { prompt: "A steampunk airship flying through a sunset sky filled with gears-shaped clouds", category: "fantasy" },
    { prompt: "Anime girl standing on a rooftop at sunset, wind blowing through hair, city lights below", category: "anime" },
    { prompt: "A polished obsidian sphere reflecting a surreal landscape, minimalist and mysterious", category: "abstract" }
];

async function uploadAndRecord(imageBuffer, prompt, index) {
    if (!imageBuffer) return;

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
    console.log("=== FLUX 2 DEV SHOWCASE GENERATOR (ENHANCED) ===");

    // 1. Load Environment (First thing)
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

    // Set globals
    CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const B2_ENDPOINT = process.env.B2_ENDPOINT || process.env.VITE_B2_ENDPOINT;
    const B2_REGION = process.env.B2_REGION || process.env.VITE_B2_REGION;
    B2_BUCKET = process.env.B2_BUCKET || process.env.VITE_B2_BUCKET;
    const B2_KEY_ID = process.env.B2_KEY_ID || process.env.VITE_B2_KEY_ID;
    const B2_APP_KEY = process.env.B2_APP_KEY || process.env.VITE_B2_APP_KEY;
    B2_PUBLIC_URL = process.env.B2_PUBLIC_URL || process.env.VITE_B2_PUBLIC_URL;

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        console.error("Missing Cloudflare Credentials");
        process.exit(1);
    }

    // 2. Dynamic Import of Libraries (TRIGGERS FIREBASE INIT)
    // This must happen BEFORE getFirestore()
    console.log("Importing VertexFlow & LoadBalancer...");
    const { vertexFlow } = await import("../lib/vertexFlow.js");
    const { loadBalancer } = await import("../workers/image.js");

    // 3. Initialize Firebase Accessors (now that app is initialized by image.js -> firebaseInit.js)
    db = getFirestore();

    // 4. Initialize S3
    s3Client = new S3Client({
        endpoint: B2_ENDPOINT,
        region: B2_REGION,
        credentials: {
            accessKeyId: B2_KEY_ID,
            secretAccessKey: B2_APP_KEY,
        },
    });

    // 5. Configure LoadBalancer
    const CF_ENDPOINT = 'cf-flux-2-dev';
    loadBalancer.endpoints[CF_ENDPOINT] = {
        url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-dev`,
        tier: 'standard',
        costFactor: 1.0,
        baseLatency: 8000,
        maxConcurrency: 1 // Strict limit for background script
    };

    // Initialize metrics if missing
    if (!loadBalancer.healthMetrics[CF_ENDPOINT]) {
        loadBalancer.healthMetrics[CF_ENDPOINT] = {
            consecutiveFailures: 0,
            consecutiveSuccesses: 0,
            recentLatencies: [],
            avgLatency: null,
            p95Latency: null,
            circuitState: 'closed',
            circuitBackoffMs: 15000,
            circuitRecoveryAttempts: 0,
            totalRequests: 0,
            totalFailures: 0,
            transientErrors: 0,
            permanentErrors: 0,
            saturationEvents: 0,
            maxObservedConcurrent: 0,
            lastRequest: null
        };
    }

    // Generator Helper
    const generateImage = async (prompt, index) => {
        // Wrap in VertexFlow for queuing
        return vertexFlow.execute('FLUX_SHOWCASE', async () => {
            // Throttling Check (LoadBalancer)
            if (loadBalancer.shouldThrottle(CF_ENDPOINT)) {
                // We don't throw here inside VertexFlow retry loop usually, unless we want to trigger backoff
                // VertexFlow handles queuing, so we might not need strict LB throttling throwing,
                // but checking health doesn't hurt.
            }

            const jobStartTime = loadBalancer.recordJobStart(CF_ENDPOINT);
            // Spread requests
            await loadBalancer.applyRequestSpread(CF_ENDPOINT);

            console.log(`[${index}] Generating: "${prompt.substring(0, 30)}..."`);

            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('num_steps', "25");
            formData.append('guidance', "3.5");

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000); // 2 min

            try {
                const response = await fetch(loadBalancer.endpoints[CF_ENDPOINT].url, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}` },
                    body: formData,
                    signal: controller.signal
                });

                if (!response.ok) {
                    const err = await response.text();
                    loadBalancer.recordFailure(CF_ENDPOINT, jobStartTime, new Error(err));
                    throw new Error(`CF Error (${response.status}): ${err}`);
                }

                const json = await response.json();

                let base64 = json.result?.image || json.result;
                if (!base64) {
                    loadBalancer.recordFailure(CF_ENDPOINT, jobStartTime, new Error("No image data"));
                    throw new Error("No image data");
                }

                loadBalancer.recordSuccess(CF_ENDPOINT, jobStartTime);
                return Buffer.from(base64, 'base64');
            } catch (e) {
                loadBalancer.recordFailure(CF_ENDPOINT, jobStartTime, e);
                throw e; // Propagate to VertexFlow for retry decision
            } finally {
                clearTimeout(timeout);
            }
        }, vertexFlow.constructor.PRIORITY.LOW);
    };

    // Execution Loop
    for (let i = 0; i < PROMPTS.length; i++) {
        try {
            const buffer = await generateImage(PROMPTS[i].prompt, i);
            await uploadAndRecord(buffer, PROMPTS[i], i);

            // Still nice to have a small breathing room even with flow control
            // to allow other concurrent tasks (if any) to breathe
            await new Promise(r => setTimeout(r, 1000));

        } catch (e) {
            console.error(`Error on item ${i}:`, e.message);
        }
    }
}

main();
