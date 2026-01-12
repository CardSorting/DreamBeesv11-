const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// --- Configuration ---
const SHOWCASE_DIR = path.join(__dirname, '../public/showcase/qwen-gravure');
const MANIFEST_PATH = path.join(SHOWCASE_DIR, 'manifest.json');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../functions/dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json');

// The list of orphaned files provided by user
const ORPHANED_FILES = [
    "1768174486743_1.png", "1768174523121_2.png", "1768174559256_3.png",
    "1768174595452_4.png", "1768174632261_5.png", "1768174668411_6.png",
    "1768174732321_7.png", "1768174768386_8.png", "1768174806258_9.png",
    "1768174842426_10.png", "1768174878607_11.png", "1768174914797_12.png",
    "1768174950947_13.png", "1768174987097_14.png", "1768175023187_15.png",
    "1768175059245_16.png", "1768175095374_17.png", "1768175131603_18.png",
    "1768175167791_19.png"
];

// Metadata to apply
const CREATOR = { user: 'ChatGPT 5.2', model: 'Qwen 2.5 12B' };
const MODEL_ID = 'qwen-image-2512';
const GENERIC_PROMPT = "Qwen Gravure Showcase Image (Recovered)";
const ASPECT_RATIO = "2:3";

async function run() {
    console.log("🚀 Starting Recovery Script...");

    // 1. Initialize Firebase Admin
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error("❌ Service account not found at:", SERVICE_ACCOUNT_PATH);
        process.exit(1);
    }
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    const db = admin.firestore();
    console.log("✅ Firebase initialized.");

    // 2. Load Manifest
    let manifest = [];
    if (fs.existsSync(MANIFEST_PATH)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        console.log(`✅ Loaded existing manifest with ${manifest.length} items.`);
    } else {
        console.warn("⚠️ No existing manifest found. Creating new one.");
    }

    let addedCount = 0;
    const batch = db.batch();
    const collectionRef = db.collection('model_showcase_images');

    // 3. Process Orphaned Files
    for (const filename of ORPHANED_FILES) {
        const url = `/showcase/qwen-gravure/${filename}`;

        // Check if already in manifest
        const exists = manifest.some(item => item.url === url || item.url.endsWith(filename));

        if (!exists) {
            // Create New Entry
            const newEntry = {
                url: url,
                prompt: GENERIC_PROMPT,
                base_prompt: GENERIC_PROMPT,
                modelId: MODEL_ID,
                aspectRatio: ASPECT_RATIO,
                creator: CREATOR
            };

            // Add to Local Manifest
            manifest.push(newEntry);

            // Prepare Firestore Write
            // Use filename as doc ID for uniqueness/idempotency
            const docRef = collectionRef.doc(`qwen_gravure_${filename.replace('.png', '')}`);
            batch.set(docRef, {
                ...newEntry,
                createdAt: admin.firestore.Timestamp.now(), // Use server timestamp equivalent
                imageUrl: url // Ensure compatibility
            });

            addedCount++;
            console.log(`   ➕ Prepared: ${filename}`);
        } else {
            // Even if in manifest, ensure it's in Firestore with correct Creator if missing
            // For this task, we focus on the ones requested.
            // But if we want to force update the creator on existing ones that match this list?
            // The user asked to "mark THESE images". So even if they exist, we should update the creator.

            // Locate entry idx
            const idx = manifest.findIndex(item => item.url === url || item.url.endsWith(filename));
            if (idx !== -1) {
                manifest[idx].creator = CREATOR; // Update local

                const docRef = collectionRef.doc(`qwen_gravure_${filename.replace('.png', '')}`);
                batch.set(docRef, {
                    ...manifest[idx],
                    createdAt: admin.firestore.Timestamp.now(),
                    imageUrl: url
                }, { merge: true });

                console.log(`   🔄 Updated Creator: ${filename}`);
                addedCount++;
            }
        }
    }

    if (addedCount > 0) {
        // 4. Save Manifest
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log(`💾 Saved updated manifest with ${manifest.length} items.`);

        // 5. Commit to Firestore
        await batch.commit();
        console.log(`☁️  Committed ${addedCount} updates to Firestore.`);
    } else {
        console.log("✨ No changes needed. All images already processed.");
    }

    console.log("🎉 Done!");
}

run().catch(console.error);
