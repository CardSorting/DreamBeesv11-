const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MODELS = [
    'perfect-illustrious'
];

const BASE_OUTPUT_DIR = path.join(__dirname, '../public/showcase');

const PROMPTS = [
];

async function generateImage(modelId, item, index, outputDir) {
    const filename = `${item.name}.png`;
    const filePath = path.join(outputDir, filename);

    // Skip if exists to save time/cost during dev (optional, remove check for full regen)
    if (fs.existsSync(filePath)) return `/showcase/${modelId}/${filename}`;

    console.log(`   [${modelId}] [${index + 1}/${PROMPTS.length}] Generating: ${item.name}...`);

    const params = new URLSearchParams({
        prompt: item.prompt,
        model: modelId,
        steps: '30',
        cfg: '7.5',
        width: '1024',
        height: '1024',
        scheduler: 'DPM++ 2M Karras'
    });

    const url = `https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${params.toString()}`;


    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                // If model not supported or error, just reject
                reject(new Error(`API Error: ${res.statusCode}`));
                return;
            }

            const stream = fs.createWriteStream(filePath);
            res.pipe(stream);

            stream.on('finish', () => {
                stream.close();
                console.log(`      ✓ Saved to ${filename}`);
                resolve(`/showcase/${modelId}/${filename}`);
            });
        }).on('error', reject);
    });
}

async function processModel(modelId) {
    console.log(`\n=== Processing Model: ${modelId} ===`);
    const outputDir = path.join(BASE_OUTPUT_DIR, modelId);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const manifestPath = path.join(outputDir, 'manifest.json');
    const webPaths = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        try {
            const webPath = await generateImage(modelId, PROMPTS[i], i, outputDir);
            webPaths.push({
                url: webPath,
                name: PROMPTS[i].name,
                prompt: PROMPTS[i].prompt,
                creator: 'Gemini 3 Pro'
            });
        } catch (error) {
            console.error(`      ✗ Failed: ${error.message}`);
        }
    }

    if (webPaths.length > 0) {
        fs.writeFileSync(manifestPath, JSON.stringify(webPaths, null, 2));
        console.log(`   ✓ Manifest saved for ${modelId}`);
    } else {
        console.log(`   ! No images generated for ${modelId}`);
    }
}

async function main() {
    console.log(`Starting Batch Showcase Generation for ${MODELS.length} models...`);

    for (const modelId of MODELS) {
        await processModel(modelId);
    }

    console.log('\n✓ All models processed.');
}

main();
