/**
 * Pokemon Female Characters Fanservice Showcase Generator
 * 
 * Generates elite showcase images featuring famous female Pokemon trainers,
 * gym leaders, champions, and anime characters in 
 * world-class ecchi, hentai & seductive art styles.
 * Fanservice focused on female characters only.
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ENDPOINT = 'https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run';
const DEFAULT_MODEL_ID = 'rin-anime-blend';

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

const MODEL_OVERRIDE = process.env.MODEL_OVERRIDE || DEFAULT_MODEL_ID;
const CONCURRENCY = 4;

// ========================================
// POKEMON FEMALE FANSERVICE PROMPTS - 50 Characters
// World-Class Erotic Art - Ecchi, Hentai & Seductive
// ========================================
const PROMPTS_PER_MODEL = {

    // ========================================
    // WAI ILLUSTRIOUS EROTIC - POKEMON FEMALE EDITION
    // ========================================
    "wai-illustrious-erotic": [
        // === MAIN SERIES PROTAGONISTS ===
        "rating_suggestive, 1girl, leaf pokemon trainer pinup, kanto champion bedroom, hat backwards, blue suspender skirt lifted, thigh highs, pokeball bra, charizard and venusaur sleeping outside, pallet town nostalgia, confident smirk, first generation beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, kris johto trainer pinup, silver hair pigtails, new bark town bedroom, totodile and chikorita plushies, pokemon center after hours, pink mini skirt, suspenders slipping, johto region aesthetic, 16 bit nostalgia, goldenrod city lights through window, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, may hoenn trainer pinup, bandana and fanny pack, littleroot town bedroom, torchic and mudkip sleeping, contest hall after victory, orange bandana top, bike shorts, secret base intimacy, delta episode aftermath, hoenn region tropical heat, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, dawn sinnoh trainer pinup, beret and scarf, twinleaf town bedroom, piplup and turtwig toys, contest ribbon scattered, pink dress lifted, mt cornet view, snowpoint city cold outside, warm blanket, generation 4 pixel nostalgia, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, hilda unova trainer pinup, ponytail and baseball cap, nuvema town bedroom, oshawott and snivy cushions, pokemon musical costumes, black tank top, denim shorts, team plasma aftermath, legendary dragon slumbering, unova region modern, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, rosa unova 2 trainer pinup, visor and double bun, aspertia city bedroom, tepig and dewott posters, pokestar studios after filming, pink short shorts, raglan shirt, world tournament victory, unova sequels romance, 2d animated style, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, serena kalos trainer pinup, mega ring and fashion, vaniville town bedroom, fennekin and froakie sleeping, trainer custom clothes scattered, red pleated skirt, thigh high boots, pokemon-amie affection, lysandre labs aftermath, kalos region beauty, french elegance, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, selene alola trainer pinup, tropical floral dress, hauoli city bedroom, rowlet and popplio plush, festival plaza at night, short shorts, loose tank top, ultra wormhole aftermath, alola region island heat, z-move pose energy, hawaiian aesthetic, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, gloria galar trainer pinup, beanie and tartan skirt, postwick bedroom, scorbunny and sobble socks, wyndon stadium after champion match, dynamax energy lingering, galar region industrial, league card on nightstand, british aesthetic, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, akari hisui trainer pinup, galaxy team uniform, jubilife village tent, cyndaquil and oshawott resting, alpha pokemon encounter adrenaline, traditional japanese undergarments, ancient sinnoh region, noble pokemon blessing, feudal japan aesthetic, masterpiece, best quality, very aesthetic",

        // === GYM LEADERS ===
        "rating_suggestive, 1girl, misty cerulean gym leader pinup, red suspenders, yellow crop top, side ponytail, starmie and psyduck, cerulean city gym pool, water type beauty, gym badge case, orange islands nostalgia, kasumi classic anime style, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, erika celadon gym leader pinup, elegant kimono slipping, vileplume and bellossom, perfume shop after hours, grass type mistress, japanese beauty, black hair traditional, celadon city greenhouse, incense smoke, mysterious smile, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, sabrina saffron gym leader pinup, psychic type mistress, elegant dress, spoon prop, alakazam and mr mime, gym leader conference room, mysterious aura, red eyes glowing, black hair straight, kanto region power, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, whitney goldenrod gym leader pinup, pink hair pigtails, normal type cutie, miltank and clefairy, goldenrod gym bedroom, pink tank top, shorts, roller skates nearby, johto region adorable, winking smile, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, clair blackthorn gym leader pinup, dragon type master, blue hair ponytail, skin tight blue outfit, cape flowing, dragonair and kingdra, blackthorn gym dragon's den, johto region elegant, mastery pose, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, flannery lavaridge gym leader pinup, red hair wild, fire type hothead, torkoal and slugma, volcanic hot spring, towel slipping, steam rising, hoenn region temperature, passionate expression, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, winona fortree gym leader pinup, flying type bird keeper, blue hair winged helmet, cloud dress flowing, altaria and swablu, fortree city treehouse, sky pillar view, hoenn region wild, bird master pose, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, skyla mistralton gym pilot pinup, blue hair tied up, pilot goggles, shorts and jacket, swanna and unfezant, mistralton airfield, cockpit intimacy, unova region skies, confident pilot pose, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, caitlin unova elite four pinup, long blonde hair flowing, psychic type noble, metagross and reuniclus, unova league castle bedroom, elegant nightgown, sleeping beauty aura, midnight castle atmosphere, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, korrina shalour city gym pinup, blonde hair ponytail, fighting type master, lucario and hawlucha, roller skates, shorts and tank top, tower of mastery, mega evolution aura, kalos region energy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, mallow akala island trial captain pinup, green hair flower, grass type cook, tsareena and shaymin, lush jungle background, chef apron over lingerie, alola region islander, cooking together intimacy, tropical heat, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, lana akala island trial captain pinup, blue hair short, water type diver, primarina and lapras, ocean diving intimacy, swimsuit, fishing gear, alola region tropical, beach sunset, wet hair, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, nessa hulbury gym leader pinup, dark skin beauty, water type model, drednaw and goldeen, gym stadium showers, long blue hair, athletic wear, championship match aftermath, galar region coast, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, bea stow-on-side gym pinup, blonde hair short, fighting type karateka, sirfetchd and machamp, training dojo after hours, gi partially open, sweat glistening, galar region hotblooded, muscular feminine, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, melony circhester gym leader pinup, mature ice type master, white hair elegant, lapras and frosmoth, ice cavern bedroom, winter coat slipping, age beauty, galar region cold, experienced seduction, masterpiece, best quality, very aesthetic",

        // === ELITE FOUR AND CHAMPIONS ===
        "rating_suggestive, 1girl, lorelei kanto elite four pinup, glasses and elegance, ice type specialist, lapras and cloyster, indigo plateau bedroom, business suit slipping, red hair glasses, sophisticated beauty, champion room intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, phoebe hoenn elite four pinup, ghost type shrine maiden, purple hair short, dusknoir and sableye, mt pyre view, traditional dress flowing, mysterious spiritual beauty, hoenn region mystical, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, cynthia sinnoh champion pinup, blonde hair flowing, black and gold dress, garchomp and spiritomb, celestial town bedroom, champion aura, mature elegance, black coat, sinnoh region ultimate, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, cynthia beach pinup, blonde hair wet, swimsuit, garchomp surfboard, sinnoh region tropical vacation, mature beauty, sunglasses, beach towel, summer heat, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, iris unova champion pinup, purple hair long, dragon type master, haxorus and hydreigon, unova league throne, young beauty, traditional dress, white cape, dragon dance pose, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, diantha kalos champion pinup, blonde hair elegant, gardevoir and goodra, kalos region actress, red carpet gown slipping, celebrity beauty, lysandre labs aftermath, flamboyant elegance, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, sonia galar professor assistant pinup, orange hair wavy, yamper and charizard, wyndon bedroom, research assistant outfit, scarf and coat, galar region fame, british elegance, laboratory after hours, masterpiece, best quality, very aesthetic",

        // === TEAM VILLAINS ===
        "rating_suggestive, 1girl, jessie team rocket pinup, red hair long, arbok and wobbuffet, team rocket uniform modified, criminal seduction, pokemon center heist aftermath, classic anime villain, jessie pose, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, shelly team aqua pinup, blue hair short, pirate captain style, kyogre awakening aftermath, team aqua uniform wet, lilycove city hideout, ocean beauty, water type extremist, passionate villain, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, courtney team magma pinup, red hood, fire type scientist, groudon awakening, team magma uniform, mt chimney base, volcanic heat, mask slipping, mysterious beauty, villain passion, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, mars team galactic pinup, red hair short, space obsession, dialga and palkia, team galactic uniform, veilstone city building, devoted admin, sinnoh region cosmos, villain worship pose, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, jupiter team galactic pinup, purple hair short, commandress style, skuntank and toxicroak, team galactic executive, cold and calculating, sinnoh region villain, uniform tight, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, anthea team plasma pinup, pink hair long, goddess of love, zekrom and reshiram, n castle throne room, team plasma uniform flowing, unova region liberation, muse beauty, white cape, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, concordia team plasma pinup, blonde hair long, goddess of harmony, n castle peaceful, team plasma white dress, unova region serenity, divine beauty, calming aura, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, malva team flare pinup, red hair wild, fire type elite four, yveltal and talonflame, lysandre labs, team flare uniform, destruction beauty, kalos region extremist, passionate reporter, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, plumeria team skull pinup, pink hair long, poison type admin, golisopod and salazzle, shady house po town, team skull uniform, punk goth beauty, alola region outcast, bad girl aesthetic, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, lusamine aether foundation pinup, blonde hair elegant, motherly beauty, lillie and gladion mother, nihilego and pheromosa, aether paradise bedroom, ultra beast research, alola region tragedy, mature elegance, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, lusamine ultra beast fusion pinup, blonde hair glowing, symbiont beauty, ultra space aura, aether president, mature seduction, legendary energy, alola region cosmic, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, oleana macro cosmos pinup, red hair professional, secretary elegance, copperajah and garbodor, rose tower penthouse, business suit tight, galar region industry, wealthy executive, chairman secretary, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, marnie galar gym leader pinup, black hair short, dark type idol, morpeko and obstagoon, spikemuth bedroom, punk aesthetic, team yell cheering, galar region goth, cute and dark, masterpiece, best quality, very aesthetic",

        // === ANIME AND SPECIAL CHARACTERS ===
        "rating_suggestive, 1girl, serena xy anime pinup, brown hair long, blue ribbon, braixen and pancham, kalos region performer, showcase costume, performer outfit, dance pose, amourshipping beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, dawn anime contest pinup, blue hair long, pink dress contest, piplup and buneary, sinnoh region coordinator, twin tails, contest appeal pose, pearlshipping beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, may anime contest pinup, brown hair bandana, torchic and beautifly, hoenn region coordinator, orange and green outfit, contest ribbon pose, advanceshipping beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, misty anime pinup, orange hair side pony, togepi and psyduck, cerulean gym swimsuit, orange islands bikini, water pokemon training, kasumi classic beauty, pokeshipping nostalgia, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, lillie alola anime pinup, blonde hair long, white dress flowing, snowy and clefairy, aether foundation escape, alola region gentle, lusamine daughter, nebby cosmog, sun and moon beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, lillie z-powered form pinup, blonde hair z-crystal glow, sporty outfit, battle ready, alola region champion potential, z-move pose, pokemon school uniform modified, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, mallow anime pinup, green hair flower, tsareena and shaymin, aina kitchen cook, tropical dress, alola region sweet, trial captain beauty, cooking apron, sweetshipping aesthetic, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, lana anime pinup, blue hair short, primarina and sandy, ocean lover, swimsuit and fishing rod, alola region diver, captain mermaid, blue shipping beauty, wet hair, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, chloe pokemon journeys pinup, black hair short, eevee and yamper, sakuragi institute, researcher outfit, project mew, kanto region modern, goh friend, new series beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, zinnia lorekeeper pinup, black hair short, red cloak flowing, rayquaza and mega rayquaza, sky pillar summit, delta episode crisis, hoenn region ancient, lorekeeper beauty, dragon whisperer, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, zinnia casual pinup, black hair messy, ancient sinnoh descendant, asteroid town, space center visit, brendan rival, hoenn region wild, tomboy beauty, masterpiece, best quality, very aesthetic",
    ]
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generateWithSDXL(prompt) {
    console.log(`   [SDXL] Submitting: ${prompt.substring(0, 50)}...`);

    const body = {
        prompt,
        model: DEFAULT_MODEL_ID,
        steps: 30,
        width: 1024,
        height: 1024
    };

    const res = await fetch(`${ENDPOINT}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Modal Submission Failed: ${res.status}`);
    const { job_id } = await res.json();

    // Poll for result
    for (let poll = 0; poll < 120; poll++) {
        await sleep(4000);
        let resultRes = await fetch(`${ENDPOINT}/result/${job_id}`);
        if (resultRes.status === 404) resultRes = await fetch(`${ENDPOINT}/jobs/${job_id}`);

        if (resultRes.status === 202) {
            process.stdout.write(".");
            continue;
        }

        if (resultRes.ok) {
            const ct = resultRes.headers.get("content-type") || "";
            if (ct.includes("image/")) {
                console.log("\n   [SDXL] ✓ Received Image Buffer");
                return Buffer.from(await resultRes.arrayBuffer());
            } else if (ct.includes("application/json")) {
                const statusJson = await resultRes.json();
                if (['generating', 'queued', 'processing'].includes(statusJson.status)) {
                    process.stdout.write(".");
                    continue;
                }
                if (statusJson.status === 'failed') {
                    throw new Error(`Generation failed: ${statusJson.error || 'Unknown error'}`);
                }
            }
        }

        if (resultRes.status !== 202) {
            const err = await resultRes.json().catch(() => ({}));
            throw new Error(`Polling failed: ${JSON.stringify(err)}`);
        }
    }
    throw new Error("Generation timed out after 8 minutes");
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
        userId: "system_pokemon_fanservice_script",
        likesCount: Math.floor(Math.random() * 50) + 10,
        bookmarksCount: Math.floor(Math.random() * 10)
    };

    await db.collection("model_showcase_images").add(docData);
    return imageUrl;
}

async function main() {
    const models = MODEL_OVERRIDE ? [MODEL_OVERRIDE] : Object.keys(PROMPTS_PER_MODEL);

    console.log("=== POKEMON FEMALE CHARACTERS FANSERVICE SHOWCASE ===");
    console.log("Famous Pokemon Female Trainers - Ecchi, Hentai & Seductive");
    console.log(`Models: ${models.join(", ")}`);
    if (MODEL_OVERRIDE) {
        console.log(`[OVERRIDE] Running ALL prompts on model: ${MODEL_OVERRIDE}`);
    }
    const totalPrompts = MODEL_OVERRIDE ?
        Object.values(PROMPTS_PER_MODEL).reduce((sum, p) => sum + p.length, 0) :
        models.reduce((sum, m) => sum + PROMPTS_PER_MODEL[m].length, 0);
    console.log(`Total Prompts: ${totalPrompts}\n`);

    for (const modelId of models) {
        const prompts = MODEL_OVERRIDE ?
            Object.values(PROMPTS_PER_MODEL).flat() :
            PROMPTS_PER_MODEL[modelId];
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
                    const imageBuffer = await generateWithSDXL(prompt);
                    const url = await processAndUpload(imageBuffer, modelId, globalIdx, prompt);
                    console.log(`   [${globalIdx + 1}] ✓ ${url}`);
                } catch (err) {
                    console.error(`   [${globalIdx + 1}] ✗ ${err.message}`);
                }
            }));

            await sleep(2000);
        }
    }

    console.log("\n=== POKEMON FANSERVICE SHOWCASE COMPLETE ===");
    console.log("All female character showcases generated and uploaded!");
}

main().catch(console.error);
