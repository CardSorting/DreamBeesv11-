
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MODELS = [
    'animij-v7',
    'swijtspot-no1'
];

// Define one clear, high-quality prompt per model for the preview
const PREVIEWS = {
    'animij-v7': {
        name: 'preview',
        prompt: 'Masterpiece, best quality, 1girl, solo, anime style, highly detailed, vibrant colors, soft lighting, cinematic composition, looking at viewer'
    },
    'swijtspot-no1': {
        name: 'preview',
        prompt: 'A painting of a surreal landscape, soft brushstrokes, dreamy atmosphere, pastel colors, artistic, highly detailed, oil painting style'
    }
};

const BASE_OUTPUT_DIR = path.join(__dirname, '../public/models'); // Saving to public/models for easier serving

async function generateImage(modelId, item, outputDir) {
    const filename = `preview.png`; // Standardize preview name
    const filePath = path.join(outputDir, filename);

    console.log(`   [${modelId}] Generating: ${item.prompt.substring(0, 30)}...`);

    const params = new URLSearchParams({
        prompt: item.prompt,
        model: modelId,
        steps: '30',
        cfg: '7.0',
        width: '1024',
        height: '1024',
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
                console.log(`      ✓ Saved to ${filename}`);
                resolve(`/models/${modelId}/${filename}`);
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

    const item = PREVIEWS[modelId];
    if (!item) {
        console.log(`No preview config for ${modelId}`);
        return;
    }

    try {
        const webPath = await generateImage(modelId, item, outputDir);
        console.log(`   ✓ Preview generated at ${webPath}`);
    } catch (error) {
        console.error(`      ✗ Failed: ${error.message}`);
    }
}

async function main() {
    console.log(`Starting Preview Generation for ${MODELS.length} models...`);

    for (const modelId of MODELS) {
        await processModel(modelId);
    }

    console.log('\n✓ All models processed.');
}

main();
