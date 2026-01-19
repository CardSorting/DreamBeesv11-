/**
 * Mockup Feed Seed Script
 * 
 * Generates sample mockups using Vertex AI Gemini and seeds the `generations` collection.
 * Uses Backblaze B2 for storage (same as showcase scripts).
 * 
 * Usage:
 *   node --experimental-modules scripts/seed_mockup_feed.js
 *   node --experimental-modules scripts/seed_mockup_feed.js --count=5
 */

import { VertexAI } from "@google-cloud/vertexai";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Load Environment Variables
// ============================================================================

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

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    COUNT: parseInt(process.argv.find(a => a.startsWith('--count='))?.split('=')[1] || '5'),
    SYSTEM_USER_ID: 'system-seed-account',
    SYSTEM_USER_NAME: 'DreamBees Studio',
    PROJECT_ID: 'dreambees-alchemist',
    MODEL_NAME: 'gemini-2.5-flash-image',
    LOCATION: 'us-central1'
};

// B2 Config
const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION;
const B2_BUCKET = process.env.B2_BUCKET;
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL;

if (!B2_KEY_ID || !B2_APP_KEY) {
    console.error("❌ Missing B2 Credentials in .env");
    process.exit(1);
}

// ============================================================================
// Initialize Firebase Admin
// ============================================================================

try {
    initializeApp({ projectId: CONFIG.PROJECT_ID });
} catch (e) {
    // App may already be initialized
}

const db = getFirestore();

// ============================================================================
// Initialize S3 Client (B2)
// ============================================================================

const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

// ============================================================================
// Initialize Vertex AI
// ============================================================================

const vertexAI = new VertexAI({ project: CONFIG.PROJECT_ID, location: CONFIG.LOCATION });

const getModel = () => {
    return vertexAI.getGenerativeModel({ model: CONFIG.MODEL_NAME });
};

// ============================================================================
// Preset Definitions
// ============================================================================

const PRESETS = [
    { id: 'studio', label: 'Clean Studio', prompt: 'Place the {subject} on a seamless white background. Soft, diffuse studio lighting from the left. Minimalist and clean aesthetic.' },
    { id: 'marble', label: 'Luxury Marble', prompt: 'Place the {subject} on a polished white Carrara marble surface. Elegant high-key lighting with sharp reflections.' },
    { id: 'shadow_play', label: 'Dynamic Shadows', prompt: 'Place the {subject} on a textured beige plaster surface. Strong, dynamic shadows cast by tropical palm leaves creating a bold geometric pattern across the composition.' },
    { id: 'wood', label: 'Wood Table', prompt: 'Place the {subject} flat on a warm, textured oak wooden table. Natural sunlight coming from a window, casting organic shadows.' },
    { id: 'cafe', label: 'Cafe Vibe', prompt: 'Place the {subject} on a wooden cafe table next to a steaming latte. Warm, cozy coffee shop lighting with a blurred background of the shop interior.' },
    { id: 'plants', label: 'Botanical', prompt: 'Place the {subject} amongst fresh green house plants. Soft, organic feel with dappled sunlight filtering through leaves.' },
    { id: 'beach', label: 'Beach Scene', prompt: 'Place the {subject} on golden sand at the beach. Bright natural sunlight, with a blurred turquoise ocean and blue sky in the background.' },
    { id: 'industrial', label: 'Industrial', prompt: 'Place the {subject} on a raw grey concrete surface. Moody, dramatic lighting with cool tones.' }
];

// ============================================================================
// Sample Items
// ============================================================================

const SAMPLE_ITEMS = [
    { label: 'T-Shirt', subjectNoun: 'cotton t-shirt', formatSpec: 'fabric shirt' },
    { label: 'Mug', subjectNoun: 'ceramic coffee mug', formatSpec: 'ceramic mug' },
    { label: 'Tote Bag', subjectNoun: 'canvas tote bag', formatSpec: 'canvas fabric' },
    { label: 'Phone Case', subjectNoun: 'phone case on a modern smartphone', formatSpec: 'phone case' },
    { label: 'Poster', subjectNoun: 'framed poster on a wall', formatSpec: 'sized poster' },
    { label: 'Business Card', subjectNoun: 'stack of business cards', formatSpec: 'cardstock' },
    { label: 'Water Bottle', subjectNoun: 'reusable water bottle', formatSpec: 'metal/plastic bottle' },
    { label: 'Hoodie', subjectNoun: 'pullover hoodie', formatSpec: 'fabric hoodie' }
];

