
const fs = require('fs');
const path = require('path');
const https = require('https');

// Prompts to generate
const ASSETS = [
    { name: 'robot_portrait', prompt: 'Portrait of a robot with human emotions, oil painting style, expressive', model: 'cat-carrier' }, // Testing cat-carrier for variety
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
