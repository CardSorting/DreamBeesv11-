const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// --- Configuration ---
const SOURCE_DIR = path.join(__dirname, '../public/showcase/qwen-gravure');
const TARGET_DIR = path.join(__dirname, '../public/showcase/qwen-image-2512');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../functions/dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json');

async function run() {
    console.log("🚀 Starting Migration Script...");

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

    // 2. Load Manifests
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error("❌ Source directory not found:", SOURCE_DIR);
        process.exit(1);
    }

    // Ensure target exists
    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    const sourceManifestPath = path.join(SOURCE_DIR, 'manifest.json');
    const targetManifestPath = path.join(TARGET_DIR, 'manifest.json');

    let sourceManifest = [];
    if (fs.existsSync(sourceManifestPath)) {
        sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
    }

    let targetManifest = [];
    if (fs.existsSync(targetManifestPath)) {
        targetManifest = JSON.parse(fs.readFileSync(targetManifestPath, 'utf8'));
    }

    console.log(`📦 Found locally: Source ${sourceManifest.length} items, Target ${targetManifest.length} items.`);

    // 3. Move Files and Process Manifest
    const files = fs.readdirSync(SOURCE_DIR);
    let movedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        if (file === 'manifest.json' || file === '.DS_Store') continue;

        const sourcePath = path.join(SOURCE_DIR, file);
        const targetPath = path.join(TARGET_DIR, file);

        // If conflict, we might need to rename, but for now assuming unique timestamps/names or overwriting if identical (e.g. cover.png)
        // If cover.png exists in target, we should probably keep target's cover or overwrite? 
        // Let's overwrite cover.png if it's better, or skip. 
        // User didn't specify, but usually migration implies moving everything.
        // However, qwen-image-2512 likely has a cover. 
        if (file === 'cover.png' && fs.existsSync(targetPath)) {
            console.log("⚠️  Target has cover.png. Renaming source cover.png to 'gravure_cover.png' to avoid overwrite.");
            const newName = 'gravure_cover.png';
            fs.renameSync(sourcePath, path.join(TARGET_DIR, newName));

            // Check if source manifest used cover.png
            const coverEntry = sourceManifest.find(i => i.url.endsWith('cover.png'));
            if (coverEntry) {
                coverEntry.url = `/showcase/qwen-image-2512/${newName}`;
                coverEntry.imageUrl = `/showcase/qwen-image-2512/${newName}`;
            }
            movedCount++;
            continue;
        }

        // Move file
        if (fs.existsSync(targetPath)) {
            console.log(`⚠️  File exists in target: ${file}. Skipping move, but will update manifest logic.`);
            skippedCount++;
        } else {
            fs.renameSync(sourcePath, targetPath);
            movedCount++;
        }
    }
    console.log(`🚚 Moved ${movedCount} files. Skipped ${skippedCount}.`);

    // 4. Update Manifest Entries
    const newEntries = sourceManifest.map(item => {
        let newUrl = item.url;
        // Replace base path
        if (item.url.includes('/showcase/qwen-gravure/')) {
            newUrl = item.url.replace('/showcase/qwen-gravure/', '/showcase/qwen-image-2512/');

            // Handle the special renamed cover case if needed, though we handled it precisely above for the file.
            // But if the loop above changed the file, we updated the object ref.
            // If the loop didn't change it (normal file), the replace works.
        }

        return {
            ...item,
            url: newUrl,
            imageUrl: newUrl, // Ensure consistency
            modelId: 'qwen-image-2512' // Ensure modelId is correct target
        };
    });

    // Merge: Append new entries to target manifest
    const mergedManifest = [...targetManifest, ...newEntries];

    // Deduplicate based on URL just in case
    const uniqueManifest = Array.from(new Map(mergedManifest.map(item => [item.url, item])).values());

    fs.writeFileSync(targetManifestPath, JSON.stringify(uniqueManifest, null, 2));
    console.log(`📝 Updated target manifest with ${uniqueManifest.length} items (merged).`);

    // 5. Update Firestore
    console.log("🔥 Updating Firestore...");
    const batch = db.batch();
    let dbUpdateCount = 0;

    // Find all docs that point to the old location
    // Since we stamped them with modelId='qwen-image-2512' in previous step (mark_orphaned), 
    // we search by modelId and filter manually or query.
    // Efficient way: Query all model_showcase_images for modelId 'qwen-image-2512'.

    const snapshot = await db.collection('model_showcase_images')
        .where('modelId', '==', 'qwen-image-2512')
        .get();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const url = data.url || data.imageUrl;

        if (url && url.includes('/showcase/qwen-gravure/')) {
            const newUrl = url.replace('/showcase/qwen-gravure/', '/showcase/qwen-image-2512/');
            // Also handle the cover rename if applicable
            let finalUrl = newUrl;
            if (url.endsWith('/cover.png') && fs.existsSync(path.join(TARGET_DIR, 'gravure_cover.png'))) {
                // That check is local fs check which works.
                // But wait, if we renamed it locally, we need to update DB.
                // The sourceManifest logic handled the object update. 
                // Here we are iterating DB docs.
                // If the DB doc matched the source manifest item, we need to replicate the rename logic.
                // Checking if "gravure_cover.png" exists is a proxy.
                // Safer: Check if filename is "cover.png".
                if (url.endsWith('/cover.png')) {
                    finalUrl = newUrl.replace('cover.png', 'gravure_cover.png');
                }
            }

            batch.update(doc.ref, {
                url: finalUrl,
                imageUrl: finalUrl
            });
            dbUpdateCount++;
        }
    });

    if (dbUpdateCount > 0) {
        await batch.commit();
        console.log(`☁️  Updated ${dbUpdateCount} Firestore documents.`);
    } else {
        console.log("✨ No Firestore documents needed update.");
    }

    // 6. Cleanup
    // Check if source dir is empty (except maybe manifest.json)
    const remaining = fs.readdirSync(SOURCE_DIR).filter(f => f !== '.DS_Store' && f !== 'manifest.json');
    if (remaining.length === 0) {
        fs.rmSync(SOURCE_DIR, { recursive: true, force: true });
        console.log("🗑️  Deleted source directory.");
    } else {
        console.warn(`⚠️  Source directory not empty, left contents: ${remaining.join(', ')}`);
    }

    console.log("🎉 Migration Done!");
}

run().catch(console.error);
