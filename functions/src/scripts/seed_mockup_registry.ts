import { db } from '../firebaseInit.js';
import {
    MOCKUP_ITEMS,
    TCG_ITEMS,
    DOLL_ITEMS,
    RESKIN_ITEMS
} from '../lib/mockupData.js';

const ALL_MOCKUP_ITEMS = [
    ...MOCKUP_ITEMS,
    ...TCG_ITEMS,
    ...DOLL_ITEMS,
    ...RESKIN_ITEMS
];


async function seedMockupRegistry() {
    console.log(`[Seed] Starting Mockup Registry seeding (${ALL_MOCKUP_ITEMS.length} items)...`);
    const batch = db.batch();
    const registryRef = db.collection('mockup_registry');

    for (const item of ALL_MOCKUP_ITEMS) {
        const docRef = registryRef.doc(item.id);
        batch.set(docRef, {
            ...item,
            updatedAt: new Date(),
            source: 'original_distribution'
        });
    }

    await batch.commit();
    console.log(`[Seed] Successfully seeded ${ALL_MOCKUP_ITEMS.length} items to mockup_registry.`);
}

seedMockupRegistry().catch(console.error);
