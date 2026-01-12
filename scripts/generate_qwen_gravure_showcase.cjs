
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '../public/showcase/qwen-gravure');
const MANIFEST_PATH = path.join(TARGET_DIR, 'manifest.json');
const ENDPOINT = "https://mariecoderinc--qwen-image-2512-qwenimage-api-generate.modal.run";

const BASE_PROMPTS = [
    // 🌿 Indoor Soft Gravure (Peak Allure)
    "Golden-hour bedroom surrender — Early-20s woman reclined against pillows, thin cotton shirt unbuttoned almost to navel, fabric parted wide to expose the soft inner curves of her breasts and the delicate line down her sternum, knees drawn up high so the hem pools at upper thighs, golden light caressing every inch of flushed skin, heavy-lidded eyes locked on camera, lips parted in a slow, silent exhale, one hand resting just below her navel as if inviting the gaze lower",
    "Tatami dawn intimacy — Kneeling with hips tilted forward, yukata completely untied and draped open across her shoulders like fallen silk, bare skin glowing in soft morning light, nipples subtly peaked from the cool air, one hand trailing fingers along her own inner thigh, gaze starting low then slowly rising, dark and liquid, throat working with a quiet swallow",
    "Sheer-curtain revelation — Standing in profile against bright window, ultra-thin sleep shirt completely backlit and clinging like second skin, every curve outlined in exquisite detail — the gentle swell of breasts, dip of waist, flare of hips — fabric translucent enough to hint at the shadow between thighs, looking back over shoulder with half-smile and eyes that smolder, hair cascading down bare back",
    "Velvet sofa dusk desire — Legs tucked under her, costume top slipped completely off shoulders and pooled at elbows, arms crossed beneath breasts to lift and frame them perfectly, warm rim light tracing the soft underside and creating delicate shadows, chest rising and falling visibly, tongue slowly wetting lower lip, gaze heavy and unwavering",
    "Morning bed-edge tease — Sitting on mattress edge, knees wide apart, oversized shirt hiked to the very top of thighs, bare skin meeting lace panties just visible at the hem, one hand lazily dragging the fabric higher inch by inch, soft morning light highlighting the gentle tremble in her thighs, eyes direct, pupils dilated, small private smile that says \"watch me\"",

    // 🎀 Idol / Costume Gravure (Private Intensity)
    "Post-performance undress — Dressing room chair, elaborate idol costume unzipped to waist, satin falling open to reveal lace bralette soaked with light sweat, nipples visible through sheer fabric, chest heaving from recent performance, fingers tracing slow circles around the zipper pull, eyes half-closed in lingering adrenaline high, flushed cheeks and parted lips",
    "Backstage ribbon intimacy — Corset half-laced, ribbons trailing across bare stomach and dipping low between breasts, one breast fully exposed except for the desperate edge of satin, breath shallow and quick, looking down at her own skin then up into camera with wide, dark eyes and bitten lip, throat glistening",
    "Magical girl on rug — Skirt fanned wide, top ties completely undone so neckline plunges to navel, one strap fallen, pale skin flushed pink in pastel light, knees bent outward in relaxed position revealing soft inner thighs, innocent face contrasting with the slow, confident stroke of her own collarbone → sternum → pausing just above the ribbon bow, gaze steady and inviting",
    "Off-stage idol cross-legged — Frilly skirt ridden high to show lace thigh-high tops and bare skin above, jacket open wide, damp hair clinging to neck and collarbone, one finger absently circling the edge of her bra cup, small bead of sweat trailing down cleavage, eyes sparkling with post-show heat, lips curved in quiet promise",

    // 🐰 Costume Gravure (Velvet Heat)
    "Side-lying bunny — On plush carpet, upper leg bent forward dramatically, high-cut bodysuit stretched taut across hips and creating perfect tension lines, satin ears tilted, fluffy tail cushion arching her lower back, looking back over shoulder with molten eye contact, lips slightly parted, slow blink",
    "Seated bunny tension — Legs spread elegantly wide on low stool, corset loosened three hooks so soft flesh spills gently over the top, one hand resting high on inner thigh (fingers splayed, not touching), satin bow at throat rising with deep breaths, gaze heavy-lidded and direct, small teasing smile",
    "Prone bunny arch — Lying stomach-down on oversized cushion, back deeply arched, costume back cut so low the dimples above hips and upper curve of rear are fully exposed, long legs extended and crossed at ankles, fluffy tail framing the view, chin on forearms, looking back with slow, knowing smirk",
    "Wall bunny contrapposto — Standing with one hip cocked sharply, hand lifting hair to expose long neck and sensitive spot behind ear, bodysuit clinging from body heat and outlining every curve, side lighting carving the elegant S-line from shoulder to ankle, eyes downcast but lips curved in silent invitation",
    "Reclining bunny slow burn — Against mountain of pillows, one knee raised high and wide showing inner thigh all the way up to lace edge, costume straps slipped off shoulders, chest gently heaving, fingers trailing deliberately from collarbone → sternum → pausing at the bow between breasts, gaze locked and time-stopping, the air thick with unspoken promise"
];

