const fs = require('fs');
const path = require('path');
const { uploadToB2, validateCredentials } = require('./utils/b2_uploader.cjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const B2_PUBLIC_URL = process.env.VITE_B2_PUBLIC_URL;
const B2_BUCKET = process.env.VITE_B2_BUCKET;

/**
 * Migrates showcase images from local public/showcase to B2
 * Updates manifest.json files to use B2 URLs
 */
async function migrateShowcaseToB2() {
    // Validate credentials before starting
    console.log('🔐 Validating B2 credentials...');
    const isValid = await validateCredentials();
    if (!isValid) {
        console.error('\n❌ B2 credentials validation failed!');
        console.error('Please check your .env file and ensure all B2 variables are set correctly.');
        process.exit(1);
    }
    console.log('✅ Credentials validated successfully!\n');

    const showcaseDir = path.join(__dirname, '../public/showcase');
    
    if (!fs.existsSync(showcaseDir)) {
        console.error('Showcase directory not found:', showcaseDir);
        process.exit(1);
    }

    const modelDirs = fs.readdirSync(showcaseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`Found ${modelDirs.length} model directories to migrate\n`);

    for (const modelId of modelDirs) {
        const modelDir = path.join(showcaseDir, modelId);
        const manifestPath = path.join(modelDir, 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
            console.log(`⚠️  Skipping ${modelId}: No manifest.json found`);
            continue;
        }

        console.log(`\n📦 Processing ${modelId}...`);
        
        try {
            // Read manifest
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            console.log(`   Found ${manifest.length} images in manifest`);

            // Process each image in manifest
            const updatedManifest = [];
            let uploadedCount = 0;
            let skippedCount = 0;

            for (let i = 0; i < manifest.length; i++) {
                const item = manifest[i];
                const oldUrl = item.url || item.imageUrl;
                
                // Skip if already a B2/CDN URL
                if (oldUrl && (oldUrl.includes('backblazeb2.com') || oldUrl.includes('cdn.dreambeesai.com'))) {
                    console.log(`   [${i + 1}/${manifest.length}] ⏭️  Already on B2: ${oldUrl}`);
                    updatedManifest.push(item);
                    skippedCount++;
                    continue;
                }

                // Extract filename from URL
                let filename;
                if (oldUrl && oldUrl.startsWith('/')) {
                    // Relative path like /showcase/cat-carrier/cyberpunk_portrait.png
                    filename = path.basename(oldUrl);
                } else if (oldUrl) {
                    filename = path.basename(oldUrl);
                } else {
                    // Try to get from name field
                    filename = item.name ? `${item.name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase()}.png` : `image_${i}.png`;
                }

                const localImagePath = path.join(modelDir, filename);
                
                if (!fs.existsSync(localImagePath)) {
                    console.log(`   [${i + 1}/${manifest.length}] ⚠️  File not found: ${filename}`);
                    updatedManifest.push(item); // Keep original entry
                    continue;
                }

                // B2 path: showcase/{modelId}/{filename}
                const b2Key = `showcase/${modelId}/${filename}`;

                try {
                    console.log(`   [${i + 1}/${manifest.length}] ⬆️  Uploading: ${filename}...`);
                    
                    // Read file
                    const imageBuffer = fs.readFileSync(localImagePath);
                    
                    // Upload to B2
                    await uploadToB2(imageBuffer, b2Key, 'image/png');
                    
                    // Construct CDN URL with explicit bucket path (matching functions/index.js format)
                    // B2_PUBLIC_URL might be the base CDN URL, so we need to add /file/bucket/ if not present
                    let publicUrl;
                    if (B2_PUBLIC_URL && B2_PUBLIC_URL.includes('cdn.dreambeesai.com')) {
                        // CDN URL format: https://cdn.dreambeesai.com/file/printeregg/showcase/...
                        publicUrl = `${B2_PUBLIC_URL.replace(/\/$/, '')}/file/${B2_BUCKET}/${b2Key}`;
                    } else {
                        // Fallback: use the URL returned by uploadToB2 or construct from B2_PUBLIC_URL
                        publicUrl = `${B2_PUBLIC_URL}/${b2Key}`;
                    }
                    
                    // Update manifest entry
                    const updatedItem = {
                        ...item,
                        url: publicUrl,
                        imageUrl: publicUrl, // Ensure both fields are set
                    };
                    
                    updatedManifest.push(updatedItem);
                    uploadedCount++;
                    
                    console.log(`      ✓ Uploaded: ${publicUrl}`);
                } catch (error) {
                    console.error(`      ✗ Failed to upload ${filename}:`, error.message);
                    // Keep original entry on error
                    updatedManifest.push(item);
                }
            }

            // Write updated manifest
            fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2));
            console.log(`\n   ✅ Updated manifest: ${uploadedCount} uploaded, ${skippedCount} skipped`);

        } catch (error) {
            console.error(`   ✗ Error processing ${modelId}:`, error.message);
        }
    }

    console.log('\n🎉 Migration complete!');
}

// Run migration
if (require.main === module) {
    migrateShowcaseToB2()
        .then(() => {
            console.log('\n✅ All done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateShowcaseToB2 };