// ============================================================================
// Simple Design Generator
// ============================================================================

const generateSimpleDesign = (index) => {
    const colors = ['blue', 'red', 'green', 'purple', 'orange', 'pink', 'teal', 'gold'];
    const patterns = ['geometric abstract pattern', 'minimalist logo', 'bold typography', 'gradient waves', 'floral illustration', 'retro badge'];

    return {
        description: `A ${colors[index % colors.length]} ${patterns[index % patterns.length]} design`,
        color: colors[index % colors.length]
    };
};

// ============================================================================
// Mockup Generation
// ============================================================================

const generateMockup = async (designDescription, item, preset, retries = 3) => {
    const model = getModel();

    const scenePrompt = preset.prompt.replace(/{subject}/g, item.subjectNoun);

    const fullPrompt = `
Act as a world-class commercial product photographer. Your goal is to produce a hyper-realistic e-commerce mockup.

THE DESIGN TO APPLY: ${designDescription}

TARGET PRODUCT: ${item.formatSpec}

SCENE: ${scenePrompt}

CRITICAL INSTRUCTIONS:
1. Generate the design described above and apply it to the ${item.subjectNoun}.
2. The design must be properly warped to match the product's shape and surface.
3. Use complex, multi-source studio lighting with physically accurate shadows.
4. 4k resolution, highly detailed, professional product photography quality.

Output only the final product mockup image.
    `.trim();

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE']
                }
            });

            const response = await result.response;
            const candidates = response.candidates;

            if (!candidates || candidates.length === 0) {
                throw new Error("No candidates returned from Vertex AI");
            }

            // Extract image from response
            for (const part of candidates[0].content.parts || []) {
                if (part.inlineData?.data) {
                    return part.inlineData.data;
                }
            }

            throw new Error("No image generated");
        } catch (error) {
            if (error.message.includes('429') && attempt < retries - 1) {
                const waitTime = Math.pow(2, attempt + 1) * 10000; // 20s, 40s, 80s
                console.log(`   ⚠️  Rate limited, waiting ${waitTime / 1000}s before retry ${attempt + 2}/${retries}...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }
            throw error;
        }
    }
};

// ============================================================================
// Upload to B2 & Save to Firestore
// ============================================================================

const uploadAndSave = async (imageBase64, item, preset, designDesc) => {
    const timestamp = Date.now();
    const key = `mockups/${timestamp}.png`;

    // Upload to B2
    const buffer = Buffer.from(imageBase64, 'base64');

    await s3Client.send(new PutObjectCommand({
        Bucket: B2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/png'
    }));

    const url = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${key}`;

    // Create Firestore document
    const docRef = await db.collection('generations').add({
        userId: CONFIG.SYSTEM_USER_ID,
        userDisplayName: CONFIG.SYSTEM_USER_NAME,
        prompt: `${designDesc} on ${item.label} - ${preset.label}`,
        url: url,
        thumbnailUrl: url,
        type: 'mockup',
        isPublic: true,
        createdAt: FieldValue.serverTimestamp(),
        modelId: 'gemini-2.5-flash-image',
        presetId: preset.id,
        itemLabel: item.label,
        likes: 0
    });

    return { docId: docRef.id, url };
};

// ============================================================================
// Main Execution
// ============================================================================

const main = async () => {
    console.log(`\n🎨 Mockup Feed Seed Script (B2 Storage)`);
    console.log(`   Generating ${CONFIG.COUNT} mockups...\n`);

    let successCount = 0;

    for (let i = 0; i < CONFIG.COUNT; i++) {
        const item = SAMPLE_ITEMS[i % SAMPLE_ITEMS.length];
        const preset = PRESETS[i % PRESETS.length];
        const design = generateSimpleDesign(i);

        console.log(`[${i + 1}/${CONFIG.COUNT}] ${item.label} × ${preset.label}`);

        try {
            const imageBase64 = await generateMockup(design.description, item, preset);
            const { docId, url } = await uploadAndSave(imageBase64, item, preset, design.description);

            console.log(`   ✅ Success: ${docId}`);
            successCount++;

        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }

        // Longer delay between requests to avoid rate limiting (1 req/min)
        if (i < CONFIG.COUNT - 1) {
            console.log(`   ⏳ Waiting 60s before next request (quota limit)...`);
            await new Promise(r => setTimeout(r, 60000));
        }
    }

    console.log(`\n📊 Complete: ${successCount}/${CONFIG.COUNT} mockups generated`);
    console.log(`   View at: /mockups\n`);

    process.exit(0);
};

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
