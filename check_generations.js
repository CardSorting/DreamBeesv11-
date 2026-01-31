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

async function checkGenerations() {
    console.log('--- Generations Collection ---');
    const snapshot = await db.collection('generations').limit(10).get();

    if (snapshot.empty) {
        console.log('No documents found in "generations" collection.');
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\nID: ${doc.id}`);
        console.log(`isPublic: ${data.isPublic}`);
        console.log(`type: ${data.type}`);
        console.log(`status: ${data.status}`);
        console.log(`hidden: ${data.hidden}`);
        console.log(`imageUrl: ${data.imageUrl || data.url}`);
        console.log(`createdAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
    });
}

checkGenerations().catch(console.error);
