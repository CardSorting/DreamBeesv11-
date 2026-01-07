
const admin = require('firebase-admin');
const serviceAccount = require('./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedUsers() {
    console.log("Starting user seed for 'reels' field...");
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
        if (data.reels === undefined) {
            batch.update(doc.ref, { reels: 0 });
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

    console.log(`Seed complete. Updated ${updatedCount} users with 'reels: 0'.`);
}

seedUsers().catch(console.error);
