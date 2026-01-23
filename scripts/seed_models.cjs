const admin = require('firebase-admin');

admin.initializeApp({
    projectId: 'dreambees-alchemist'
});

const db = admin.firestore();

const MODELS = [
    {
        id: 'nova-furry-xl',
        name: 'Nova Furry XL',
        description: 'Optimized for furry art and anthropomorphic characters.',
        type: 'SDXL',
        order: 3,
        isActive: true,
        tags: ['Furry', 'Art', 'Character']
    },
    {
        id: 'perfect-illustrious',
        name: 'Perfect Illustrious',
        description: 'Refined illustration model focusing on detailed textures and lighting.',
        type: 'SDXL',
        order: 4,
        isActive: true,
        tags: ['Art', 'Illustration', 'Detailed']
    },
    {
        id: 'gray-color',
        name: 'Gray Color',
        description: 'Unique style focusing on grayscale and monochromatic aesthetics.',
        type: 'SDXL',
        order: 5,
        isActive: true,
        tags: ['Art', 'Monochrome', 'Stylish']
    },
    {
        id: 'scyrax-pastel',
        name: 'Scyrax Pastel',
        description: 'Soft, pastel color palettes and dreamy atmospheres.',
        type: 'SDXL',
        order: 6,
        isActive: true,
        tags: ['Art', 'Pastel', 'Soft']
    },
    {
        id: 'ani-detox',
        name: 'Ani Detox',
        description: 'Clean, crisp anime style with high detail.',
        type: 'SDXL',
        order: 7,
        isActive: true,
        tags: ['Anime', 'Clean', '2D']
    },
    {
        id: 'animij-v7',
        name: 'Animij V7',
        description: 'The latest version of the popular Animij model for anime art.',
        type: 'SDXL',
        order: 8,
        isActive: true,
        tags: ['Anime', 'Vibrant', '2D']
    },
    {
        id: 'swijtspot-no1',
        name: 'Swijtspot No. 1',
        description: 'Artistic model with a distinct, painterly touch.',
        type: 'SDXL',
        order: 9,
        isActive: true,
        tags: ['Art', 'Painting', 'Abstract']
    },
    {
        id: 'zit-model',
        name: 'Z-Image-Turbo',
        description: 'Ultra-fast generation model optimized for low latency.',
        type: 'SDXL',
        order: 10,
        isActive: true,
        tags: ['Realistic', 'Fast', 'Photo']
    },

    {
        id: 'wai-illustrious',
        name: 'Wai Illustrious',
        description: 'High-quality illustrations with enforced quality tags.',
        type: 'SDXL',
        order: 12,
        isActive: true,
        image: '/showcase/wai-illustrious/cover.png',
        tags: ['Art', 'Illustration', 'Anime']
    },
    {
        id: 'rin-anime-blend',
        name: 'Rin Anime Blend',
        description: 'A smooth blend of popular anime models for high-quality results.',
        type: 'SDXL',
        order: 14,
        isActive: true,
        tags: ['Anime', 'Blend', 'Soft']
    },
    {
        id: 'rin-anime-popcute',
        name: 'Rin Anime Popcute',
        description: 'Bright, vibrant, and cute anime style with popping colors.',
        type: 'SDXL',
        order: 15,
        isActive: true,
        tags: ['Anime', 'Cute', 'Vibrant']
    },
    {
        id: 'lightricks-ltx-2-pro',
        name: 'LTX 2 Pro',
        description: 'High-quality video generation model by Lightricks.',
        type: 'Video',
        category: 'reels',
        order: 16,
        isActive: true,
        tags: ['Video', 'Realistic', 'Motion']
    },
    {
        id: 'flux-klein-4b',
        name: 'Flux 4B (Klein)',
        description: 'Fast and efficient FLUX model variant (4B parameters).',
        type: 'Flux',
        order: 17,
        isActive: true,
        tags: ['Fast', 'Efficient', 'Flux']
    },
    {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash (Image)',
        description: 'Google\'s fastest multimodal model, optimized for speed and visual quality.',
        type: 'Gemini',
        order: 18,
        isActive: true,
        tags: ['Fast', 'Google', 'Multimodal']
    },
    {
        id: 'crystal-cuteness',
        name: 'Crystal Cuteness',
        description: 'Adorable and sparkling aesthetics for high-quality cute art.',
        type: 'SDXL',
        order: 19,
        isActive: true,
        image: '/showcase/crystal-cuteness/cover.png',
        tags: ['Cute', 'Sparkling', 'Art']
    },
    {
        id: 'veretoon-v10',
        name: 'Veretoon V1.0',
        description: 'Vibrant toon-style illustrations with clean outlines.',
        type: 'SDXL',
        order: 20,
        isActive: true,
        image: '/showcase/veretoon-v10/cover.png',
        tags: ['Toon', 'Anime', 'Vibrant']
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
            // Update existing model with new config (Tags etc)
            await docRef.set(model, { merge: true });
            console.log(`↻ Updated model: ${model.name} (${model.id})`);
        }
    }

    console.log('Seed complete.');
}

seedModels().catch(console.error);
