
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin
// Assuming environment is already set up or using default credential search
try {
    initializeApp({
        projectId: 'dreambees-alchemist'
    });
} catch (e) {
    // Ignore if already initialized
}

const db = getFirestore();

async function checkMockups() {
    console.log('--- Checking Mockup Data ---');

    // 1. Check plain existence
    const snapshotAll = await db.collection('generations').where('type', '==', 'mockup').limit(5).get();
    console.log(`Query (type=='mockup'): Found ${snapshotAll.size} documents.`);
    snapshotAll.forEach(doc => {
        console.log(` - ${doc.id}: isPublic=${doc.data().isPublic}, createdAt=${doc.data().createdAt ? doc.data().createdAt.toDate() : 'null'}`);
    });

    // 2. Check compound query (Admin SDK doesn't always strictly require indexes like client, but good to check exact keys)
    const snapshotPublic = await db.collection('generations')
        .where('type', '==', 'mockup')
        .where('isPublic', '==', true)
        .limit(5)
        .get();

    console.log(`Query (type=='mockup', isPublic==true): Found ${snapshotPublic.size} documents.`);

    if (snapshotPublic.size > 0) {
        console.log('✅ Data exists correctly in Firestore.');
        console.log('👉 If client shows empty, it is likely a MISSING INDEX issue for the sort order.');
    } else {
        console.log('❌ No matching documents found. Seed script might have failed silently or used wrong keys.');
    }
}

checkMockups().catch(console.error);
