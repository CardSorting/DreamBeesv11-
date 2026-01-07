const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '../public/showcase/miaomiao-harem');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const ENDPOINT_BASE = "https://cardsorting--sdxl-multi-model-model-web-inference.modal.run";

const PROMPTS = [
    "1girl, solo, cybernetic angel, mechanical wings, glowing halo, futuristic city sky, clouds, lens flare, white armor, divine atmosphere, masterpiece, best quality, 8k",
    "1girl, solo, oni girl, red horns, kimono, katana, cherry blossoms, night, full moon, traditional japanese architecture, fierce expression, intense eyes, masterpiece, best quality",
    "1girl, solo, librarian, ancient library, floating books, magic scrolls, dust motes, warm candlelight, glasses, intellectual, mysterious, fantasy, masterpiece, best quality",
    "1girl, solo, pilot, cockpit, mech robot, interface screens, holographic hud, sci-fi, intense battle, sparks, explosions outside, focused, masterpiece, best quality, detailed",
    "1girl, solo, street artist, spray painting, graffiti wall, urban alley, paint splatters, hoodie, gas mask, colorful, hip hop style, rebellion, masterpiece, best quality",
    "1girl, solo, ice queen, frozen throne, ice crystals, blizzards, cold blue lighting, elegant gown, tiara, magical, winter fantasy, sharp focus, masterpiece, best quality",
    "1girl, solo, baker, french bakery, croissants, pastries, morning sunlight, apron, flour on face, cheerful, cozy, warm colors, masterpiece, best quality",
    "1girl, solo, kunoichi, ninja, rooftop, night, stealth, black outfit, scarf blowing in wind, city lights background, dynamic pose, action, masterpiece, best quality",
    "1girl, solo, alchemist, chemistry lab, colorful potions, smoke, glassware, protective goggles, experiment, magic, detailed messy room, masterpiece, best quality",
    "1girl, solo, skater girl, skate park, mid-air trick, skateboard, afternoon sun, wide angle lens, dynamic, sportswear, cool, masterpiece, best quality",
    "1girl, solo, dragon tamer, fantasy armor, baby dragon on shoulder, mountain peak, epic landscape, clouds, wind, adventure, masterpiece, best quality, cinematic",
    "1girl, solo, jazz singer, vintage microphone, dim club lighting, spotlight, evening gown, smoke, classy, emotional, retro style, masterpiece, best quality",
    "1girl, solo, gardener, greenhouse, exotic plants, watering can, sunlight streaming through glass, nature, peaceful, straw hat, sundress, masterpiece, best quality",
    "1girl, solo, cyborg assassin, neon city rain, glowing red eye, weapons, leather jacket, reflection in puddle, dark cyberpunk, edgy, masterpiece, best quality",
    "1girl, solo, shrine maiden, fox mask, holding lantern, dark forest, fireflies, mystical, spiritual, glowing lights, ethereal, masterpiece, best quality",
    "1girl, solo, space princess, zero gravity, floating hair, nebula background, stars, futuristic gown, elegance, cosmic, sci-fi, masterpiece, best quality",
    "1girl, solo, mechanic, garage, classic car, wrench, grease, tank top, tools, detailed vehicle, american retro, strong, masterpiece, best quality",
    "1girl, solo, pirate captain, ship deck, ocean waves, storm, sword, pirate hat, treasure map, adventure, dynamic, epic, masterpiece, best quality",
    "1girl, solo, nurse, futuristic hospital, hologram medical chart, clean white aesthetic, caring expression, sci-fi medical, detailed uniform, masterpiece, best quality",
    "1girl, solo, violinist, concert hall, playing violin, elegant dress, closed eyes, passion, music notes, spotlight, classical, masterpiece, best quality",
    "1girl, solo, explorer, jungle ruins, overgrown stone, compass, backpack, sunlight through leaves, adventure, discovery, detailed background, masterpiece, best quality",
    "1girl, solo, zombie hunter, ruined city, shotgun, survival gear, grit, dirt, intense, action movie style, post-apocalyptic, masterpiece, best quality",
    "1girl, solo, circus acrobat, traversing tightrope, spotlight, colorful costume, tension, balance, audience below, dynamic angle, masterpiece, best quality",
    "1girl, solo, gamer girl, rgb room, headset, gaming chair, computer screens, snacks, casual clothes, relaxed, modern, masterpiece, best quality",
    "1girl, solo, goddess of time, giant clock gears, hourglass, flowing robes, golden light, surreal, abstract background, ethereal, masterpiece, best quality"
];

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(prompt, index) {
    console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt}"...`);

    const params = new URLSearchParams({
        prompt: prompt,
        model: "miaomiao-harem",
        steps: "30",
        cfg: "7.0",
        scheduler: "Euler a"
    });

    const url = `${ENDPOINT_BASE}?${params.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText} ${await response.text()}`);
        }

        const buffer = await response.arrayBuffer();

        // Save first image as 'cover.png', others with timestamp
        const filename = index === 0 ? 'cover.png' : `${Date.now()}_${index}.png`;
        const filePath = path.join(TARGET_DIR, filename);

        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`  Saved to ${filename}`);

        return {
            url: `/showcase/miaomiao-harem/${filename}`,
            prompt: prompt,
            modelId: 'miaomiao-harem',
            creator: { user: 'Gemini 3 Pro', model: 'Miaomiao Harem' }
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting Miaomiao Showcase Generation...");
    const manifest = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        const result = await generateAndSave(PROMPTS[i], i);
        if (result) {
            manifest.push(result);
        }
        // Small delay to be polite to the endpoint
        await new Promise(r => setTimeout(r, 1000));
    }

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nDone! Manifest written to ${MANIFEST_PATH} with ${manifest.length} items.`);
}

run();
