
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Adjusted path: script is in functions/scripts/, items are in src/pages/...
const ITEMS_DIR = path.join(__dirname, '../../src/pages/MockupStudio/services/items');

async function extractAndSeed() {
    try {
        if (!fs.existsSync(ITEMS_DIR)) {
            console.error(`Directory not found: ${ITEMS_DIR}`);
            return;
        }

        const files = fs.readdirSync(ITEMS_DIR).filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.js'));
        let allItems = [];

        console.log(`Found ${files.length} files in ${ITEMS_DIR}`);

        for (const file of files) {
            const content = fs.readFileSync(path.join(ITEMS_DIR, file), 'utf8');

            // Regex to match the array body
            // Matches: export const [name] = [ ... ];
            const match = content.match(/export const \w+\s*(?::\s*\w+\[\])?\s*=\s*(\[\s*[\s\S]*?\n\]);/);

            if (match && match[1]) {
                let arrayString = match[1];

                // Replace JSX icons with string identifiers
                // e.g. icon: <Icons.Print />, -> icon: "Print",
                arrayString = arrayString.replace(/icon:\s*<Icons\.(\w+)\s*\/>,?/g, 'iconName: "$1",');

                try {
                    // Use a safe-ish eval to parse the array string
                    const items = eval(arrayString);
                    console.log(`Extracted ${items.length} items from ${file}`);
                    allItems = [...allItems, ...items];
                } catch (e) {
                    console.error(`Failed to parse content from ${file}:`, e.message);
                }
            } else {
                console.warn(`No items array found in ${file}`);
            }
        }

        if (allItems.length === 0) {
            console.error("No items extracted. validation failed.");
            return;
        }

        console.log(`Total items to seed: ${allItems.length}`);

        // Batch write to Firestore
        // Note: Firestore batch limit is 500. We likely have fewer, but best to be safe.
        // We will create a fresh batch for every chunk.

        const chunkSize = 400;
        for (let i = 0; i < allItems.length; i += chunkSize) {
            const chunk = allItems.slice(i, i + chunkSize);
            const batch = db.batch();
            const collectionRef = db.collection('mockup_items');

            chunk.forEach(item => {
                if (item.id) {
                    const docRef = collectionRef.doc(item.id);
                    // Deep clone to ensure no weird references (though eval output is clean)
                    const cleanItem = JSON.parse(JSON.stringify(item));
                    cleanItem.updatedAt = admin.firestore.FieldValue.serverTimestamp();
                    batch.set(docRef, cleanItem);
                }
            });

            await batch.commit();
            console.log(`Committed batch ${i / chunkSize + 1}`);
        }

        console.log("Seeding complete!");

    } catch (error) {
        console.error("Error seeding mockups:", error);
    }
}

extractAndSeed();
