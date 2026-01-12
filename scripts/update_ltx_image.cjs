const admin = require('firebase-admin');
const serviceAccount = require('../functions/dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateModel() {
    const modelId = 'lightricks-ltx-2-pro';
    const docRef = db.collection('models').doc(modelId);

    try {
        await docRef.update({
            image: '/showcase/lightricks-ltx-2-pro/cover.png'
        });
        console.log(`Successfully updated image for ${modelId}`);

        // Verify
        const doc = await docRef.get();
        console.log('Updated data:', doc.data());
    } catch (error) {
        console.error('Error updating model:', error);
    }
}

updateModel().catch(console.error);
