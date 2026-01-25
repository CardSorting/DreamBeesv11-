import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { initializeApp } from "firebase-admin/app";
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
    {
        prompt: "A neon sign saying 'DREAM BEES' in a rainy cyberpunk city, highly detailed, cinematic lighting, 8k",
        category: "text"
    },
    {
        prompt: "A cinematic portrait of an elderly fisherman with detailed wrinkles, stormy ocean background, photorealistic, 8k, masterpiece",
        category: "portrait"
    },
    {
        prompt: "A miniature world inside a lightbulb, highly detailed, macro photography, moss, tiny house, magical atmosphere",
        category: "macro"
    },
    {
        prompt: "A majestic dragon made of stained glass, cathedral lighting, vibrant colors, intricate details, fantasy art",
        category: "art"
    },
    {
        prompt: "A delicious gourmet burger with melting cheese, steam rising, professional food photography, studio lighting, advertising quality",
        category: "food"
    },
    {
        prompt: "A futuristic city floating in the clouds, waterfalls cascading into the void, golden hour lighting, 8k, dreamlike",
        category: "landscape"
    },
    {
        prompt: "A detailed close-up of a cybernetic warrior with glowing blue eyes, metallic skin texture, rain effects, cinematic lighting",
        category: "portrait"
    },
    {
        prompt: "A stack of fluffy pancakes with dripping maple syrup and fresh berries, steam rising, morning sunlight, photorealistic",
        category: "food"
    },
    {
        prompt: "A majestic white tiger walking through a snowy forest, piercing blue eyes, snowflakes resting on fur, 8k, wildlife photography",
        category: "animal"
    },
    {
        prompt: "Starry night style painting of a modern metropolis, swirling blue skies, glowing yellow windows, impasto texture",
        category: "art"
    },
    {
        prompt: "An ancient temple overgrown with bioluminescent plants in a dark jungle, mystical atmosphere, volumetric fog",
        category: "architecture"
    },
    {
        prompt: "A vintage 1950s diner sign saying 'MILKSHAKES' with neon tubing, wet pavement reflection, night time",
        category: "text"
    },
    {
        prompt: "Dew drops on a spider web, morning light refracting through droplets, bokeh background, macro photography",
        category: "macro"
    },
    {
        prompt: "A model wearing a dress made of flowing water, high fashion photography, studio lighting, surreal concept",
        category: "fashion"
    },
    {
        prompt: "Astronaut standing on a red planet looking at a giant ringed planet in the sky, desolate landscape, cinematic composition",
        category: "sci-fi"
    },
    {
        prompt: "A wizard's tower spiraling into the sky, surrounded by floating islands, magical energy trails, epic scale",
        category: "fantasy"
    },
    {
        prompt: "A retro-futuristic hover car speeding through a neon tunnel, motion blur, synthwave aesthetic",
        category: "vehicle"
    },
    {
        prompt: "A cozy library with floor-to-ceiling bookshelves, a fireplace, leather armchair, warm lighting, dust motes dancing",
        category: "interior"
    },
    {
        prompt: "Explosion of colorful powder dyes, high speed photography, vibrant colors, black background",
        category: "abstract"
    },
    {
        prompt: "A redhead woman with freckles in a field of sunflowers, soft natural lighting, golden hour, bokeh",
        category: "portrait"
    },
    {
        prompt: "Japanese ukiyo-e style woodblock print of a giant wave crashing over a futuristic city",
        category: "art"
    },
    {
        prompt: "A glass of refreshing mojito with mint leaves and lime wedges, ice cubes, condensation on glass, summer vibe",
        category: "food"
    },
    {
        prompt: "A tiny owl wearing a steampunk hat and goggles, perched on a brass gear, fantasy illustration",
        category: "animal"
    },
    {
        prompt: "Aurora borealis over a frozen lake, reflection in the ice, mountains in background, night photography",
        category: "landscape"
    },
    {
        prompt: "Gold foil balloons spelling 'PARTY' floating against a pink pastel background, studio lighting",
        category: "text"
    },
    {
        prompt: "Complex mechanical watch movement gears, macro shot, shallow depth of field, golden metal textures",
        category: "macro"
    },
    {
        prompt: "Cyberpunk street style, neon jacket, visor, raining alleyway background, edgy pose",
        category: "fashion"
    },
    {
        prompt: "A giant mech robot rusty and abandoned in a forest, overgrown with vines, birds nesting on it",
        category: "sci-fi"
    },
    {
        prompt: "A crystal clear lake with a mermaid resting on a rock, iridescent scales, moonlight, magical atmosphere",
        category: "fantasy"
    },
    {
        prompt: "Low poly 3D render of a fox in a geometric forest, pastel colors, soft lighting",
        category: "art"
    },
    {
        prompt: "Minimalist concrete house on a cliff edge overlooking the ocean, storm approaching, dramatic lighting",
        category: "architecture"
    },
    {
        prompt: "Old sea captain with a pipe, detailed beard texture, moody lighting, rembrandt style",
        category: "portrait"
    },
    {
        prompt: "Freshly baked artisan bread on a wooden board, flour dusting, sharp knife, rustic setting",
        category: "food"
    },
    {
        prompt: "A group of penguins sliding on ice, dynamic motion, antarctica landscape, bright sunlight",
        category: "animal"
    },
    {
        prompt: "Modern manufacturing plant looking clean and high tech, robots assembling cars, cool blue lighting",
        category: "interior"
    },
    {
        prompt: "Graffiti art on a brick wall saying 'REVOLUTION' in bright colors, urban street art style",
        category: "text"
    },
    {
        prompt: "Liquid metal ferrofluid forming spikes, black and shiny, studio lighting, abstract sculpture",
        category: "abstract"
    },
    {
        prompt: "Cherry blossom avenue in Japan, petals falling, spring time, soft pink hues",
        category: "landscape"
    },
    {
        prompt: "A floating castle made of clouds, golden gates, sunbeams piercing through, heavenly atmosphere",
        category: "fantasy"
    },
    {
        prompt: "Cybernetic brain interface, glowing neural networks, data streams, digital art style",
        category: "sci-fi"
    },
    {
        prompt: "Victorian era dress with a modern twist, lace details, studio portrait, sepia tone",
        category: "fashion"
    },
    {
        prompt: "Close up of a chameleon's eye, detailed skin texture, vibrant colors",
        category: "macro"
    },
    {
        prompt: "A warrior princess with face paint, fur armor, snowy mountain background, fierce expression",
        category: "portrait"
    },
    {
        prompt: "Charcoal sketch of a dancer in motion, dynamic lines, smudge effects, artistic style",
        category: "art"
    },
    {
        prompt: "Sushi platter with salmon, tuna, and avocado rolls, chopsticks, wasabi, elegant plating",
        category: "food"
    },
    {
        prompt: "A bioluminescent jellyfish floating in deep ocean, glowing tentacles, dark blue water",
        category: "animal"
    },
    {
        prompt: "Glass skyscraper reflecting the sunset, city skyline background, modern architecture",
        category: "architecture"
    },
    {
        prompt: "Chalkboard menu art saying 'COFFEE' with illustrations of beans and cups, rustic cafe style",
        category: "text"
    },
    {
        prompt: "Portal to another dimension opening in a subway station, swirling energy, surprised commuters",
        category: "sci-fi"
    },
    {
        prompt: "Book of spells open on a desk, magic particles rising from pages, candle light, wizard's study",
        category: "fantasy"
    },
    {
        prompt: "Desert dunes at sunset, camels walking in distance, long shadows, warm orange tones",
        category: "landscape"
    },
    {
        prompt: "Paper cut art style landscape, layered paper mountains, depth effect, soft shadows",
        category: "art"
    },
    {
        prompt: "Astronaut removing helmet on an alien planet, looking at strange flora, detailed reflection in visor",
        category: "portrait"
    },
    {
        prompt: "Frost patterns on a window pane, intricate ice crystals, winter morning light",
        category: "macro"
    },
    {
        prompt: "Sneaker product shot, floating in air, deconstructed parts, commercial photography",
        category: "fashion"
    }
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
