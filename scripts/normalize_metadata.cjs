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

async function normalizeModelMetadata() {
    console.log("Starting model metadata normalization for showcase images...");

    // 1. Fetch all models to build a mapping
    const modelsSnapshot = await db.collection('models').get();
    const modelMap = {};
    modelsSnapshot.forEach(doc => {
        const data = doc.data();
        modelMap[doc.id] = {
            name: data.name,
            thumbnailUrl: data.image || data.imageUrl
        };
    });
    console.log(`Loaded ${Object.keys(modelMap).length} models for mapping.`);

    // 2. Process showcase images
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
        const modelInfo = modelMap[data.modelId];

        if (modelInfo) {
            // Check if updates are needed (avoid redundant writes)
            const needsUpdate = !data.modelName || !data.modelThumbnailUrl;

            if (needsUpdate) {
                batch.update(doc.ref, {
                    modelName: modelInfo.name,
                    modelThumbnailUrl: modelInfo.thumbnailUrl
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
    }

    if (operationCount > 0) {
        await batch.commit();
    }

    console.log(`Normalization complete. Updated ${updatedCount} documents with model metadata.`);
}

normalizeModelMetadata().catch(err => {
    console.error("Normalization failed:", err);
    process.exit(1);
});
