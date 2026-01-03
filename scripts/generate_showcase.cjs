
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MODEL_ID = 'hassaku-illustrious';
const OUTPUT_DIR = path.join(__dirname, '../public/showcase', MODEL_ID);
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const PROMPTS = [
    { name: 'cyberpunk_portrait', prompt: 'masterpiece, best quality, 1girl, cyberpunk, neon aesthetic, urban, mechanical parts, glowing eyes, cinematic lighting, highly detailed' },
    { name: 'fantasy_forest', prompt: 'masterpiece, best quality, magical forest, bioluminescent plants, ethereal atmosphere, fireflies, soft fog, dreamlike, fantasy landscape' },
    { name: 'scifi_station', prompt: 'masterpiece, best quality, futuristic space station interior, sleek white panels, holographic displays, window looking out to deep space, nebulae' },
    { name: 'anime_cafe', prompt: 'masterpiece, best quality, cozy cafe interior, rain on window, warm lighting, anime style, lo-fi aesthetic, detailed food and drinks' },
    { name: 'mecha_battle', prompt: 'masterpiece, best quality, giant mecha robot, battle stance, explosions in background, detailed armor, lens flare, dynamic angle' },
    { name: 'watercolor_landscape', prompt: 'masterpiece, best quality, rolling hills, watercolor style, soft pastel colors, traditional art medium, serene, fluffy clouds' }
];

async function generateImage(item, index) {
    const filename = `${item.name}.png`;
    const filePath = path.join(OUTPUT_DIR, filename);

    console.log(`[${index + 1}/${PROMPTS.length}] Generating: ${item.name}...`);

    const params = new URLSearchParams({
        prompt: item.prompt,
        model: MODEL_ID,
        steps: '30',
        cfg: '7.5',
        width: '1024',
        height: '1024', // Square for showcase tiles
        scheduler: 'DPM++ 2M Karras'
    });

    const url = `https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${params.toString()}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`API Error: ${res.statusCode}`));
                return;
            }

            const stream = fs.createWriteStream(filePath);
            res.pipe(stream);

            stream.on('finish', () => {
                stream.close();
                console.log(`   ✓ Saved to ${filename}`);
                resolve(`/showcase/${MODEL_ID}/${filename}`); // Return web path
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log(`Starting showcase generation for model: ${MODEL_ID}`);
    const webPaths = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        try {
            const webPath = await generateImage(PROMPTS[i], i);
            webPaths.push(webPath);
        } catch (error) {
            console.error(`   ✗ Failed: ${error.message}`);
        }
    }

    // Write Manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(webPaths, null, 2));
    console.log(`\n✓ Generated ${webPaths.length} images.`);
    console.log(`✓ Manifest saved to public/showcase/${MODEL_ID}/manifest.json`);
}

main();
