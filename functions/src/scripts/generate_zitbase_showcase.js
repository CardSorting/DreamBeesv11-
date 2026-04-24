/**
 * Z-Image Base Capability Showcase Generator
 * 
 * Generates an extensive set of elite showcase images to demonstrate the deep variance
 * and capabilities of the Z-Image Base (zit-base-model) model across multiple domains.
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

// --- Load Model Conventions (Infrastructure Layer Abstraction) ---
import { MODEL_IDS, MODEL_ENDPOINTS } from '../lib/modelConventions.js';

const ENDPOINT = MODEL_ENDPOINTS[MODEL_IDS.ZIT_BASE];
const MODEL_ID = MODEL_IDS.ZIT_BASE;
const CONCURRENCY = 1; // Sequential to maximize stability for this model

// ========================================
// PROMPT LOADING LOGIC
// ========================================

async function loadPrompts() {
    const args = process.argv.slice(2);
    const packFilePath = args.find(arg => arg.startsWith("--pack="))?.split("=")[1];

    if (packFilePath) {
        console.log(`[Showcase] Loading prompts from pack: ${packFilePath}`);
        const absolutePath = path.resolve(packFilePath);
        try {
            const data = JSON.parse(await fs.readFile(absolutePath, "utf-8"));
            if (data.batch) {
                return data.batch.map((item, idx) => ({
                    title: `${data.pack_name || "Pack"} - ${item.internal_mode || "Prompt"} ${idx + 1}`,
                    prompt: item.prompt
                }));
            }
        } catch (err) {
            console.error(`[Showcase] Failed to load pack from ${absolutePath}:`, err.message);
        }
    }

    // Default Hardcoded Prompts
    // Deep Variance Capability Showcase Prompts
    return [
        // --- High-Fashion: The Forbidden Elite ---
        { title: "The Obsidian Muse: Heart-Reaper", prompt: "A gaze that steals the soul; an incredibly alluring woman draped in liquid obsidian silk that clings like a shadow. Skin like polished bone, dangerous cheekbones, a predatory grace under a single beam of cold white light. The pinnacle of forbidden high-fashion allure. 8k hyper-detailed.", aesthetic: "Forbidden Luxury" },
        { title: "The Chrome Narcissus: Liquid Gold", prompt: "A man of unholy magnetism, shirtless and dripping with molten gold that pools at his feet. A stoic, enticing stare that holds you hostage; standing in a hall of shattered mirrors reflecting a blood-orange sunset. Raw, high-end power.", aesthetic: "Divine Eroticism" },
        { title: "The Neon Goddess: Digital Pulse", prompt: "A breathtaking person in a gown of woven fiber-optic nerves that pulse with violet light. Iridescent skin with bioluminescent circuitry, a digital siren call echoing through a dark, void-like studio. Sharp, intoxicating, futuristic.", aesthetic: "Cyber-Siren" },
        { title: "Milan Predatory: Wet Ink Leather", prompt: "The rawest form of runway magnetism; a model with an intense, predatory gaze walking through Milan's midnight heat. Wearing leather that gleams like fresh oil, chrome chains catching strobe flashes. An atmosphere of danger and deep attraction.", aesthetic: "High-Fashion Power" },
        { title: "Vintage Temptress: The Ghost of Hollywood", prompt: "Captivating 1950s glamour with a dark edge; an actress with an alluring, soul-piercing gaze. Shimmering silver sequins cascading off her like liquid moonlight, white fur against sun-kissed skin, a soft but intense cinematic glow.", aesthetic: "Vintage Noir" },
        { title: "Desert Mirage: The Blood Silk", prompt: "Wide cinematic shot of a breathtaking siren in a massive, gravity-defying crimson silk gown that bleeds across white sand dunes at the exact moment of sunset. Honey-soaked rim lighting, etheral and dangerously untouchable.", aesthetic: "Epic Ethereal" },
        { title: "The Mercury Empress: Molten Divinity", prompt: "An incredibly beautiful woman with skin of liquid mercury and pulses of violet light beneath the surface. Draped in shifting metallic fabrics that flow like lava, floating holographic ornaments. A portrait of haunting futuristic divinity.", aesthetic: "Post-Human Beauty" },
        { title: "The Shadow Aristocrat: Midnight Velvet", prompt: "Intensely magnetic B&W portrait of a handsome man with eyes that hold ancient secrets. High-contrast noir lighting carving out perfection, a sharp velvet tuxedo, an atmosphere of deep mystery and irresistible gravity.", aesthetic: "Noir Aristocracy" },
        { title: "Lace & Thorns: The Dark Nymph", prompt: "A beautiful, haunting girl with a gaze of deceptive innocence. Draped in intricate black lace and living silver thorns, standing in a mist-shrouded field of dead roses. Soft, romantic, yet intoxicatingly dangerous.", aesthetic: "Gothic Romantic" },
        { title: "Brutalist God: Cashmere & Steel", prompt: "A man of rugged, high-end beauty leaning against a brutalist steel structure. Wearing oversized, heavy charcoal cashmere that highlights his sharp, magnetic features. Soft, moody overcast light, intimate focus on texture and quiet strength.", aesthetic: "Modern God" },

        // --- Cinematic: The Haunting Narrative ---
        { title: "The Last Navigator: Star-Eater", prompt: "Cinematic close-up of a stunningly alluring astronaut, her eyes reflecting the birth of a nebula. Gaze fixed on the void, violet and teal starlight painting her face, hyper-realistic cosmic cinematic. A siren of the final frontier.", aesthetic: "Cosmic Noir" },
        { title: "Dragon Queen: The Ash Sovereign", prompt: "A majestic beauty with silver hair like spun smoke, wearing black dragon-scale armor that glows with internal embers. Standing on a field of ash, a gaze that commands fire and soul. A fierce, enticing warrior queen.", aesthetic: "Dark Fantasy Epic" },
        { title: "Neon Rain: The Cyber-Drifter", prompt: "A magnetic man with a glowing cybernetic eye, standing in a rainy cyberpunk alley. Pink and blue neon reflecting off wet, tanned skin and a tattered leather coat. A dangerous, seductive silhouette in a digital underworld.", aesthetic: "Cyberpunk Noir" },
        { title: "The Regency Ghost: Candlelight & Scandal", prompt: "A breathtaking woman in a Regency ballroom, her gaze cutting through the golden smoke of a hundred candles. Shimmering silk gown that clings and flows, surrounded by the blurred spirits of dancers. Intoxicating period allure.", aesthetic: "Haunted Regency" },
        { title: "Wasteland Siren: Warpaint & Dust", prompt: "Rugged yet devastatingly alluring; a survivor with intricate gold warpaint and a gaze of pure, untamed fire. Wearing patchwork leather and rusted scrap metal, standing in a heat-hazed wasteland. The allure of the apocalypse.", aesthetic: "Gritty Cinematic" },
        { title: "The Femme Fatale: Shadows & Satin", prompt: "A mysterious woman emerging from the deep shadows of a 1940s office. Sharp fedora veiling alluring, predatory eyes, Venetian blind shadows painting her skin, a halo of blue cigarette smoke. The ultimate cinematic temptress.", aesthetic: "Fatal Noir" },
        { title: "The Deep Abyss: Siren of the Void", prompt: "Breathtakingly beautiful person submerged in a pitch-black ocean, illuminated by a halo of glowing jellyfish. Long hair floating like ink, a hauntingly enticing underwater vision of forbidden beauty.", aesthetic: "Macabre Ethereal" },
        { title: "The Outlaw King: Sunset Lead", prompt: "A handsome gunslinger with a face of stone and soul. Warm golden rim lighting catching a dangerous, magnetic smile. Dust motes dancing in the air, the intense allure of a man with nothing but a name.", aesthetic: "Dark Western" },
        { title: "Sakura Blade: The Blood Petal", prompt: "A beautiful female samurai in ornate obsidian armor, standing beneath a blizzard of crimson cherry blossoms. High-contrast lighting hitting the steel of her blade and the iron intensity of her gaze. Cinematic masterpiece.", aesthetic: "Blood Samurai" },
        { title: "The Binary Ghost: Code-Breaker", prompt: "A magnetic young man in a dark hoodie, his face a canvas for cascading emerald code. A high-tech, high-tension atmosphere, shallow depth of field, an enticing mix of digital coldness and human passion.", aesthetic: "Hack-Noir" },

        // --- Fantasy & Myth: The Unholy Divine ---
        { title: "Birch Dryad: The Forest's Whisper", prompt: "A stunningly alluring dryad with skin of silver birch and hair of living autumnal flame. Standing in an ancient, moonlit grove, glowing spores dancing around her form. A magical, siren-like connection to the primal earth.", aesthetic: "Primal Fantasy" },
        { title: "Celestial Seraph: The Burning Wing", prompt: "An incredibly beautiful celestial being with six wings of spun white fire. Draped in translucent silk that glows with divine heat, a gaze that judges and entices. Radiating a terrifying, holy magnetism.", aesthetic: "Divine Horror" },
        { title: "Moonlit Assassin: Twilight Steel", prompt: "A beautiful dark elf with skin like twilight and glowing, ethereal eyes. Wearing obsidian armor that fits like a second skin, perched on a moonlit spire above a gothic city. A dangerous, magnetic shadow of the night.", aesthetic: "Dark Elf Noir" },
        { title: "Coral Nymph: The Turquoise Drown", prompt: "A breathtaking nymph emerging from a neon-turquoise sea, wearing a crown of living, pulsing coral. Water pearling on sun-kissed skin, a gaze that pulls the viewer into the depths. Vibrant, mythological allure.", aesthetic: "Vibrant Myth" },
        { title: "Phoenix Queen: Rebirth in Flame", prompt: "A beautiful person with hair of roaring white flame and skin that glows like a dying star. Wearing a gown woven from smoke and embers, rising from ash with a gaze of absolute power. Elemental magnetism.", aesthetic: "Elemental Queen" },
        { title: "Frost Sovereign: The Ice Heart", prompt: "A breathtakingly beautiful woman with skin of fractured diamond and hair of frozen mist. Wearing a gown made of a thousand shards of ice, standing in a silent blizzard. A cold, intoxicating, and lethal beauty.", aesthetic: "Winter Horror" },
        { title: "Solar God: The Sun's Gaze", prompt: "A magnificent man with skin of burnished gold and eyes like miniature suns. Wearing solar-themed plate armor that radiates a shimmering heat haze. The allure of a god walking through a solar flare.", aesthetic: "Solar Divine" },
        { title: "Faerie Rogue: Gossamer & Venom", prompt: "A beautiful, mischievous faerie with translucent wings that shimmer like oil on water. Perched on a glowing, lethal mushroom in a dark glen. Tiny, intricate details, a whimsical yet dangerous siren call of the fey.", aesthetic: "Twisted Whimsy" },
        { title: "The Soul Weaver: Necromantic Grace", prompt: "A beautifully haunting necromancer with pale, translucent skin and dark vein-like markings. Holding a orb of ethereal green soul-fire that illuminates her intense, magnetic features. A monarch of the dead.", aesthetic: "Necro-Chic" },
        { title: "The Valkyrie: Storm-Bringer", prompt: "A powerful, enticing warrior woman with a silver winged helmet, her hair streaming like thunderclouds. Riding a spectral white horse through a violent storm, lightning reflecting in her fierce eyes.", aesthetic: "Norse Epic" },

        // --- Artistic: The Hypnotic Vision ---
        { title: "Renaissance Muse: Spheroid Radiance", prompt: "A classical oil painting of a devastatingly beautiful woman. Soft sfumato transitions, a gaze that follows the viewer with predatory intent, rich textures of old canvas and drying oil. Timeless, magnetic portraiture.", aesthetic: "Dark Renaissance" },
        { title: "Impressionist Bloom: Sun-Drenched Mist", prompt: "An impressionist painting of a beautiful girl in a sun-soaked garden. Thick, vibrant brushstrokes of light and color, an atmosphere of warm air and floral intoxication. Monet-inspired magic with a magnetic core.", aesthetic: "Impressionist Luxe" },
        { title: "Charcoal Soul: The Raw Perfection", prompt: "A hyper-detailed charcoal drawing of a handsome man's face. Every pore and fleck in the iris captured with raw, smudged intensity. High contrast, an enticingly honest and powerful portrayal of human beauty.", aesthetic: "Charcoal Grit" },
        { title: "Watercolor Dream: The Flowing Spirit", prompt: "A delicate, ethereal watercolor portrait. Colors bleeding like memories, a beautiful gaze emerging from soft pastel washes. A dreamy, fragile, and magnetic artistic vision of the soul.", aesthetic: "Ethereal Watercolor" },
        { title: "Synthwave Siren: Retro-Chrome", prompt: "A vibrant, 80s-inspired illustration of an incredibly beautiful woman with neon pink hair and chrome sunglasses. A digital siren in a world of wireframes and sunsets. High-saturation, nostalgia-fueled allure.", aesthetic: "Retro-Future" },
        { title: "Ghibli Summer: The Wind's Secret", prompt: "Studio Ghibli style portrait of a beautiful girl in a sea of emerald grass. Wind blowing through hair, a hand-painted sky of impossible blues. A nostalgic, heartwarming, and magnetic anime spirit.", aesthetic: "Premium Anime" },
        { title: "Marble Perfected: The Living Statue", prompt: "A hyper-realistic photo of a marble statue so perfect it feels warm to the touch. Smooth, translucent white stone, intricate carving of flowing hair and soul-piercing eyes. A museum-quality siren in stone.", aesthetic: "Classical Perfection" },
        { title: "Pop Art Icon: Saturated Desire", prompt: "A bold, graphic pop art portrait of a beautiful person. High-saturation yellows and violets, halftone patterns, thick ink outlines. An iconic, magnetic, and high-energy artistic showcase of beauty.", aesthetic: "Modern Graphic" },
        { title: "Cosmic Double Exposure: Galaxy Soul", prompt: "A surreal double exposure blending the sharp profile of a beautiful man with the chaotic beauty of a galaxy. Skin made of stars, eyes of voids. An intoxicating, cosmic portrait of universal allure.", aesthetic: "Cosmic Surrealism" },
        { title: "The Ukiyo-e Dream: Ink & Silk", prompt: "A beautiful woman in a complex kimono, rendered in the style of 19th-century Japanese woodblock prints. Flat, elegant colors, flowing ink lines, an atmosphere of traditional, magnetic grace.", aesthetic: "Traditional Mastery" },

        // --- Cultural: The Exotic Magnet ---
        { title: "Maasai Radiance: Gold & Mahogany", prompt: "A stunning Maasai woman with skin that glows like polished mahogany, wearing intricate, vibrant gold beadwork. Standing in the golden tall grass, a proud, magnetic gaze as the sun sets. Raw cultural beauty.", aesthetic: "Cultural Majesty" },
        { title: "Kyoto Geisha: Silk Crane Siren", prompt: "A breathtaking geisha in a kimono of impossible detail—silk woven with silver and gold cranes. Traditional white makeup revealing deep, alluring eyes. Soft, intimate paper-lantern lighting. A siren of history.", aesthetic: "Imperial Traditional" },
        { title: "Hindu Bride: The Fire Dancer", prompt: "A breathtakingly beautiful Indian bride in a red lehenga heavy with gold. Intricate henna designs on her hands, her eyes framed by gold jewelry, reflected in the ceremonial fire. Intoxicating and regal.", aesthetic: "Regal Indian" },
        { title: "Nordic Warrior: Glacier Eyes", prompt: "A handsome Viking with a gaze as blue as ancient ice. Braided beard, fur-lined obsidian armor, standing on the edge of a mist-shrouded fjord. A raw, primal, and magnetic Nordic beauty.", aesthetic: "Primal Nordic" },
        { title: "Andean Soul: The Cloud Muse", prompt: "A beautiful Peruvian girl in vibrant woven textiles. Her face framed by a montera hat, standing before the jagged, snow-capped peaks of the Andes. A sharp, clear-eyed magnetic presence of the mountains.", aesthetic: "Mountain Beauty" },
        { title: "Arabian Night: Kohl & Gold Coin", prompt: "A stunning person with eyes of liquid amber rimmed in thick kohl. Wearing a silk veil decorated with gold coins that catch the desert lantern light. A siren under a canopy of infinite stars.", aesthetic: "Desert Majesty" },
        { title: "Himalayan Serenity: Sky-Spirit", prompt: "A beautiful Tibetan woman with noble features and intense eyes. Wearing coral and turquoise jewelry, standing before prayer flags and the roof of the world. Peacefully, deeply magnetic.", aesthetic: "Himalayan Soul" },
        { title: "Rio Dancer: Feathers & Adrenaline", prompt: "A beautiful Carnival dancer in an explosion of emerald feathers and glittering sequins. Motion blur of celebration, sweat on glowing skin, a vibrant, intoxicating energy of pure joy and beauty.", aesthetic: "Vibrant Festive" },
        { title: "Celtic Mist: The Emerald Maiden", prompt: "A beautiful woman with hair of copper and a gaze of emerald. Wearing a plaid wool shawl, standing in the misty Scottish highlands near an ancient stone circle. A haunting, magnetic Celtic call of the earth.", aesthetic: "Celtic Ethereal" },
        { title: "Hanfu Lotus: Silk & Reflection", prompt: "A stunning woman in a Hanfu dress of translucent silk, standing in a lotus pond. Soft, pastel colors, reflection in the glass-like water, a serene and magnetic traditional beauty.", aesthetic: "Oriental Grace" },

        // --- Dynamic: The Untamable Pulse ---
        { title: "Urban Leap: The Sky-Diver", prompt: "An incredibly beautiful contemporary dancer caught at the apex of a leap between high-rise rooftops. Flowing fabrics trailing like clouds, sunset light hitting her skin, a moment of alluring, impossible grace.", aesthetic: "Urban Action" },
        { title: "Cyber Sprint: The Neon Racer", prompt: "A beautiful futuristic runner in sleek, chrome-accented gear, sprinting through a neon-soaked metropolis. Motion blur of city lights, intense focus in her eyes, a dynamic pulse of high-tech beauty.", aesthetic: "Cyber Dynamic" },
        { title: "Concrete Wave: Skater's Zenith", prompt: "A handsome skateboarder caught in a high-energy trick. Golden flare blinding the lens, casual streetwear, an authentic, magnetic urban energy flowing through every limb. Peak urban magnetism.", aesthetic: "Urban Sport" },
        { title: "Blade Dance: Steel & Shadow", prompt: "A beautiful martial artist in a white gi, her movements creating a splash of water in mid-air. Sharp focus on the cold steel of the katana and her intoxicating, intense gaze of warrior grace.", aesthetic: "Zen Action" },
        { title: "Rockstar Pulse: The Stage Siren", prompt: "A stunning lead singer illuminated by the chaotic strobe lights of a stadium. Sweat on skin, hair flying, a raw, magnetic siren call of music and adrenaline. High-energy concert masterpiece.", aesthetic: "Music Icon" },
        { title: "Inside the Blue: The Wave's Heart", prompt: "A very beautiful surfer tucked inside the emerald tube of a massive wave. Sunlight refracting through the water, spray hanging in the air like crushed diamonds. A portrait of alluring, primal focus.", aesthetic: "Ocean Action" },
        { title: "Skyscraper Edge: Height of Beauty", prompt: "A beautiful athlete jumping across a canyon of concrete and glass. Thousands of feet above the city, intense focus, an athletic body in a moment of extreme, magnetic tension. Dynamic angle.", aesthetic: "Extreme Action" },
        { title: "Fire Hoop: The Flame Dancer", prompt: "A beautiful acrobat performing with a ring of roaring fire. Long exposure light trails of orange and yellow, a dark background, a dangerous and intoxicating display of peak human skill.", aesthetic: "Fire Performance" },
        { title: "Neon Racer: The Night Blur", prompt: "A beautiful woman on a sleek black motorcycle, a blur of leather and chrome against bokehed city lights. Wind-swept hair, a gaze of pure adrenaline, the magnetic allure of dark speed.", aesthetic: "Automotive Noir" },
        { title: "Fencer's Gaze: Reflection of Steel", prompt: "A stunning fencer with her mask removed, revealing beads of sweat and an intense, magnetic stare. Dramatic side lighting hitting her white suit and the silver blade. Athletic, enticing elegance.", aesthetic: "Elite Sport" },

        // --- Ethereal: The Intoxicating Dream ---
        { title: "Lavender Twilight: Purple Mist", prompt: "A very beautiful woman wading through an endless sea of lavender. Soft purple and gold light, a dreamy, intoxicating atmosphere of pure peace and magnetic stillness. Ethereal masterpiece.", aesthetic: "Soft Ethereal" },
        { title: "Moon Prop: Stardust & Lace", prompt: "An incredibly beautiful person sitting on a giant glowing crescent moon. Wearing a dress of living starlight that drips glittering particles. A soft, magical, and magnetic dreamscape of the night sky.", aesthetic: "Dreamscape" },
        { title: "Cloud Nymph: The Pastel Sky", prompt: "A beautiful girl resting on a fluffy white cloud in a sky of pink and peach. Ethereal, translucent fabrics floating around her, a whimsical, magnetic gaze of pure serenity and wonder.", aesthetic: "Surreal Dream" },
        { title: "Sunbeam Portrait: The Golden Attic", prompt: "Close-up of a beautiful face hit by a singular, intense beam of light in a dark, dusty room. Floating gold dust motes, soft focus, a soulful, alluring expression of quiet and magnetic beauty.", aesthetic: "Cinematic Light" },
        { title: "Winter Whisper: Ice Siren", prompt: "A breathtakingly beautiful woman with flakes of snow on her eyelashes. Draped in soft white fur, eyes of piercing ice, standing in a silent pine forest. A serene, शीतकालीन siren of the north.", aesthetic: "Winter Fantasy" },
        { title: "Floral Queen: The Peony Bloom", prompt: "A very beautiful person with a massive, intricate crown of fresh peonies. Soft morning light catching the dew on the petals and her glowing skin. A romantic, magnetic vision of natural spring beauty.", aesthetic: "Romantic Nature" },
        { title: "Dawn Lake: Silk & Morning Mist", prompt: "A beautiful woman in a light silk robe standing on a pier at dawn. Mist swirling around her ankles, a reflection in the glassy water, a peaceful and intoxicatingly beautiful silence. Serene allure.", aesthetic: "Serene Ethereal" },
        { title: "Butterfly Storm: Monarch Grace", prompt: "A stunning person surrounded by a kaleidoscope of monarch butterflies. Perched on their lips and hair, vibrant colors against soft sun-kissed skin. A magical, magnetic realism of beauty.", aesthetic: "Magic Realism" },
        { title: "Fairy Light Glow: Night Whisper", prompt: "A beautiful girl wrapped in a tangled string of warm, glowing fairy lights. Soft bokeh of a night garden, a warm, intimate glow on her skin and in her enticing, dreamy eyes.", aesthetic: "Cozy Allure" },
        { title: "Galaxy Weaver: The Cosmic Tress", prompt: "Portrait of a beautiful woman whose flowing hair transforms into a swirling nebula. Glowing stars embedded in her tresses, a gaze of cosmic depth and magnetic surrealism. A beauty from the stars.", aesthetic: "Cosmic Beauty" },

        // --- Urban: The Raw Pulse ---
        { title: "Tokyo Rain: Neon Plastic", prompt: "A beautiful person in a transparent raincoat standing under the glow of Shinjuku. Reflections of pink and blue in the plastic and on their wet skin. A futuristic, seductive urban pulse of the city.", aesthetic: "Cyber-Urban" },
        { title: "Brooklyn Grit: Rooftop Sovereign", prompt: "A handsome man in high-end streetwear, leaning against a graffiti-scarred wall. The Manhattan skyline blurring behind him at dusk. A casual, magnetic cool of the concrete jungle. Street editorial.", aesthetic: "Urban Streetwear" },
        { title: "Subway Noir: Midnight Carriage", prompt: "A stunning woman sitting in a derelict subway car, illuminated by harsh, flickering lights. High contrast shadows, an atmosphere of gritty, enticing urban mystery and human resilience.", aesthetic: "Gritty Noir" },
        { title: "Skater Sunset: Rebellion & Gold", prompt: "A beautiful girl with a beat-up skateboard and a gaze of pure rebellion. Golden hour at a concrete skatepark, lens flare washing out edges. Authentic, magnetic street style masterpiece.", aesthetic: "Street Rebellion" },
        { title: "Cyber-Bazaar: Neon & Smoke", prompt: "A beautiful man with glowing tech-tattoos on his jawline, standing in a crowded night market. Smoke, neon, and a dense, magnetic urban atmosphere. Deep focus on the fusion of human and machine.", aesthetic: "Cyber-Street" },
        { title: "The Vandal: Creative Chaos", prompt: "A beautiful artist with spray paint on her skin and a gaze of intense creation. Standing before a massive, chaotic mural. A candid, magnetic burst of urban creative energy and beauty.", aesthetic: "Urban Creative" },
        { title: "Night Market Muse: Steam & Light", prompt: "A stunningly beautiful person in a bustling night market. Steam from a street stall veiling their face, colorful bokehed lights, a warm, magnetic, and lively urban scene of desire.", aesthetic: "Candid Market" },
        { title: "Vertigo: Skyscraper Sovereign", prompt: "A beautiful person sitting on the edge of a skyscraper, legs dangling over lights. A sense of scale, danger, and magnetic freedom under the night sky. The pinnacle of urban allure.", aesthetic: "Extreme Urban" },
        { title: "White Contrast: Alley Couture", prompt: "A very beautiful woman in professional white couture standing in a filthy, vibrant graffiti alley. Sharp focus, high fashion meeting the street in a magnetic and beautiful collision.", aesthetic: "High-Fashion Street" },
        { title: "90s Grunge: Muted Intensity", prompt: "A handsome model in a 90s grunge aesthetic. Oversized flannel, heavy boots, and a gaze of bored, magnetic intensity. Film grain, muted tones, an authentic retro urban pulse.", aesthetic: "Retro Grunge" },

        // --- Nature: Primal Magic ---
        { title: "Desert Spirit: Red Rock Muse", prompt: "A stunning woman with skin of deep copper and eyes of fire, wearing flowing ochre linens. Standing in a vast desert canyon, the red rocks swirling around her magnetic and ancient presence.", aesthetic: "Ancient Desert" },
        { title: "Alpine Peak: The Summit Gaze", prompt: "A beautiful mountain climber on a jagged peak at sunrise. Frost in hair, skin flushed with cold and triumph, a magnetic gaze overlooking the world from the top. High-detail adventure.", aesthetic: "Mountain Peak" },
        { title: "Jungle Shadow: Primal Gaze", prompt: "A breathtakingly beautiful person partially hidden by the massive leaves of a rainforest. Sun-dappled skin, a gaze of primal, magnetic mystery and untamed nature. Exotic allure.", aesthetic: "Jungle Allure" },
        { title: "Ocean Cliff: Storm-Chaser", prompt: "A beautiful man with wind-whipped hair standing on a cliff edge. Crashing waves, salt spray, a raw, magnetic connection between the human soul and the sea. Primal coastal beauty.", aesthetic: "Coastal Primal" },
        { title: "Autumn Queen: Amber & Leaf", prompt: "A stunning girl in an oversized amber sweater, surrounded by a blizzard of falling leaves. Warm, soft light, an intoxicatingly cozy and beautiful autumn scene of magnetic warmth.", aesthetic: "Premium Autumn" },
        { title: "Magma Muse: Volcanic Soul", prompt: "A beautiful person with skin of smoke-grey and eyes of glowing lava. Standing on a black volcanic beach with steam rising. Powerful, elemental magnetism and forbidden beauty.", aesthetic: "Volcanic Allure" },
        { title: "Antelope Canyon: Silk Sandstone", prompt: "A beautiful woman in flowing white silk walking through a narrow sandstone canyon. The rocks glowing like embers, light filtering from above, a serene and magnetic natural temple of beauty.", aesthetic: "Serene Nature" },
        { title: "Twilight Bayou: The Willow Siren", prompt: "A hauntingly beautiful person in a cypress swamp at twilight. Hanging moss, glowing fireflies, a gaze that pulls you into the still waters. A magnetic and dark bayou siren.", aesthetic: "Gothic Bayou" },
        { title: "Savannah King: Red Sun Silhouette", prompt: "A beautiful man standing in the African savannah beneath an acacia tree. The giant red sun silhouetting his magnetic form. A raw, majestic, and powerful vision of cultural beauty.", aesthetic: "Savannah Majesty" },
        { title: "Aurora Gaze: The Celestial Sky", prompt: "A stunning person looking up as the Aurora Borealis dances in ribbons of green. The celestial light reflecting in their alluring eyes. Pure, magnetic and cosmic wonder.", aesthetic: "Aurora Allure" },

        // --- Unique: The Forbidden Fusion ---
        { title: "Cyber-Geisha: Neon Ceremony", prompt: "A beautiful fusion of porcelain tradition and high-tech future. Silver circuit patterns on skin, holographic fans, a magnetic and unsettlingly beautiful tea ceremony in a neon world.", aesthetic: "Cyber-Tradition" },
        { title: "Steampunk Workshop: Brass Siren", prompt: "An incredibly beautiful woman with brass goggles and a gaze of intense intelligence. Surrounded by gears and steam, wearing a leather corset. A magnetic steampunk temptress of machinery.", aesthetic: "Steampunk Allure" },
        { title: "Solarpunk Utopia: Leaf & Glass", prompt: "A beautiful person in a bright city reclaimed by nature. White and gold fabrics, a gaze of optimistic, magnetic brilliance. The alluring future of humanity in harmony with earth.", aesthetic: "Solarpunk Allure" },
        { title: "Alien Pioneer: Red World Sunset", prompt: "A stunning astronaut on a planet of red sand and dual suns. Reflection of the alien horizon in her visor, a magnetic gaze of wonder and cosmic isolation. High-detail sci-fi beauty.", aesthetic: "Sci-Fi Siren" },
        { title: "Velvet Throne: Dark Prince", prompt: "A beautiful man with long, ink-black hair sitting on a jagged gothic throne. Wearing an ornate velvet suit, surrounded by cathedral shadows. A dark, magnetic prince of the night.", aesthetic: "Gothic Royalty" },
        { title: "The Nomad: Caravan & Coin", prompt: "A beautiful woman with layered silver jewelry and flowing scarves, standing by a colorful caravan. Sunset light, a gaze of wandering, magnetic freedom and romantic mystery.", aesthetic: "Nomadic Allure" },
        { title: "Tech Surgeon: Laser Precision", prompt: "A beautiful woman in a high-tech medical suite, features carved by blue surgical lasers. Immaculate, sharp, and intoxicatingly precise futuristic beauty. A siren of the laboratory.", aesthetic: "Tech-Chic" },
        { title: "Golden Faun: The Glade's Secret", prompt: "A beautiful faun with small curled horns and a gaze of pure enchantment. Playing a golden flute in a sunlit forest glade. A whimsical, magnetic mythological vision of desire.", aesthetic: "Mythic Allure" },
        { title: "Baroque Excess: Gold & Candlelight", prompt: "A portrait of a stunning man in 18th-century Baroque finery. Extreme detail on gold embroidery and pearls, dramatic candlelight, an atmosphere of magnetic opulence and decadence.", aesthetic: "Baroque Noir" },
        { title: "Prism Reflection: Rainbow Muse", prompt: "A face of a beautiful woman hit by the light of a crystal prism, exploding into a rainbow of colors. Creative, magnetic, and high-variance artistic lighting of a siren's soul.", aesthetic: "Spectrum Allure" }
    ];
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generateWithZImage(prompt) {
    console.log(`   [ZIT-BASE] Submitting: ${prompt.substring(0, 50)}...`);

    const body = {
        prompt,
        steps: 30, // High quality, verified stable in sequential mode
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
                console.log("\n   [ZIT-BASE] ✓ Received Image Buffer");
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

async function processAndUpload(imageBuffer, prompt, title, index, aesthetic = "Kawaii Cosplay") {
    const sharpImg = sharp(imageBuffer);
    const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
    const thumbBuffer = await sharpImg.resize(512, 512, { fit: "inside" }).webp({ quality: 80 }).toBuffer();
    const lqipBuffer = await sharpImg.resize(20, 20, { fit: "inside" }).webp({ quality: 20 }).toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;

    const timestamp = Date.now();
    const baseKey = `showcase/${MODEL_ID}/${timestamp}_${index}`;
    const originalKey = `${baseKey}.webp`;
    const thumbKey = `${baseKey}_thumb.webp`;

    await Promise.all([
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalKey, Body: webpBuffer, ContentType: "image/webp" })),
        s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" }))
    ]);

    const imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalKey}`;
    const thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbKey}`;

    const docData = {
        modelId: MODEL_ID,
        prompt,
        title,
        imageUrl,
        url: imageUrl,
        thumbnailUrl,
        lqip,
        createdAt: FieldValue.serverTimestamp(),
        userId: "system_kawaii_showcase_script",
        likesCount: Math.floor(Math.random() * 50) + 15,
        bookmarksCount: Math.floor(Math.random() * 10) + 2,
        isElite: true,
        aesthetic: aesthetic
    };

    await db.collection("model_showcase_images").add(docData);
    return imageUrl;
}

async function main() {
    console.log("=== Z-IMAGE BASE CAPABILITY SHOWCASE ===");
    console.log(`Model: ${MODEL_ID}`);

    const prompts = await loadPrompts();
    console.log(`Total Prompts: ${prompts.length}\n`);

    for (let i = 0; i < prompts.length; i += CONCURRENCY) {
        const batch = prompts.slice(i, i + CONCURRENCY);
        console.log(`\nProcessing batch ${Math.floor(i / CONCURRENCY) + 1} (${batch.length} items)...`);

        await Promise.all(batch.map(async (item, idx) => {
            const globalIdx = i + idx;
            try {
                const imageBuffer = await generateWithZImage(item.prompt);
                const url = await processAndUpload(imageBuffer, item.prompt, item.title, globalIdx, item.aesthetic);
                console.log(`   [${globalIdx + 1}] ✓ ${url}`);
            } catch (err) {
                console.error(`   [${globalIdx + 1}] ✗ ${err.message}`);
            }
        }));

        if (i + CONCURRENCY < prompts.length) {
            console.log("Waiting between batches...");
            await sleep(5000);
        }
    }

    console.log("\n=== SHOWCASE COMPLETE ===");
}

main().catch(console.error);
