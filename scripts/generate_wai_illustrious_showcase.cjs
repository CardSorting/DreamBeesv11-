
const fs = require('fs');
const path = require('path');
// fetch is global in recent Node

const TARGET_DIR = path.join(__dirname, '../public/showcase/wai-illustrious');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const BASE_URL = "https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run";

const PROMPTS = [
    "masterpiece, best quality, 1girl, solo, magical library, floating books, magic circles, indoors, fantasy, light particles, dust, shelves, detailed, dynamic angle",
    "masterpiece, best quality, 1girl, solo, cyberpunk, neon lights, glowing headphones, reflection, rainy street, mechanical parts, futuristic city, night, wet skin",
    "masterpiece, best quality, scenery, coffee shop, indoors, plant, window, rain, cozy, lo-fi, cup, steam, wooden table, warm lighting",
    "masterpiece, best quality, 1girl, elf, silver hair, long hair, blue eyes, forest, nature, fantasy dress, intricate jewelry, soft lighting, dappled sunlight, portrait",
    "masterpiece, best quality, scenery, steampunk airship, gears, brass, steam, clouds, sky, adventure, detailed, flying, engine",
    "masterpiece, best quality, no humans, dragon, chibi, cute, treasure, gold, coins, cave, bright colors, kawaii, sitting",
    "masterpiece, best quality, scenery, post-apocalyptic, city, ruins, overgrown, nature, vines, moss, skyscrapers, rust, sunlight, clouds, abandoned",
    "masterpiece, best quality, scenery, underwater, coral reef, fish, bioluminescence, ocean, water, bubbles, mermaid, caustic lighting, vibrant",
    "masterpiece, best quality, scenery, wizard tower, floating island, lightning, storm, magic, purple energy, dark clouds, dramatic lighting, fantasy",
    "masterpiece, best quality, scenery, japanese garden, cherry blossoms, falling petals, torii gate, shrine, spring, pink flowers, pond, reflection, traditional",
    // New 25 prompts
    "masterpiece, best quality, 1boy, solo, mecha pilot, plugsuit, sci-fi, cockpit, holographic hud, space battle background, intense expression, dynamic lighting",
    "masterpiece, best quality, 1girl, solo, school uniform, classroom, sunlight, sunset, looking out window, sentimental, slice of life, detailed background, lens flare",
    "masterpiece, best quality, 1boy, solo, playing basketball, sweat, dynamic pose, court, indoors, action shot, sports anime, muscular, determination",
    "masterpiece, best quality, 1girl, solo, idol, concert, stage lights, microphone, singing, sparkling, frilly dress, enthusiastic, crowd silhouette, vibrant colors",
    "masterpiece, best quality, 1girl, solo, gothic lolita, parasol, lace, ribbons, rose garden, victorian mansion background, elegant, ruffle dress, bonnet",
    "masterpiece, best quality, 1man, solo, samurai, katana, cherry blossoms, moonlight, bamboo forest, serious, traditional clothes, cinematic composition",
    "masterpiece, best quality, 1girl, solo, hacker, multiple screens, dark room, green glow, hoodie, glasses, keyboard, cybernetic implants, coding",
    "masterpiece, best quality, scenery, space station bridge, view of earth, stars, futuristic furniture, clean, sci-fi, detailed control panel, reflection",
    "masterpiece, best quality, 1girl, solo, magical girl, transformation sequence, glowing ribbons, sparkles, floating, dynamic pose, colorful, stars, magic staff",
    "masterpiece, best quality, 1boy, solo, demon hunter, dark fantasy, glowing eyes, ruined cathedral, fog, cape, sword, mysterious, eerie atmosphere",
    "masterpiece, best quality, 1girl, solo, gamer, bedroom, headphones, rgb pc, plushies, messy room, snacks, night, screen glow, cozy",
    "masterpiece, best quality, 1girl, solo, swimwear, bikini, beach, ocean, blue sky, summer, sunglasses, tropical, palm trees, splashing water, happy",
    "masterpiece, best quality, 1girl, solo, yukata, fireworks festival, night, holding fan, traditional japanese, colorful explosions, matsuri, bokeh",
    "masterpiece, best quality, 1girl, solo, winter clothes, scarf, snow, mountains, cold breath, skiing, white landscape, bright sunlight, blue sky",
    "masterpiece, best quality, 1girl, solo, inventor, steampunk, goggles, workshop, tools, blueprints, messy hair, grease smudge, gears, brass",
    "masterpiece, best quality, 1man, solo, survivor, post-apocalypse, gas mask, ruins, tactical gear, backpack, sunset, gritty, wasteland",
    "masterpiece, best quality, 1girl, solo, chef, kitchen, cooking, apron, food, vegetables, bright lighting, steam, delicious, happy",
    "masterpiece, best quality, 1girl, solo, librarian, glasses, library, books, ladder, quiet, sunlight beams, dust motes, academic, studious",
    "masterpiece, best quality, 1girl, solo, playing violin, music notes, concert hall, spotlight, elegant dress, closed eyes, emotion, dynamic",
    "masterpiece, best quality, group, fantasy party, adventurer guild, tavern, drinking, laughter, diverse characters, warm lighting, wooden interior",
    "masterpiece, best quality, 1man, vampire, gothic castle, red moon, wine glass, elegant suit, cape, bats, dark atmosphere, pale skin",
    "masterpiece, best quality, 1girl, solo, 90s style, retro anime, cel shading, vhs effect, bright colors, oversized jacket, city pop aesthetic",
    "masterpiece, best quality, 1girl, ghost, translucent, abandoned house, night, candle, scary, horror, pale, floating, eerie",
    "masterpiece, best quality, 1girl, solo, cat ears, tail, maid outfit, tray, cafe, cute, paw pose, bell, fluffy, smile",
    "masterpiece, best quality, 1girl, solo, angel, wings, clouds, heaven, halo, white dress, feathers, holy light, ethereal, divine"
];

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(prompt, index) {
    console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt}"...`);

    const body = {
        prompt: prompt,
        model: "wai-illustrious",
        steps: 30,
        cfg: 7.0,
        scheduler: "DPM++ 2M Karras",
        width: 1024,
        height: 1024
    };

    try {
        // 1. Submit
        const submitResponse = await fetch(`${BASE_URL}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!submitResponse.ok) {
            throw new Error(`Submit API Error: ${submitResponse.statusText} ${await submitResponse.text()}`);
        }

        const submitJson = await submitResponse.json();
        const jobId = submitJson.job_id;
        console.log(`  Job: ${jobId}...`);

        // 2. Poll
        let buffer = null;
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const resultRes = await fetch(`${BASE_URL}/result/${jobId}`);

            if (resultRes.status === 202) continue;

            if (!resultRes.ok) {
                const errText = await resultRes.text();
                throw new Error(`Polling Error (${resultRes.status}): ${errText}`);
            }

            const ct = resultRes.headers.get('content-type');
            if (ct && ct.includes('image/')) {
                buffer = await resultRes.arrayBuffer();
                break;
            }

            // Check for failed
            const json = await resultRes.json();
            if (json.status === 'failed') throw new Error(json.error);
        }

        if (!buffer) throw new Error("Generation timed out");

        // Save first image specifically as 'cover.png' for the preview mode usage if index is 0
        const filename = index === 0 ? 'cover.png' : `${Date.now()}_${index}.png`;
        const filePath = path.join(TARGET_DIR, filename);

        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`  Saved to ${filename}`);

        return {
            url: `/showcase/wai-illustrious/${filename}`,
            prompt: prompt,
            modelId: 'wai-illustrious',
            creator: { user: 'Gemini 3 Pro', model: 'Wai Illustrious' }
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting Wai Illustrious Showcase Generation...");
    const manifest = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        const result = await generateAndSave(PROMPTS[i], i);
        if (result) {
            manifest.push(result);
        }
        // Small delay to be safe
        await new Promise(r => setTimeout(r, 1000));
    }

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nDone! Manifest written to ${MANIFEST_PATH} with ${manifest.length} items.`);
}

run();
