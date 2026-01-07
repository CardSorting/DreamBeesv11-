const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '../public/showcase/miaomiao-harem');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const ENDPOINT_BASE = "https://cardsorting--sdxl-multi-model-model-web-inference.modal.run";

const PROMPTS = [
    "A group of beautiful anime girls having a tea party in a lush royal garden, detailed dresses, soft sunlight, vibrant flowers, high quality, masterpiece",
    "Portrait of a magical girl with glowing wings and a starry sky background, intricate jewelry, sparkling eyes, dynamic pose, best quality",
    "A futuristic classroom scene with cute anime students using holographic tablets, bright colors, clean lines, high resolution",
    "Two anime characters sharing an umbrella in a scenic rainy street, reflections on the wet pavement, cozy atmosphere, cinematic lighting",
    "A fantasy warrior princess standing on a cliff overlooking a kingdom, detailed armor, cape blowing in the wind, epic composition",
    "A cheerful anime idol performing on stage with colorful laser lights and confetti, energetic pose, sparkling outfit, detailed background"
];

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(prompt, index) {
    console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt}"...`);

    const params = new URLSearchParams({
        prompt: prompt,
        model: "miaomiao-harem",
        steps: "30",
        cfg: "7.0",
        scheduler: "Euler a"
    });

    const url = `${ENDPOINT_BASE}?${params.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText} ${await response.text()}`);
        }

        const buffer = await response.arrayBuffer();

        // Save first image as 'cover.png', others with timestamp
        const filename = index === 0 ? 'cover.png' : `${Date.now()}_${index}.png`;
        const filePath = path.join(TARGET_DIR, filename);

        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`  Saved to ${filename}`);

        return {
            url: `/showcase/miaomiao-harem/${filename}`,
            prompt: prompt,
            modelId: 'miaomiao-harem',
            creator: { user: 'Gemini 3 Pro', model: 'Miaomiao Harem' }
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting Miaomiao Showcase Generation...");
    const manifest = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        const result = await generateAndSave(PROMPTS[i], i);
        if (result) {
            manifest.push(result);
        }
        // Small delay to be polite to the endpoint
        await new Promise(r => setTimeout(r, 1000));
    }

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nDone! Manifest written to ${MANIFEST_PATH} with ${manifest.length} items.`);
}

run();
