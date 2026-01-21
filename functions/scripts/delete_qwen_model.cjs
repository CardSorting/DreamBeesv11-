
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

async function deleteQwenModel() {
    console.log("--- Deleting 'qwen-image-2512' model ---");
    const docRef = db.collection('models').doc('qwen-image-2512');

    // Check if it exists
    const doc = await docRef.get();
    if (!doc.exists) {
        console.log("Model 'qwen-image-2512' does not exist (already deleted?).");
        return;
    }

    // Delete
    await docRef.delete();
    console.log("Successfully deleted 'qwen-image-2512' from 'models' collection.");
}

deleteQwenModel().catch(console.error);
