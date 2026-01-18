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
    // Shared A10G Endpoint (Async)
    const BASE_URL = "https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run";

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
/**
 * Helper to call the generation API and return a Buffer
 */
async function fetchGeneration(modelId, prompt, params, baseUrl = "https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run") {
    // 1. Submit Job
    const submitUrl = `${baseUrl}/generate`;
    const body = JSON.stringify({
        prompt: prompt,
        model: modelId,
        steps: parseInt(params.steps),
        cfg: parseFloat(params.cfg),
        width: parseInt(params.width),
        height: parseInt(params.height),
        scheduler: params.scheduler
    });

    const submitRes = await new Promise((resolve, reject) => {
        const req = https.request(submitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });

    if (submitRes.statusCode !== 202) {
        throw new Error(`Submit Failed (${submitRes.statusCode}): ${submitRes.data}`);
    }

    const jobId = JSON.parse(submitRes.data).job_id;
    // console.log(`      Job: ${jobId}`); // Optional log

    // 2. Poll
    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const result = await new Promise((resolve, reject) => {
            https.get(`${baseUrl}/result/${jobId}`, (res) => {
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    buffer: Buffer.concat(chunks)
                }));
            }).on('error', reject);
        });

        if (result.statusCode === 202) continue; // Queued

        if (result.statusCode !== 200) {
            throw new Error(`Polling Error (${result.statusCode}): ${result.buffer.toString()}`);
        }

        const ct = result.headers['content-type'];
        if (ct && ct.includes('image/')) {
            return result.buffer;
        }

        // Check for failed status in JSON
        try {
            const json = JSON.parse(result.buffer.toString());
            if (json.status === 'failed') throw new Error(json.error);
        } catch (e) {
            // ignore
        }
    }
    throw new Error("Generation timed out");
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
