
const admin = require('firebase-admin');

// Use Application Default Credentials (gcloud auth application-default login)
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'dreambees-alchemist'
});

const db = admin.firestore();

const DEPRECATED_MODEL_IDS = [
    'lightricks-ltx-2-pro',
    'flux-2-dev',
    'flux-klein-9b'
];

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
        id: 'wai-illustrious',
        name: 'Wai Illustrious',
        description: 'High-quality illustrations with enforced quality tags and custom High-Res Fix workflow.',
        type: 'SDXL',
        order: 12,
        isActive: true,
        image: 'https://cdn.dreambeesai.com/file/printeregg/assets/landing/wai_illustrious_preview.png'
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
    }
];

async function seedModels() {
    const collectionRef = db.collection('models');

    console.log(`Starting seed of ${MODELS.length} models...`);

    for (const modelId of DEPRECATED_MODEL_IDS) {
        await collectionRef.doc(modelId).delete();
        console.log(`✕ Deleted deprecated model: ${modelId}`);

        const showcaseSnap = await db.collection('model_showcase_images')
            .where('modelId', '==', modelId)
            .get();
        for (const doc of showcaseSnap.docs) {
            await doc.ref.delete();
            console.log(`✕ Deleted showcase image for ${modelId}: ${doc.id}`);
        }
    }

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
