
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { readFileSync } from 'fs';

// This script assumes you have a service account key or are authenticated via ADC
const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));

initializeApp({
    credential: cert(serviceAccount),
    projectId: 'dreambees-alchemist'
});

const db = getFirestore();
const functions = getFunctions();

async function enqueueTest() {
    const requestId = 'manual-test-' + Date.now();
    const userId = 'CHtpp5gWEVXGYuH9qH1osxlC63T2'; // Real user UID

    console.log(`Creating queue doc: ${requestId}`);
    await db.collection('generation_queue').doc(requestId).set({
        userId,
        prompt: "a majestic golden eagle soaring over snow-capped mountains",
        modelId: "wai-illustrious", // SDXL
        status: 'queued',
        aspectRatio: '1:1',
        steps: 30,
        cfg: 7,
        createdAt: FieldValue.serverTimestamp()
    });

    console.log("Enqueuing to urgentWorker...");
    const queue = functions.taskQueue('locations/us-central1/functions/urgentWorker');

    await queue.enqueue({
        taskType: 'image',
        requestId,
        userId,
        prompt: "a majestic golden eagle soaring over snow-capped mountains",
        modelId: "wai-illustrious",
        steps: 30,
        cfg: 7,
        aspectRatio: '1:1'
    });

    console.log("Done! Check logs for requestId:", requestId);
}

enqueueTest().catch(console.error);
