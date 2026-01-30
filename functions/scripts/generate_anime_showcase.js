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
const CONCURRENCY = 4; // Standard SDXL concurrency

// ========================================
// ELITE ANIME PROMPTS - Ultra High Quality
// ========================================
const PROMPTS_PER_MODEL = {

    // ========================================
    // WORLD-CLASS EROTIC ART - ECCHI, HENTAI & SEDUCTIVE
    // ========================================
    "wai-illustrious-erotic": [
        // ARTISTIC ECCHI - SENSUAL ATMOSPHERE
        "rating_suggestive, 1girl, seductive elf maiden in an enchanted hot spring, steam rising around delicate porcelain skin, wet silver hair cascading down bare shoulders, luminous violet eyes with inviting gaze, soft candlelight reflections on water surface, traditional Japanese onsen architecture, cherry blossoms floating in mist, artistic nudity, high fantasy romance atmosphere, Kyoto Animation softness, romantic lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, beautiful demoness succubus reclining on velvet cushions in a gothic boudoir, crimson eyes glowing with desire, curved horns and flowing black hair, sheer lace lingerie barely concealing, moonlight streaming through stained glass windows, rich burgundy and gold color palette, mature feminine curves, sensual elegance, dark fantasy seduction, atmospheric depth, intricate fabric details, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, alluring kitsune spirit with nine glowing tails, traditional shrine maiden outfit partially open, porcelain skin with mystical markings, golden eyes with vertical pupils, soft sakura petals dancing in evening breeze, torii gate at sunset background, ethereal seduction, yokai romance aesthetic, soft focus background, magical atmosphere, artistic partial nudity, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, mermaid siren on moonlit ocean rocks, bioluminescent scales shimmering on bare skin, flowing aquamarine hair covering strategic areas, hypnotic gaze beckoning sailors, starry night sky reflection on calm waters, romantic tragedy atmosphere, fantasy pin-up elegance, soft blue and silver palette, mystical aquatic beauty, detailed water droplets on skin, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, shy shrine maiden caught in rain, wet white hakama becoming translucent, blushing cheeks and downcast eyes, traditional Japanese temple courtyard, rain droplets on flawless skin, innocent seduction, soft overcast lighting, emotional vulnerability, accidental beauty, delicate fabric cling, artistic atmospheric shot, masterpiece, best quality, very aesthetic",

        // SOPHISTICATED HENTAI AESTHETIC
        "rating_suggestive, 1girl, elegant noblewoman in Victorian lingerie in her private chambers, corset partially unlaced revealing soft curves, flushed expression in vanity mirror reflection, baroque bedroom with candlelight, rich fabrics and antique furniture, romantic historical erotica, soft skin shading, intimate atmosphere, classical beauty, warm amber lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, cyberpunk android girl with synthetic skin panels exposed, neon circuit patterns glowing beneath translucent sections, seductive mechanical elegance, rain-soaked cyber city rooftop, holographic advertisements reflecting on wet chrome body, sci-fi eroticism, detailed mechanical joints mixed with organic curves, violet and cyan neon palette, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, bewitching sorceress performing midnight ritual, arcane symbols glowing on bare skin, floating candles illuminating voluptuous silhouette, ancient grimoire open before her, dark magic swirling as sheer fabric, mystical erotica, gothic fantasy atmosphere, dramatic chiaroscuro lighting, occult sensuality, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, innocent countryside girl bathing in forest stream, dappled sunlight through leaves on bare skin, startled deer in background, pastoral romanticism, soft natural beauty, accidental voyeur aesthetic, Rococo painting influence, golden afternoon light, water ripples and reflections, delicate nudity, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, confident dominatrix queen on obsidian throne, leather and lace ensemble, powerful feminine presence, submissive courtiers at her feet, grand gothic ballroom, candlelight and shadows, BDSM elegance, commanding gaze, rich purple and black palette, architectural grandeur, assertive sensuality, masterpiece, best quality, very aesthetic",

        // SEDUCTIVE PORTRAITURE
        "rating_suggestive, 1girl, intimate bedroom scene with beautiful girl just awakened, sleep-tousled hair and dreamy expression, silk sheets slipping from bare shoulders, morning light through sheer curtains, warm skin tones, peaceful sensuality, slice of life intimacy, soft atmospheric haze, romantic domesticity, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, femme fatale spy in noir-inspired scene, smoky jazz club atmosphere, red dress with high slit, confident smoldering gaze, saxophone player silhouette, film noir lighting with venetian blind shadows, sophisticated seduction, vintage Hollywood glamour, dramatic contrast, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, shy bookworm librarian girl reaching for high shelf, glasses sliding down nose, cardigan slipping off shoulder revealing camisole strap, stacked books creating intimate space, warm library afternoon light, accidental allure, intellectual beauty, cozy sensuality, soft focus background, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, athletic fitness model post-workout glow, sports bra and shorts, glistening sweat on toned physique, gym mirror selfie pose, confident empowered expression, health and vitality erotica, dynamic lighting, motivational aesthetic, strong feminine beauty, modern fitness culture, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, enchanting belly dancer performing in desert tent, coins catching lantern light, midriff bare and undulating, mysterious veiled gaze, rich textiles and cushions, Arabian Nights fantasy, hypnotic movement frozen in time, warm sunset colors, exotic sensuality, detailed jewelry and henna, masterpiece, best quality, very aesthetic",

        // FANTASY EROTIC ART
        "rating_suggestive, 1girl, angel fallen from grace, torn white dress revealing celestial markings on skin, broken halo, weeping in moonlit cathedral ruins, tragic beauty, religious ecstasy aesthetic, dramatic divine lighting, sorrowful seduction, baroque drama, spiritual eroticism, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, ancient Egyptian priestess in golden chambers, sheer linen gown, kohl-lined eyes with knowing gaze, lotus flower offerings, hieroglyphic walls telling stories of love, warm desert light, historical erotica, regal sensuality, detailed gold jewelry, Nile blue accents, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, vampire countess emerging from velvet-lined coffin, fangs glinting, blood-red lips, antique nightgown slipping from pale shoulder, gothic castle interior, eternal youth beauty, supernatural allure, candlelit intimacy, immortal seduction, dark romanticism, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, forest nymph among glowing mushrooms, nature spirit unclothed and unashamed, bioluminescent body paint, ancient oak tree sanctuary, magical twilight atmosphere, pagan beauty, organic sensuality, fantasy naturalism, soft green and gold lighting, mystical creature, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, steamy bathhouse attendant in Edo-period Japan, tenugui towel artfully placed, steam obscuring and revealing, traditional wooden interior, intimate service aesthetic, ukiyo-e influence, delicate beauty, historical Japan erotica, shunga art homage, warm humid atmosphere, masterpiece, best quality, very aesthetic",

        // MODERN SEDUCTION
        "rating_suggestive, 1girl, glamorous idol singer backstage dressing room, sequined costume half-removed, vanity mirror ring lights, paparazzi flashes visible through window, celebrity vulnerability, showbiz erotica, modern entertainment industry, dramatic spotlighting, aspirational beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, secluded beach sunset with figure silhouetted against golden horizon, sheer sarong blowing in wind, tropical paradise romance, skin kissed by sun, freedom and liberation aesthetic, travel poster sensuality, warm orange and pink sky, natural beauty unadorned, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, sophisticated sommelier in wine cellar, dress bodice unbuttoned from heat, holding crystal glass, oak barrels and vintage bottles, intimate tasting atmosphere, mature elegance, sensual connoisseurship, rich burgundy palette, candlelit intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, lonely housewife at rainy window, silk robe loosely tied, coffee steam and breath fogging glass, suburban longing, emotional erotica, Edward Hopper influence, melancholic beauty, soft grey lighting, intimate solitude, longing gaze, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, artist's muse posing in sunlit studio, draped in translucent fabric, painter's easel and palette visible, creative intimacy, classical art reference, bohemian romance, golden hour studio light, artistic collaboration, inspired beauty, masterpiece, best quality, very aesthetic",

        // YURI / GIRLS LOVE SENSUAL
        "rating_suggestive, 2girls, intimate moment between two schoolgirls in empty classroom after hours, shared secret, blushing proximity, afternoon light through windows, innocent exploration, romantic tension, yuri aesthetic, emotional intimacy, soft focus, coming of age tenderness, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2girls, elegant ladies sharing a private moment in Victorian boudoir, corsets and flowing hair, whispered confidences, romantic friendship aesthetic, historical yuri, soft pastel palette, intimate feminine space, period detail, emotional closeness, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, athletic women's volleyball team locker room camaraderie, post-game showers and laughter, healthy female bonding, sports anime sensuality, team intimacy, dynamic poses, steam and tile, celebration of feminine strength, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, mystical priestesses performing sacred union ritual, glowing spiritual connection, flowing ceremonial robes, ancient temple setting, spiritual erotica, divine feminine energy, transcendent beauty, golden ethereal lighting, sacred intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2girls, cozy winter cabin with two women sharing body warmth under furs, fireplace glow, intimate conversation, domestic bliss, romantic slice of life, soft warm lighting, emotional security, tender closeness, hygge aesthetic, masterpiece, best quality, very aesthetic",

        // PIN-UP & GLAMOUR
        "rating_suggestive, 1girl, retro 1950s pin-up girl with victory rolls hairstyle, polka dot dress blowing up Marilyn-style, playful wink, vintage car in background, Americana nostalgia, classic cheesecake aesthetic, vibrant saturated colors, flirtatious energy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, calendar girl for fantasy months, each season represented in costume and setting, pin-up art series concept, playful personality, seasonal color palettes, commercial art beauty, collectible aesthetic, variety of moods and themes, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, mechanic girl with grease smudge on cheek, overalls unbuckled, classic car engine background, pin-up with profession, empowered working woman, industrial aesthetic, confident smirk, tool belt accessory, retro-modern fusion, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, sailor girl on shore leave, nautical theme, anchor tattoos, navy uniform stylized, ocean sunset behind, maritime romance, classic tattoo art influence, navy blue and red palette, playful seaside energy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, cowgirl on ranch fence at golden hour, boots and denim, wide open sky, western romance, frontier freedom, Americana beauty, warm earth tones, confident pose, pastoral seduction, big country atmosphere, masterpiece, best quality, very aesthetic",

        // DARK EROTIC FANTASY
        "rating_suggestive, 1girl, imprisoned princess in dark tower, chains as aesthetic accessory, defiant gaze, moonlight through barred window, gothic romance, beauty in captivity, dramatic shadows, emotional strength, tragic allure, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, corrupted magical girl transformation, dark energy enveloping figure, torn costume, pain and ecstasy expression, fallen heroine aesthetic, dramatic magical effects, tragic beauty, dark purple and black palette, transformation sequence, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, yandere lover in blood-splattered wedding dress, crazed beautiful smile, knife hidden behind back, rose petals and carnage, obsessive love, horror erotica, dramatic crimson lighting, beautiful nightmare, dangerous attraction, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, ghostly yuurei woman in abandoned love hotel, translucent form revealing skeletal hints, tragic romantic death, horror beauty, supernatural longing, ethereal blue lighting, melancholic eroticism, Japanese horror aesthetic, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, post-apocalyptic warrior queen in ruined luxury hotel, battle-worn armor partially removed, victorious and exhausted, sunset through broken windows, strength and vulnerability, Mad Max feminine beauty, dust and gold light, powerful presence, masterpiece, best quality, very aesthetic",

        // COSPLAY & ROLEPLAY
        "rating_suggestive, 1girl, bunny girl waitress in exclusive club, fishnet stockings and tail, serving tray with champagne, VIP lounge atmosphere, Playboy aesthetic, sophisticated adult entertainment, soft mood lighting, service industry glamour, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, neko maid in luxurious bedroom service, frilly uniform with cat ears and tail, loyal devotion expression, four-poster bed and velvet drapes, pet play aesthetic, domestic servitude fantasy, warm intimate lighting, devoted beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, magical girl in damaged costume, battle aftermath, torn tights and ripped skirt, heroic exhaustion, wounded warrior beauty, determination in eyes, shoujo action erotica, dynamic pose, sparkles and destruction, resilient sensuality, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, casino dealer in revealing evening wear, cards and chips arranged artfully, high roller atmosphere, smoky sophisticated lounge, risk and seduction, Vegas glamour, red and gold palette, confident professional beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, flight attendant in vintage airline uniform, scarf flowing, friendly professional smile, luxury jet cabin, travel romance, golden age of flight nostalgia, blue sky visible through windows, service industry elegance, masterpiece, best quality, very aesthetic"
    ],

    "rin-anime-blend": [
        "rating_safe, 1girl, elegant kimono-clad geisha girl with cherry blossom hair accessory, serene beauty, delicate porcelain skin, traditional Japanese onsen atmosphere, warm candlelit interior, traditional ink brush and paper, graceful pose, ethereal serenity, masterpiece, best quality, very aesthetic",
        "rating_safe, 1girl, cyberpunk android girl with smooth skin texture, seamless synthetic makeup, vibrant neon lighting, holographic advertising screens, mechanical limbs and circuits, digital skin texture, steampunk aesthetic, futuristic elegance, robotic sensuality, masterpiece, best quality, very aesthetic",
        "rating_safe, 1girl, priestess maiden in shrine at sunset, glowing lanterns, mystical forest background, ethereal atmosphere, masterpiece, best quality, very aesthetic",
        "rating_safe, 1girl, idol singer performing on stage, vibrant sparkles, cheering crowd silhouettes, electric energy, masterpiece, best quality, very aesthetic",
        "rating_safe, 1girl, magical girl flying through starry night sky, celestial trail, moon background, dress billowing, masterpiece, best quality, very aesthetic"
    ],

    // ========================================
    // ADVANCED EROTIC ART COLLECTION - BATCH 2
    // ========================================
    "wai-illustrious-erotic-v2": [
        // MYTHOLOGICAL SEDUCTION
        "rating_suggestive, 1girl, Aphrodite rising from sea foam on scallop shell, golden hair dripping pearls, divine nudity censored by flowing hair and cherubs, Botticelli anime homage, classical beauty, Renaissance composition, sacred eroticism, azure Mediterranean waters, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Japanese goddess Amaterasu emerging from celestial cave, radiant light illuminating divine curves, sacred Shinto elements, heavenly nudity veiled by sun rays, creation myth beauty, divine feminine power, golden divine aura, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Hindu goddess Parvati in Himalayan meditation, lotus position, silk sari slipping from shoulder, third eye glowing, spiritual eroticism, sacred mountain backdrop, divine tranquility, tantric aesthetic, warm saffron and gold, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Norse valkyrie selecting fallen warriors, winged helmet and minimal armor, battlefield moonlight, divine warrior beauty, mythological afterlife, powerful and sensual, cold silver and blue palette, epic Norse atmosphere, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Egyptian goddess Isis performing resurrection ritual, ankh symbols glowing on bare skin, hieroglyphic spells floating, magical wings extended, divine mother sexuality, ancient temple interior, mystical green and gold, masterpiece, best quality, very aesthetic",

        // STEAMPUNK EROTICA
        "rating_suggestive, 1girl, steampunk inventor in brass corset and leather straps, grease smudges on porcelain skin, workshop filled with steam and gears, Victorian industrial aesthetic, empowered female engineer, copper and bronze palette, mechanical intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, clockwork courtesan with visible mechanical joints, golden gears beneath translucent synthetic skin, automatons ball backdrop, artificial yet sensual, retro-futuristic seduction, Art Nouveau influences, warm amber lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, airship pirate captain on observation deck, leather coat open in wind, cloud sea sunset, aerial freedom sensuality, goggles on forehead, adventure romance, dieselpunk aesthetic, dramatic sky colors, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, steam bath attendant in underground Victorian spa, brass pipes and riveted walls, therapeutic nudity, industrial wellness aesthetic, soot and steam on flushed skin, working class erotica, warm copper tones, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, gearheart android with exposed clockwork heart, winding key on back, porcelain doll face with human eyes, mechanical intimacy, steampunk Pinocchio, brass and lace combination, melancholic beauty, masterpiece, best quality, very aesthetic",

        // AQUATIC FANTASIES
        "rating_suggestive, 1girl, jellyfish princess floating in bioluminescent abyss, translucent gown flowing like tentacles, ethereal glowing skin, deep ocean mystery, phosphorescent sea creatures surrounding, alien beauty, dark blue and cyan palette, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, pearl diver girl emerging from tropical lagoon, water streaming down sun-kissed skin, traditional ama diving aesthetic, island paradise backdrop, aquatic labor sensuality, documentary realism, turquoise waters, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, shipwreck survivor on deserted beach, torn clothing barely covering, sunset survival beauty, Robinson Crusoe feminine, tropical isolation, nature reclaiming, golden hour desperation and hope, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, underwater city mermaid in crystalline palace, coral crown and kelp garments, fish companions, submerged eroticism, breathing bubble magic, aquatic utopia, blue-green ethereal lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, competitive swimmer in Olympic pool, water droplets on athletic form, starting block anticipation, sports documentary aesthetic, chlorinated intimacy, underwater viewing, dynamic aquatic motion, masterpiece, best quality, very aesthetic",

        // GOTHIC EROTIC POETRY
        "rating_suggestive, 2girls, vampire bride in blood-moon honeymoon, wedding dress stained crimson, eternal night castle, macabre romance, undead bridal beauty, gothic architecture, tragic eternal love, deep red and black, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2girls, plague doctor's secret patient, leather beak mask removed, intimate examination, dark Renaissance medical, candlelit apothecary, forbidden healing touch, historical horror romance, warm candle amber, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, ouija board spirit emerging from planchette, ectoplasm forming feminine curves, Victorian séance parlor, spiritualist erotica, ghostly translucence, ectoplasmic nudity, supernatural seduction, purple and green spirit lights, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, living doll in abandoned toy shop, porcelain skin with hairline cracks, vintage dress, uncanny valley beauty, childhood nostalgia twisted, haunting sensuality, moonlight through dusty windows, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2girls, Carmilla-esque lesbian vampire seducing innocent maiden, canopy bed drapery, Gothic manor bedroom, Sapphic horror romance, predatory elegance, storm outside windows, romantic terror, masterpiece, best quality, very aesthetic",

        // CYBERPUNK SENSUALITY
        "rating_suggestive, 1girl, netrunner in neural interface bath, cables connecting to spinal ports, liquid cooling tank, trance state beauty, transhuman intimacy, neon-lit server room, digital transcendence, blue and purple cyber glow, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, synthetic pop idol on holographic stage, costume dissolving into light pixels, virtual fan service, digital eroticism, cyber celebrity culture, projected desires, pink and cyan holographic effects, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, augmented street mercenary in rain-soaked alley, tactical gear partially removed showing cybernetic implants, neon sign reflections on wet skin, blade runner aesthetic, urban survival sensuality, high contrast noir, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, gene-modified geisha in neo-Tokyo tea house, bioluminescent tattoos shifting patterns, traditional meets transhuman, bio-enhanced beauty, cultural evolution, warm interior neon accents, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, AI companion in virtual reality honeymoon suite, customizable perfection, simulated intimacy, digital paradise, user-customized beauty, infinite possibility romance, soft focus digital haze, masterpiece, best quality, very aesthetic",

        // FAIRY TALE EROTICA
        "rating_suggestive, 1girl, Little Red Riding Hood meeting wolf in dark forest, cloak open, predatory tension, fairy tale psychological, coming of age symbolism, Brothers Grimm darkness, moonlit woodland, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Sleeping Beauty awakening with true love's kiss, bed chamber intimacy, roses and thorns, medieval romance, enchanted slumber ending, golden Renaissance aesthetic, soft morning light, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Rapunzel letting down golden hair from tower window, imprisoned beauty, rescue romance, long hair as erotic symbol, medieval isolation, fairy tale longing, sunset castle backdrop, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Beauty taming the Beast in rose garden, torn ball gown, monster romance, transformation metaphor, enchanted castle grounds, gothic fairy tale, twilight magic hour, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Snow White among seven admirers, glass coffin awakening, apple red lips, forest cottage intimacy, fairytale polyamory, Disney dark reimagining, woodland fantasy, masterpiece, best quality, very aesthetic",

        // CULINARY EROTICISM
        "rating_suggestive, 1girl, chocolatier in artisan kitchen, melted chocolate on bare skin, aprons and confections, food porn aesthetic, sensual gastronomy, warm cocoa browns and gold, culinary artistry, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, sushi chef apprentice practicing with sticky rice, traditional uniform, Japanese culinary discipline, food preparation intimacy, kitchen heat, steam and precision, professional dedication, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, wine harvest in Italian vineyard, grape-stained feet and dress, crushing ceremony participation, agricultural sensuality, Tuscan golden hour, pastoral abundance, Mediterranean warmth, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, bakery opening before dawn, flour-dusted skin, warm croissants, intimate workspace, culinary creation passion, oven glow lighting, domestic artistry, yeast and sugar atmosphere, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, competitive eating champion backstage, bloat and satisfaction, food as pleasure, primal indulgence, festival atmosphere, cultural celebration, warm competitive energy, masterpiece, best quality, very aesthetic",

        // ATHLETIC INTIMACY
        "rating_suggestive, 1girl, ballerina backstage tying pointe shoes, leotard and tights, sweat and dedication, performing arts erotica, stage lights through curtains, disciplined beauty, rose petal scattered floor, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, rock climber at cliff edge, harness and chalk, athletic muscle definition, outdoor adventure sensuality, nature conquest, adrenaline and intimacy, dramatic landscape backdrop, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, ice skater costume change between performances, cold breath visible, sequins and Lycra, winter sports intimacy, rinkside atmosphere, frosted beauty, competitive grace, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, yoga instructor in advanced pose, sweat on serene face, spiritual physical union, studio morning light, mindfulness sensuality, flexible beauty, peaceful intensity, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, fencer removing mask after tournament, flushed cheeks, protective gear partially removed, swordsmanship elegance, competitive relief, aristocratic sport aesthetic, metallic and white, masterpiece, best quality, very aesthetic",

        // SPACE OPERA ROMANCE
        "rating_suggestive, 1girl, space princess in cryogenic preservation pod, frost on bare skin, suspended animation beauty, sci-fi Sleeping Beauty, starship medical bay, futuristic clinical erotica, blue cryo lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, alien siren on ammonia beach of distant moon, bioluminescent anatomy exotic, cosmic horror beauty, Lovecraftian elegance, otherworldly colors, atmospheric strangeness, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2girls, zero gravity dance in orbital station, hair floating freely, space suit discarded, weightless intimacy, Earth view through windows, astronaut romance, sci-fi weightlessness, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, terraforming colonist in biodome greenhouse, sweat and soil, new world pioneer sensuality, hydroponic growth, survival beauty, artificial sunset, hopeful frontier erotica, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, interstellar diplomat in first contact ritual, ceremonial nudity, alien negotiation, cultural exchange intimacy, diplomatic quarters, science fiction anthropology, warm neutral tones, masterpiece, best quality, very aesthetic"
    ],

    // ========================================
    // FAIRY TALE EROTICA & FANTASY COLLECTION - BATCH 3
    // ========================================
    "wai-illustrious-erotic-v3": [
        // EXTENDED FAIRY TALE EROTICA - CLASSIC TALES REIMAGINED
        "rating_suggestive, 1girl, Cinderella at midnight, glass slipper falling from delicate foot, torn ball gown revealing corset and stockings, pumpkin coach in background dissolving into magic, desperate escape with prince chasing, romantic tension, Disney dark reimagining, moonlit castle steps, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Thumbelina in giant flower bed, miniature nude figure cradled by tulip petals, dewdrops glistening on porcelain skin, fairy tale scale difference, garden of Eden innocence, magical morning light, whimsical erotica, oversized nature, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Little Mermaid on her wedding night, human legs transformed, Prince Eric sleeping beside her, ocean visible through window, painful sacrifice beauty, Hans Christian Andersen tragedy, moonlit bridal chamber, sea foam foreshadowing, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Alice in Wonderland growing giant in cramped rabbit hole, torn blue dress, playing cards scattering, curiouser and curiouser expression, Victorian childhood innocence corrupted, surreal proportions, psychedelic tunnel background, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Bluebeard's final wife discovering forbidden room, key dripping blood, bridal gown soiled, candlelit horror, curiosity and consequence, gothic fairy tale, mysterious husband's secret, dramatic revelation scene, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Princess and the Pea in towering mattress pile, nightgown disheveled from sleepless tossing, sensual discomfort, royal test of sensitivity, Scandinavian folklore, cozy castle bedroom, blankets and sheets in disarray, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Red Shoes dancer unable to stop, torn dancing slippers, exhausted but beautiful pirouette, obsessive passion, Andersen morality tale, midnight ballroom, eternal dance punishment, flushed exertion, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Snow Queen's ice palace, Kai trapped frozen, Gerda warming him with body heat, Scandinavian fairy tale, crystalline beauty, eternal winter sensuality, mirror shard metaphors, blue and white palette, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Wild Swans princess weaving nettles into shirts, torn bloody fingers, swan brothers circling, mute suffering beauty, Andersen sacrifice, marshland setting, determined expression through pain, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Emperor's New Clothes parade, weavers' invisible fabric, confident nude strut, crowd pretending to admire, societal conformity erotica, satirical beauty, golden carriage, sunlit Renaissance square, masterpiece, best quality, very aesthetic",

        // GRIMM BROTHERS DARK EROTICA
        "rating_suggestive, Hansel and Gretel witch's gingerbread cottage, candy cane fence, innocent siblings exploring, gingerbread roof tiles, dark forest temptation, edible architecture, childhood curiosity, warm amber interior glow, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Frog Prince transformation mid-kiss, human emerging from amphibian form, princess recoiling and fascinated, swamp setting at twilight, magical metamorphosis, slime and royalty, grotesque beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Rumpelstiltskin maiden spinning gold in tower room, straw everywhere, desperate bargaining, imp silhouette at window, gothic fairy tale, mechanical wheel, sweat and determination, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, Twelve Dancing Princesses emerging from secret portal, worn dancing shoes, sleepy satisfied expressions, underground crystal ballroom, worn-through slippers, mysterious nightly disappearance, masterpiece, best quality, very aesthetic",
        "rating_suggestive, Golden Goose pursued by greedy townspeople stuck together, comedic pile of bodies, simpleton hero rewarded, village square chaos, Aesop moral, slapstick sensuality, bright peasant clothing, masterpiece, best quality, very aesthetic",
        "rating_suggestive, Brave Little Tailor defeating giant in bed, giant's snoring bulk, clever trickster hero, medieval inn setting, David and Goliath miniature, triumphant small figure, humorous erotica, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Goose Girl with talking horse head, decapitated Falada on city wall, true princess in servant rags, identity theft drama, mistaken identity romance, castle courtyard, medieval intrigue, masterpiece, best quality, very aesthetic",
        "rating_suggestive, Iron Hans wild man at forest pool, golden boy bathing, transformation from beast to prince, Grimm coming of age, shaggy hair and leaves, wild man nurturing, enchanted forest setting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Briar Rose asleep in thorn tower, hundred years of preserved beauty, prince cutting through roses, blood on thorns, sleeping beauty anticipation, gothic castle, dust motes in sunbeams, masterpiece, best quality, very aesthetic",

        // EASTERN FAIRY TALE EROTICA
        "rating_suggestive, Urashima Taro returning from Dragon Palace, opened forbidden box, aging instantly, beautiful Otohime memory, Japanese folklore tragedy, seaside cottage, transformation sorrow, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, Tale of Genji moon viewing party, Heian period nobles, layers of silk kimono slipping, courtly love aesthetics, classical Japanese romance, cherry blossom viewing, aristocratic sensuality, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Bamboo Cutter's Daughter Kaguya returning to moon, celestial robe billowing, earthly suitors weeping, Taketori Monogatari, bamboo forest at night, lunar beauty, transcendent farewell, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, White Snake Madame White at herb shop, transformation magic, Xu Xian falling in love, Chinese legend, West Lake Hangzhou, serpent seduction, traditional medicine jars, masterpiece, best quality, very aesthetic",
        "rating_suggestive, Peach Boy Momotaro finding giant peach, elderly couple discovering child, Japanese folklore origin, flowing river setting, divine birth, pastoral idyll, warm family discovery, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Crane Wife weaving in secret room, feathers scattered, husband spying through door, shapeshifter romance, Japanese folklore tragedy, traditional weaver's hut, trust and betrayal, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, One Thousand and One Nights Scheherazade weaving tales, Sultan's bedchamber, cliffhanger endings preserving life, Arabian Nights framing device, Orientalist luxury, storytelling seduction, masterpiece, best quality, very aesthetic",
        "rating_suggestive, Aladdin discovering magic lamp in Cave of Wonders, trapped underground, genie emerging, Middle Eastern treasure cave, golden coins everywhere, wish fulfillment fantasy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, Sinbad the Sailor at Roc egg mountain, giant bird returning, desperate hiding, Arabian Nights adventure, exotic island, danger and wonder, nautical exploration, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, Journey to the West Spider Demons luring monks, tangled silk webs, seductive monsters, Chinese mythology, Buddhist temptation, grotesque beauty, silk cocoons, masterpiece, best quality, very aesthetic",

        // MYTHOLOGICAL FAIRY TALE FUSION
        "rating_suggestive, 1girl, 1boy, Psyche discovering Cupid's true form by candlelight, oil lamp dripping wax, sleeping god of love, wings spread on bed, forbidden knowledge, Greek myth romance, divine beauty revealed, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, Orpheus looking back at Eurydice in Underworld, she dissolving into shadows, lyre in hand, tragic love, Greek mythology, dark cavern, pale shades of dead, desperate reach, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Pygmalion statue coming to life, Galatea blushing first breath, sculptor's studio, marble to flesh transformation, Ovid metamorphosis, artistic creation desire, warm studio light, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Danae receiving Zeus as golden shower, tower prison, divine conception, Greek myth erotica, imprisoned princess, godly visitation, golden light flooding room, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Leda and the Swan, Zeus in bird form, seduction by river, mythological bestiality, Greek pastoral, swan neck curved, ambiguous consent, classical painting homage, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Persephone eating pomegranate seeds in Hades, six seeds for six months, underworld throne, seasonal explanation myth, dark romance, red juice on lips, captive queen, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Europa riding Zeus as white bull across sea, Crete in distance, abduction or seduction, Phoenician princess, wave spray, bull's gentle eyes, mythological travel, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Narcissus gazing at reflection in pool, Echo watching hidden, unrequited love, flower beginning to grow, Ovid tragedy, forest pool, self-love obsession, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Medusa before curse, beautiful priestess in Athena's temple, Poseidon's shadow looming, tragedy foretold, serpent hair not yet, classical Greek beauty, temple columns, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Andromeda chained to sea rocks, Cetus monster approaching, Perseus arriving on Pegasus, rescue romance, Ethiopian princess, coastal sacrifice, heroic arrival, masterpiece, best quality, very aesthetic",

        // MODERN FAIRY TALE TWISTS
        "rating_suggestive, 1girl, Shrek-inspired ogre princess in swamp, layers like onion metaphor, true beauty within, misunderstood monster romance, fairytale subversion, mud and lily pads, ogre hut, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Matrix Red Pill Blue Pill choice, Alice down rabbit hole cyberpunk, simulated reality fairy tale, redhead in white dress, leather and code, techno-fantasy fusion, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Pan's Labyrinth Ofelia at faun's labyrinth, tasks to prove royalty, 1940s Spain fantasy, Guillermo del Toro aesthetic, dark fairy tale, maze stone walls, magical realism, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, Princess Mononoke San and Ashitaka first meeting, blood on mouth, wolf girl wildness, cursed arm touching, Studio Ghibli romance, forest spirit atmosphere, dramatic tension, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Howl's Moving Castle Sophie aging transformation, finding beauty at every age, Calcifer hearth fire, door to different lands, Miyazaki feminist fairy tale, self-acceptance, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Spirited Away Chihiro working in bathhouse, Haku dragon form, stolen name magic, Yubaba's contract, coming of age in spirit world, soot sprites, night atmosphere, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Kiki's Delivery Service first solo flight, independence and growing up, black cat Jiji, red radio, bakery window, Ghibli teenage girl, self-discovery journey, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Wolf Children Hana with Ame and Yuki, choosing human or wolf path, motherhood sacrifice, rural isolation, tragic family fairy tale, seasons passing, field of flowers, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Tale of Princess Kaguya celestial beings descending, return to moon, earthly attachments torn, Takahata watercolor style, cherry blossom storm, transcendent sadness, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Whisper of the Heart writing fantasy novel, cat Baron statue coming to life, library card romance, Ghibli creative process, antique shop, violin maker workshop, masterpiece, best quality, very aesthetic",

        // ADDITIONAL CREATIVE EROTIC ART - BATCH 3 BONUS
        "rating_suggestive, 1girl, tattoo artist working on intimate canvas, needle buzzing, ink on skin, trust and vulnerability, studio privacy, artistic pain, body as masterpiece, dramatic lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, contortionist circus performer in dressing room, flexible poses, sequined costume, carnival atmosphere, physical mastery, behind tent scenes, performer intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, perfume maker testing exotic fragrances on skin, amber bottles, botanical extracts, scent memory, laboratory romance, alchemy of attraction, glass distillation apparatus, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, glass blower shaping molten crystal, heat glow on skin, workshop intimacy, fragile beauty creation, industrial art, orange furnace light, delicate and dangerous, masterpiece, best quality, very aesthetic",
        "rating_suggestive, lighthouse keeper's solitary existence, storm outside, warm interior, maritime isolation, romantic loneliness, beacon rotation, coastal weather, stormy passion, masterpiece, best quality, very aesthetic",
        "rating_suggestive, clock tower midnight maintenance, gears and pendulum, time stopped at twelve, mechanical romance, Victorian engineering, moon through glass, temporal intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, apiarist tending hives in meadow, protective veil lifted, honey on skin, nature's sweetness, beekeeper suit, summer fields, golden hour harvest, rural sensuality, masterpiece, best quality, very aesthetic",
        "rating_suggestive, astrologer mapping stars from observatory dome, telescope pointed at heavens, cosmic perspective, night sky romance, celestial charts, dome opening to universe, masterpiece, best quality, very aesthetic",
        "rating_suggestive, taxidermist preserving beauty forever, Victorian curiosity shop, frozen poses, eternal youth, macabre art, glass eyes, preservation desire, moth-eaten velvet, masterpiece, best quality, very aesthetic",
        "rating_suggestive, submarine crew in cramped quarters under ocean, porthole showing deep sea, isolated intimacy, steel hull pressure, dieselpunk underwater, confined space romance, masterpiece, best quality, very aesthetic"
    ],

    // ========================================
    // AFTER DARK EROTICA - INTIMATE NIGHT SCENES - BATCH 4
    // ========================================
    "wai-illustrious-erotic-v4": [
        // LATE NIGHT ENCOUNTERS
        "rating_suggestive, 1girl, 1boy, midnight confession on apartment balcony, city lights below, shared cigarette smoke, tension before first kiss, urban romance, intimate whispering, warm interior light spilling out, after-hours connection, vulnerable truth, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2people, lovers in silk bedsheets at 3am, moonlight stripe across bare skin, whispered secrets in dark bedroom, sleep-tousled intimacy, domestic passion, late night confessions, soft skin tones, peaceful eroticism, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, underground jazz club VIP booth, saxophone solo in background, thighs touching under table, stolen glances over whiskey glasses, smoky seduction, vintage noir romance, amber lighting, intimate conspiracy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, hotspring ryokan midnight soak, steam obscuring figure in private bath, traditional wooden tub, sake bottle nearby, Japanese after-dark tradition, wet skin glistening, intimate solitude, warm water ripples, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 24-hour diner waitress leaning over counter, uniform buttons straining, late-night regular customer, fluorescent intimacy, Americana after dark, coffee steam, exhausted sensuality, neon through rain windows, masterpiece, best quality, very aesthetic",

        // HOTEL & TRAVEL ENCOUNTERS
        "rating_suggestive, 1girl, luxury hotel suite with city view at night, silk robe slipping off shoulder, champagne flute in hand, business trip affair, anonymous intimacy, floor-to-ceiling windows, sophisticated adult encounter, urban nightscape, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 2people, roadside motel neon sign flickering, strangers seeking shelter from storm, single bed necessity, temporary connection, rain on window, transient intimacy, pulp fiction romance, red and blue neon glow, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, overnight train sleeper car, bunk bed privacy curtain drawn, rhythmic motion of tracks, traveling salesman encounter, confined mobile intimacy, European railway romance, blue night lighting through window, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, airport hotel bar, delayed flight strangers, anonymous hotel room key exchange, travel loneliness connection, business class casual encounter, departure tomorrow, temporary passion, lounge lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, cruise ship cabin at sea, balcony door open to ocean sounds, vacation affair, tropical night air, ship motion sensuality, nautical romance, moon on water, escape from everyday, masterpiece, best quality, very aesthetic",

        // ADULT CLUB & NIGHTLIFE
        "rating_suggestive, 1girl, pole dancer in private champagne room, sweat-sheen skin under colored lights, intimate performance for one, velvet seating, adult entertainment, seductive athleticism, purple and gold lighting, professional sensuality, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, burlesque performer backstage removing costume, feather boa and sequins, dressing room mirror lights, cabaret intimacy, theatrical nudity, powder and perfume, red velvet curtains, performer vulnerability, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, hostess club booth, beautiful companion pouring expensive sake, intimate conversation service, Japanese nightlife, pink neon interior, companionship commerce, tailored seduction, city night continuing outside, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, underground fetish club masked ball, latex and leather, anonymous identity, candlelit warehouse, alternative lifestyle celebration, mysterious encounters, industrial chic, consensual adult exploration, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, drag queen backstage transformation, makeup half-applied, gender performance intimacy, cabaret preparation, sequins and contour, theatrical dressing room, identity and sensuality, warm mirror bulbs, masterpiece, best quality, very aesthetic",

        // SECRET AFFAIRS & FORBIDDEN ENCOUNTERS
        "rating_suggestive, 1girl, 1boy, best friend's wedding reception, stolen moment in coat check room, forbidden attraction, tuxedo and bridesmaid dress, guilt and desire, celebration noise muffled, secret touching, formal attire intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, office after hours, desk cleared, power dynamic encounter, boss and employee tension released, city lights through window, professional boundaries crossed, workplace affair, glass and chrome office, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, professor's office hours extending to evening, book-lined walls, intellectual seduction, academic power, thesis defense celebration, scholarly intimacy, leather chairs and mahogany, forbidden knowledge, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, confessional booth intimacy, priest and penitent, sacred space profaned, whispered sins becoming desires, religious taboo, candlelit church, velvet curtains, forbidden spiritual transgression, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, therapist's couch session turning intimate, transference realized, professional boundary dissolution, office afternoon light, psychological intimacy, forbidden healing touch, leather couch, trust exploited, masterpiece, best quality, very aesthetic",

        // DOMINATION & SUBMISSION
        "rating_suggestive, 1girl, dominatrix dungeon playroom, leather and chains aesthetic, submissive kneeling position, power exchange ritual, BDSM elegance, candle wax and velvet, controlled pain, intimate dominance, red and black palette, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, pet play scene, collar and leash aesthetic, devotion and ownership, master and pet dynamic, intimate power, crawling pose, absolute trust, alternative relationship, soft lighting on leather accessories, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, rope bondage shibari session, intricate knots on skin, Japanese bondage art, model suspended, trust and artistry, kinbaku elegance, rope marks on flesh, intimate restriction, warm studio light, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, age play caregiver scene, nurturing intimacy, innocent costume, protective dynamic, adult consensual regression, stuffed animals and comfort, gentle caretaking, soft pastel room, emotional vulnerability, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, cuckold scenario, watching through slightly open door, voyeuristic intimacy, complex emotional dynamics, bedroom shadows, lace and betrayal, psychological erotica, muted domestic lighting, masterpiece, best quality, very aesthetic",

        // GROUP INTIMACY
        "rating_suggestive, girls, polyamorous triad in shared bed, tangled limbs and sheets, compersion and connection, multiple partner intimacy, love multiplied, warm domestic bedroom, trust and communication, relationship anarchy beauty, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, swingers party masked encounter, stranger intimacy, consensual non-monogamy, champagne and silk masks, anonymous connection, upper class decadence, candlelit mansion room, adventurous exploration, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, harem bath scene, multiple beautiful figures in steam, oils and attendants, historical polygamy, Ottoman luxury, marble and gold, collective sensuality, warm steam, service and pampering, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, cuddle pile after party, platonic intimacy, warmth and connection, trust and vulnerability, friendship boundary exploration, soft blankets, morning after closeness, innocent touching, safe space, masterpiece, best quality, very aesthetic",
        "rating_suggestive, people, festival orgy ancient rites, pagan celebration, seasonal fertility ritual, Dionysian ecstasy, collective transcendence, bonfire light, primitive abandon, cultural erotica, masked participants, masterpiece, best quality, very aesthetic",

        // FETISH & KINK AESTHETICS
        "rating_suggestive, 1girl, foot fetish worship scene, delicate arch and painted nails, submission through adoration, power in being worshipped, velvet cushion, intimate service, sensual focus, soft lighting on skin, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, leather and latex fashion shoot, skin-tight material gleaming, alternative beauty, fetish wear as art, industrial studio setting, dominant presence, alternative lifestyle pride, dramatic contrast lighting, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, macrophilia fantasy, giantess towering over tiny admirer, size difference power, fantasy scale, cityscape or bedroom setting, overwhelming feminine presence, magical size play, dramatic perspective, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, vorarephilia vore, predatory consumption metaphor, swallowed whole fantasy, dangerous intimacy, monster girl aesthetic, threat and desire, vore fantasy art, dark sensuality, teeth and tongue, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, transformation fetish, gradual change from human to creature, mid-transformation beauty, fur or scales emerging, metamorphosis erotica, changing identity, liminal body horror beauty, magical change, masterpiece, best quality, very aesthetic",

        // SENSUAL MASSAGE & TOUCH
        "rating_suggestive, 1girl, nuru massage session, gel-slicked bodies sliding, intimate body-to-body contact, Japanese massage technique, trust and relaxation, warm room, professional intimacy, oil reflections on skin, therapeutic touch, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, tantric ritual prolonged touch, chakras aligned, spiritual sexuality, meditative intimacy, incense and candles, prolonged pleasure, Eastern mysticism, energy connection, warm golden light, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, four-hand massage luxury spa, two therapists synchronized, complete surrender to touch, wealthy indulgence, hot stones and oils, bamboo decor, ultimate relaxation, service industry intimacy, soft spa music, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, acupuncture and sensual healing, needles placed with care, alternative medicine intimacy, trust in practitioner, traditional Chinese medicine, holistic wellness, warm treatment room, therapeutic vulnerability, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Reiki energy healing session, hands hovering over body chakras, spiritual intimacy, energy transfer, New Age sensuality, crystal healing, trust and openness, white light visualization, holistic connection, masterpiece, best quality, very aesthetic",

        // EXHIBITIONISM & VOYEURISM
        "rating_suggestive, 1girl, balcony nudity high above city, risk of being seen, exhibitionist thrill, urban exposure, glass railing, skyline backdrop, daring exposure, adrenaline and arousal, twilight blue hour, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, changing room voyeur peek, curtain gap, unaware beauty, shopping mall intimacy, accidental watching, lingerie trying on, consumerism and desire, florescent retail lighting, forbidden glimpse, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, webcam performer in home studio, ring light reflection in eyes, digital exhibitionism, online intimacy economy, bedroom as stage, streaming performance, modern sex work aesthetic, pink LED glow, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, nude beach sunset, public nudity comfort, naturist lifestyle, bodies of all types, ocean backdrop, liberation and freedom, European coastal, golden hour skin, social nudity acceptance, masterpiece, best quality, very aesthetic",
        "rating_suggestive, people, sauna co-ed nudity, sweat and steam, Scandinavian tradition, wooden benches, health and wellness nudity, social intimacy, heat glow on skin, relaxation and openness, Nordic minimalism, masterpiece, best quality, very aesthetic"
    ],

    // ========================================
    // EXTREME EROTIC FANTASY - DARK PASSIONS - BATCH 5
    // ========================================
    "wai-illustrious-erotic-v5": [
        // SUPERNATURAL SEDUCTION
        "rating_suggestive, 1girl, succubus feeding on sleeping victim, ethereal form astride chest, life force exchange, nocturnal emission demon, parasitic romance, bedroom shadows, supernatural assault, dark feminine power, moonlight through curtains, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, vampire thrall marked by bite, willing submission to immortal, puncture wounds on neck, blood bond connection, eternal servitude desire, gothic bedroom, immortal seduction, pallid skin contrast, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, werewolf transformation during intimate moment, beast and beauty, feral passion unleashed, claws emerging from human hands, primal desire, full moon through window, dangerous transformation, wild sensuality, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, ghost lover's cold embrace, phantom touching living skin, ectoplasmic intimacy, haunting desire, spectral persistence beyond death, haunted bedroom, supernatural longing, translucent against solid, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, demon contract sealed with kiss, magical binding, soul exchange, pentagram glow beneath bed, infernal bargain, price of desire, hellfire reflection in eyes, arcane symbols appearing on skin, masterpiece, best quality, very aesthetic",

        // DANGEROUS OBSESSION
        "rating_suggestive, 1girl, stalker's shrine wall covered in photos, obsession documented, target unaware in bed, one-way intimacy, voyeuristic collection, candlelit obsession, dangerous fixation, wall of faces, shrine dedication, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, kidnapped victim developing Stockholm syndrome, captor and captive intimacy, basement dungeon comfort, psychological complexity, trauma bonding, dim bulb lighting, twisted domesticity, survival intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, identical twin seducing sibling's lover, mistaken identity game, bedroom deception, genetic identical seduction, betrayal and thrill, sheets and moonlight, forbidden twin dynamic, deceptive intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, resurrection necromancer raising lost lover, decay and preservation magic, undead romance, gray skin and preserved beauty, love beyond death, candlelit ritual, dark magic intimacy, mourning and desire, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, time traveler seducing ancestor, paradox passion, historical bedroom, temporal forbidden love, family resemblance attraction, period accurate sheets, chronological transgression, destiny manipulation, masterpiece, best quality, very aesthetic",

        // EXTREME ROLEPLAY
        "rating_suggestive, 1girl, interrogation room seduction, good cop routine, power dynamic reversal, handcuffed to table, fluorescent hum, institutional intimacy, authority and submission, government facility, classified desire, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, medical experiment volunteer, clinical trial intimacy, research subject and scientist, laboratory setting, white coat and nudity, scientific observation, sterile room passion, data collection during ecstasy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, prison conjugal visit trailer, institutional intimacy, orange jumpsuit, metal table bolted down, incarcerated passion, surveillance camera awareness, freedom in captivity, barred window moonlight, masterpiece, best quality, very aesthetic",
        "rating_suggestive, girls, cult indoctrination chamber, masked figures watching, initiation ritual intimacy, collective ceremony, sacred profanity, underground temple, cult leader and recruit, candlelit brainwashing, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, asylum patient and doctor transference, restraints optional, therapeutic intimacy crossed, white padded room, institutional seduction, mental health and desire, doctor's coat, professional violation, masterpiece, best quality, very aesthetic",

        // ALIEN & SCI-FI EROTICA
        "rating_suggestive, 1girl, alien abduction examination, probing intimacy, clinical extraterrestrial interest, bright ship lights, human specimen, interspecies curiosity, sterile craft interior, vulnerable abduction, scientific seduction, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, hive mind collective intimacy, drone and queen connection, insectoid alien romance, pheromone communication, biological imperative, hive interior organic walls, genetic exchange, other species reproduction, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, tentacle entity consensual encounter, Japanese hentai aesthetic, Lovecraftian erotica, multiple appendage intimacy, impossible anatomy pleasure, ancient one cult, eldritch sensuality, purple and green, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, holographic lover program, AI romance, digital touch sensation, cyberpunk bedroom, programmed passion, data stream intimacy, virtual reality sex, neon and chrome, artificial satisfaction, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, shape-shifter assuming perfect lover form, identity fluidity, reading mind desires, becoming ideal partner, mirror showing true form during climax, revelation intimacy, trust and deception, morphing skin, masterpiece, best quality, very aesthetic",

        // MYTHOLOGICAL DARK EROTICA
        "rating_suggestive, 1girl, Medusa's lovers turned to stone, statues in temple, final moment of pleasure frozen, snake hair embrace, death by beauty, petrified ecstasy, Greek tragedy, temple ruins, beautiful danger, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Siren luring sailor to rocky death, song of seduction, shipwreck embrace, drowning in pleasure, ocean foam, maritime fatality, beautiful predator, coastal rocks, moonlit drowning, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Baba Yaga seducing lost traveler, chicken leg hut interior, Russian folklore witch, ancient crone magic youth restoration, forest dark fantasy, slavic mythology, chicken fence, cauldron warmth, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Kitsune draining life force through sex, multiple tails manifesting during climax, fox spirit feeding, each tail representing consumed soul, traditional Japanese bedroom, yokai predation, spiritual consumption, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, Lilith original demoness with Adam, Eden's rejected first wife, garden paradise intimacy, before the fall, serpent watching, divine disobedience, primordial sexuality, apple tree shade, perfect anatomy, masterpiece, best quality, very aesthetic",

        // TABOO & FORBIDDEN
        "rating_suggestive, 1girl, 1boy, step-sibling rivalry becoming desire, parental home bedroom, family dinner downstairs, risk of discovery, forbidden domestic, secret steps, shared bathroom history, childhood friends turned lovers, family proximity, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, clergy vow breaking, nun's habit discarded, convent cell intimacy, sacred vows dissolved, divine punishment risk, religious ecstasy, candle and crucifix, stone walls, spiritual crisis pleasure, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, teacher's pet earning extra credit, after-school detention, desk intimacy, educational institution, grade negotiation, authority figure seduction, chalkboard background, school setting, academic power, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, nurse providing special care, hospital gown open, medical intimacy, late night rounds, professional care exceeding duty, heart monitor beeping, sterile gloves, clinical setting, healing hands, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, babysitter fantasy fulfillment, parents away for weekend, couch intimacy, responsible adult temporarily absent, suburban home, youthful exploration, popcorn and movie night, couch cushions, innocent corruption, masterpiece, best quality, very aesthetic",

        // EXTREME FETISH
        "rating_suggestive, 1girl, asphyxiation play edge moment, breath control intimacy, trust extreme, hand at throat, consciousness threshold, danger and pleasure merged, bedroom shadows, risk awareness, heightened sensitivity, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, medical cast fetish, immobilized limb dependency, care and restriction, signed cast with messages, helpless intimacy, assistance required for everything, white plaster, vulnerability aesthetic, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, amputee desire and stumps, different body beauty, phantom sensation intimacy, adapted lovemaking, disability erotica, unique body appreciation, strength through adaptation, warm lighting on skin, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, body modification extreme, piercings and implants, modified anatomy, alternative beauty standards, subdermal patterns, ink and metal, transformation commitment, heavy modification, alternative aesthetic, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, nullification fantasy, smooth featureless body, alien or surgical, absence as presence, unique anatomy, otherworldly beauty, sterile clinical or magical transformation, blank canvas skin, masterpiece, best quality, very aesthetic",

        // PSYCHOLOGICAL INTENSITY
        "rating_suggestive, 1girl, doppelganger self-love, mirror come to life, narcissism realized, identical lover, self-recognition in other, bedroom confrontation with self, uncanny identical, ego and desire, perfect match, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, dream lover visitation, sleep paralysis intimacy, between waking and dream, cannot move but feel everything, night hag beautiful form, liminal consciousness, dawn approaching, reality uncertain, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, drug-induced psychedelic sex, senses merged, synesthesia pleasure, colors tasted, sounds felt, expanded consciousness intimacy, hallucination and touch, trippy patterns, perception dissolution, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, memory implanted false intimacy, Total Recall style, was it real or manufactured, implanted erotic memory, questioning experience, neural implant technology, cyberpunk bedroom, manufactured passion, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, personality split encounter, multiple personalities intimate, different lovers in one body, Dissociative Identity Disorder, unknown to each other, morning confusion, fragmented intimacy, psychological complexity, masterpiece, best quality, very aesthetic"
    ],

    // ========================================
    // ROMANTIC EROTICA - EMOTIONAL INTIMACY - BATCH 6
    // ========================================
    "wai-illustrious-erotic-v6": [
        // TENDER FIRST TIMES
        "rating_suggestive, 1girl, 1boy, first time intimacy trembling hands, nervous excitement, virgin exploration, gentle guidance, emotional vulnerability, candlelit bedroom, cherry blossom petals, Japanese first love, tender hesitation, emotional connection, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, wedding night traditional bedding, white negligee, new husband's gaze, marital duty becoming desire, traditional Japanese room, shojin screen, union of families, consummation, red and white palette, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, anniversary celebration rekindling passion, familiar bodies new positions, years of knowledge, marital bed rediscovered, comfortable intimacy, practiced love, domestic bedroom, long-term commitment, mature romance, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, elderly couple slow gentle love, aged beauty, silver hair and wrinkles, lifelong intimacy, comfortable familiarity, wisdom of years, afternoon nap together, body acceptance, timeless connection, golden years passion, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, second first time after healing, trauma survivor reclaiming body, patient partner, healing intimacy, therapeutic love, trust rebuilding, safe word comfort, empowered vulnerability, survivor strength, gentle restoration, masterpiece, best quality, very aesthetic",

        // EMOTIONAL CONNECTION
        "rating_suggestive, 1girl, 1boy, crying during orgasm emotional release, tears of joy and healing, overwhelmed intimacy, partner comforting, emotional breakthrough, rain outside window, release years of tension, therapeutic sex, vulnerability rewarded, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, pregnant lovers gentle intimacy, round belly between them, expecting couple passion, new life creating, maternity beauty, side position care, nursery visible, creation miracle, family beginning, gentle with child, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, post-miscarriage comfort sex, healing through connection, grief and love intertwined, holding each other close, tears and orgasm, trying again hope, bedroom sanctuary, shared loss, intimate comfort, hopeful continuation, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, military leave reunion passion, uniform half-removed, deployment longing released, homecoming intimacy, flag on wall, missed connection restored, patriotic bedroom, service member return, grateful touching, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, long distance relationship reunion, airport to bedroom urgency, months of video calls realized, luggage still in hallway, immediate need, virtual to physical, pent-up desire released, reunion ecstasy, distance closed, masterpiece, best quality, very aesthetic",

        // SLOW BURN FINALE
        "rating_suggestive, 1girl, 1boy, slow burn romance finally consummated, seasons of tension released, first kiss leading to bedroom, clothing finally coming off, anticipation fulfilled, couch to bed progression, worth the wait, romantic comedy climax, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, enemies to lovers final battle to bedroom, combat becoming embrace, hate sex realization, actually love, sword belt unbuckling, resolved tension, passion from conflict, war room to intimate quarters, opposing forces united, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, friends to lovers crossing line, movie night shoulder touch, familiar body new way, realization moment, why didn't we before, comfortable couch becoming bed, known and unknown, friendship foundation, love discovered, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, arranged marriage growing love, strangers to intimates, getting to know body before mind, traditional wedding bed, learning each other, commitment before passion, duty becoming desire, matched couple success, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, unrequited finally required, years of longing satisfied, secret love confessed, shock and acceptance, desperate hungry intimacy, making up for lost time, bedroom celebration, fantasy realized, patience rewarded, masterpiece, best quality, very aesthetic",

        // SACRED INTIMACY
        "rating_suggestive, 1girl, 1boy, temple of love ancient ritual, priest and priestess sacred union, divine blessing on coupling, cosmic energy exchange, tantric temple, stone fertility statues watching, religious ecstasy, spiritual and physical merged, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, handfasting ceremony consummation, pagan wedding night, bound wrists together, nature religion blessing, outdoor bedding under stars, Celtic tradition, Beltane fires, natural magic, earth and body connection, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, shrine maiden offering to god, ritual purity, divine husband visitation, kami descending, Shinto spiritual sex, torii gate visible, sacred duty, possession and pleasure, spiritual medium ecstasy, religious service, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, Christian wedding night prayer before bed, blessing the union, sacred marital privilege, religious household, cross above bed, sanctified pleasure, God's design, biblical love, Ephesians 5:25, holy matrimony, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, twin flames recognition sex, spiritual counterpart, soul memory reunion, past life recall during orgasm, karmic connection, auras visible merging, cosmic significance, destined meeting, universe aligned, eternal return, masterpiece, best quality, very aesthetic",

        // VULNERABLE TRUTH
        "rating_suggestive, 1girl, body insecurity overcome by love, stretch marks and scars accepted, unconditional acceptance, first time lights on, shame released, partner's adoration healing, real bodies real love, bedroom honesty, authentic intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, disability and able-bodied love, wheelchair to bed transfer, adapted passion, care and desire intertwined, different bodies same need, assistance as foreplay, strength in vulnerability, inclusive beauty, barrier-free intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, transition body first intimate experience, transgender affirmation, correct body parts touched, gender euphoria during sex, validation through desire, true self recognized, hormones and happiness, authentic connection, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, body dysmorphia comfort, reassuring touch, you're beautiful whispers, mirror avoided, partner's eyes replacing reflection, healing through physical affirmation, gentle guidance, anxiety melting, trust rebuilding intimacy, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, ED and patience, pharmaceutical assistance, understanding partner, pressure-free exploration, alternative satisfaction, intimacy beyond penetration, mature love adaptation, medical reality acceptance, creative solutions, masterpiece, best quality, very aesthetic",

        // AFTERGLOW MOMENTS
        "rating_suggestive, 1girl, 1boy, post-coital cigarette sharing, sweat cooling on skin, satisfied silence, window open to city sounds, intimate domesticity, afterglow peace, tangled sheets and limbs, quiet connection, smoke curling, contentment, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, shower together after, washing each other, intimate cleaning, steam and recovery, caring for partner, warm water, bathroom intimacy, coconut soap, continued touching, rejuvenation, wet embrace, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, falling asleep still connected, spooning into dreams, unconscious intimacy, breathing synchronized, night together, morning wood preparation, sleep-heavy limbs, dream sharing, deepest rest, trust absolute, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, morning after awkwardness becoming comfort, realizing connection deeper, breakfast in bed preparation, new relationship potential, sheets as toga, kitchen visible, coffee brewing smell, continuing intimacy, hope, masterpiece, best quality, very aesthetic",
        "rating_suggestive, 1girl, 1boy, round two preparation, recovery touching, building again slower, knowing each other now, confidence second time, skills application, marathon session middle, endurance passion, bedroom athleticism, sustained desire, masterpiece, best quality, very aesthetic"
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
        userId: "system_anime_showcase_script",
        likesCount: Math.floor(Math.random() * 50) + 10,
        bookmarksCount: Math.floor(Math.random() * 10)
    };

    await db.collection("model_showcase_images").add(docData);
    return imageUrl;
}

async function main() {
    const models = MODEL_OVERRIDE ? [MODEL_OVERRIDE] : Object.keys(PROMPTS_PER_MODEL);

    console.log("=== ELITE ANIME SHOWCASE GENERATOR ===");
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

            // [REMOVED] loadBalancer stats

            await sleep(2000);
        }
    }

    console.log("\n=== SHOWCASE COMPLETE ===");
}

main().catch(console.error);
