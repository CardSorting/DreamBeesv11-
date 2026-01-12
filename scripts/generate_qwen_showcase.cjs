
const fs = require('fs');
const path = require('path');
// fetch is global in recent Node

const TARGET_DIR = path.join(__dirname, '../public/showcase/qwen-image-2512');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const ENDPOINT = "https://mariecoderinc--qwen-image-2512-qwenimage-api-generate.modal.run";

const PROMPTS = [
    // 🔥 Mainstream Anime / Gacha-Inspired Cosplay (Photo Style)
    "Professional cosplay photoshoot of an adult female cosplayer wearing a fantasy game–inspired outfit, thigh-high stockings, fitted costume with elegant details, confident relaxed pose, studio lighting, shallow depth of field, high-resolution DSLR photo",
    "High-end cosplay photoshoot, adult woman in ornate fantasy costume, clean makeup, styled wig, confident smile, neutral studio backdrop, softbox lighting, editorial cosplay photography",
    "Cosplay pinup photoshoot, adult female cosplayer in fantasy heroine outfit, subtle armor accents, relaxed confident stance, cinematic lighting, realistic fabric textures",
    "Studio cosplay shoot, adult cosplayer wearing a popular anime game–style costume, symmetrical framing, clean background, magazine-cover composition",

    // 🧙 Fantasy Mage / Sorceress (Very Popular)
    "Cosplay photoshoot of an adult sorceress character, flowing robe costume, off-shoulder design, styled wig, dramatic studio lighting, confident expression, high realism",
    "Fantasy mage cosplay photoshoot, adult female model holding a glowing prop orb, controlled lighting, dark backdrop, cinematic mood",
    "Elegant spellcaster cosplay shoot, adult cosplayer in fitted fantasy outfit, long sleeves, detailed accessories, soft rim lighting, DSLR realism",
    "Light-mage cosplay photoshoot, adult woman in pastel fantasy costume, soft natural lighting, clean studio environment",

    // 🤖 Cyberpunk / Sci-Fi Cosplay (Top Engagement)
    "Cyberpunk cosplay photoshoot, adult female cosplayer wearing futuristic jacket and bodysuit, neon accent lighting, night city backdrop, cinematic photography",
    "Sci-fi operative cosplay shoot, adult cosplayer in tactical futuristic outfit, confident stance, LED lighting effects, high-detail realism",
    "Android-inspired cosplay photoshoot, adult woman in sleek sci-fi costume, subtle glowing accents, minimal studio background, soft rim light",
    "Cyberpunk pinup cosplay shoot, adult cosplayer with asymmetrical futuristic outfit, bold makeup, neon lighting, editorial framing",

    // 🎀 Idol / Magical Girl (Real-World Cosplay Version)
    "Modern magical-girl cosplay photoshoot, adult cosplayer in short skirt costume with tech accents, pastel lighting, confident idol pose",
    "Idol cosplay photoshoot, adult female performer in sparkly stage outfit, studio lights, energetic confident posture, concert-inspired lighting",
    "Cosplay photoshoot of an adult idol character, star-themed costume, styled wig, glossy makeup, magazine-style composition",
    "After-performance cosplay shoot, adult cosplayer relaxing backstage, warm lighting, candid confident pose",

    // 🐰 Bunny / Tactical Bunny (Safe & Popular)
    "Bunny-themed cosplay photoshoot, adult female cosplayer in sleek fitted bodysuit, confident playful pose, studio lighting, realistic textures",
    "Tactical bunny cosplay shoot, adult cosplayer wearing sci-fi armor accents and bunny ears, dramatic lighting, confident stance",
    "Cyber bunny cosplay photoshoot, adult woman in futuristic bunny costume, neon rim lighting, clean studio background",
    "Elegant bunny cosplay pinup shoot, adult cosplayer, soft glow lighting, tasteful pose, editorial cosplay photography",

    // 🖤 Maid Cosplay (Evergreen)
    "Elegant maid cosplay photoshoot, adult female cosplayer in modern tailored maid uniform, soft lighting, confident smile",
    "Luxury café maid cosplay shoot, adult cosplayer in refined outfit, warm ambient lighting, lifestyle cosplay photography",
    "Futuristic maid cosplay photoshoot, adult woman in sleek maid-inspired costume, minimalist sci-fi set",
    "Classic maid cosplay shoot, adult cosplayer, pastel tones, studio lighting, clean background",

    // 🎒 Casual / Fashion-Forward Cosplay (Adult-Coded)
    "Fashion-inspired cosplay photoshoot, adult woman wearing school-uniform–inspired outfit with modern tailoring, clearly adult model, editorial lighting",
    "Casual cosplay pinup shoot, adult cosplayer wearing jacket draped off shoulder, relaxed confident stance, cinematic lighting",
    "Urban cosplay photoshoot, adult woman in anime-inspired street outfit, golden hour lighting, city background",
    "Casual idol cosplay shoot, adult cosplayer in oversized hoodie costume, soft lighting, relaxed pose",

    // 🛡️ Knight / Armor Cosplay
    "Female knight cosplay photoshoot, adult cosplayer wearing polished armor with feminine details, studio lighting, confident stance",
    "Light armor warrior cosplay shoot, adult woman with fitted armor and cape, dramatic fantasy lighting",
    "Paladin cosplay photoshoot, adult cosplayer in radiant armor, strong confident posture, cinematic lighting",
    "Battle-ready knight cosplay pinup, adult woman, dramatic contrast lighting, studio environment",

    // 🌸 Cozy / Soft-Sell (Very Print-Friendly)
    "Cat-themed cosplay photoshoot, adult cosplayer in cozy costume, café-style background, warm lighting",
    "Window-light cosplay photoshoot, adult woman by a large window, soft natural light, calm confident expression",
    "Spring festival cosplay shoot, adult cosplayer in light fabric outfit, outdoor lighting, gentle breeze effect",
    "Autumn jacket cosplay photoshoot, adult woman in layered costume, warm tones, lifestyle photography",

    // 💿 Retro / Y2K / Pop Cosplay
    "Y2K-inspired cosplay photoshoot, adult female model wearing metallic fashion costume, glossy lighting, studio backdrop",
    "Retro arcade cosplay shoot, adult cosplayer in colorful outfit, neon props, playful confident pose",
    "90s idol cosplay photoshoot, adult woman in retro stage costume, saturated lighting, magazine-style framing",
    "Tech diva cosplay photoshoot, adult cosplayer with futuristic accessories, confident stance, clean editorial lighting"
];

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(prompt, index) {
    console.log(`[${index + 1}/${PROMPTS.length}] Generating: "${prompt}"...`);

    // Payload as per API Documentation
    const body = {
        prompt: prompt,
        // negative_prompt: "", // Use model defaults
        aspect_ratio: "1:1"
    };

    try {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText} ${await response.text()}`);
        }

        const buffer = await response.arrayBuffer();

        // Save first image specifically as 'cover.png' for the preview mode usage if index is 0
        const filename = index === 0 ? 'cover.png' : `${Date.now()}_${index}.png`;
        const filePath = path.join(TARGET_DIR, filename);

        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`  Saved to ${filename}`);

        return {
            url: `/showcase/qwen-image-2512/${filename}`,
            prompt: prompt,
            modelId: 'qwen-image-2512',
            creator: { user: 'Gemini 3 Pro', model: 'Qwen 2.5 12B' }
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting Qwen Showcase Generation...");
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
