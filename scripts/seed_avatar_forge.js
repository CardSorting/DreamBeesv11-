
import admin from 'firebase-admin';

// Note: This script assumes you are authenticated via Firebase CLI or have GOOGLE_APPLICATION_CREDENTIALS set.
// If you get a "credential" error, you can provide a serviceAccountKey.json path.

const PROJECT_ID = 'dreambees-alchemist';

admin.initializeApp({
    projectId: PROJECT_ID
});

const db = admin.firestore();

const avatars = [
    // MINTED (For Gallery)
    { theme: 'Neon Cyber Hacker', rarity: 'Rare', url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Zephyr_X', mintNumber: 101 },
    { theme: 'Aetherial Monk', rarity: 'Legendary', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Solana', mintNumber: 102 },
    { theme: 'Bionic Nomad', rarity: 'Common', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Drifter', mintNumber: 103 },
    { theme: 'Solar Sentinel', rarity: 'Rare', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Astra', mintNumber: 104 },
    { theme: 'Void Walker', rarity: 'Legendary', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Nexus_Zero', mintNumber: 105 },
    { theme: 'Clockwork Engineer', rarity: 'Common', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'GearHead', mintNumber: 106 },
    { theme: 'Primal Soul', rarity: 'Rare', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Gaia', mintNumber: 107 },
    { theme: 'Synthezoid Alpha', rarity: 'Legendary', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Core_AI', mintNumber: 108 },
    { theme: 'Bio-Organic Queen', rarity: 'Rare', url: 'https://images.unsplash.com/photo-1500462859233-0bb2900a2a5e?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Flora', mintNumber: 109 },
    { theme: 'Quantum Voyager', rarity: 'Common', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop', minted: true, userDisplayName: 'Pulse', mintNumber: 110 },

    // UNMINTED (For Gacha Pool)
    { theme: 'Shadow Infiltrator', rarity: 'Rare', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop', minted: false },
    { theme: 'Glacial Guardian', rarity: 'Common', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', minted: false },
    { theme: 'Volcanic Fury', rarity: 'Legendary', url: 'https://images.unsplash.com/photo-1467348733814-393e1f568c1c?q=80&w=800&auto=format&fit=crop', minted: false },
    { theme: 'Nebula Weaver', rarity: 'Rare', url: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=800&auto=format&fit=crop', minted: false },
    { theme: 'Chrome Knight', rarity: 'Common', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop', minted: false },
];

async function seed() {
    const collectionRef = db.collection('community_avatar_pool');
    const batch = db.batch();

    console.log(`Seeding ${avatars.length} items...`);

    avatars.forEach((avatar) => {
        const docRef = collectionRef.doc();
        batch.set(docRef, {
            ...avatar,
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
            mintedAt: avatar.minted ? admin.firestore.FieldValue.serverTimestamp() : null,
            status: avatar.minted ? 'minted' : 'ready'
        });
    });

    await batch.commit();
    console.log('Successfully seeded database!');
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
