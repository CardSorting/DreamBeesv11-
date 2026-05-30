
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
        id: 'wai-illustrious',
        name: 'Wai Illustrious',
        description: 'High-quality illustrations with enforced quality tags and custom High-Res Fix workflow.',
        type: 'SDXL',
        order: 12,
        isActive: true,
        image: 'https://cdn.dreambeesai.com/file/printeregg/assets/landing/wai_illustrious_preview.png'
    },
    {
        id: 'rin-anime-blend',
        name: 'Rin Anime Blend',
        description: 'A smooth blend of popular anime models for high-quality results.',
        type: 'SDXL',
        order: 14,
        isActive: true
    },
    {
        id: 'rin-anime-popcute',
        name: 'Rin Anime Popcute',
        description: 'Bright, vibrant, and cute anime style with popping colors.',
        type: 'SDXL',
        order: 15,
        isActive: true
    },
    {
        id: 'z-image-turbo-a100',
        name: 'Z-Image Turbo',
        description: 'Ultra-fast image generation model optimized for quick iteration on A100 GPUs.',
        type: 'Image',
        order: 17,
        isActive: true,
        image: 'https://dreambees-alchemist.web.app/assets/styles/hr_core.png',
        thumbnail: 'https://dreambees-alchemist.web.app/assets/styles/hr_core.png',
        previewImages: ['https://dreambees-alchemist.web.app/assets/styles/hr_core.png']
    },
    {
        id: 'anima',
        name: 'Anima',
        description: 'Anime illustration model powered by circlestone-labs/Anima Base v1.0.',
        type: 'Image',
        order: 18,
        isActive: true
    },
    {
        id: 'crystal-cuteness',
        name: 'Crystal Cuteness',
        description: 'Adorable and sparkling aesthetics for high-quality cute art.',
        type: 'SDXL',
        order: 19,
        isActive: true
    },
    {
        id: 'veretoon-v10',
        name: 'Veretoon V1.0',
        description: 'Vibrant toon-style illustrations with clean outlines.',
        type: 'SDXL',
        order: 20,
        isActive: true
    },
    {
        id: 'nova-3d-cg-xl',
        name: 'Nova 3D CG XL',
        description: 'Premium SDXL model optimized for high-quality 3D and CGI art with extreme detail.',
        type: 'Generator',
        order: 22,
        isActive: true
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
