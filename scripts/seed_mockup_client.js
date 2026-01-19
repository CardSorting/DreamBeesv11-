
import { initializeApp } from "firebase/app";
import { getFirestore, doc, writeBatch } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
    apiKey: "AIzaSyA_mazg4YhNIJ4KYUNrMCHwF4p7PfM-Td8",
    authDomain: "dreambees-alchemist.firebaseapp.com",
    projectId: "dreambees-alchemist",
    storageBucket: "dreambees-alchemist.firebasestorage.app",
    messagingSenderId: "519217549360",
    appId: "1:519217549360:web:867310181e910b5df15df5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Read the JSON file
const data = JSON.parse(fs.readFileSync('./scripts/mockup_data.json', 'utf8'));

async function seed() {
    console.log(`Starting seed of ${data.length} items...`);

    // Chunk items into batches of 450 (limit is 500)
    const chunkSize = 450;
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        console.log(`Processing batch ${i / chunkSize + 1} (${chunk.length} items)...`);

        chunk.forEach(item => {
            // Ensure unique ID if not present or collisions occur
            // The extracted ID should be fine, but let's be safe
            const docId = item.id || `auto-${Date.now()}-${Math.random()}`;
            const ref = doc(db, "mockup_items", docId);
            batch.set(ref, item, { merge: true });
        });

        await batch.commit();
        console.log(`Batch ${i / chunkSize + 1} committed.`);
    }

    console.log("Seed complete.");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seed failed", err);
    process.exit(1);
});
