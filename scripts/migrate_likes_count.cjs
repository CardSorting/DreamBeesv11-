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

async function migrateLikesCount() {
    console.log("Starting migration to add 'likesCount' to model_showcase_images...");
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

        // Skip if likesCount already exists (idempotency)
        // Unless we want to re-sync it from 'rating'
        if (data.likesCount === undefined) {
            // If there's an existing 'rating', use it as the initial likesCount
            // In the current system, 'rating' seems to be -1 or 1 or 0?
            // Actually, handleRateShowcaseImage sets it to 1 or -1 directly.
            // Let's assume positive ratings are "likes".
            const initialLikes = (data.rating && data.rating > 0) ? data.rating : 0;

            batch.update(doc.ref, {
                likesCount: initialLikes,
                // Also ensure rating exists for legacy compatibility
                rating: data.rating || 0
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

    console.log(`Migration complete. Updated ${updatedCount} documents with 'likesCount'.`);
}

migrateLikesCount().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
