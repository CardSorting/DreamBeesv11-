/* global require */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // I'll check if this exists or use default

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkModels() {
    console.log('--- Models ---');
    const modelsSnapshot = await db.collection('models').get();
    modelsSnapshot.forEach(doc => {
        console.log(`ID: ${doc.id}, Name: ${doc.data().name}`);
    });

    console.log('\n--- Flux Klein Showcase ---');
    const showcaseSnapshot = await db.collection('model_showcase_images')
        .where('modelId', '==', 'flux-klein-4b')
        .limit(5)
        .get();

    showcaseSnapshot.forEach(doc => {
        console.log(`ID: ${doc.id}, URL: ${doc.data().imageUrl || doc.data().url}`);
    });
}

checkModels().catch(console.error);
