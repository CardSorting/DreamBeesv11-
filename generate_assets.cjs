
const fs = require('fs');
const path = require('path');
const https = require('https');

// Prompts to generate - Using 'hassaku-illustrious' for consistent art style as 'juggernaut-xl' is not supported
const ASSETS = [
    { name: 'cyberpunk_city', prompt: 'A futuristic cyberpunk city with neon lights, cinematic lighting, highly detailed, 8k', model: 'hassaku-illustrious' },
    { name: 'japanese_garden', prompt: 'A serene japanese garden with cherry blossoms, digital art, soft lighting', model: 'hassaku-illustrious' },
    { name: 'robot_portrait', prompt: 'Portrait of a robot with human emotions, oil painting style, expressive', model: 'cat-carrier' }, // Testing cat-carrier for variety
    { name: 'abstract_fluid', prompt: 'Abstract fluid colors, vibrant, 4k, wallpaper', model: 'hassaku-illustrious' },
    { name: 'space_explorer', prompt: 'Astronaut exploring a bioluminescent alien planet, cinematic 8k', model: 'hassaku-illustrious' },
    { name: 'fantasy_castle', prompt: 'Epic fantasy castle in the clouds, ethereal lighting, concept art', model: 'hassaku-illustrious' },
    { name: 'pixel_cafe', prompt: 'Cozy coffee shop interior, pixel art style, retro game aesthetic', model: 'hassaku-illustrious' },
    { name: 'synthwave_car', prompt: 'Retrowave sports car driving into the sunset, synthwave aesthetic, vaporwave', model: 'hassaku-illustrious' }
];

const OUTPUT_DIR = path.join(__dirname, 'src/assets/images/landing');

async function downloadImage(asset) {
    console.log(`Generating ${asset.name}...`);

    // Construct params
    const params = new URLSearchParams({
        prompt: asset.prompt,
        model: asset.model,
        steps: '30',
        cfg: '7',
        width: '600', // Smaller for marquee performance
        height: '400',
        scheduler: 'DPM++ 2M Karras'
    });

    const url = `https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${params.toString()}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${asset.name}: ${res.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(path.join(OUTPUT_DIR, `${asset.name}.png`));
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✓ Saved ${asset.name}.png`);
                resolve();
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    for (const asset of ASSETS) {
        try {
            await downloadImage(asset);
        } catch (e) {
            console.error(`Error generating ${asset.name}:`, e.message);
        }
    }
}

main();
