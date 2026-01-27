/**
 * Specialized Anime Showcase Generator
 * 
 * Generates elite showcase images for new anime models focusing on 
 * world-class anime pop culture icons with ultra-detailed prompts.
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
// [REMOVED] import { LoadBalancer } from "../workers/image.js";
// [REMOVED] const loadBalancer = new LoadBalancer();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load Environment ---
const envPath = path.resolve(__dirname, "../.env");
try {
    const envFile = await fs.readFile(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value && !key.startsWith("#")) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch {
    console.warn("Could not read .env file, assuming env vars are set.");
}

// --- Configuration ---
const B2_ENDPOINT = process.env.B2_ENDPOINT || process.env.VITE_B2_ENDPOINT;
const B2_REGION = process.env.B2_REGION || process.env.VITE_B2_REGION;
const B2_BUCKET = process.env.B2_BUCKET || process.env.VITE_B2_BUCKET;
const B2_KEY_ID = process.env.B2_KEY_ID || process.env.VITE_B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY || process.env.VITE_B2_APP_KEY;
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL || process.env.VITE_B2_PUBLIC_URL;

if (!B2_KEY_ID || !B2_APP_KEY) {
    console.error("Missing B2 Credentials in .env");
    process.exit(1);
}

// --- Init Firebase ---
try {
    initializeApp({ projectId: "dreambees-alchemist" });
} catch {
    // Already initialized
}
const db = getFirestore();

// --- S3 Client for B2 ---
const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
    },
});

const CONCURRENCY = 4; // Scale testing concurrency

// ========================================
// ELITE ANIME PROMPTS - Ultra High Quality
// ========================================
const PROMPTS_PER_MODEL = {

    // RIN-ANIME-BLEND: Best for scenic, atmospheric, emotional, Ghibli-esque works
    "rin-anime-blend": [
        // STUDIO GHIBLI INSPIRED
        "Anime masterpiece, Howl and Sophie soaring through dreamlike golden sunset clouds, Howl's black feather cloak in mid-transformation, Sophie's shimmering silver hair flowing in the wind, a magnificent moving castle silhouetted against distant misty mountains, romantic Ghibli-inspired magic, ethereal pastel lighting, soft cinematic glow, emotional atmosphere, high resolution",
        "Anime masterpiece, Chihiro standing at the ornate entrance of the spirit bathhouse, iconic red bridge, glowing paper lanterns, mysterious spirits drifting past, Spirited Away night atmosphere, nostalgic and magical, towering architecture, intricate Japanese woodwork, soft moonlit reflections, emotional resonance, high quality art",
        "Anime masterpiece, Totoro and Satsuki waiting at a rural bus stop in the gentle rain, lush bamboo forest, magical night scene, Catbus approaching with brilliant glowing eyes, oversized leaf umbrellas, My Neighbor Totoro iconic mood, soft rain droplets, mystical forest glow, cozy and heartwarming, 4k resolution",
        "Anime masterpiece, Princess Mononoke San riding her massive white wolf Moro, ancient mystical forest with glowing kodama spirits, mask removed showing wild determination, Shishigami forest at twilight, nature vs industry theme, epic and serene composition, detailed fur and foliage, cinematic lighting, Studio Ghibli inspired",
        "Anime masterpiece, Nausicaa soaring on her glider Mehve, panoramic view of the toxic jungle below, giant Ohmu with glowing blue eyes in the distance, Valley of the Wind windmills, post-apocalyptic ethereal beauty, environmental storytelling, soft wind-blown hair, masterful aerial perspective, cinematic sky",
        "Anime masterpiece, Kiki flying on her broomstick with Jiji the black cat, bakery delivery basket, sprawling coastal European town panorama, circling seagulls, warm summer afternoon Mediterranean light, Kiki's Delivery Service nostalgia, vibrant and warm colors, detailed town architecture, blue ocean horizon",
        "Anime masterpiece, Ashitaka riding Yakul through misty primeval mountains, cursed arm detail, dense morning fog in deep valleys, ancient Japan wilderness, epic journey beginning, Princess Mononoke landscape art, atmospheric depth, realistic foliage texture, somber lighting",

        // EMOTIONAL MASTERPIECES
        "Anime masterpiece, 5 Centimeters Per Second cherry blossom scene, urban train crossing, Takaki reaching out in yearning, thousands of sakura petals suspended in time, melancholy golden hour glow, Makoto Shinkai lighting style, hyper-detailed environment, beautiful loneliness, emotional sky",
        "Anime masterpiece, Your Name (Kimi no Na wa) Taki and Mitsuha twilight meeting on the mountain crater, comet Tiamat splitting the vibrant sky, red kumihimo cord connecting them, magical realism, tears and starlight, destiny moment, incredible sky detail, cinematic lens flare",
        "Anime masterpiece, A Silent Voice Shouko and Shoya standing on the bridge, intimate sign language communication, colorful koi fish swimming below, redemption and forgiveness theme, soft watercolor aesthetic, emotional healing, Kyoto Animation style, gentle afternoon sun",
        "Anime masterpiece, Violet Evergarden writing a heartfelt letter by warm candlelight, intricate prosthetic hands detail, glowing emerald brooch, autumn leaves falling outside the window, bittersweet emotions, Kyoto Animation masterpiece quality, shimmering tears, masterpiece lighting",
        "Anime masterpiece, Clannad After Story field in the illusionary world, father and daughter silhouettes, endless golden wheat field, brilliant blue sky with fluffy white clouds, bittersweet family love, Key visual novel aesthetic, emotional climax, vibrant colors",
        "Anime masterpiece, Grave of the Fireflies Seita and Setsuko watching fireflies dance in the shelter, wartime Japan tragedy, innocent expressions, soft candlelight, tin of sakuma drops, historical Studio Ghibli style, beautiful and heartbreaking, soft focus",

        // ATMOSPHERIC & SCENIC
        "Anime masterpiece, Ancient Magus Bride, Chise wearing Elias's heavy coat in the lush English countryside, ancient standing stones, magical creatures drifting in morning mist, Celtic fantasy aesthetic, ethereal golden hour, master and apprentice bond, detailed nature",
        "Anime masterpiece, Mushishi Ginko walking alone on a winding mountain path, white smoke curling from pipe, invisible mushi spirits floating as light particles, traditional Edo Japan, peaceful solitude, supernatural naturalism, muted earthy tones, atmospheric fog",
        "Anime masterpiece, Natsume Yuujinchou returning a youkai's name, paper scraps flying in the wind, Madara Nyanko-sensei watching, sunset over a rural shrine, gentle supernatural mood, Book of Friends pages, warm nostalgia and acceptance, soft sunset",
        "Anime masterpiece, Made in Abyss sunrise over the terrifying abyss edge, Riko looking down into the infinite netherworld layers, Orth town lighthouse, sense of wonder and danger, magnificent worldbuilding, adventure calling, epic scale, high detail",
        "Anime masterpiece, Weathering With You Hina praying on a rainy Tokyo rooftop, rain parting around her in a circle, sunlight breaking through dark clouds, urban magical realism, hope and sacrifice, Makoto Shinkai atmospheric beauty, hyper-detailed raindrops",
        "Anime masterpiece, Wolf Children Hana with wolf pups in the countryside, traditional Japanese farmhouse, majestic mountain backdrop, seasons changing collage, motherhood journey, slice of life magic, heartwarming and bittersweet, high resolution",

        // ========================================
        // NEW WORLD-CLASS PROMPTS BATCH 2
        // ========================================

        // ETHEREAL DREAMSCAPES
        "Anime masterpiece, Paprika dream parade sequence, circus elephants flying through the Tokyo skyline, reality bending carnival surrealism, Satoshi Kon visual poetry, impossible architecture, dreamscape masterpiece, psychological wonder, chaotic vibrant colors, cinematic depth",
        "Anime masterpiece, Serial Experiments Lain in the Wired, holographic data streams and cables surrounding her, lonely bedroom with glowing monitors, existential isolation, 90s cyberpunk aesthetic, identity dissolution, hauntingly beautiful, cool blue and green lighting",
        "Anime masterpiece, Angel's Egg girl carrying an oversized egg through gothic cathedral ruins, Mamoru Oshii atmosphere, endless rain and deep shadows, biblical symbolism, surreal melancholy, art film anime masterpiece, monochromatic tones with subtle highlights",
        "Anime masterpiece, Haibane Renmei Rakka with grey wings in Old Home, warm autumn light through tall windows, peaceful existential contemplation, afterlife serenity, feathers falling gently, quiet beauty, liminal space warmth, soft sepia tones",
        "Anime masterpiece, Millennium Actress Chiyoko running through her film roles, time periods blending seamlessly, cherry blossoms and snow mixing in the air, pursuit of love across decades, Satoshi Kon magic, cinematic memory lane, dynamic perspective",

        // POETIC LANDSCAPES
        "Anime masterpiece, Garden of Words Takao and Yukari in the rainy park pavilion, lush verdant garden, raindrops creating ripples in the pond, detailed shoes and poetry, forbidden feelings, Shinkai rain perfection, intimate atmosphere, hyper-detailed greenery",
        "Anime masterpiece, Aria the Animation Neo-Venezia canals at sunset, Akari rowing her gondola gracefully, Undine trainee serenity, nostalgic future Martian city, healing anime paradise, golden hour reflections on water, peaceful utopia, soft blue and gold palette",
        "Anime masterpiece, Yokohama Kaidashi Kikou Alpha alone at her countryside cafe, post-apocalyptic pastoral, rusted robots overgrown with wildflowers, melancholy acceptance, end of humanity beauty, quiet robot girl, expansive sky, soft wind",
        "Anime masterpiece, Mushoku Tensei Sylphiette and Rudeus under a massive ancient tree, wind magic rustling leaves, first love innocence, isekai fantasy romance, emotional growth, dappled sunlight, peaceful moment, vibrant fantasy colors",
        "Anime masterpiece, Frieren: Beyond Journey's End journeying through endless flower meadows, elf mage walking alone, centuries of memories, field of blue flowers and ancient gravestones, passage of time, beautiful solitude, fantasy wanderlust, detailed sky",

        // TWILIGHT EMOTIONS
        "Anime masterpiece, Anohana summer fireworks at the mountain shrine, Menma ghost in white dress, childhood friends reunion, tears and laughter, letting go, hanabi festival bittersweet, emotional healing, vibrant firework reflections, summer night",
        "Anime masterpiece, March Comes in Like a Lion Rei crossing the bridge alone, shogi piece metaphors overlaid in the night sky, river reflections, lonely genius, Shaft artistic style, inner struggle beauty, dramatic lighting and framing",
        "Anime masterpiece, Erased Satoru at the frozen lake, Kayo in her iconic red coat, snow falling gently, blue butterfly time travel effect, childhood nostalgia, winter tragedy prevention, desperate hope, saving the past, cool winter light",
        "Anime masterpiece, Fruits Basket final moment, Tohru embracing Kyo, zodiac curse broken celebration, rice ball metaphor, spirits ascending, found family completion, emotional payoff, healing tears, warm sunset glow",
        "Anime masterpiece, To Your Eternity Fushi's first snow with the boy, primitive world isolation, immortal beginning, learning raw emotions, beautiful tragedy, quiet winter landscape, existence awakening, poignant atmosphere, soft white focus",
        "Anime masterpiece, Land of the Lustrous Phosphophyllite at the night beach, gem body reflecting brilliant moonlight, existential crystal beauty, post-human melancholy, shattered and reformed, quiet philosophical anguish, iridescent textures, starry night",
        "Anime masterpiece, The Girl Who Leapt Through Time Makoto frozen mid-leap over a riverbank, summer sunset, time-stopping baseball moment, nostalgic teenage freedom, bittersweet possibilities, golden youth ending, cinematic orange sky",

        // MYSTERIOUS ATMOSPHERES
        "Anime masterpiece, Steins;Gate Okabe in the time travel laboratory, broken microwave phone, @channel messages floating in air, World War III divergence meter glowing, mad scientist determination, chaos theory visualization, time paradox tension, green digital glow",
        "Anime masterpiece, Monster Dr. Kenzo Tenma in the operating theater, harsh red operating light, surgical precision vs moral dilemma, classical music aesthetic, hospital corridor shadows, ethical nightmare, surgical horror beauty, dramatic chiaroscuro",
        "Anime masterpiece, Psycho-Pass Akane Tsunemiya with Dominator raised, futuristic blue summer uniform, justice versus the system, Sibyl System holographic displays, latent criminal awakening, philosophical police drama, cyberpunk cityscape background",
        "Anime masterpiece, Death Parade Quindecim bar, arbiters judging humanity, Chiyuki and her childhood memories floating, existential courtroom, beautiful despair, life evaluation drama, refined gothic aesthetic, glowing blue threads",
        "Anime masterpiece, Another cursed classroom, red string noose swinging, Mei Misaki with crimson eye patch, cursed videotape aesthetic, 90s horror nostalgia, supernatural classroom terror, eerie red and black atmosphere",

        // SERENE LANDSCAPES & SEASONS
        "Anime masterpiece, Sweet Blue Flowers childhood summer, Fumi and Akira on a bicycle ride, rural Japan countryside, first love awakening, gentle breeze through golden rice fields, nostalgic adolescence, tender coming of age, soft watercolor palette",
        "Anime masterpiece, Bloom Into You Yuu and Nanami confession under cherry blossoms, heart-pounding moment, literary club rooftop, romantic tension release, soft pink petals falling, lesbian romance tenderness, cinematic bloom effect",
        "Anime masterpiece, Citrus stepsister romance, Yuzu and Mei on an autumn park bench, forbidden attraction, vibrant orange and yellow leaves, bittersweet family complications, elegant emotional drama, aristocratic tension, detailed fashion",
        "Anime masterpiece, Revolutionary Girl Utena dueling arena, swirling rose petals, sword of Dios, prince and princess symbolism, revolutionary girl pose, Victorian gothic academy, feminist allegory, dramatic theatrical lighting",
        "Anime masterpiece, Adachi and Shimamura student council room after hours, budding romance, rain against dark windows, quiet conversation intimacy, high school girl love, gentle emotional development, cozy indoor lighting",

        // SUPERNATURAL SERENITY
        "Anime masterpiece, Spirited Away bathhouse workers, Lin and Chihiro friendship, spirit world bureaucracy, golden hour steam rising from baths, magical realism workplace, coming of age wonder, nostalgic bathhouse warmth, intricate background",
        "Anime masterpiece, My Neighbor the Witch Hinata discovering magic, broomstick flight lessons, magical girl academy, autumn maple leaves, friendship and discovery, wholesome fantasy, gentle witch training, whimsical atmosphere",
        "Anime masterpiece, Aoi Hana Fumi Manjoume in art club solitude, watercolor brushes and paper, creative introspection, spring light through tall library windows, artistic girl melancholy, creative expression beauty, soft textures",
        "Anime masterpiece, Liz and the Blue Bird Mizore and Nozomi flute duet, sharp and flat key personalities, music room golden hour, Kyoto Animation precision, emotional musical harmony, friendship depth, focus on instruments",
        "Anime masterpiece, Tamayomi baseball girls determination, Kanata Hishishishita pitching form, sunset stadium, sports anime passion, girl power athleticism, competitive spirit, sunset victory moment, dynamic pose",

        // TEMPORAL REFLECTIONS
        "Anime masterpiece, Puella Magi Madoka Magica final monologue, pink goddess Madokami form dissolving into light, cosmic despair and hope, ultimate sacrifice beauty, emotional philosophical climax, magical girl transcendence, galaxy background"
    ],

    // RIN-ANIME-POPCUTE: Best for vibrant, energetic, cute, modern pop-style anime
    "rin-anime-popcute": [
        // MODERN IDOL & POP ICONS
        "Vibrant anime art, Anya Forger from Spy x Family, iconic 'heh' smug face, star pupils sparkling, peanuts floating in a colorful background, chibi Loid and Yor in the distance, adorable chaos, kawaii pop style, manga panel accents, bright pastel colors, high energy",
        "Vibrant anime art, Bocchi the Rock guitar solo, Hitori Gotoh in full glitch mode, abstract psychedelic rock music visualization, neon pink and cyan electric sparks, social anxiety turned into legendary rock god energy, chaotic cute, dynamic jagged lines",
        "Vibrant anime art, Ai Hoshino from Oshi no Ko, B-Komachi idol costume, star eyes maximum sparkle, concert stage with thousands of glowing lightsticks, tragic idol persona, bright pop aesthetic, love and lies theme, cinematic idol lighting, masterpiece",
        "Vibrant anime art, Marin Kitagawa My Dress-Up Darling cosplay pose, gyaru makeup perfection, colorful wigs and fabrics in background, energetic peace sign, Gojo blushing, romance comedy pop vibes, fashionista queen, clean lineart, bright colors",
        "Vibrant anime art, Chika Fujiwara Love is War, chaotic dance pose, pink hair bouncing, love detective magnifying glass, heart explosions in background, comedy queen energy, maximum kawaii chaos, festive atmosphere, pastel palette",
        "Vibrant anime art, Kaguya-sama 'O kawaii koto' smug pose, crescent moon hairpin, folding fan covering face, sparkle effects and red rose petals, tsundere elegance, romantic comedy royalty, beautiful and terrifying, sophisticated composition",

        // CLASSIC MAGICAL GIRLS
        "Vibrant anime art, Sailor Moon Eternal form, Silver Crystal shining with immense power, all sailor scouts silhouettes in a cosmic background, Moon Kingdom rising, 90s anime nostalgia with modern high-end polish, starry galaxy, magical girl supreme",
        "Vibrant anime art, Cardcaptor Sakura Star Card transformation, pink frilly dress with intricate wings, Star Wand raised high, Sakura Cards orbiting in a magical circle, Tomoyo filming, CLAMP style, petals and stars, magical girl masterpiece",
        "Vibrant anime art, Madoka Magica ultimate form Madokami, pink goddess ascending, magical girl silhouettes in the cosmic void, abstract ethereal background, hope and despair balance, beautiful and tragic, Shaft studio aesthetic, stellar light",
        "Vibrant anime art, Puella Magi Homura with time-shield, time stop aesthetic, purple and black diamond motifs, floating guns frozen in time, determination and love, rebellion movie style, cool beauty, sharp edges, dramatic lighting",

        // HIGH ENERGY ACTION
        "Vibrant anime art, Ryuko Matoi Kill la Kill, Senketsu synchronized transformation, scissor blade over shoulder, life fiber red accents swirling, dynamic speed lines, punk rock rebel energy, Trigger studio explosive style, bold outlines, high contrast",
        "Vibrant anime art, Megumin Konosuba, explosion pose with staff, Chomusuke sitting on hat, crimson demon clan eye patch, massive fiery explosion mushroom cloud background, chuunibyou maximum energy, comedy fantasy pop, vibrant red and orange",
        "Vibrant anime art, Aqua Konosuba useless goddess energy, party trick 'Nature's Beauty' pose, magical blue water fans, crying face, comedy perfection, fantasy pop aesthetic, bright blue palette, sparkling water effects",
        "Vibrant anime art, Zero Two Darling in the Franxx, red pilot suit, dinosaur horns, long pink hair flowing, sitting in Strelizia cockpit, 'Darling' catchphrase vibe, romantic mecha pop, honey and cherry blossom colors, futuristic UI",

        // GAMING & INTERNET CULTURE
        "Vibrant anime art, Shiro No Game No Life, rainbow hair galaxy brain mode, floating chess pieces and digital cards, neon purple and pink palette, Sora silhouette, genius NEET aesthetic, game world pop art, unbeatable aura, intricate detail",
        "Vibrant anime art, Emilia Re:Zero, silver half-elf beauty, Puck on her shoulder, swirling ice crystal magic, intricate white and purple gothic lolita dress, fantasy romance, isekai heroine perfection, soft magical glow",
        "Vibrant anime art, Ram and Rem Re:Zero twins mirror pose, pink and blue symmetry, detailed maid outfits, morning star and wind magic effects, devoted love, twin maid pop aesthetic, cute and deadly, vibrant color split",
        "Vibrant anime art, Nezuko Kamado chibi running through a forest, bamboo muzzle, demon form cute version, pink butterfly effects, Tanjiro chibi chasing in background, Demon Slayer kawaii interpretation, family love, soft cel shading",
        "Vibrant anime art, Ochako Uravity My Hero Academia, zero gravity pose floating, UA hero uniform, pink cheek blush, heroic determination, cute but powerful, shounen romance target, modern hero aesthetic, bubbles and floaty objects",

        // MODERN IDOL REVOLUTION
        "Vibrant anime art, Ruby Rose from RWBY, rose petal transformation, red hooded cape flowing, scythe Crescent Rose spinning, huntress determination, Remnant world adventure, energetic action girl, volume 1 nostalgia, stylized cel shading",
        "Vibrant anime art, Asuka Langley Soryu plugsuit pose, confident smirk, orange hair ponytails, Eva pilot attitude, German precision, tsundere energy maximum, mecha pilot diva, red interface headset, cinematic mecha cockpit lighting",
        "Vibrant anime art, Cattleya from Queen's Blade, amazon warrior pose, green hair flowing, massive sword raised, arena crowd cheering, tournament fighter, muscular beauty, fantasy battle royale, victory declaration, bold fantasy style",
        "Vibrant anime art, Boa Hancock, empress of Amazon Lily, snake hair accessories, Kuja pirate captain, One Piece empress beauty, Haki conqueror aura, love-sickness immunity, royal dignity, elegant posing, vibrant sky",

        // GAMING ANIME FUSION
        "Vibrant anime art, Kirito dual wielding in Aincrad, black swordsman coat flowing, Elucidator and Dark Repulser swords, Sword Art Online pioneer, nerve gear interface, virtual reality legend, solo player determination, blue digital particles",
        "Vibrant anime art, Yennefer of Vengerberg chaos energy swirling, violet eyes glowing, silver hair wild, Witcher 3 sorceress in anime style, magic portals opening, monster hunter elegance, powerful magic effects, dark amethyst palette",
        "Vibrant anime art, Tifa Lockhart final fantasy victory pose, leather suspenders, fists glowing with ki, Avalanche leader, Midgar cityscape skyline, bar hostess to revolutionary, strong female fighter, materia magic sparks",

        // POP CULTURE ICONS
        "Vibrant anime art, Momo Yaoyorozu My Hero Academia, creation quirk activation, utility belt materializing from skin, student council president, strategic genius, supportive heroine, class 1-A elegance, intricate creation effects",
        "Vibrant anime art, Tsuyu Asui frog girl hero, tongue extended, U.A. uniform with green goggles, Rainy Season Hero Froppy, rescue operations in water, stealth reconnaissance, amphibian abilities, cheerful determination, water ripples",
        "Vibrant anime art, Toru Hagakure invisible girl mystery, floating U.A. gloves and boots, invisible quirk effects, cheerful personality, supportive friend, class 1-A invisible menace, cute floating accessories",

        // ENERGETIC MAGICAL GIRLS
        "Vibrant anime art, Flame Haze Shana wielding Nietono no Shana, red hair burning with sparks, Rinne marks, Denizen destroyer, Shakugan no Shana crimson realm, flame of destruction, crimson god warrior, eternal flame, dramatic fire lighting"
    ]
    ,

    "crystal-cuteness": [
        "Masterpiece, premium quality art, 1girl as the princess of the crystal kingdom, hair adorned with sparkling iridescent gemstones, dress made of translucent shimmering silk, standing in a vast field of glass flowers, rainbow light reflections in every petal, ethereal lighting, kawaii and precious aesthetic, 8k resolution, shimmering atmosphere, intricate detail",
        "Masterpiece, premium quality art, small adorable chibi dragon made of opalescent crystalline shards, sitting protectively over a hoard of glowing magical gems, deep moonlit cave with sparkling air, large expressive eyes, heartwarming aura, vibrant crystalline textures, sharp focus",
        "Masterpiece, premium quality art, magical crystalline forest interior at twilight, trees with leaves like clear diamonds, tiny crystal fairy resting on a glowing neon mushroom, soft pastel pink and purple palette, iridescent wings fluttering, dreamlike and serene, ultra high quality illustration",
        "Masterpiece, premium quality art, cosmic crystal girl floating in a nebula of purple stardust, body reflecting distant galaxies, eyes like swirling nebulae, flowing hair made of liquid light and gems, cinematic space fantasy, sparkling and beautiful, vibrant cosmic colors, deep space depth",
        "Masterpiece, premium quality art, kawaii crystal animal companions: glass bunny and gemstone fox playing in a sparkling river, water splashing like liquid diamonds, sunbeams creating prisms through crystal trees, happy and whimsical, bright and clear art style, high contrast"
    ],

    // VERETOON-V10: Vibrant toon-style illustrations, clean outlines
    "veretoon-v10": [
        "Masterpiece, epic vibrant toon style, 1boy superhero in a dynamic mid-air action pose, bright red cape billowing with speed, futuristic toon metropolis background, flying vehicles, thick clean professional outlines, bold primary colors, 2D animation masterclass, determined expression, high energy action, cel shaded",
        "Masterpiece, epic vibrant toon style, colorful cartoon scene with a squad of animal explorers, courageous parrot captain and nerdy tortoise engineer, ancient jungle ruins, hidden golden treasures, playful slapstick aesthetic, crisp clean linework, vibrant and fun colors, expressive character design",
        "Masterpiece, epic vibrant toon style, futuristic toon city park at sunset, neon-lit digital trees, cool toon girl performing an impossible skateboard trick, fountain of blue soda, fish-eye lens perspective, dynamic and stylish, 2D pop-culture aesthetic, bright oranges and purples, motion blur",
        "Masterpiece, epic vibrant toon style, cozy interior of a vibrant magical workshop, potions bubbling in colorful glass jars, mischievous toon imp causing magical chaos, floating tools and sparking energy, highly expressive and detailed toon art, warm whimsical lighting",
        "Masterpiece, epic vibrant toon style, majestic landscape with a floating island and giant colorful waterfall, toon-style clouds with happy faces, brave adventurer looking at the horizon, vibrant lush greens and sapphire blues, clean and inviting animation style, high resolution"
    ]
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.status === 429) {
                const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
                console.warn(`   [Rate Limit] 429. Backing off for ${Math.round(waitTime / 1000)}s...`);
                await sleep(waitTime);
                continue;
            }
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res;
        } catch (e) {
            if (i === retries - 1) throw e;
            await sleep(1000 * (i + 1));
        }
    }
}

async function generateWithLoadBalancer(modelId, prompt) {
    const modelType = modelId.includes('zit') ? 'zit' : 'sdxl';

    // 1. Select endpoints
    const candidates = loadBalancer.selectEndpoints(modelType, {
        useTurbo: true, // For scale testing, prioritize performance
        jobComplexity: 0.6
    });

    if (candidates.length === 0) throw new Error(`No endpoints available for ${modelType}`);

    const body = {
        prompt,
        model: modelId,
        steps: 30,
        width: 1024,
        height: 1024
    };

    let resultBuffer = null;
    let lastError = null;

    // Try candidates in order
    for (const endpoint of candidates) {
        let startTime = null;
        try {
            if (loadBalancer.shouldThrottle(endpoint.key)) {
                console.warn(`   [LoadBalancer] ${endpoint.key} throttled, trying next...`);
                continue;
            }

            startTime = loadBalancer.recordJobStart(endpoint.key);
            console.log(`   [LoadBalancer] Using ${endpoint.key} for ${modelId}...`);

            // Poll for result
            const pollUrl = `${endpoint.url}`;

            const submitResponse = await fetchWithRetry(`${pollUrl}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const submitJson = await submitResponse.json();
            if (!submitJson.job_id) throw new Error(submitJson.detail || "No job_id");
            const jobId = submitJson.job_id;

            for (let poll = 0; poll < 90; poll++) {
                await sleep(2000);
                let resultRes = await fetch(`${pollUrl}/result/${jobId}`);
                if (resultRes.status === 404) resultRes = await fetch(`${pollUrl}/jobs/${jobId}`);

                if (resultRes.status === 202) continue;

                if (resultRes.ok) {
                    const ct = resultRes.headers.get("content-type") || "";
                    if (ct.includes("image/")) {
                        resultBuffer = Buffer.from(await resultRes.arrayBuffer());
                        loadBalancer.recordSuccess(endpoint.key, startTime);
                        return resultBuffer;
                    }
                }

                const errJson = await resultRes.json().catch(() => ({}));
                if (errJson.status === "failed") throw new Error(errJson.error || "Generation failed");
            }
            throw new Error("Timeout");

        } catch (err) {
            if (startTime) loadBalancer.recordFailure(endpoint.key, startTime, err);
            lastError = err;
            console.warn(`   [LoadBalancer] ${endpoint.key} failed: ${err.message}`);
        }
    }

    throw lastError || new Error("All endpoints failed");
}

async function processAndUpload(imageBuffer, modelId, index, prompt) {
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
    const thumbBuffer = await sharpImg.resize(512, 512, { fit: "inside" }).webp({ quality: 80 }).toBuffer();
    const lqipBuffer = await sharpImg.resize(20, 20, { fit: "inside" }).webp({ quality: 20 }).toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;

    const timestamp = Date.now();
    const baseKey = `showcase/${modelId}/${timestamp}_${index}`;
    const originalKey = `${baseKey}.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalKey, Body: webpBuffer, ContentType: "image/webp" })),
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" }))
    ]);

    const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalKey}`;
    const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbKey}`;

    const docData = {
        modelId,
        prompt,
        imageUrl,
        url: imageUrl,
        thumbnailUrl,
        lqip,
        createdAt: FieldValue.serverTimestamp(),
        userId: "system_anime_showcase_script",
        likesCount: Math.floor(Math.random() * 50) + 10,
        bookmarksCount: Math.floor(Math.random() * 10)
    };

    await db.collection("model_showcase_images").add(docData);
    return imageUrl;
}

async function main() {
    const models = Object.keys(PROMPTS_PER_MODEL);

    console.log("=== ELITE ANIME SHOWCASE GENERATOR ===");
    console.log(`Models: ${models.join(", ")}`);
    console.log(`Total Prompts: ${models.reduce((sum, m) => sum + PROMPTS_PER_MODEL[m].length, 0)}\n`);

    for (const modelId of models) {
        const prompts = PROMPTS_PER_MODEL[modelId];
        console.log(`\n========================================`);
        console.log(`MODEL: ${modelId.toUpperCase()} (${prompts.length} prompts)`);
        console.log(`========================================`);

        // Process in concurrent batches for scale testing
        for (let i = 0; i < prompts.length; i += CONCURRENCY) {
            const batch = prompts.slice(i, i + CONCURRENCY);
            console.log(`Processing batch ${Math.floor(i / CONCURRENCY) + 1} (${batch.length} items)...`);

            await Promise.all(batch.map(async (prompt, idx) => {
                const globalIdx = i + idx;
                try {
                    const imageBuffer = await generateWithDirectCall(modelId, prompt);
                    const url = await processAndUpload(imageBuffer, modelId, globalIdx, prompt);
                    console.log(`   [${globalIdx + 1}] ✓ ${url}`);
                } catch (err) {
                    console.error(`   [${globalIdx + 1}] ✗ ${err.message}`);
                }
            }));

            // [REMOVED] loadBalancer stats

            await sleep(2000);
        }
    }

    console.log("\n=== SHOWCASE COMPLETE ===");
}

main().catch(console.error);
