const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MODELS = [
    'ani-detox'
];

const BASE_OUTPUT_DIR = path.join(__dirname, '../public/showcase');

const PROMPTS = [
    { name: 'anime_girl_001', prompt: 'masterpiece, best quality, a beautiful anime girl, long silver hair, blue eyes, sailor school uniform, standing in a classroom, sunlight streaming through windows, soft lighting, detailed background' },
    { name: 'anime_girl_002', prompt: 'masterpiece, best quality, a beautiful anime girl, short pink bob cut, green eyes, oversized hoodie, listening to headphones, cyberpunk city street at night, neon lights, rain reflections' },
    { name: 'anime_girl_003', prompt: 'masterpiece, best quality, a beautiful anime girl, flowing golden blonde hair, amber eyes, elegant white sundress, field of sunflowers, blue sky, cumulus clouds, bright summer day' },
    { name: 'anime_girl_004', prompt: 'masterpiece, best quality, a beautiful anime girl, long black hair, hime cut, red eyes, gothic lolita dress with frills, holding a red rose, dark gothic cathedral background, stained glass windows' },
    { name: 'anime_girl_005', prompt: 'masterpiece, best quality, a beautiful anime girl, messy brown ponytail, hazel eyes, sporty gym clothes, holding a basketball, sunset on a rooftop court, lens flare, dynamic pose' },
    { name: 'anime_girl_006', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, heterochromia eyes blue and yellow, futuristic sci-fi bodysuit, glowing circuit pattern, inside a spaceship cockpit, stars in window' },
    { name: 'anime_girl_007', prompt: 'masterpiece, best quality, a beautiful anime girl, purple hair twin tails, violet eyes, maid outfit, carrying a serving tray, victorian mansion hallway, elegant carpet, chandelier' },
    { name: 'anime_girl_008', prompt: 'masterpiece, best quality, a beautiful anime girl, red hair braided, green eyes, fantasy adventurer leather armor, holding a magic staff, enchanted forest, glowing mushrooms, fireflies' },
    { name: 'anime_girl_009', prompt: 'masterpiece, best quality, a beautiful anime girl, teal hair, orange eyes, casual streetwear, denim jacket, leaning against a graffiti wall, urban alleyway, confident expression' },
    { name: 'anime_girl_010', prompt: 'masterpiece, best quality, a beautiful anime girl, platinum blonde hair, grey eyes, winter coat and scarf, snowy street, christmas lights blur, catching a snowflake, breath vapor' },
    { name: 'anime_girl_011', prompt: 'masterpiece, best quality, a beautiful anime girl, navy blue hair, golden eyes, traditional japanese kimono with floral pattern, temple festival at night, paper lanterns, fireworks in sky' },
    { name: 'anime_girl_012', prompt: 'masterpiece, best quality, a beautiful anime girl, pastel rainbow hair, purple eyes, pajama party outfit, sitting on a bed with plushies, pastel bedroom, cute aesthetic, soft focus' },
    { name: 'anime_girl_013', prompt: 'masterpiece, best quality, a beautiful anime girl, ginger curly hair, freckles, green eyes, librarian outfit, glasses, surrounded by piles of books, dusty old library, god rays' },
    { name: 'anime_girl_014', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair in a bun, sharp red eyes, assassin outfit, sleek black bodysuit, holding dual daggers, moonlight rooftop, city skyline' },
    { name: 'anime_girl_015', prompt: 'masterpiece, best quality, a beautiful anime girl, ash grey hair, blue eyes, nurse uniform, hospital corridor, clean white aesthetic, holding a clipboard, gentle smile' },
    { name: 'anime_girl_016', prompt: 'masterpiece, best quality, a beautiful anime girl, maroon hair, brown eyes, barista apron, making latte art, cozy coffee shop interior, warm lighting, steam rising' },
    { name: 'anime_girl_017', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde wavy hair, blue eyes, fairy wings, floral dress, sitting on a giant mushroom, magical glade, sparkles, ethereal atmosphere' },
    { name: 'anime_girl_018', prompt: 'masterpiece, best quality, a beautiful anime girl, dark blue hair, purple eyes, witch hat and robe, brewing a potion, alchemist lab, cluttered shelves, glowing liquid' },
    { name: 'anime_girl_019', prompt: 'masterpiece, best quality, a beautiful anime girl, pink hair space buns, yellow eyes, pop idol costume, singing with microphone, concert stage, stage lights, crowd silhouette' },
    { name: 'anime_girl_020', prompt: 'masterpiece, best quality, a beautiful anime girl, green hair, red eyes, zombie hunter outfit, holding a crossbow, post-apocalyptic ruins, overgrown city, dramatic lighting' },
    { name: 'anime_girl_021', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, pale skin, red eyes, vampire nobility dress, holding a wine glass, gothic castle balcony, full moon, bats flying' },
    { name: 'anime_girl_022', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair bob, glasses, sweater vest, coding at a computer, messy desk, multiple monitors, matrix code reflection' },
    { name: 'anime_girl_023', prompt: 'masterpiece, best quality, a beautiful anime girl, silver long hair, aqua eyes, mermaid tail, underwater coral reef, colorful fish, bubbles, refraction of light' },
    { name: 'anime_girl_024', prompt: 'masterpiece, best quality, a beautiful anime girl, lavender hair, pink eyes, ballet tutu, dancing en pointe, opera stage, spotlight, rose petals falling' },
    { name: 'anime_girl_025', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde pixie cut, blue eyes, pilot jumpsuit, vintage airplane hangar, propeller plane, golden hour lighting' },
    { name: 'anime_girl_026', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair long straight, dark eyes, shrine maiden miko outfit, sweeping temple grounds, autumn leaves falling, peaceful atmosphere' },
    { name: 'anime_girl_027', prompt: 'masterpiece, best quality, a beautiful anime girl, orange hair, green eyes, chef uniform, holding a gourmet dish, busy kitchen background, fire from stove, intensity' },
    { name: 'anime_girl_028', prompt: 'masterpiece, best quality, a beautiful anime girl, blue hair, yellow eyes, police officer uniform, directing traffic, futuristic city intersection, flying cars, daytime' },
    { name: 'anime_girl_029', prompt: 'masterpiece, best quality, a beautiful anime girl, pink hair, blue eyes, magical girl transformation sequence, ribbons and sparkles, glowing heart background, dynamic angle' },
    { name: 'anime_girl_030', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair braids, hazel eyes, farm girl outfit, holding a basket of apples, orchard, autumn colors, sunny' },
    { name: 'anime_girl_031', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair short, purple eyes, angel wings, white robe, sitting on a cloud, blue sky, heavenly light' },
    { name: 'anime_girl_032', prompt: 'masterpiece, best quality, a beautiful anime girl, red hair, green eyes, pirate captain outfit, tricorne hat, on a ship deck, ocean waves, seagulls, adventure' },
    { name: 'anime_girl_033', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde drill curls, blue eyes, victorian ballgown, royalty, sitting on a throne, red velvet, gold ornaments' },
    { name: 'anime_girl_034', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair ponytail, brown eyes, office lady suit, walking in business district, skyscrapers, busy morning' },
    { name: 'anime_girl_035', prompt: 'masterpiece, best quality, a beautiful anime girl, silver hair, red eyes, demon horns, black leather outfit, hellscape background, lava ambiance, fire particles' },
    { name: 'anime_girl_036', prompt: 'masterpiece, best quality, a beautiful anime girl, green hair, blue eyes, gardener outfit, watering plants, greenhouse, lush foliage, blooming flowers' },
    { name: 'anime_girl_037', prompt: 'masterpiece, best quality, a beautiful anime girl, purple hair, yellow eyes, fortune teller, crystal ball, dark tent with tapestries, mystical smoke, candles' },
    { name: 'anime_girl_038', prompt: 'masterpiece, best quality, a beautiful anime girl, blue hair twin drills, pink eyes, cheerleader outfit, cheering with pom poms, sports stadium, blue sky' },
    { name: 'anime_girl_039', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair, green eyes, hiking gear, mountain peak, panoramic view, clouds below, triumphant pose' },
    { name: 'anime_girl_040', prompt: 'masterpiece, best quality, a beautiful anime girl, pink hair, blue eyes, bunny girl suit, casino background, roulette wheel, cards flying, glamorous' },
    { name: 'anime_girl_041', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, grey eyes, ghost spirit, translucent kimono, abandoned dark hallway, eerie blue glow, floating' },
    { name: 'anime_girl_042', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde hair, amber eyes, mechanic jumpsuit, grease on cheek, working on a robot, garage workshop, tools, sparks' },
    { name: 'anime_girl_043', prompt: 'masterpiece, best quality, a beautiful anime girl, red hair, green eyes, celtic warrior, woad face paint, holding a sword, misty highlands, stone circle' },
    { name: 'anime_girl_044', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair, blue eyes, playing violin, concert hall stage, spotlight on her, emotional expression, music notes' },
    { name: 'anime_girl_045', prompt: 'masterpiece, best quality, a beautiful anime girl, silver hair, purple eyes, ice queen, crown of ice, frozen throne room, snowflakes, cold breath' },
    { name: 'anime_girl_046', prompt: 'masterpiece, best quality, a beautiful anime girl, orange hair, yellow eyes, fox ears and tail, kitsune, forest shrine, torii gate, spiritual fire' },
    { name: 'anime_girl_047', prompt: 'masterpiece, best quality, a beautiful anime girl, blue hair, green eyes, surfer girl, wetsuit, holding surfboard, beach sunset, ocean waves, tropical vibes' },
    { name: 'anime_girl_048', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair, brown eyes, painter artist, beret, holding palette and brush, art studio, canvas, colorful paint splatters' },
    { name: 'anime_girl_049', prompt: 'masterpiece, best quality, a beautiful anime girl, pink hair, blue eyes, candy land theme, dress made of sweets, lollipop forest, chocolate river, whimsical' },
    { name: 'anime_girl_050', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde hair, red eyes, vampire hunter, trench coat, crossbow, foggy london street, gaslight, mysterious' },
    { name: 'anime_girl_051', prompt: 'masterpiece, best quality, a beautiful anime girl, green hair, yellow eyes, dryad nature spirit, skin like bark texture mix, deep forest, vines, wildlife' },
    { name: 'anime_girl_052', prompt: 'masterpiece, best quality, a beautiful anime girl, purple hair, blue eyes, galaxy theme, dress made of stars, floating in space, nebula background, cosmic' },
    { name: 'anime_girl_053', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, gold eyes, egyptian priestess, gold jewelry, ancient temple, hieroglyphs, desert sunset' },
    { name: 'anime_girl_054', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair, red eyes, ninja kunoichi, masked, running on rooftops, moonlight, shuriken, action pose' },
    { name: 'anime_girl_055', prompt: 'masterpiece, best quality, a beautiful anime girl, red hair, blue eyes, race car driver, racing suit, holding helmet, race track, pit lane, fast curs blur' },
    { name: 'anime_girl_056', prompt: 'masterpiece, best quality, a beautiful anime girl, blue hair, pink eyes, skater girl, oversized shirt, holding skateboard, skate park, graffiti, sunny day' },
    { name: 'anime_girl_057', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair, green eyes, detective, trench coat, magnifying glass, noir office, rain on window, shadow' },
    { name: 'anime_girl_058', prompt: 'masterpiece, best quality, a beautiful anime girl, silver hair, yellow eyes, cyborg, mechanical arm, soldering, futuristic lab, blueprints, holograms' },
    { name: 'anime_girl_059', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde hair, blue eyes, cowgirl, cowboy hat, riding a horse, desert canyon, wild west, dust' },
    { name: 'anime_girl_060', prompt: 'masterpiece, best quality, a beautiful anime girl, pink hair, green eyes, flower shop girl, arranging bouquet, flower shop interior, colorful blooms, sunshine' },
    { name: 'anime_girl_061', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, red eyes, lab coat scientist, holding test tube, chemistry lab, colorful liquids, safety goggles' },
    { name: 'anime_girl_062', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair, purple eyes, goth girl, mesh shirt, choker, graveyard, crow on shoulder, moody' },
    { name: 'anime_girl_063', prompt: 'masterpiece, best quality, a beautiful anime girl, red hair, amber eyes, blacksmith, forging sword, anvil, sparks flying, fire glow, muscular' },
    { name: 'anime_girl_064', prompt: 'masterpiece, best quality, a beautiful anime girl, blue hair, blue eyes, rain spirit, raincoat, splashing in puddle, rainy street, hydrangea flowers, cute' },
    { name: 'anime_girl_065', prompt: 'masterpiece, best quality, a beautiful anime girl, green hair, brown eyes, archaeologist, exploring ruins, holding torch, ancient carvings, dust motes' },
    { name: 'anime_girl_066', prompt: 'masterpiece, best quality, a beautiful anime girl, purple hair, pink eyes, neon pop aesthetic, colorful geometric background, bubblegum, visor, stylish' },
    { name: 'anime_girl_067', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde hair, green eyes, elf archer, drawing bow, forest canopy, dappled light, focused expression' },
    { name: 'anime_girl_068', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair, blue eyes, photographer, holding dslr camera, taking photo, scenic overlook, wind blowing hair' },
    { name: 'anime_girl_069', prompt: 'masterpiece, best quality, a beautiful anime girl, silver hair, red eyes, assassin nun, dual pistols, church ruins, torn habit, action shot' },
    { name: 'anime_girl_070', prompt: 'masterpiece, best quality, a beautiful anime girl, pink hair, yellow eyes, circus acrobat, hanging from hoop, big top tent, spotlight, audience below' },
    { name: 'anime_girl_071', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, blue eyes, snow maiden, fur lined hood, snowy forest, deer friend, peaceful winter' },
    { name: 'anime_girl_072', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair, gold eyes, dragon girl, dragon wings and tail, sitting on treasure pile, cave, torchlight' },
    { name: 'anime_girl_073', prompt: 'masterpiece, best quality, a beautiful anime girl, red hair, green eyes, irish dancer, traditional dress, dancing jig, green field, stone wall, cloudy sky' },
    { name: 'anime_girl_074', prompt: 'masterpiece, best quality, a beautiful anime girl, blue hair, purple eyes, dj, mixing deck, club lights, headphones, energetic crowd, lasers' },
    { name: 'anime_girl_075', prompt: 'masterpiece, best quality, a beautiful anime girl, green hair, brown eyes, military uniform, tank commander, sitting on tank, desert battlefield, dust' },
    { name: 'anime_girl_076', prompt: 'masterpiece, best quality, a beautiful anime girl, purple hair, yellow eyes, genie, emerging from lamp, magical smoke, treasure room, gold coins' },
    { name: 'anime_girl_077', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde hair, blue eyes, lifeguard, swimsuit, whistle, beach tower, sunny ocean, watching water' },
    { name: 'anime_girl_078', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair, green eyes, scout, camping, tent, campfire, night sky, roasting marshmallows' },
    { name: 'anime_girl_079', prompt: 'masterpiece, best quality, a beautiful anime girl, silver hair, red eyes, terminator style, half face mechanical, leather jacket, motorcycle, dystopia' },
    { name: 'anime_girl_080', prompt: 'masterpiece, best quality, a beautiful anime girl, pink hair, blue eyes, figure skater, ice rink, sparkling costume, spinning, motion blur' },
    { name: 'anime_girl_081', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, gold eyes, goddess, toga, marble temple, clouds, sun halo, divine' },
    { name: 'anime_girl_082', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair, brown eyes, student council president, uniform, adjusting glasses, school hallway, stern look' },
    { name: 'anime_girl_083', prompt: 'masterpiece, best quality, a beautiful anime girl, red hair, green eyes, lumberjack, flannel shirt, axe, pine forest, mountains, rugged' },
    { name: 'anime_girl_084', prompt: 'masterpiece, best quality, a beautiful anime girl, blue hair, yellow eyes, thunder deity, drums, lightning bolts, storm clouds, electrifying' },
    { name: 'anime_girl_085', prompt: 'masterpiece, best quality, a beautiful anime girl, green hair, pink eyes, toxic neon theme, gas mask, graffiti alley, sludge, glowing green' },
    { name: 'anime_girl_086', prompt: 'masterpiece, best quality, a beautiful anime girl, purple hair, blue eyes, dream weaver, floating in clouds, catching stars, surreal background, sheep' },
    { name: 'anime_girl_087', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde hair, red eyes, villainess, elegant dress, evil smirk, holding wine, ballroom, ominous' },
    { name: 'anime_girl_088', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair, hazel eyes, baker, holding tray of bread, bakery interior, warm light, flour dust' },
    { name: 'anime_girl_089', prompt: 'masterpiece, best quality, a beautiful anime girl, silver hair, silver eyes, robot girl, charging cable, metallic skin sheen, white void, minimalist' },
    { name: 'anime_girl_090', prompt: 'masterpiece, best quality, a beautiful anime girl, pink hair, green eyes, floral fairy, dress made of petals, sitting on flower, garden, butterflies' },
    { name: 'anime_girl_091', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, blue eyes, yeti girl, fur bikini, snowy cave, holding bone, primal' },
    { name: 'anime_girl_092', prompt: 'masterpiece, best quality, a beautiful anime girl, black hair, red eyes, vampire slayer, whip, gothic town, night, bats, action' },
    { name: 'anime_girl_093', prompt: 'masterpiece, best quality, a beautiful anime girl, red hair, yellow eyes, phoenix girl, fire wings, rising from ash, flames, dramatic' },
    { name: 'anime_girl_094', prompt: 'masterpiece, best quality, a beautiful anime girl, blue hair, purple eyes, crystal mage, floating crystals, crystal cave, glowing, magic circle' },
    { name: 'anime_girl_095', prompt: 'masterpiece, best quality, a beautiful anime girl, green hair, brown eyes, ranger, hooded cloak, rain, forest path, tracking' },
    { name: 'anime_girl_096', prompt: 'masterpiece, best quality, a beautiful anime girl, purple hair, pink eyes, candy witch, broom made of licorice, gingerbread house, sweets, flying' },
    { name: 'anime_girl_097', prompt: 'masterpiece, best quality, a beautiful anime girl, blonde hair, green eyes, dryad, leaves in hair, tree merge, ancient oak, sunlight' },
    { name: 'anime_girl_098', prompt: 'masterpiece, best quality, a beautiful anime girl, brown hair, blue eyes, aviator, goggles, biplane, sky, clouds, adventure' },
    { name: 'anime_girl_099', prompt: 'masterpiece, best quality, a beautiful anime girl, white hair, red eyes, albino rabbit girl, bunny ears, carrots, garden, cute' },
    { name: 'anime_girl_100', prompt: 'masterpiece, best quality, a beautiful anime girl, rainbow hair, rainbow eyes, prismatic, colors swirling, abstract art background, paint, creative' }
];

async function generateImage(modelId, item, index, outputDir) {
    const filename = `${item.name}.png`;
    const filePath = path.join(outputDir, filename);

    // Skip if exists to save time/cost during dev (optional, remove check for full regen)
    if (fs.existsSync(filePath)) return `/showcase/${modelId}/${filename}`;

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
            webPaths.push({
                url: webPath,
                name: PROMPTS[i].name,
                prompt: PROMPTS[i].prompt,
                creator: 'Gemini 3 Pro'
            });
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