const MASTER_ANCHOR = "modern Japanese gravure style (2020s), young adult woman (early 20s), youthful idol appearance, smooth clear skin, fresh natural makeup, soft natural lighting, intimate candid framing, relaxed casual pose, gentle eye contact, tasteful gravure mood, non-explicit";

const CAMERA_LOCKS = [
    "shot on DSLR, 50mm lens",
    "shallow depth of field",
    "natural skin texture, soft highlights",
    "indoor daylight, window light",
    "subtle film softness"
];

const NEGATIVE_PROMPT = "no illustration, no anime art, no editorial fashion, no mature appearance, no heavy makeup, no harsh lighting, no exaggerated poses, no studio flash";

// Helper to get 2-3 random camera locks
function getRandomLocks() {
    const shuffled = [...CAMERA_LOCKS].sort(() => 0.5 - Math.random());
    const count = 2 + Math.floor(Math.random() * 2); // 2 or 3
    return shuffled.slice(0, count).join(", ");
}

// Ensure directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function generateAndSave(basePrompt, index) {
    // Assembly: Base + Anchor + Locks
    const locks = getRandomLocks();
    const fullPrompt = `${basePrompt}, ${MASTER_ANCHOR}, ${locks}`;

    console.log(`[${index + 1}/${BASE_PROMPTS.length}] Generating...`);
    // console.log(`Prompt: ${fullPrompt}`);

    const body = {
        prompt: fullPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        aspect_ratio: "2:3" // Gravure is often portrait, but showcase usually 1:1. User didn't specify AR, but 'photobook' often implies portrait. Let's stick to 2:3 or 1:1. The previous script used 1:1. "Gravure photobook" feels like 2:3 or 3:4. Let's try 2:3 for variety if supported, otherwise 1:1. The API doc says aspect_ratio key exists. Safe bet is 2:3 for "portrait" feel requested by "photobook/gravure". 
        // Wait, showcase tiles in Gallery.jsx are square/grid. 1:1 is safer for the grid layout unless masonry. Gallery.jsx uses `img.aspectRatio ? img.aspectRatio.replace(':', '/') : '1/1'`. So it supports others. 2:3 requires `aspect_ratio: "2:3"`.
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
        const filename = index === 0 ? 'cover.png' : `${Date.now()}_${index}.png`;
        const filePath = path.join(TARGET_DIR, filename);

        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`  Saved to ${filename}`);

        return {
            url: `/showcase/qwen-gravure/${filename}`,
            prompt: fullPrompt, // Store full prompt for reference
            base_prompt: basePrompt,
            modelId: 'qwen-image-2512',
            aspectRatio: "2:3",
            creator: { user: 'Grok', model: 'Qwen 2.5 12B' }
        };
    } catch (err) {
        console.error(`  Failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("Starting Qwen Gravure Showcase Generation...");
    const manifest = [];

    for (let i = 0; i < BASE_PROMPTS.length; i++) {
        const result = await generateAndSave(BASE_PROMPTS[i], i);
        if (result) {
            manifest.push(result);
        }
        await new Promise(r => setTimeout(r, 1000));
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nDone! Manifest written to ${MANIFEST_PATH} with ${manifest.length} items.`);
}

run();
