
export const getOptimizedImageUrl = (url) => {
    if (!url) return url;
    // Check if it's a raw Backblaze B2 public URL
    // We replace the specific bucket path to the CDN root
    if (url.includes('f005.backblazeb2.com/file/printeregg')) {
        return url.replace('https://f005.backblazeb2.com', 'https://cdn.dreambeesai.com');
    }

    // Fix malformed CDN URLs that are missing the bucket path
    if (url.startsWith('https://cdn.dreambeesai.com/generated/')) {
        return url.replace('https://cdn.dreambeesai.com/generated/', 'https://cdn.dreambeesai.com/file/printeregg/generated/');
    }

    return url;
};
const RANDOM_PROMPTS = [
    "A futuristic city with neon lights reflecting on wet pavement, cybernetic citizens walking, towering skyscrapers, cinematic lighting, 8k resolution.",
    "A serene japanese garden with cherry blossoms falling, a koi pond, traditional architecture, soft sunlight, highly detailed.",
    "Portrait of an astronaut floating in deep space, nebula background, reflective visor, high tech suit, photorealistic.",
    "A magical forest with glowing mushrooms, fairies, ancient trees with faces, ethereal atmosphere, fantasy art style.",
    "Cyberpunk street food vendor in Tokyo, steam rising from food, rain, neon signs in kanji, detailed textures.",
    "A steampunk airship flying over a victorian city, gears and brass, clouds, sunset, detailed mechanical parts.",
    "Post-apocalyptic landscape, overgrown ruins of a city, nature reclaiming, sunset, melancholic atmosphere.",
    "A cute robot watering plants in a greenhouse, sunlight streaming through glass, vibrant colors, pixar style.",
    "An underwater city with bioluminescent creatures, coral reefs, mermaid architecture, deep blue ocean.",
    "A fierce dragon perched on a mountain peak, breathing fire, snow capped mountains, epic scale, fantasy illustration.",
    "Abstract composition of swirling colors, liquid metal, glass textures, ray tracing, 3d render.",
    "A cozy cabin in the snowy mountains, warm light from windows, pine trees, starry night sky.",
    "Double exposure portrait of a woman and a forest, nature blending with human features, artistic, surreal.",
    "A retro synthwave landscape, grid floor, purple sun, mountains, 80s aesthetic, vhs glitch effect.",
    "Macro shot of a dew drop on a spider web, morning light, bokeh background, extreme detail."
];

const ENHANCERS = [
    "highly detailed", "8k resolution", "cinematic lighting", "photorealistic",
    "masterpiece", "best quality", "ultra realistic", "HDR", "vivid colors",
    "sharp focus", "intricate details", "professional photography"
];

export const getRandomPrompt = () => {
    return RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
};

export const getEnhancedPrompt = (currentPrompt) => {
    if (!currentPrompt) return currentPrompt;

    // Shuffle enhancers and pick 3-4 distinct ones
    const shuffled = [...ENHANCERS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    // Join unique added terms
    const textToAdd = selected.filter(term => !currentPrompt.toLowerCase().includes(term.toLowerCase())).join(", ");

    if (!textToAdd) return currentPrompt;
    return `${currentPrompt}, ${textToAdd}`;
};
