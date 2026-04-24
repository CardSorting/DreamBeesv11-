import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, './serviceAccountKey.json');
let credential = applicationDefault();

if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential,
        projectId: process.env.GCLOUD_PROJECT || "dreambees-alchemist"
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
        .where('modelId', '==', 'flux-klein-9b')
        .limit(5)
        .get();

    showcaseSnapshot.forEach(doc => {
        console.log(`ID: ${doc.id}, URL: ${doc.data().imageUrl || doc.data().url}`);
    });
}

checkModels().catch(console.error);
