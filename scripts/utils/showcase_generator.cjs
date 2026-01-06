const fs = require('fs');
const path = require('path');
const https = require('https');
const { uploadToB2 } = require('./b2_uploader.cjs');
const { DEMO_PROMPTS } = require('./demo_prompts.cjs');

/**
 * Shared Showcase Generator
 * Generates images for a given model and prompt list, uploads to B2, and saves a manifest.
 * 
 * @param {string} modelId The ID of the model
 * @param {Array<{name:string, prompt:string}>} prompts List of prompt objects. Defaults to DEMO_PROMPTS if null.
 * @param {object} options Optional settings
 */
async function generateShowcase(modelId, prompts = DEMO_PROMPTS, options = {}) {
    if (!modelId) {
        throw new Error('Model ID is required');
    }

    const {
        steps = '30',
        cfg = '7.5',
        width = '1024',
        height = '1024',
        scheduler = 'DPM++ 2M Karras',
        folderPrefix = 'showcase' // B2 folder prefix
    } = options;

    console.log(`\n=== Processing Model: ${modelId} ===`);
    console.log(`Using ${prompts.length} prompts...`);

    // We will accumulate results for the manifest here
    const manifestEntries = [];
    // Also save a local backup manifest just in case, in the old location or a temp one
    const localOutputDir = path.join(__dirname, '../../public/showcase', modelId);
    if (!fs.existsSync(localOutputDir)) {
        fs.mkdirSync(localOutputDir, { recursive: true });
    }

    const manifestPath = path.join(localOutputDir, 'manifest.json');

    for (let i = 0; i < prompts.length; i++) {
        const item = prompts[i];
        const safeName = item.name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
        const filename = `${folderPrefix}/${modelId}/${safeName}.png`; // B2 Key structure

        console.log(`   [${modelId}] [${i + 1}/${prompts.length}] Generating: ${item.name}...`);

        try {
            // 1. Generate Buffer
            const imageBuffer = await fetchGeneration(modelId, item.prompt, { steps, cfg, width, height, scheduler });

            // 2. Upload to B2
            console.log(`      ↑ Uploading to B2: ${filename}...`);
            const publicUrl = await uploadToB2(imageBuffer, filename, 'image/png');
            console.log(`      ✓ Uploaded: ${publicUrl}`);

            // 3. Add to Manifest
            manifestEntries.push({
                url: publicUrl,
                name: item.name,
                prompt: item.prompt,
                creator: 'Gemini 3 Pro',
                modelId: modelId,
                steps: parseInt(steps),
                cfg: parseFloat(cfg),
                width: parseInt(width),
                height: parseInt(height),
                scheduler: scheduler,
                createdAt: new Date().toISOString()
            });

        } catch (error) {
            console.error(`      ✗ Failed: ${error.message}`);
        }
    }

    if (manifestEntries.length > 0) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifestEntries, null, 2));
        console.log(`   ✓ Manifest saved locally to ${manifestPath}`);
    } else {
        console.log(`   ! No images generated for ${modelId}`);
    }
}

/**
 * Helper to call the generation API and return a Buffer
 */
async function fetchGeneration(modelId, prompt, params) {
    const urlParams = new URLSearchParams({
        prompt: prompt,
        model: modelId,
        steps: params.steps,
        cfg: params.cfg,
        width: params.width,
        height: params.height,
        scheduler: params.scheduler
    });

    const url = `https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${urlParams.toString()}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`API Error: ${res.statusCode}`));
                return;
            }

            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

// Allow direct execution from CLI
// Usage: node scripts/utils/showcase_generator.cjs <modelId>
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Usage: node scripts/utils/showcase_generator.cjs <modelId>');
    } else {
        const modelId = args[0];
        generateShowcase(modelId).catch(err => console.error(err));
    }
}

module.exports = { generateShowcase };
