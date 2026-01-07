
const fs = require('fs');
const path = require('path');
// fetch is global in recent Node

const TARGET_DIR = path.join(__dirname, '../public/showcase/qwen-image-2512');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const ENDPOINT = "https://cardsorting--qwen-image-2512-qwenimage-api-generate.modal.run";

const PROMPTS = [
    "A bioluminescent jungle at night where every plant emits a soft blue or purple glow, huge alien flowers, glowing insects, atmospheric fog, 8k, mysterious",
    "A steampunk space station built from brass and copper gears, steam pipes, victorian aesthetics in zero gravity, nebula background, intricate details",
    "A vast desert where the dunes are made of crushed crystal, giant jagged crystal formations rising from the sand, twin suns setting, prismatic light refractions",
    "Close up portrait of a samurai with a face half made of sleek white metal, neon katana, rainy holographic city background, intense gaze, cinematic",
    "Islands floating in a sky filled with clouds and hot air balloons, waterfalls cascading into the void beneath, fantasy art style, vibrant colors",
    "A seemingly microscopic view of a moss forest looking like huge trees, tiny glowing creatures, macro photography, depth of field"
];

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(prompt, index) {
    console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt}"...`);

    // Payload as per API Documentation
    const body = {
        prompt: prompt,
        // negative_prompt: "", // Use model defaults
        aspect_ratio: "1:1"
    };

    try {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText} ${await response.text()}`);
        }

        const buffer = await response.arrayBuffer();

        // Save first image specifically as 'cover.png' for the preview mode usage if index is 0
        const filename = index === 0 ? 'cover.png' : `${Date.now()}_${index}.png`;
        const filePath = path.join(TARGET_DIR, filename);

        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`  Saved to ${filename}`);

        return {
            url: `/showcase/qwen-image-2512/${filename}`,
            prompt: prompt,
            modelId: 'qwen-image-2512',
            creator: { user: 'Gemini 3 Pro', model: 'Qwen 2.5 12B' }
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting Qwen Showcase Generation...");
    const manifest = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        const result = await generateAndSave(PROMPTS[i], i);
        if (result) {
            manifest.push(result);
        }
        // Small delay to be safe
        await new Promise(r => setTimeout(r, 1000));
    }

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nDone! Manifest written to ${MANIFEST_PATH} with ${manifest.length} items.`);
}

run();
