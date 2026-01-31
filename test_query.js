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

async function testQuery() {
    console.log('--- Testing Query from PublicGenerationsFeed.jsx ---');
    try {
        const q = db.collection('generations')
            .where('isPublic', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(60);

        const snapshot = await q.get();
        console.log(`Success! Found ${snapshot.size} documents.`);
    } catch (error) {
        console.error('Query Failed!');
        console.error(error.message);
        if (error.code === 9) { // 9 is PRECONDITION_FAILED, usually missing index
            console.log('This likely indicates a missing composite index.');
        }
    }
}

testQuery().catch(console.error);
