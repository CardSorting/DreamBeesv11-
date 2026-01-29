
import admin from 'firebase-admin';

// Initialize Admin SDK (assuming service account or default credentials)
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function seedGalmix() {
  console.log('--- Starting GalMix Seeding ---');
  const modelId = 'galmix';
  const modelData = {
    name: 'GalMix',
    description: 'High-performance custom model for rapid experimentation. Free for all users.',
    isActive: true,
    isFree: true,
    order: -1, // Make it appear at the top
    tags: ['Fast', 'Free', 'Universal'],
    image: '/models/galmix.png', // Local preview image
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    console.log(`Attempting to set document: models/${modelId}`);
    const res = await db.collection('models').doc(modelId).set(modelData, { merge: true });
    console.log('✓ Galmix model seeded successfully at:', res.writeTime);
  } catch (err) {
    console.error('✗ Error seeding Galmix model:', err);
    console.error('Stack:', err.stack);
  } finally {
    console.log('--- Seeding Process Finished ---');
    process.exit();
  }
}

seedGalmix();
