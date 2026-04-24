/**
 * Fix existing showcase documents by adding missing 'url' field
 */

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

try {
    initializeApp({
        credential: applicationDefault(),
        projectId: "dreambees-alchemist"
    });
} catch (e) {
    if (!/already exists/.test(e.message)) {
        console.error('Firebase initialization error', e.stack);
    }
}

const db = getFirestore();

async function fixShowcaseUrls() {
    console.log("--- Fixing showcase documents with missing 'url' field ---");

    const snapshot = await db.collection('model_showcase_images').get();

    let fixedCount = 0;
    let skippedCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();

        // If already has 'url' field, skip
        if (data.url) {
            skippedCount++;
            continue;
        }

        // If has 'imageUrl' but no 'url', copy it over
        if (data.imageUrl) {
            await doc.ref.update({ url: data.imageUrl });
            fixedCount++;
            console.log(`Fixed: ${doc.id}`);
        }
    }

    console.log(`\nDone. Fixed: ${fixedCount}, Skipped: ${skippedCount}`);
}

fixShowcaseUrls().catch(console.error);
