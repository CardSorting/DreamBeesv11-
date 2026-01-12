const admin = require('firebase-admin');
const crypto = require('crypto');

// Target the correct project
process.env.GOOGLE_CLOUD_PROJECT = 'dreambees-alchemist';

// Initialize with ADC
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

function getPromptHash(prompt) {
    return crypto.createHash('sha256').update((prompt || "").toLowerCase().trim()).digest('hex');
}

function getPromptMetadata(prompt) {
    const clean = (prompt || "").trim();
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = clean.match(emojiRegex) || [];
    return {
        length: clean.length,
        wordCount: clean.split(/\s+/).filter(Boolean).length,
        emojiCount: emojis.length,
        hasNegativeModifiers: /low quality|bad|ugly|deformed/i.test(clean)
    };
}

async function backfillMetadata(collectionName) {
    console.log(`Starting backfill for ${collectionName}...`);
    const ref = db.collection(collectionName);
    const snapshot = await ref.get();

    if (snapshot.empty) {
        console.log(`No documents found in ${collectionName}.`);
        return;
    }

    console.log(`Found ${snapshot.size} documents in ${collectionName}.`);

    let updatedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();

        if (data.prompt && (!data.promptHash || !data.promptMetadata)) {
            batch.update(doc.ref, {
                promptHash: getPromptHash(data.prompt),
                promptMetadata: getPromptMetadata(data.prompt)
            });

            updatedCount++;
            operationCount++;

            if (operationCount >= batchSize) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
                console.log(`Committed batch of ${batchSize} updates for ${collectionName}...`);
            }
        }
    }

    if (operationCount > 0) {
        await batch.commit();
    }

    console.log(`Backfill complete for ${collectionName}. Updated ${updatedCount} documents.`);
}

async function run() {
    await backfillMetadata('generation_queue');
    await backfillMetadata('images');
    await backfillMetadata('model_showcase_images');
}

run().catch(err => {
    console.error("Backfill failed:", err);
    process.exit(1);
});
