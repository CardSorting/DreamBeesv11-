
// scripts/generate_zit_showcase.cjs
const fs = require('fs');
const path = require('path');
// const fetch = require('node-fetch'); // Ensure fetch is available, utilizing global fetch in newer Node

const TARGET_DIR = path.join(__dirname, '../public/showcase/zit-model');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const ENDPOINT = "https://cardsorting--zit-only-fastapi-app.modal.run/generate";

// 10 diverse prompts demonstrating range
const PROMPTS = [
    "A futuristic city with neons, cyberpunk style, highly detailed, 8k",
    "A serene japanese garden with cherry blossoms, watercolor style",
    "Portrait of a warrior in golden armor, intense lighting, realistic, photorealistic",
    "A cute isometric 3d render of a coffee shop, pastel colors",
    "Abstract geometric shapes floating in void, vibrant colors, digital art",
    "A dark fantasy forest with glowing mushrooms, eerie atmosphere",
    "A sketch of an old cathedral, pencil drawing style",
    "A macro shot of a dew drop on a leaf, bokeh",
    "A retro synthwave landscape, purple and grid lines, 80s style",
    "Oil painting of a stormy sea, dramatic waves, impasto texture"
];

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(prompt, index) {
    console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt}"...`);

    // Using default aspect ratio 1:1 (1024x1024)
    const body = {
        prompt: prompt,
        steps: 9,
        width: 1024,
        height: 1024
    };

    try {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const filename = `${Date.now()}_${index}.png`;
        const filePath = path.join(TARGET_DIR, filename);

        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`  Saved to ${filename}`);

        return {
            url: `/showcase/zit-model/${filename}`,
            prompt: prompt,
            modelId: 'zit-model',
            creator: { user: 'System', model: 'ZIT-model' } // metadata
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting ZIT Showcase Generation...");
    const manifest = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        const result = await generateAndSave(PROMPTS[i], i);
        if (result) {
            manifest.push(result);
        }
        // Small delay to be nice
        await new Promise(r => setTimeout(r, 1000));
    }

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nDone! Manifest written to ${MANIFEST_PATH} with ${manifest.length} items.`);
}

run();
