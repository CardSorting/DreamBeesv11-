
// scripts/generate_zit_showcase.cjs
const fs = require('fs');
const path = require('path');
// const fetch = require('node-fetch'); // Ensure fetch is available, utilizing global fetch in newer Node

const TARGET_DIR = path.join(__dirname, '../public/showcase/zit-model');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const ENDPOINT = "https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run/generate";

// Extremely obsessively beautiful intoxicating women prompts demonstrating range
const PROMPTS = [
    "hyper-realistic portrait of an intoxicatingly beautiful woman with mesmerizing emerald eyes, soft cinematic lighting, high fashion silk gown, obsidian hair flowing, intricate jewelry, 8k resolution, masterpiece",
    "ethereal goddess with glowing skin, amber eyes, wearing a dress made of starlight, golden hour lighting, surreal atmosphere, hyper-detailed",
    "mysterious femme fatale in a noir setting, red lipstick, smokey eyes, vintage velvet dress, dramatic shadows, rainy city background, cinematic",
    "obsessively beautiful woman with a haunting gaze, platinum blonde hair, porcelain skin, wearing intricate white lace, soft focus background, delicate lighting",
    "vibrant high-fashion editorial of a stunning woman, neon lighting, silver metallic outfit, sharp features, intense gaze, futuristic aesthetic",
    "serene portrait of a beautiful woman in a garden of white roses, soft pastel colors, flowing chiffon dress, ethereal lighting, romantic vibe",
    "intoxicatingly beautiful woman with exotic features, deep blue eyes, wearing traditional silk garments, soft sunset lighting, intricate patterns, realistic texture",
    "regal queen with a diamond crown, piercing gaze, royal purple velvet robe, golden throne room, dramatic cinematic lighting, extremely detailed",
    "dreamy portrait of a woman with freckles and ocean-blue eyes, wet hair, sunlight filtering through leaves, natural beauty, hyper-realistic",
    "stunning woman with a graceful pose, wearing a minimalist black dress, sharp silhouette, high-contrast lighting, sophisticated and elegant",
    "ethereal water nymph, translucent skin, glowing eyes, underwater lighting, floating hair, iridescent scales, magical and intoxicating",
    "obsessively beautiful woman in a cyberpunk setting, cybernetic eye glow, leather jacket, rainy street, neon reflections, sharp detail",
    "bohemian beauty with wild hair, turquoise eyes, wearing layered jewelry and linen, desert sunset lighting, earthy tones, cinematic",
    "intoxicating portrait of a woman with auburn hair, hazel eyes, wearing an emerald green dress, forest background, soft dappled light",
    "high-fashion model in a desert, windswept hair, flowing sand-colored silk, intense sunlight, sharp focus, breathtaking beauty",
    "stunning woman with a mischievous smile, cat-like eyes, wearing a masquerade mask, candlelit ballroom, mysterious and alluring",
    "ethereal ice queen, pale blue skin, silver hair, crystalline dress, frozen landscape, cold cinematic lighting, hyper-detailed",
    "obsessively beautiful woman with a soulful gaze, wearing a chunky knit sweater, cozy fireplace lighting, soft warm tones, realistic",
    "intoxicating beauty in a field of lavender, sunset lighting, purple hues, flowing white dress, dreamy and serene",
    "vibrant portrait of a woman with rainbow hair, kaleidoscopic eyes, wearing avant-garde fashion, studio lighting, bold colors",
    "stunning woman with a fierce expression, warrior princess aesthetic, leather armor, glowing war paint, dramatic battlefield background",
    "ethereal wood elf, emerald green eyes, leaf-like hair ornaments, moss-covered forest, soft magical glow, intricate detail",
    "obsessively beautiful woman in a vintage library, wearing glasses and a silk blouse, soft window light, scholarly and elegant",
    "intoxicating portrait of a woman with deep dark skin, gold leaf accents on face, glowing eyes, cosmic background, celestial beauty",
    "stunning woman in a red silk cheongsam, traditional lanterns, soft glow, elegant pose, intricate embroidery, realistic",
    "ethereal angel with massive white wings, golden halo, soft clouds background, heavenly lighting, divine beauty",
    "obsessively beautiful woman with a punk aesthetic, leather jacket, smokey eyes, neon graffiti background, gritty and cinematic",
    "intoxicating beauty in a Venetian gondola, moonlight, dark water, black lace dress, mysterious and romantic",
    "stunning woman with a delicate neck, wearing a pearl necklace, soft pink roses, elegant and timeless, hyper-detailed",
    "ethereal space traveler, reflective visor (half seen), glowing stars, nebula background, futuristic beauty, cinematic",
    "obsessively beautiful woman with a vintage Hollywood aesthetic, finger waves, red lips, satin gown, spotlight, classic beauty",
    "intoxicating portrait of a woman with tribal markings, amber eyes, tiger lilies, jungle background, fierce and beautiful",
    "stunning woman with a serene expression, wearing a kimono, cherry blossom petals falling, soft spring lighting, realistic",
    "ethereal siren, hypnotic gaze, rocky shore, crashing waves, moonlight, dark and intoxicating beauty",
    "obsessively beautiful woman in a futuristic laboratory, white lab coat (high fashion version), glowing blue fluids, sharp and cold aesthetic",
    "intoxicating beauty with a crown of thorns, dark tears, gothic aesthetic, cathedral background, dramatic and haunting",
    "stunning woman with a futuristic visor, digital interface reflections, neon glow, sharp and modern beauty",
    "ethereal moon goddess, silver skin, glowing crescent moon behind head, starry night sky, cold and divine beauty",
    "obsessively beautiful woman in a Parisian café, wearing a beret and a trench coat, soft afternoon light, chic and elegant",
    "intoxicating portrait of a woman with metallic silver skin, liquid metal hair, surreal background, hyper-detailed and unique",
    "stunning woman with a graceful neck, ballerina pose, tutu, soft stage lighting, elegant and fragile beauty",
    "ethereal fire spirit, hair made of flames, glowing orange eyes, volcanic background, intense and intoxicating beauty",
    "obsessively beautiful woman with a retro-futuristic aesthetic, 60s hair, silver jumpsuit, colorful space station center, cinematic",
    "intoxicating beauty with a veil of butterflies, soft colorful lighting, dreamy meadow background, whimsical and stunning",
    "stunning woman in a gold metallic dress, desert dunes, harsh sunlight, high-contrast, breathtaking and regal",
    "ethereal forest spirit, bark-like skin patterns, glowing leaf eyes, deep woods, soft natural light, intricate and beautiful",
    "obsessively beautiful woman with a vampire aesthetic, pale skin, red eyes, velvet choker, dark castle, cinematic",
    "intoxicating portrait of a woman with a galaxy in her hair, glowing stars on skin, cosmic aesthetic, hyper-detailed",
    "stunning woman with a sharp bob, wearing a power suit, city skyline background, modern and fierce beauty",
    "ethereal cloud spirit, soft translucent skin, sky blue hair, sunset clouds, soft and airy beauty",
    "intoxicating portrait of a woman with obsidian skin and glowing neon violet tattoos, sharp gaze, futuristic high-fashion armor, bioluminescent background, cinematic",
    "stunning woman with a cascading waterfall of silver hair, crystalline eyes, wearing a gown reflecting the aurora borealis, arctic night lighting, hyper-detailed",
    "obsessively beautiful woman in a desert oasis, wearing intricate gold body jewelry, sun-kissed skin, turquoise water background, vivid and intoxicating",
    "ethereal spirit of the autumn forest, hair made of maple leaves, glowing amber eyes, soft golden mist, intricate moss and lichen details",
    "vibrant high-fashion editorial of a woman with iridescent skin, wearing a dress made of liquid glass, refracting kaleidoscopic light, studio setting",
    "intoxicatingly beautiful woman with a vintage noir aesthetic, black lace veil, ruby red lips, dramatic monochrome lighting with a single red rose, cinematic",
    "stunning woman with a regal posture, wearing a crown of peacock feathers, iridescent silk robes, ancient palace interior, soft candlelight, hyper-realistic",
    "ethereal creature from the deep sea, luminescent patterns on skin, flowing hair like jellyfish tentacles, deep blue abyss background, hauntingly beautiful",
    "obsessively beautiful woman in a futuristic greenhouse, surrounded by alien bioluminescent flowers, soft ethereal glow on skin, sharp focus",
    "intoxicating portrait of a woman with a lunar landscape in her eyes, silver stardust on skin, crescent moon earrings, black void background, celestial",
    "stunning woman with a fierce gaze, wearing high-tech samurai armor, neon red reflections, urban rainy night background, dynamic and sharp",
    "ethereal nymph of the lavender fields, wearing a dress of woven petals, soft twilight lighting, purple and gold hues, dreamy atmosphere",
    "obsessively beautiful woman with a vintage jazz singer aesthetic, sequined gown, shimmering in spotlight, smoky atmosphere, classic allure",
    "intoxicatingly beautiful woman with tribal gold markings on face, piercing amber eyes, leopard print silk fashion, jungle sunset lighting",
    "stunning woman with a delicate porcelain doll face, wearing a high-fashion Victorian gown with a dark gothic twist, intricate lace, moody lighting",
    "ethereal being made of light and shadow, flowing translucent fabric, surreal void background, high contrast, breathtaking and intoxicating",
    "obsessively beautiful woman in a futuristic library with holographic books, glowing light on face, sharp and sophisticated aesthetic",
    "intoxicating portrait of a woman with a vibrant sunset captured in her flowing hair, warm golden skin, orange and pink lighting, serene",
    "stunning woman with a minimalist aesthetic, wearing a white silk suit, sharp architectural background, clean and powerful beauty, hyper-realistic",
    "ethereal queen of the coral reef, wearing a dress made of living sea anemones, tropical fish swimming around, dappled underwater sunlight",
    "obsessively beautiful woman with a cyberpunk hacker aesthetic, glowing code reflected in eyes, multiple monitors, neon green and violet glow",
    "intoxicatingly beautiful woman in a rain-slicked alleyway, neon signs reflecting in wet leather jacket, dramatic lighting, moody and cinematic",
    "stunning woman with a soft ethereal gaze, wearing a dress made of peacock silk, garden of exotic birds, vibrant and detailed",
    "ethereal guardian of the ancient ruins, wearing weathered stone-like armor, glowing runes on skin, soft moonlight lighting, mysterious",
    "obsessively beautiful woman with a high-fashion space explorer aesthetic, reflective metallic suit, nebula and starfield background, cinematic",
    "intoxicating portrait of a woman with a forest canopy in her eyes, dappled sunlight on face, wearing a dress of woven vines, organic beauty",
    "stunning woman with a vintage film star aesthetic, 1940s waves, silk slip dress, soft focus, timeless and intoxicating allure",
    "ethereal spirit of the winter stars, skin covered in frost patterns, glowing white eyes, frozen lake background, silent and beautiful",
    "obsessively beautiful woman in a high-tech laboratory, analyzing a glowing crystal, blue light reflecting on face, sharp and clinical aesthetic",
    "intoxicatingly beautiful woman with a dramatic red cloak, snow-covered forest background, fierce gaze, high contrast of red and white, cinematic",
    "stunning woman with a graceful neck, wearing a heavy emerald necklace, deep green velvet, dark moody lighting, regal and intoxicating",
    "ethereal being with skin made of cracked porcelain and gold filling (kintsugi style), glowing eyes, surreal and breathtakingly beautiful",
    "obsessively beautiful woman in a futuristic city garden, metallic trees, architectural lighting, sharp and modern high-fashion aesthetic",
    "intoxicating portrait of a woman with a storm brewing in her eyes, chaotic lightning background, electric blue lighting on skin, intense",
    "stunning woman with a minimalist futuristic aesthetic, wearing a dress of light beams, dark void background, sharp and ethereal",
    "ethereal nymph of the cherry blossom forest, wearing a kimono made of petals, soft pink morning light, serene and intoxicating",
    "obsessively beautiful woman with a dark fantasy queen aesthetic, crown of black diamonds, onyx throne, dramatic shadows, cinematic",
    "intoxicatingly beautiful woman with a vibrant floral crown, skin dusted with pollen, sun-drenched meadow background, warm and organic",
    "stunning woman with a sharp bob and metallic silver lips, futuristic high-fashion editor aesthetic, minimalist office, cold and sharp",
    "ethereal creature with butterfly wings for ears, soft iridescent skin, flower garden background, whimsical and intoxicatingly beautiful",
    "obsessively beautiful woman in a Parisian rooftop setting at night, Eiffel Tower in background, chic black dress, city lights, romantic",
    "intoxicating portrait of a woman with a galaxy swirling on her neck, glowing jewels on skin, cosmic high-fashion aesthetic, hyper-detailed",
    "stunning woman with a warrior's resolve, wearing intricate tribal braids and bronze jewelry, desert sunset, fierce and breathtaking",
    "ethereal being of the desert mirage, shimmering translucent skin, heat haze effects, endless dunes background, haunting and beautiful",
    "obsessively beautiful woman with a vintage 1920s flapper aesthetic, emerald green sequins, smoke, jazz club background, intoxicating allure",
    "intoxicating portrait of a woman with a mountain range reflected in her calm eyes, sunrise over the peak background, natural and regal",
    "stunning woman with a sharp high-fashion look, wearing a structured red avant-garde gown, architectural white background, high contrast",
    "ethereal spirit of the coral moon, skin shimmering like wet sand, silver moon in background, calm ocean waves, serene and beautiful",
    "obsessively beautiful woman in a high-tech library, holographic star maps, soft blue light on face, intelligent and stunning aesthetic",
    "intoxicatingly beautiful woman with a wreath of wild roses, soft morning dew on skin, cottage garden background, delicate and breathtaking",
    "stunningly alluring woman with liquid gold eyes, wearing a dress woven from sunlight and silk, ethereal glow, golden hour desert background, 8k resolution",
    "immensely beautiful woman with a soft, sincere smile, wearing a vintage cream-colored lace dress, sunlight filtering through stained glass, divine lighting",
    "obsessively beautiful woman in a Venetian palace at dusk, wearing an intricate sapphire velvet gown, soft candlelight reflecting in her eyes, cinematic",
    "intoxicating portrait of a woman with obsidian hair and translucent pale skin, wearing a high-fashion gown of deep crimson silk, dramatic shadows, noir aesthetic",
    "ethereal goddess of the lunar tides, silver flowing hair, skin shimmering like moonlight on water, wearing iridescent pearls, celestial and alluring",
    "stunningly beautiful woman with an exotic, captivating gaze, wearing a crown of white orchids, tropical jungle waterfall background, misty and romantic",
    "immensely alluring woman with auburn curls, wearing a deep forest green velvet dress, soft dappled sunlight in a secret garden, hyper-detailed",
    "obsessively beautiful woman in a futuristic crystalline city, wearing a dress of refracted light, prismatic reflections on her skin, sharp and ethereal",
    "intoxicating portrait of a woman with a sincere, soul-piercing gaze, wearing a minimal black silk slip, soft morning light in a minimalist studio, elegant",
    "ethereal spirit of the summer meadow, wearing a dress made of wildflowers and butterflies, soft golden sunlight, dreamy and immensely beautiful",
    "stunningly alluring woman with a mysterious smile, wearing a dark masquerade mask of gold and obsidian, candlelit opera house background, cinematic",
    "immensely beautiful woman with a fierce and regal presence, wearing a high-fashion golden breastplate over white silk, desert sunset, breathtaking",
    "obsessively beautiful woman with a vintage Parisian aesthetic, wearing a silk scarf and red lipstick, sitting in a flower-filled balcony, soft afternoon glow",
    "intoxicating portrait of a woman with deep, mesmerizing violet eyes, wearing a gown of galaxy-printed silk, glowing starfield background, celestial beauty",
    "ethereal nymph of the sacred spring, translucent skin, hair like flowing water, wearing bioluminescent lilies, hauntingly alluring and beautiful",
    "stunningly beautiful woman with a graceful, long neck, wearing a heavy ruby necklace, deep red velvet ballgown, dramatic spotlight, masterpiece",
    "immensely alluring woman with freckled skin and oceanic eyes, wet hair, wearing a white linen dress on a windswept beach at sunrise, natural beauty",
    "obsessively beautiful woman with a cyberpunk high-fashion aesthetic, neon violet hair, glowing circuitry tattoos, rainy futuristic street background, sharp",
    "intoxicating portrait of a woman with a sincere and heart-melting expression, wearing a soft cashmere sweater, warm fireplace lighting, cozy and beautiful",
    "ethereal queen of the frost, skin covered in delicate ice crystals, wearing a gown of woven starlight, frozen aurora background, cold and alluring",
    "stunningly beautiful woman with a mischievous gaze, wearing a dress made of autumn leaves and gold thread, misty forest background, warm and enchanting",
    "immensely alluring woman in a high-fashion editorial, wearing a dress made of liquid mercury, sharp architectural shadows, futuristic and stunning",
    "obsessively beautiful woman with a vintage Hollywood siren aesthetic, platinum waves, shimmering silver gown, dramatic spotlights, timeless beauty",
    "intoxicating portrait of a woman with exotic amber eyes, wearing a crown of desert lilies, golden sand dunes at sunset background, majestic",
    "ethereal spirit of the cherry blossom moon, pale pink skin, hair adorned with petals, soft silver moonlight, serene and immensely beautiful",
    "stunningly alluring woman in a neo-gothic cathedral, wearing a black lace gown, mystical violet lighting, shadows and candlelight, haunting",
    "immensely beautiful woman with a soulful gaze, wearing a minimalist silk gown in a field of sunflowers, soft golden hour lighting, radiant",
    "obsessively beautiful woman with a high-fashion warrior aesthetic, wearing bronze armor and silk ribbons, glowing embers in the air, dramatic",
    "intoxicating portrait of a woman with mesmerizing emerald green eyes, wearing a dress of peacock feathers, lush botanical garden background, vibrant",
    "ethereal being made of light and stardust, translucent glowing skin, cosmic void background with nebulae, breathtakingly alluring",
    "stunningly beautiful woman with a vintage 1950s aesthetic, wearing a floral silk dress and pearls, sun-drenched Italian villa background, charming",
    "immensely alluring woman in a futuristic aquatic city, wearing a suit of bioluminescent silk, underwater light rays, serene and stunning",
    "obsessively beautiful woman with a dark fantasy aesthetic, wearing a crown of obsidian roses, misty moonlit graveyard background, mysterious",
    "intoxicating portrait of a woman with a sincere gaze and soft features, wearing a white silk nightgown, sunlight filtering through sheer curtains, divine",
    "ethereal muse of the arts, wearing a dress stained with vibrant watercolors, studio background with paintings, creative and immensely beautiful",
    "stunningly alluring woman with a sharp, high-fashion look, wearing a structured metallic silver suit, neon blue lighting, futuristic and fierce",
    "immensely beautiful woman with a gentle expression, wearing a dress made of woven lavender, sunset over the fields background, dreamy",
    "obsessively beautiful woman with a vintage noir detective aesthetic, wearing a trench coat and a fedora, dramatic rainy night lighting, cinematic",
    "intoxicating portrait of a woman with deep, dark eyes and obsidian skin, wearing gold leaf accents, desert night background with stars, regal",
    "ethereal spirit of the fountain, hair like liquid silver, wearing a dress of crystalline water, moonbathed garden background, silent beauty",
    "stunningly alluring woman with a regal posture, wearing a crown of white feathers, minimalist white silk gown, bright ethereal lighting, divine",
    "immensely beautiful woman with a vintage aesthetic, finger waves, dark red lips, wearing a sequined gown, shimmering in a jazz club, alluring",
    "obsessively beautiful woman with a futuristic pilot aesthetic, wearing a sleek flight suit and glowing HUD visor reflections, cockpit lighting",
    "intoxicating portrait of a woman with a sincere smile, wearing a dress of yellow silk in a lemon grove, bright Mediterranean sunlight, radiant",
    "ethereal queen of the underwater kingdom, wearing a crown of coral and pearls, glowing sea life background, majestic and alluring",
    "stunningly beautiful woman with a warrior's spirit, wearing intricate leather and gold armor, standing on a mountain peak, epic sunset lighting",
    "immensely alluring woman in a high-fashion editorial, wearing a dress made of woven light, dark space background, sharp and breathtaking",
    "obsessively beautiful woman with a vintage bohemian aesthetic, wearing flowing silk and turquoise jewelry, desert landscape at dusk, serene",
    "intoxicating portrait of a woman with a sincere gaze, wearing a dress of white feathers, soft dawn light, immensely beautiful and peaceful",
    "stunningly alluring woman with charcoal-smudged eyes, wearing an edgy high-fashion black leather gown, industrial warehouse background, dramatic cool lighting",
    "immensely beautiful woman with a radiant, sincere smile, wearing a flowy yellow sun dress, standing in a field of sunflowers, soft warm sunlight, organic",
    "obsessively beautiful woman in a futuristic crystal palace, wearing a gown of refracting light, prismatic rainbows on her skin, sharp and ethereal",
    "intoxicating portrait of a woman with a mysterious, captivating gaze, wearing a crown of pearls and silver, deep blue ocean background, ethereal and alluring",
    "ethereal goddess of the golden harvest, hair like spun wheat, wearing a dress of woven grain and silk, soft sunset lighting, warm and immensely beautiful",
    "stunningly alluring woman with a fierce look, wearing high-fashion silver metallic armor, futuristic city skyline background, sharp and cinematic",
    "immensely beautiful woman with a soft, sincere expression, wearing a vintage pink lace shift dress, blooming cherry blossom garden background, delicate",
    "obsessively beautiful woman in a futuristic glass garden, surrounded by glowing neon flora, soft ethereal light on her face, sharp focus",
    "intoxicating portrait of a woman with a sincere and heart-piercing gaze, wearing a simple white silk slip, morning light in a minimalist loft, divine and elegant",
    "ethereal spirit of the starlit sky, wearing a dress made of constellations and dark velvet, glowing stardust background, celestial and alluring",
    "stunningly alluring woman with a captivating, soft smile, wearing a dark velvet evening gown, elegant ballroom background, soft candlelight",
    "immensely beautiful woman with a regal and powerful presence, wearing a high-fashion gold and white silk robe, ancient ruins background, majestic",
    "obsessively beautiful woman with a vintage Italian aesthetic, wearing a silk headscarf and sunglasses, sitting in an open-top classic car, soft coastal light",
    "intoxicating portrait of a woman with deep, soul-searching eyes, wearing a gown of woven moonlight and silk, black night sky background, ethereal",
    "ethereal nymph of the enchanted forest, translucent skin, hair adorned with glowing mushrooms, moonlit forest background, mysterious and alluring",
    "stunningly alluring woman with a long, elegant neck, wearing a vintage sapphire necklace, deep blue velvet gown, dramatic spotlight lighting",
    "immensely beautiful woman with a soft, sincere gaze, wearing a dress made of white orchids, tropical garden background, delicate and breathtaking",
    "obsessively beautiful woman with a cyberpunk high-fashion look, neon blue hair, glowing digital tattoos, rainy futuristic city background, sharp and vibrant",
    "intoxicating portrait of a woman with a sincere and comforting expression, wearing a soft wool sweater, warm fireplace lighting, cozy and beautiful",
    "ethereal queen of the ice crystals, skin covered in delicate frost, wearing a gown of woven starlight, frozen lake background, cold and alluring",
    "stunningly alluring woman with a mischievous and captivating gaze, wearing a dress of autumn silk and bronze thread, misty forest background, enchanting",
    "immensely beautiful woman in a high-fashion editorial, wearing a dress made of liquid gold, sharp architectural shadows, futuristic and breathtaking",
    "obsessively beautiful woman with a vintage Hollywood glamour aesthetic, platinum curls, shimmering silver gown, dramatic spotlights, timeless beauty",
    "intoxicating portrait of a woman with exotic and mesmerizing eyes, wearing a crown of desert lilies, sand dunes sunset background, majestic and alluring",
    "ethereal spirit of the cherry blossom festival, pale pink skin, hair adorned with petals, soft silver moonlight, serene and immensely beautiful",
    "stunningly alluring woman in a dark fantasy setting, wearing a black lace and onyx gown, mystical violet lighting, shadows and candlelight, haunting",
    "immensely beautiful woman with a soulful and sincere gaze, wearing a minimalist silk gown in a field of sunflowers, golden hour lighting, radiant",
    "obsessively beautiful woman with a warrior's resolve, wearing bronze and silk high-fashion armor, glowing embers, dramatic and breathtaking presence",
    "intoxicating portrait of a woman with mesmerizing emerald eyes, wearing a dress of peacock silk, lush botanical garden background, vibrant and alluring",
    "ethereal creature made of light and shadow, translucent skin, mysterious void background, high contrast, breathtaking and intoxicatingly beautiful",
    "stunningly alluring woman with a vintage 1950s aesthetic, wearing a floral silk dress and pearls, sun-drenched garden background, charming and alluring",
    "immensely beautiful woman in a futuristic aquatic city, wearing a suit of bioluminescent silk, underwater light rays, serene and stunning aesthetic",
    "obsessively beautiful woman with a dark fantasy queen aesthetic, wearing a crown of obsidian roses, misty moonlit graveyard background, mysterious",
    "intoxicating portrait of a woman with a sincere and soft gaze, wearing a white silk gown, sunlight filtering through sheer curtains, divine and alluring",
    "ethereal muse of the creative arts, wearing a dress stained with vibrant watercolors, studio background with paintings, creative and immensely beautiful",
    "stunningly alluring woman with a sharp, futuristic high-fashion look, wearing a structured metallic silver suit, neon blue lighting, fierce beauty",
    "immensely beautiful woman with a gentle and sincere expression, wearing a dress made of woven lavender, sunset over the fields background, dreamy",
    "obsessively beautiful woman with a vintage noir detective aesthetic, wearing a trench coat and a fedora, dramatic rainy night lighting, cinematic allure",
    "intoxicating portrait of a woman with deep, captivating eyes and obsidian skin, wearing gold leaf accents, desert night background, regal beauty",
    "ethereal spirit of the crystalline fountain, hair like liquid silver, wearing a dress of water, moonbathed garden background, silent and alluring",
    "stunningly alluring woman with a regal and divine posture, wearing a crown of white feathers, minimalist white silk gown, bright ethereal lighting",
    "immensely beautiful woman with a vintage jazz club aesthetic, finger waves, red lips, wearing a sequined gown, shimmering in the light, alluring",
    "obsessively beautiful woman with a futuristic space pilot aesthetic, wearing a sleek flight suit and glowing HUD visor reflections, cockpit lighting",
    "intoxicating portrait of a woman with a sincere smile, wearing a dress of yellow silk in a coastal lemon grove, bright Mediterranean light, radiant",
    "ethereal queen of the deep sea kingdom, wearing a crown of coral and bioluminescence, glowing sea life background, majestic and alluring beauty",
    "stunningly alluring woman with a warrior princess aesthetic, wearing intricate bronze and leather armor, standing on a mountain peak, sunset lighting",
    "immensely beautiful woman in a high-fashion editorial, wearing a dress made of woven light-beams, dark void background, sharp and breathtaking",
    "obsessively beautiful woman with a vintage bohemian soul, wearing flowing silk and turquoise jewelry, desert landscape at dusk, serene and alluring",
    "intoxicating portrait of a woman with a sincere and peaceful gaze, wearing a dress of white feathers, soft dawn light, immensely beautiful",
    "stunningly alluring woman with a regal presence, wearing a high-fashion gown made of liquid moonlight, soft silver reflections on her skin, ethereal nighttime garden background",
    "immensely beautiful woman with a sincere and heart-melting smile, wearing a vintage silk wrap dress, golden sunset lighting on a Tuscan balcony, breathtakingly alluring"
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
            creator: { user: 'Gemini 3 Pro', model: 'ZIT-model' } // metadata
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
