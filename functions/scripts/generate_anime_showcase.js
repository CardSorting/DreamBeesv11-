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
import { LoadBalancer } from "../workers/image.js";
const loadBalancer = new LoadBalancer();

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
    // HASSAKU-XL: Best for detailed character art, dark/epic themes, action scenes
    "hassaku-xl": [
        // SHONEN LEGENDS
        "Guts from Berserk wielding the Dragon Slayer greatsword, berserker armor with glowing red eye slit, standing atop a pile of demon corpses, massive blood moon in the sky, dark fantasy masterpiece, intricate armor detail, volumetric fog, 8k quality",
        "Saber Artoria Pendragon unleashing Excalibur, golden divine beam splitting the heavens, intricate blue and silver armor, Avalon sheath glowing, wind whipping her hair, fate series style, cinematic action shot, particle effects",
        "Satoru Gojo removing his blindfold, Six Eyes revealed with infinite void pupil, hollow purple charging between his hands, electric blue and purple energy crackling, Jujutsu Kaisen style, white hair flowing, godlike aura",
        "Itachi Uchiha in his Akatsuki cloak, Mangekyou Sharingan spinning, crows dissolving into the twilight, amaterasu flames flickering on his fingertips, tragic hero pose, rain falling, cinematic lighting, masterpiece",
        "Levi Ackerman mid-air spinning ODM attack, Survey Corps cloak billowing, titan blood splatter, blades glinting in sunlight, wall rose in background, dynamic action lines, speed blur, attack on titan style",
        "All Might in his prime form, United States of Smash pose, golden hair flowing, muscles bulging, American flag cape torn and flowing, Detroit city skyline, heroic golden hour lighting, My Hero Academia",
        "Madara Uchiha with Rinnegan and Sharingan, Susanoo forming behind him, Gunbai war fan in hand, meteorites falling from the sky, Tengai Shinsei, apocalyptic battlefield, god-tier power display",
        "Zoro with all three swords, Asura Nine-Sword Style form, demonic aura with three heads and six arms visible, black bandana, flowing green haramaki, One Piece Wano arc style, sakura petals falling",

        // COMPLEX CHARACTER STUDIES
        "Makima from Chainsaw Man, sitting in an office chair, control devil eyes piercing the viewer, suit and tie pristine, chains subtly visible in shadows, unsettling smile, psychological horror aesthetic, flat color cinematic",
        "Yor Forger in Thorn Princess assassin mode, elegant black evening dress with high slit, hidden stiletto needles, blood splatter frozen mid-air, ballroom setting with chandeliers, deadly grace, Spy x Family",
        "Power from Chainsaw Man, blood devil horns prominent, chaotic bloodthirsty grin, blood scythe forming from her arm, wildly unkempt hair, Denji in the background, energetic and violent, vivid reds and oranges",
        "Ken Kaneki Tokyo Ghoul, half white hair half black, one kakuja eye glowing red, centipede kagune emerging from back, finger cracking pose, I am a ghoul quote atmosphere, dark industrial setting, tragic antihero",
        "Alucard from Hellsing Ultimate, level zero release, millions of souls emerging as shadow familiars, crimson vampire eyes, twin pistols Jackal and Joshua, Victorian gothic London burning, ultimate vampire horror masterpiece",
        "Griffith from Berserk as Femto, hawk of darkness form, elegant yet terrifying, eclipse moon behind him, God Hand apostles in shadow, beautiful nightmare aesthetic, tragic villain, detailed wings",

        // MECHA & SCI-FI
        "Shinji Ikari inside EVA Unit-01 entry plug, LCL fluid, holographic tactical displays reflecting in haunted eyes, umbilical cable visible through entry plug, Tokyo-3 at night, psychological mecha drama",
        "Char Aznable in Zaku II cockpit, red comet legend, Zeon uniform, targeting display showing Federation mobile suits, Side 3 colony in background, UC Gundam military precision, ace pilot aura",
        "Major Motoko Kusanagi diving from skyscraper, thermoptic camouflage flickering, cybernetic body detail, futuristic Hong Kong inspired city, rain and neon, Ghost in the Shell cyberpunk masterpiece",

        // LEGENDARY BATTLES
        "Goku Ultra Instinct vs Jiren, Tournament of Power arena crumbling, silver autonomous aura, divine speed afterimages, World of Void background, ki explosion shockwaves, Dragon Ball Super climax",
        "Naruto Sage Mode Rasenshuriken clash with Sasuke Kirin, Valley of the End statues in background, orange sage cloak vs purple lightning, epic rivalry, destiny battle, wind and thunder elemental collision",

        // ========================================
        // NEW WORLD-CLASS PROMPTS BATCH 2
        // ========================================

        // DARK FANTASY LEGENDS
        "Dante from Devil May Cry, Rebellion sword resting on shoulder, red leather trenchcoat flowing, devil trigger aura flickering crimson, Temen-ni-gru tower in hellscape background, cocky smirk, stylish action pose, gothic demon slayer masterpiece",
        "Vergil Sparda wielding Yamato in Judgement Cut End stance, blue spectral swords surrounding him, silver hair slicked back, motivated cold expression, dimensional tear effects, twin brother rivalry, power incarnate",
        "Denji Chainsaw Man hybrid form, chainsaws roaring from head and arms, blood devil power unleashed, feral grin of liberation, tokyo skyline devastation, visceral gore aesthetic, traumatic hero anti-establishment punk energy",
        "Eren Yeager Founding Titan form, colossal skeletal structure emerging from spine, Attack Titan face determined, Wall Titans marching behind, apocalyptic rumbling moment, freedom at any cost, controversial protagonist climax",
        "Muzan Kibutsuchi demon king form, multi-eyed transformation horror, blood demon art tendrils, Michael Jackson suit dissolving into flesh, final battle against demon slayers, ultimate evil elegance, grotesque beauty",
        "Sukuna Ryomen King of Curses, four-armed form seated on throne of bones, malevolent domain expansion patterns, curse energy flames, Shibuya destruction, ancient evil awakened, overwhelming presence masterpiece",
        "Toji Fushiguro Sorcerer Killer, inverted spear of heaven in hand, heavenly restriction perfect body, green eyes scanning for targets, assassin in shadows, no cursed energy pure physical might, dangerous father figure",
        "Yujiro Hanma the Ogre, demon back muscles tensing, predatory grin of strongest creature, lightning storm background, Baki martial arts pinnacle, overwhelming masculine power, earth-shattering presence",

        // LEGENDARY WARRIORS
        "Kenshin Himura Battousai, cross-shaped scar glowing in moonlight, Hiten Mitsurugi stance with sakabato reversed, Meiji era rooftop duel, wanderer's guilt and redemption, samurai legend, cherry blossoms and blood",
        "Roronoa Zoro Asura form fully manifested, nine-sword style ultimate technique, King of Hell three-sword combo, black lightning armament haki, Wano arc warrior, second strongest swordsman ascension",
        "Escanor The One form, noon sun blazing behind him, divine axe Rhitta, absolute pride radiating, Seven Deadly Sins strongest human, burning arrogance personified, who decided that moment",
        "Meruem Chimera Ant King, regal pose with Komugi in memory, nen aura crown, perfect evolution contemplating humanity, Hunter x Hunter philosophical antagonist, tragic monster king, Rose poison spreading",
        "Netero Isaac heart buddha technique, thousand-armed Guanyin statue manifesting, prayer hands speed beyond comprehension, grateful for this battle smile, chairman's final gambit, Zero Hand desperation",
        "Yhwach Quincy King Almighty eyes seeing all futures, throne of souls, Bleach final villain supreme, mustache and cloak imperial, reshaping reality, soul king absorption complete, father of quincy nation",

        // PSYCHOLOGICAL HORROR
        "Johan Liebert Monster, beautiful blonde devil standing in flames, psychological manipulation incarnate, serial killer with angel face, Tenma's moral dilemma manifest, nihilistic evil perfection, the nameless monster",
        "Light Yagami Kira god complex finale, Death Note pages flying, red shinigami eyes activated, L's ghost reflection in window, justice versus madness, I am justice declaration, psychological thriller peak",
        "Shogo Makishima Psycho-Pass, white-haired philosopher criminal, high crime coefficient society critique, books and violence, charismatic anarchist, clear criminal, dominator cannot judge him",

        // ========================================
        // NEW WORLD-CLASS PROMPTS BATCH 3 (25 NEW PROMPTS)
        // ========================================

        // EPIC BATTLE MASTERS
        "Lelouch vi Britannia Zero Requiem execution pose, black cape flowing, Geass red eye activated, chessboard world domination, code geass revolution complete, emperor of rebellion, tragic genius antihero climax",
        "Killua Zoldyck Godspeed mode, electric blue aura crackling, lightning speed afterimages, assassin prodigy unleashed, Hunter x Hunter youth power, electric chair training scars visible, overwhelming talent",
        "Hisoka Morow clown makeup cracking, Bungee Gum manipulation, playing cards as weapons, Hunter x Hunter battle royale, sadistic jester grin, aura blooming scarlet, deadly entertainment",
        "Vegeta Final Flash charging, blue ki energy beam, Super Saiyan God aura, prideful warrior scream, Namek saga desperation, father-son legacy, Dragon Ball explosive power, royal bloodline",
        "Ichigo Kurosaki Bankai Tensa Zangetsu, Getsuga Tensho crescent moon, hollow mask fragments, Soul Reaper captain level, Bleach final arc transcendence, spiritual pressure hurricane, Quincy heritage",

        // COSMIC HORRORS & DEMONS
        "Rimuru Tempest True Dragon form, storm dragon silhouette, infinite regeneration aura, That Time I Got Reincarnated as a Slime god-level evolution, slime to dragon metamorphosis, overwhelming presence",
        "Diablo The Demon King, jet black wings spread wide, absolute domination aura, How Not to Summon a Demon Lord ultimate form, crimson eyes glowing, magical empire conqueror, dark fantasy supremacy",
        "Rias Gremory Destroyer form, crimson hair flowing, Power of Destruction spheres, High School DxD devil nobility, Rating Game champion, peerage united behind her, underworld empress",
        "Gilgamesh Gate of Babylon activated, countless golden weapons raining down, arrogant golden king smirk, Fate Stay Night treasury unleashed, Mesopotamian god-king, treasure horde manifestation",
        "Ainz Ooal Gown full YGGDRASIL equipment, skeletal lich supreme, super-tier magic casting, Overlord undead emperor, death knight guardians, world item activation, dark gamer supremacy",

        // ANTIHERO LEGENDS
        "Spike Spiegel smoking cigarette, red trenchcoat silhouette, Bebop crew memories, Cowboy Bebop antihero contemplation, Mars Jerusalem colony, bounty hunter philosophy, jazz saxophone melancholy",
        "Vash the Stampede red trenchcoat billowing, angel arm concealed, Trigun desert wasteland, plant heritage struggle, 60 billion double dollar reward, pacifist gunslinger contradiction, wandering savior",
        "Alphonse Elric armored body searching for philosophers stone, Fullmetal Alchemist brotherhood, blood seal alchemy circle, soul bound to steel, brotherly love eternal, automail arm detail",
        "Edward Elric automail arm and leg gleaming, transmutation circle activated, Fullmetal Alchemist genius alchemist, short temper big heart, State Alchemist watch, equivalent exchange philosophy",
        "Roy Mustang flame alchemy ignition, blue fire phoenix wings, Fullmetal Alchemist colonel ambition, Ishval war scars, promotion to general, destructive creation balance, military strategist",

        // DARK VILLAINS & MONSTERS
        "Orochimaru snake summoner, cursed seal level 2 activated, immortality pursuit, Naruto sannin betrayal, white hair and yellow eyes, Sound Village founder, forbidden jutsu master",
        "Pain Rikudo Sennin, Gedo Statue chains, Six Paths of Pain assembled, Akatsuki leader, god complex manifestation, Amegakure rain eternal, philosophical antagonist, Six Paths power",
        "Obito Uchiha Kamui dimension control, mask concealing half face, Infinite Tsukuyomi moon projection, Naruto fourth great ninja war, masked man reveal, love driving madness",
        "Kisame Hoshigaki Samehada devouring chakra, shark skin monstrous, Akatsuki executioner, Hidden Mist traitor, water prison jutsu master, tailed beast partnership, monstrous strength",
        "Deidara clay bird explosion, long blonde hair, Akatsuki artist bomber, art is an explosion mantra, scorpion summon, Naruto terrorist aesthetic, artistic destruction philosophy",

        // LEGENDARY TITANS
        "Reiner Braun Armored Titan colossal armor, Marley warrior determination, Attack on Titan coordinate command, hardened steel exterior, Survey Corps betrayal, warrior candidate tragedy",
        "Annie Leonhart Female Titan crystal hardening, Survey Corps uniform torn, Attack on Titan martial arts prodigy, underground fighting background, crystalline armor formation, emotional isolation",
        "Porco Galliard Jaw Titan monstrous bite force, Marley warrior aggression, Attack on Titan shifter combat, lightning transformation, warrior candidate determination, tactical fighter",
        "Pieck Finger quadrupedal titan form, Attack on Titan intelligent warrior, armored gun platform, Marley scout unit, coordinate communication, strategic brilliance in titan form"
    ],

    // RIN-ANIME-BLEND: Best for scenic, atmospheric, emotional, Ghibli-esque works
    "rin-anime-blend": [
        // STUDIO GHIBLI INSPIRED
        "Howl and Sophie flying through golden sunset clouds, Howl's black feather cloak transforming, Sophie's silver hair flowing, Wizard Howl's Moving Castle in the distant mountains, romantic ghibli magic, soft pastel lighting",
        "Chihiro standing at the entrance of the spirit bathhouse, red bridge, paper lanterns glowing, mysterious spirits walking past, Spirited Away night atmosphere, nostalgic and magical, Yubaba's building towering",
        "Totoro and Satsuki waiting at the bus stop in the rain, bamboo forest, magical night scene, Catbus approaching with glowing eyes, oversized leaf umbrellas, My Neighbor Totoro iconic scene, gentle rain",
        "Princess Mononoke San riding her white wolf Moro, ancient forest with kodama spirits glowing, mask removed, wild determination, shishigami forest at twilight, nature vs industry theme, epic and serene",
        "Nausicaa flying on her glider Mehve, sweeping view of the toxic jungle, ohmu glowing blue eyes in the distance, Valley of the Wind windmills, post-apocalyptic beauty, environmental masterpiece",
        "Kiki flying on her broomstick with Jiji, bakery delivery, coastal European town panorama, seagulls, warm summer afternoon light, Kiki's Delivery Service nostalgia, coming of age warmth",
        "Ashitaka riding Yakul through the misty mountains, cursed arm wrapped, morning fog in valleys, ancient Japan wilderness, epic journey beginning, Princess Mononoke landscape art",

        // EMOTIONAL MASTERPIECES
        "5 Centimeters Per Second cherry blossom scene, train crossing, Takaki reaching out, thousands of sakura petals suspended in time, melancholy golden hour, Makoto Shinkai lighting, beautiful loneliness",
        "Your Name Kimi no Na wa, Taki and Mitsuha twilight meeting on the mountain, comet Tiamat splitting the sky, red kumihimo cord connecting them, magical realism, tears and starlight, destiny moment",
        "A Silent Voice Shouko and Shoya at the bridge, sign language, koi fish swimming below, redemption and forgiveness theme, soft watercolor aesthetic, emotional healing, Kyoto Animation beauty",
        "Violet Evergarden writing a letter by candlelight, prosthetic hands detail, emerald brooch glowing, autumn leaves outside the window, bittersweet emotions, Kyoto Animation masterpiece, tears forming",
        "Clannad After Story field of illusionary world, father and daughter silhouettes, golden wheat field, blue sky with fluffy clouds, bittersweet family love, Key visual novel aesthetic, emotional climax",
        "Grave of the Fireflies Seita and Setsuko watching fireflies in the shelter, wartime Japan, innocent tragedy, soft candlelight, tin of sakuma drops, historical ghibli tearjerker, beautiful and heartbreaking",

        // ATMOSPHERIC & SCENIC
        "Ancient Magus Bride, Chise wearing Elias's coat in the English countryside, standing stones, magical creatures in morning mist, celtic fantasy, ethereal golden hour, master and apprentice bond",
        "Mushishi Ginko walking alone on a mountain path, white smoke from pipe, invisible mushi spirits floating as light particles, traditional edo japan, peaceful solitude, supernatural naturalism",
        "Natsume Yuujinchou returning a youkai's name, paper flying in wind, Madara Nyanko-sensei watching, sunset shrine, gentle supernatural, Book of Friends pages, warm nostalgia and acceptance",
        "Made in Abyss sunrise over the abyss edge, Riko looking down into the netherworld layers, Orth town lighthouse, sense of wonder and danger, magnificent worldbuilding, adventure calling",
        "Weathering With You Hina praying on Tokyo rooftop, rain parting around her, sunlight breaking through clouds, urban magical realism, hope and sacrifice, Makoto Shinkai atmospheric beauty",
        "Wolf Children Hana with wolf pups in countryside, traditional japanese farmhouse, mountain backdrop, seasons changing, motherhood journey, slice of life magic, heartwarming and bittersweet",

        // ========================================
        // NEW WORLD-CLASS PROMPTS BATCH 2
        // ========================================

        // ETHEREAL DREAMSCAPES
        "Paprika dream parade sequence, circus elephants flying through Tokyo skyline, reality bending carnival surrealism, Satoshi Kon visual poetry, impossible architecture, dreamscape masterpiece, psychological wonder",
        "Serial Experiments Lain in the Wired, holographic data streams surrounding her, lonely bedroom with glowing monitors, existential isolation, 90s cyberpunk aesthetic, identity dissolution, hauntingly beautiful",
        "Angel's Egg girl carrying oversized egg through gothic cathedral ruins, Mamoru Oshii atmosphere, endless rain and shadows, biblical symbolism, surreal melancholy, art film anime masterpiece",
        "Haibane Renmei Rakka with grey wings in Old Home, autumn light through windows, peaceful existential contemplation, afterlife serenity, feathers falling, quiet beauty, liminal space warmth",
        "Millennium Actress Chiyoko running through her film roles, time periods blending seamlessly, cherry blossoms and snow mixing, pursuit of love across decades, Satoshi Kon magic, cinematic memory lane",

        // POETIC LANDSCAPES
        "Garden of Words Takao and Yukari in the rainy park pavilion, lush green garden, raindrops creating ripples in pond, shoes and poetry, forbidden feelings, Shinkai rain perfection, intimate atmosphere",
        "Aria the Animation Neo-Venezia canals at sunset, Akari rowing her gondola, undine trainee serenity, nostalgic future mars city, healing anime paradise, golden hour reflections, peaceful utopia",
        "Yokohama Kaidashi Kikou Alpha alone at her countryside cafe, post-apocalyptic pastoral, rusted robots overgrown with flowers, melancholy acceptance, end of humanity beauty, quiet robot girl",
        "Mushoku Tensei Sylphiette and Rudeus under the great tree, wind magic rustling leaves, first love innocence, isekai fantasy romance, emotional growth, dappled sunlight, peaceful moment",
        "Frieren at the Funeral journey through endless meadows, elf mage walking alone, centuries of memories, flowers and gravestones, passage of time, beautiful solitude, fantasy wanderlust",

        // TWILIGHT EMOTIONS
        "Anohana summer fireworks at the mountain shrine, Menma ghost in white dress, childhood friends reunion, tears and laughter, letting go, hanabi festival bittersweet, emotional healing",
        "March Comes in Like a Lion Rei crossing the bridge alone, shogi piece metaphor overlaid, depression and found family, river reflections, lonely genius, Shaft artistic style, inner struggle beauty",
        "Erased Satoru at the frozen lake, Kayo in red coat, snow falling gently, butterfly time travel effect, childhood nostalgia, winter tragedy prevention, desperate hope, saving the past",
        "Fruits Basket final moment, Tohru embracing Kyo, curse broken celebration, rice ball metaphor, zodiac spirits ascending, found family completion, emotional payoff, healing tears",
        "To Your Eternity Fushi first snow with the boy, primitive world isolation, immortal beginning, learning emotions, beautiful tragedy, quiet winter, existence awakening, poignant first chapter",
        "Land of the Lustrous Phosphophyllite at the night beach, gem body reflecting moonlight, existential crystal beauty, post-human melancholy, shattered and reformed, quiet philosophical anguish",
        "The Girl Who Leapt Through Time Makoto frozen mid-leap, riverbank summer sunset, time stopping baseball moment, nostalgic teenage freedom, bittersweet possibilities, golden youth ending",

        // ========================================
        // NEW WORLD-CLASS PROMPTS BATCH 3 (15 NEW PROMPTS)
        // ========================================

        // MYSTERIOUS ATMOSPHERES
        "Steins Gate Okabe time travel laboratory, broken microwave phone, @channel messages floating, World War III divergence meter, mad scientist determination, chaos theory visualization, time paradox tension",
        "Monster Dr Kenzo Tenma operating theater, red operating light, surgical precision vs moral dilemma, classical music playing, hospital corridor shadows, ethical nightmare, surgical horror beauty",
        "Psycho-Pass Akane Tsunemiya dominator raised, blue summer uniform, justice versus system, Sibyl System holographic displays, latent criminal awakening, philosophical police drama",
        "Death Parade black and white arena, arbiters judging humanity, Chiyuki and his childhood friend, life review memories floating, existential courtroom, beautiful despair, life evaluation drama",
        "Another cursed classroom, red string noose swinging, Non-Myth incident, Mei Misaki crimson left eye, cursed videotape aesthetic, 90s horror nostalgia, supernatural classroom terror",

        // SERENE LANDSCAPES & SEASONS
        "Sweet Blue Flowers childhood summer, Fumi and Akira bicycle ride, rural Japan countryside, first love awakening, gentle breeze through rice fields, nostalgic adolescence, tender coming of age",
        "Bloom Into You Yuu and Nanami confession under cherry blossoms, heart pounding moment, literary club rooftop, romantic tension release, soft pink petals falling, lesbian romance tenderness",
        "Citrus stepsister romance, Yuzu and Mei autumn park bench, forbidden attraction, orange and yellow leaves, bittersweet family complications, elegant emotional drama, aristocratic tension",
        "Revolutionary Girl Utena dueling arena rose petals, sword of Dios, prince and princess metaphor, revolutionary girl pose, Victorian gothic academy, feminist allegory, romantic destiny",
        "Adachi and Shimamura student council room after hours, budding lesbian romance, rain against windows, quiet conversation intimacy, high school girl love, gentle emotional development",

        // SUPERNATURAL SERENITY
        "Spirited Away bathhouse workers union, Lin and Chihiro friendship, spirit world bureaucracy, golden hour steam rising, magical realism workplace, coming of age wonder, nostalgic bathhouse warmth",
        "My Neighbor the Witch Hinata discovering magic, broomstick flight lessons, magical girl academy, autumn maple leaves, friendship and discovery, wholesome fantasy, gentle witch training",
        "Aoi Hana Fumi Manjoume art club solitude, watercolor brushes and paper, creative introspection, spring light through windows, artistic girl melancholy, creative expression beauty",
        "Liz and the Blue Bird Mizore and Nozomi flute duet, sharp and flat key personalities, music room golden hour, Kyoto Animation precision, emotional musical harmony, friendship depth",
        "Tamayomi baseball girls determination, Kanata Hishishishita pitching form, sunset stadium, sports anime passion, girl power athleticism, competitive spirit, sunset victory moment",

        // TEMPORAL REFLECTIONS
        "Puella Magi Madoka Magica final monologue, pink goddess form dissolving, cosmic despair and hope, witch transformation averted, ultimate sacrifice beauty, emotional philosophical climax, magical girl transcendence"
    ],

    // RIN-ANIME-POPCUTE: Best for vibrant, energetic, cute, modern pop-style anime
    "rin-anime-popcute": [
        // MODERN IDOL & POP ICONS
        "Anya Forger from Spy x Family, heh smug face, star pupils sparkling, peanuts floating around, pink pastel background with chibi Loid and Yor, adorable chaos, kawaii pop style, manga panel effects",
        "Bocchi the Rock guitar solo moment, Hitori Gotoh going pink and glitchy, abstract rock music visualization, neon pink and cyan, social anxiety turned into rock god energy, chaotic cute",
        "Ai Hoshino from Oshi no Ko, B-Komachi idol costume, star eyes maximum sparkle, concert stage with thousands of glowsticks, tragic idol persona, bright pop aesthetic, love and lies theme",
        "Marin Kitagawa My Dress-Up Darling cosplay pose, gyaru makeup perfect, colorful wigs in background, energetic peace sign, Gojo blushing in corner, romance comedy pop vibes, fashionista queen",
        "Chika Fujiwara Love is War, chaotic dance pose, pink hair bouncing, love detective magnifying glass, heart explosions background, comedy queen energy, maximum kawaii chaos",
        "Kaguya-sama O kawaii koto smug pose, moon hairpin, fan covering lower face, sparkle and rose petals, tsundere elegance, romantic comedy royalty, beautiful and terrifying",

        // CLASSIC MAGICAL GIRLS
        "Sailor Moon eternal form, silver crystal shining, all sailor scouts silhouettes behind her, moon kingdom rising, 90s anime aesthetic with modern polish, magical girl supreme, starry cosmic background",
        "Cardcaptor Sakura Star Card transformation, pink frilly dress with wings, Star Wand raised high, Sakura Cards orbiting, Tomoyo filming in background, CLAMP magical girl masterpiece",
        "Madoka Magica ultimate form Madokami, pink goddess ascending, magical girl silhouettes, cosmic abstract background, hope and despair balance, beautiful and tragic, Shaft studio style",
        "Puella Magi Homura with shield, time stop aesthetic, purple and black diamond motifs, guns floating frozen, determination and love, Rebellion movie style, cool beauty magical girl",

        // HIGH ENERGY ACTION
        "Ryuko Matoi Kill la Kill, Senketsu synchronized, scissor blade over shoulder, life fiber red accents, dynamic speed lines, punk rock rebel energy, Trigger studio explosive style",
        "Megumin Konosuba, explosion pose with staff Chomusuke, crimson demon clan eye patch, massive explosion mushroom cloud, chuunibyou maximum, comedy fantasy pop, Kazuma face-palming distance",
        "Aqua Konosuba useless goddess energy, party trick pose, blue water effects, crying face hidden behind smile, comedy perfection, Steve Blum voice energy, fantasy pop aesthetic",
        "Zero Two Darling in the Franxx, red pilot suit, dinosaur horns, pink hair flowing, sitting in Strelizia cockpit, darling catchphrase vibe, romantic mecha pop, honeypop colors",

        // GAMING & INTERNET CULTURE
        "Shiro No Game No Life, rainbow hair galaxy brain mode, chess pieces floating, neon purple and pink, Sora in background, genius NEET aesthetic, game world pop art, unbeatable",
        "Emilia Re:Zero, silver half-elf beauty, Puck on shoulder, ice crystal magic, gothic lolita dress detail, blue and purple fantasy romance, isekai heroine perfection",
        "Ram and Rem Re:Zero twins mirror pose, pink and blue symmetry, maid outfits detailed, morning star and wind magic, devoted love, twin maid pop aesthetic, cute and deadly",
        "Nezuko Kamado chibi running, bamboo muzzle, demon form cute version, pink butterfly effects, Tanjiro chibi chasing, Demon Slayer kawaii interpretation, family love pop style",
        "Ochako Uravity My Hero Academia, zero gravity pose floating, UA uniform, pink cheek blush, heroic determination, cute but powerful, shounen romance target, modern hero aesthetic",

        // ========================================
        // NEW WORLD-CLASS PROMPTS BATCH 3 (10 NEW PROMPTS)
        // ========================================

        // MODERN IDOL REVOLUTION
        "Ruby Rose from RWBY, rose petal transformation, red hooded cape flowing, scythe Crescent Rose spinning, huntress determination, Remnant world adventure, energetic action girl, volume 1 nostalgia",
        "Asuka Langley Soryu Langley plugsuit pose, confident smirk, orange hair ponytail, Eva pilot attitude, German precision, tsundere energy maximum, mecha pilot diva, red interface headset",
        "Cattleya from Queen's Blade, amazon warrior pose, green hair flowing, sword raised, arena crowd cheering, tournament fighter, muscular beauty, fantasy battle royale, victory declaration",
        "Hancock Boa, empress of Amazon Lily, snake hair accessories, slave arrow brand, Kuja pirate captain, One Piece empress beauty, haki conqueror, love sickness immunity, royal dignity",

        // GAMING ANIME FUSION
        "Kirito dual wielding in Aincrad, black swordsman coat flowing, Elucidator and Dark Repulser, Sword Art Online pioneer, nerve gear interface, virtual reality legend, solo player determination",
        "Yennefer of Vengerberg chaos energy swirling, violet eyes glowing, silver hair wild, Witcher 3 sorceress, magic portals opening, monster hunter elegance, powerful feminist magic user",
        "Tifa Lockhart final fantasy victory pose, leather suspenders, fists glowing with ki, Avalanche leader, Midgar skyline, bar hostess to revolutionary, strong female fighter, materia magic",

        // POP CULTURE ICONS
        "Momo Yaoyorozu My Hero Academia, creation quirk activation, utility belt materializing, student council president, strategic genius, supportive heroine, rescue hero training, creation mastery",
        "Tsuyu Asui frog girl hero, tongue extended, U.A. uniform with goggles, Rainy Season Hero Froppy, rescue operations, stealth reconnaissance, amphibian abilities, cheerful determination",
        "Toru Hagakure invisible girl mystery, floating gloves and boots, invisible quirk effects, U.A. support hero, cheerleader personality, supportive friend, class 1-A invisible menace",

        // ENERGETIC MAGICAL GIRLS
        "Flame Haze Shana wielding Nietono no Shanoa, red hair burning, Rinne mark glowing, Denizen destroyer, Shakugan no Shana crimson realm, flame of destruction, crimson god warrior, eternal flame"
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
                    const imageBuffer = await generateWithLoadBalancer(modelId, prompt);
                    const url = await processAndUpload(imageBuffer, modelId, globalIdx, prompt);
                    console.log(`   [${globalIdx + 1}] ✓ ${url}`);
                } catch (err) {
                    console.error(`   [${globalIdx + 1}] ✗ ${err.message}`);
                }
            }));

            console.log(`\n--- Load Balancer Stats ---`);
            console.table(loadBalancer.getHealthSummary());

            await sleep(2000);
        }
    }

    console.log("\n=== SHOWCASE COMPLETE ===");
}

main().catch(console.error);
