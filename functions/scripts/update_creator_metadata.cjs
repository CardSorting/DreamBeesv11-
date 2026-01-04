const admin = require('firebase-admin');
// const serviceAccount = require('../../serviceAccountKey.json'); // Removed to rely on default credentials

// Initialize Firebase Admin
// If running locally with 'firebase login' or 'gcloud auth', this might work without a key file for some projects,
// but often requires serviceAccountKey.json for full admin privileges if not using the emulator.
// Since I don't see a key file in the file list, I'll try generic initialization which picks up GOOGLE_APPLICATION_CREDENTIALS
// or default credentials.
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
} else {
    // If we are in an environment where we can simply initialize
    admin.initializeApp();
}

const db = admin.firestore();

async function updateMetadata() {
    console.log('Starting metadata update...');

    try {
        const batch = db.batch();
        const snapshot = await db.collection('model_showcase_images')
            .where('modelId', '==', 'hassaku-illustrious')
            .get();

        if (snapshot.empty) {
            console.log('No images found for hassaku-illustrious.');
            return;
        }

        let count = 0;
        snapshot.forEach(doc => {
            const ref = doc.ref;
            batch.update(ref, { creator: 'Gemini Pro 3' });
            count++;
        });

        await batch.commit();
        console.log(`Successfully updated ${count} images with creator: 'Gemini Pro 3'`);
    } catch (error) {
        console.error('Error updating metadata:', error);
    }
}

updateMetadata();
