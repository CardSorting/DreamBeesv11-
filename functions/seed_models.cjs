
const admin = require('firebase-admin');
// serviceAccountKey.json is in the root, so from functions/ it is ../serviceAccountKey.json
const serviceAccount = require('./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const MODELS = [
    {
        id: 'cat-carrier',
        name: 'Cat Carrier',
        description: 'A versatile model for general purpose generation, excellent for characters and scenes.',
        type: 'SDXL',
        order: 1,
        isActive: true
    },
    {
        id: 'hassaku-illustrious',
        name: 'Hassaku Illustrious',
        description: 'Specialized for high-quality illustration and digital art styles.',
        type: 'SDXL',
        order: 2,
        isActive: true
    },
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
            console.log(`- Model exists: ${model.name} (${model.id})`);
        }
    }

    console.log('Seed complete.');
}

seedModels().catch(console.error);
