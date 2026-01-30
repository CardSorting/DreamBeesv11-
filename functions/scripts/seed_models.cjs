
const admin = require('firebase-admin');

// Use Application Default Credentials (gcloud auth application-default login)
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dreambees-alchemist'
});

const db = admin.firestore();

const MODELS = [

    {
        id: 'nova-furry-xl',
        name: 'Nova Furry XL',
        description: 'Optimized for furry art and anthropomorphic characters. Auto-tags quality prompts.',
        type: 'SDXL',
        order: 3,
        isActive: true
    },
    {
        id: 'perfect-illustrious',
        name: 'Perfect Illustrious',
        description: 'Refined illustration model focusing on detailed textures and lighting.',
        type: 'SDXL',
        order: 4,
        isActive: true
    },
    {
        id: 'gray-color',
        name: 'Gray Color',
        description: 'Unique style focusing on grayscale and monochromatic aesthetics.',
        type: 'SDXL',
        order: 5,
        isActive: true
    },
    {
        id: 'scyrax-pastel',
        name: 'Scyrax Pastel',
        description: 'Soft, pastel color palettes and dreamy atmospheres.',
        type: 'SDXL',
        order: 6,
        isActive: true
    },
    {
        id: 'ani-detox',
        name: 'Ani Detox',
        description: 'Clean, crisp anime style with high detail.',
        type: 'SDXL',
        order: 7,
        isActive: true
    },
    {
        id: 'animij-v7',
        name: 'Animij V7',
        description: 'The latest version of the popular Animij model for anime art.',
        type: 'SDXL',
        order: 8,
        isActive: true
    },
    {
        id: 'swijtspot-no1',
        name: 'Swijtspot No. 1',
        description: 'Artistic model with a distinct, painterly touch.',
        type: 'SDXL',
        order: 9,
        isActive: true
    },
    {
        id: 'zit-model',
        name: 'Z-Image-Turbo',
        description: 'Ultra-fast generation model optimized for low latency.',
        type: 'SDXL', // Kept as SDXL for UI compatibility for now, or use 'ZIT' if UI handles it. Using SDXL to ensure it shows up in default filters.
        order: 10,
        isActive: true,
        image: 'https://cdn.dreambeesai.com/file/printeregg/showcase/zit-model/1769040774566_0.webp'
    },
    {
        id: 'zit-base-model',
        name: 'Z-Image Base',
        description: 'High-quality stable base model for hyper-realistic and cinematic generations.',
        type: 'SDXL',
        order: 11,
        isActive: true,
        image: '/showcase/zit-base-model/cover.png',
        tags: ['realistic', 'cinematic', 'high-quality', 'base']
    },

    {
        id: 'wai-illustrious',
        name: 'Wai Illustrious',
        description: 'High-quality illustrations with enforced quality tags and custom High-Res Fix workflow.',
        type: 'SDXL',
        order: 12,
        isActive: true,
        image: 'https://cdn.dreambeesai.com/file/printeregg/assets/landing/wai_illustrious_preview.png'
    },
    {
        id: 'lightricks-ltx-2-pro',
        name: 'LTX 2 Pro',
        description: 'High-quality video generation model by Lightricks.',
        type: 'Video',
        category: 'reels', // Frontend identifier for currency/logic
        order: 13,
        isActive: true
    },
    {
        id: 'flux-klein-4b',
        name: 'Flux 4B (Klein)',
        description: 'Fast and efficient FLUX model variant (4B parameters).',
        type: 'Flux',
        order: 14,
        isActive: true,
        hideFromGenerator: true // Hidden from manual selection, used for Remix/Edit only
    },
    {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash (Image)',
        description: 'Google\'s fastest multimodal model, optimized for speed and visual quality.',
        type: 'Gemini',
        order: 15,
        isActive: true,
        image: 'https://cdn.dreambeesai.com/file/printeregg/showcase/gemini-2.5-flash-image/1769040312885_0.webp'
    },
    {
        id: 'flux-2-dev',
        name: 'Flux 2 Dev',
        description: 'Next-generation image synthesis with superior detail and prompt adherence by Black Forest Labs.',
        type: 'Flux',
        order: 16,
        isActive: true,
        image: 'https://cdn.dreambeesai.com/file/printeregg/assets/landing/flux_2_dev_preview.png'
    }
];

async function seedModels() {
    const collectionRef = db.collection('models');

    console.log(`Starting seed of ${MODELS.length} models...`);

    for (const model of MODELS) {
        const docRef = collectionRef.doc(model.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            await docRef.set(model);
            console.log(`✓ Created model: ${model.name} (${model.id})`);
        } else {
            // Update existing model with new config
            await docRef.set(model, { merge: true });
            console.log(`↻ Updated model: ${model.name} (${model.id})`);
        }
    }

    console.log('Seed complete.');
}

seedModels().catch(console.error);
