const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MODELS = [
    'hassaku-illustrious',
    'cat-carrier'
];

const BASE_OUTPUT_DIR = path.join(__dirname, '../public/showcase');

const PROMPTS = [
    { name: 'cyberpunk_portrait', prompt: 'masterpiece, best quality, 1girl, cyberpunk, neon aesthetic, urban, mechanical parts, glowing eyes, cinematic lighting, highly detailed' },
    { name: 'fantasy_forest', prompt: 'masterpiece, best quality, magical forest, bioluminescent plants, ethereal atmosphere, fireflies, soft fog, dreamlike, fantasy landscape' },
    { name: 'scifi_station', prompt: 'masterpiece, best quality, futuristic space station interior, sleek white panels, holographic displays, window looking out to deep space, nebulae' },
    { name: 'anime_cafe', prompt: 'masterpiece, best quality, cozy cafe interior, rain on window, warm lighting, anime style, lo-fi aesthetic, detailed food and drinks' },
    { name: 'mecha_battle', prompt: 'masterpiece, best quality, giant mecha robot, battle stance, explosions in background, detailed armor, lens flare, dynamic angle' },
    { name: 'watercolor_landscape', prompt: 'masterpiece, best quality, rolling hills, watercolor style, soft pastel colors, traditional art medium, serene, fluffy clouds' },
    { name: 'synthwave_city', prompt: 'masterpiece, best quality, synthwave city, retrowave, purple and cyan, grid floor, sunset, palm trees, 80s aesthetic' },
    { name: 'space_marine', prompt: 'masterpiece, best quality, space marine, power armor, battle worn, holding rifle, alien planet background, dust, smoke' },
    { name: 'isometric_room', prompt: 'masterpiece, best quality, isometric 3d render, cute gamer room, pastel colors, soft lighting, 3d blender style' },
    { name: 'steampunk_inventor', prompt: 'masterpiece, best quality, steampunk inventor, brass goggles, workshop, gears and steam, cinematic lighting, detailed clothes' },
    { name: 'underwater_city', prompt: 'masterpiece, best quality, bioshock style underwater city, art deco architecture, schools of fish, light rays filtering down, ocean depth' },
    { name: 'pixel_art_adventurer', prompt: 'masterpiece, best quality, pixel art style, 16-bit, adventurer standing on cliff edge, looking at castle in distance, sunset' },
    { name: 'oil_painting_cottage', prompt: 'masterpiece, best quality, oil painting, impasto, cozy cottage, flower garden, sunny day, claude monet style' },
    { name: 'glitch_art_portrait', prompt: 'masterpiece, best quality, abstract portrait, glitch art, datamosh, vhs static, neon colors, distorted face' },
    { name: 'origami_zoo', prompt: 'masterpiece, best quality, paper craft style, origami animals, paper zoo, depth of field, tilt shift, bright colors' },
    { name: 'pencil_sketch_street', prompt: 'masterpiece, best quality, graphite pencil sketch, narrow european street, cafe tables, cobblestone, rough texture, detailed shading' },
    { name: 'low_poly_mountain', prompt: 'masterpiece, best quality, low poly style, mountain landscape, geometric shapes, flat shading, vibrant colors, minimalist' },
    { name: 'stained_glass_window', prompt: 'masterpiece, best quality, stained glass window, intricate pattern, sunlight streaming through, colorful church interior' },
    { name: 'ukiyo_e_wave', prompt: 'masterpiece, best quality, ukiyo-e style, great wave, japanese woodblock print, traditional art, mount fuji in background' },
    { name: 'macro_insect', prompt: 'masterpiece, best quality, macro photography, mechanical insect, clockwork beetle, depth of field, metallic texture, detailed gears' },
    { name: 'vaporwave_statue', prompt: 'masterpiece, best quality, vaporwave aesthetic, marble statue head, windows 95 ui elements, palm leaves, pink and blue gradients' },
    { name: 'noir_detective', prompt: 'masterpiece, best quality, film noir style, detective in trench coat, rainy city street, black and white, dramatic shadows, street light' },
    { name: 'claymation_alien', prompt: 'masterpiece, best quality, claymation style, cute alien creature, plasticine texture, stop motion look, moon surface' },
    { name: 'pop_art_explosion', prompt: 'masterpiece, best quality, pop art style, comic book explosion, halftone dots, roy lichtenstein style, bold lines, bright primary colors' },
    { name: 'bioware_armor', prompt: 'masterpiece, best quality, organic bio-armor, hr giger style but clean, sleek chitin, glowing veins, character concept' },
    { name: 'vector_flat_office', prompt: 'masterpiece, best quality, vector art, flat design, modern office workspace, clean lines, corporate memphis style, minimalist' },
    { name: 'gothic_cathedral', prompt: 'masterpiece, best quality, gothic cathedral interior, vaulted ceilings, eerie mist, candlelight, dark atmosphere, photorealistic' },
    { name: 'cinematic_samurai', prompt: 'masterpiece, best quality, cinematic shot, samurai warrior, cherry blossom forest, petals falling, katana drawn, shallow depth of field' },
    { name: 'retro_futurism_car', prompt: 'masterpiece, best quality, retro futurism, 1950s flying car, chrome fins, atomic age, hover technology, utopian city background' },
    { name: 'double_exposure_bear', prompt: 'masterpiece, best quality, double exposure photography, silhouette of bear, pine forest inside silhouette, northern lights, starry sky' },
    { name: 'lego_castle', prompt: 'masterpiece, best quality, lego pieces, medieval castle, plastic texture, depth of field, miniature photography style' },
    { name: 'neon_sign_rain', prompt: 'masterpiece, best quality, close up, neon sign reflecting in puddle, rain drops, bokeh city lights, urban night atmosphere' },
    { name: 'marble_bust_flowers', prompt: 'masterpiece, best quality, classical marble bust, exploding with colorful flowers instead of head, surrealism, dali style, studio lighting' }
];

async function generateImage(modelId, item, index, outputDir) {
    const filename = `${item.name}.png`;
    const filePath = path.join(outputDir, filename);

    // Skip if exists to save time/cost during dev (optional, remove check for full regen)
    // if (fs.existsSync(filePath)) return `/showcase/${modelId}/${filename}`;

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
            webPaths.push(webPath);
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
