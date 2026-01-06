
// scripts/generate_zit_showcase.cjs
const fs = require('fs');
const path = require('path');
// const fetch = require('node-fetch'); // Ensure fetch is available, utilizing global fetch in newer Node

const TARGET_DIR = path.join(__dirname, '../public/showcase/zit-model');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const ENDPOINT = "https://cardsorting--zit-only-fastapi-app.modal.run/generate";

// 100 diverse prompts demonstrating range (expanded)
const PROMPTS = [
    // Original 10
    "A futuristic city with neons, cyberpunk style, highly detailed, 8k",
    "A serene japanese garden with cherry blossoms, watercolor style",
    "Portrait of a warrior in golden armor, intense lighting, realistic, photorealistic",
    "A cute isometric 3d render of a coffee shop, pastel colors",
    "Abstract geometric shapes floating in void, vibrant colors, digital art",
    "A dark fantasy forest with glowing mushrooms, eerie atmosphere",
    "A sketch of an old cathedral, pencil drawing style",
    "A macro shot of a dew drop on a leaf, bokeh",
    "A retro synthwave landscape, purple and grid lines, 80s style",
    "Oil painting of a stormy sea, dramatic waves, impasto texture",

    // 90 New Diverse Prompts
    "Cyberpunk street food vendor, neon lights, rain, high detail",
    "Steampunk airship docking at a floating city, brass and steam",
    "Portrait of an elderly fisherman, weathered face, hyperrealistic",
    "Cute baby dragon playing with a fireball, 3d pixar style",
    "Minimalist line art of a cat, black and white",
    "Post-apocalyptic wasteland with nature reclaiming ruins",
    "Underwater city with bioluminescent creatures, digital art",
    "Viking warrior shouting in battle, dynamic pose, intense",
    "Peaceful meadow with a single large oak tree, impressionist style",
    "Futuristic racing car on a track, motion blur, speed",
    "Macro photography of a spider eye, terrifyingly detailed",
    "Anime style high school girl on a rooftop at sunset, sentimental",
    "Low poly landscape of mountains and a river, vibrant colors",
    "Gothic castle interior, candlelight, shadows, mysterious",
    "Astronaut floating in space, reflection in visor, cinematic",
    "Close up of a mechanical watch movement, gears and springs",
    "Fantasy tavern scene, diverse races drinking, warm lighting",
    "Surreal composition of melting clocks, dali style",
    "Noir detective in a rainy alley, black and white photography",
    "Pixel art cityscape, sunset, 16-bit style",
    "Crystal cave with glowing gems, magical atmosphere",
    "Robot tending to a garden, solarpunk aesthetic",
    "A delicious gourmet burger with cheese dripping, food photography",
    "Concept art of a mech warrior, gritty and realistic",
    "A whimsical treehouse village, ghibli style",
    "Double exposure of a woman's silhouette and a forest",
    "A majestic lion with a galaxy mane, cosmic art",
    "Paper cut art of a forest scene, layered, depth",
    "Marble statue of a greek god, museum lighting",
    "Graffiti art on a brick wall, colorful and bold",
    "A cozy library with a fireplace, raining outside, lo-fi vibe",
    "Samurai standing in a field of red flowers, wind blowing",
    "Alien landscape with purple sky and multiple moons",
    "A glass of whiskey on the rocks, dramatic lighting, product shot",
    "Knolling of vintage camera gear, organized, top down",
    "A haunted house on a hill, lightning strike, horror theme",
    "Isometric room design of a gamer setup, neon details",
    "A cute robot holding a flower, wall-e vibes",
    "A fierce tiger jumping out of water, splash, action shot",
    "Abstract fluid art, swirling colors, acrylic pour style",
    "A futuristic space station corridor, clean white sci-fi",
    "Portrait of a cyborg woman, half face mechanical",
    "A majestic phoenix rising from ashes, fire and particles",
    "A vintage car driving on a coastal road, 1950s poster style",
    "A cute fluffy monster, pixar style, bright colors",
    "A dark wizard casting a spell, green magic effects",
    "A peaceful zen garden, sand raking patterns, top view",
    "A busy market in Marrakech, vibrant spices and textiles",
    "A polar bear on an iceberg, northern lights in background",
    "A stylized vector illustration of a fox, flat design",
    "A detailed map of a fantasy world, parchment texture",
    "A close up of a human eye, galaxy inside the iris",
    "A giant robot fighting a kaiju in a city, destroying buildings",
    "A quaint cottage in the woods, smoke from chimney, fairytale",
    "A futuristic soldier in power armor, looking at camera",
    "A bowl of ramen, steam rising, anime food style",
    "A skull with flowers growing out of it, memento mori",
    "A retro spaceship landing on mars, pulp sci-fi art",
    "A group of adventurers around a campfire, starry night",
    "A beautiful ballerina dancing, motion trails, elegant",
    "A cyberpunk hacker at a computer, multiple screens, green glow",
    "A majestic eagle flying over mountains, majestic eagle",
    "A cute chibi character eating a donut",
    "A stormy ocean with a lighthouse, dramatic lighting",
    "A futuristic city in the clouds, utopia",
    "A detailed blueprint of a steam engine",
    "A spooky ghost floating in a hallway, translucent",
    "A vibrant coral reef with tropical fish, underwater photography",
    "A warrior princess with a sword, fantasy art",
    "A cute sloth hanging from a branch, smiling",
    "A mysterious portal in the woods, glowing blue",
    "A fashionable woman in a futuristic outfit, runway photography",
    "A cracked porcelain doll face, creepy",
    "A majestic stag with antlers made of branches, nature spirit",
    "A intricate mandala design, black and white ink",
    "A futuristic flying car, blade runner style",
    "A cute hamster eating a sunflower seed, macro",
    "A dark alleyway with a glowing red sign, mystery",
    "A beautiful elf archer in the forest, fantasy art",
    "A retro arcade machine, neon glow, 80s nostalgia",
    "A detailed anatomical drawing of a heart, da vinci style",
    "A majestic whale breaching the water, sunset background",
    "A cute ghost reading a book, halloween theme",
    "A futuristic drone delivering a package, city background",
    "A beautiful geisha with a fan, traditional japanese art",
    "A detailed close up of a feather, texture",
    "A dark knight with glowing red eyes, fantasy",
    "A cute corgi puppy playing in the grass",
    "A futuristic helmet design, hud display",
    "A majestic dragon flying over a castle, epic fantasy"
];

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(prompt, index) {
    console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt}"...`);

    // Using default aspect ratio 1:1 (1024x1024)
    const body = {
        prompt: prompt,
        steps: 9,
        width: 1024,
        height: 1024
    };

    try {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const filename = `${Date.now()}_${index}.png`;
        const filePath = path.join(TARGET_DIR, filename);

        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`  Saved to ${filename}`);

        return {
            url: `/showcase/zit-model/${filename}`,
            prompt: prompt,
            modelId: 'zit-model',
            creator: { user: 'System', model: 'ZIT-model' } // metadata
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting ZIT Showcase Generation...");
    const manifest = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        const result = await generateAndSave(PROMPTS[i], i);
        if (result) {
            manifest.push(result);
        }
        // Small delay to be nice
        await new Promise(r => setTimeout(r, 1000));
    }

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nDone! Manifest written to ${MANIFEST_PATH} with ${manifest.length} items.`);
}

run();
