const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Or use GOOGLE_APPLICATION_CREDENTIALS

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function migrateCreditsToZaps() {
    console.log("Starting migration of 'credits' to 'zaps'...");
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
        console.log('No users found.');
        return;
    }

    let updatedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();

        // If credits exists but zaps doesn't, migrate it.
        // If both exist, we might want to sum them or prioritize zaps.
        // For a clean rename, we migrate if zaps is missing.
        if (data.credits !== undefined && data.zaps === undefined) {
            batch.update(doc.ref, {
                zaps: data.credits,
                credits: admin.firestore.FieldValue.delete()
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

    console.log(`Migration complete. Updated ${updatedCount} users.`);
}

migrateCreditsToZaps().catch(console.error);
