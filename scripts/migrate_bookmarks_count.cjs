const admin = require('firebase-admin');

// Target the correct project
process.env.GOOGLE_CLOUD_PROJECT = 'dreambees-alchemist';

// Initialize with ADC
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function migrateBookmarksCount() {
    console.log("Starting migration to add 'bookmarksCount' to model_showcase_images...");
    const showcaseRef = db.collection('model_showcase_images');
    const snapshot = await showcaseRef.get();

    if (snapshot.empty) {
        console.log('No showcase images found.');
        return;
    }

    console.log(`Found ${snapshot.size} documents to process.`);

    let updatedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();

        // Skip if bookmarksCount already exists (idempotency)
        if (data.bookmarksCount === undefined) {
            batch.update(doc.ref, {
                bookmarksCount: 0
            });

            updatedCount++;
            operationCount++;

            if (operationCount >= batchSize) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
                console.log(`Committed batch of ${batchSize} updates...`);
            }
        }
    }

    if (operationCount > 0) {
        await batch.commit();
    }

    console.log(`Migration complete. Updated ${updatedCount} documents with 'bookmarksCount'.`);
}

migrateBookmarksCount().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
