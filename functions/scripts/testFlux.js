
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load Environment FIRST ---
// This must happen before importing any app modules so valid_constants.js picks up the values
console.log("Loading environment...");
const envPath = path.resolve(__dirname, "../.env");
try {
    const envFile = await fs.readFile(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value && !key.startsWith("#")) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn("Could not read .env file, assuming env vars are set.", e.message);
}

// Check if they are actually set now
console.log("CLOUDFLARE_ACCOUNT_ID present:", !!process.env.CLOUDFLARE_ACCOUNT_ID);
console.log("CLOUDFLARE_API_TOKEN present:", !!process.env.CLOUDFLARE_API_TOKEN);

async function runTest() {
    console.log("=== FLUX 2 DEV TIERED INTEGRATION TEST ===");

    // Dynamic imports after env vars are set
    console.log("Importing modules...");
    const { processImageTask } = await import('../workers/image.js');
    const { db } = await import('../firebaseInit.js');

    const helperProcess = async (uid, name, isSub) => {
        const rid = `test_flux_${name.toLowerCase()}_${Date.now()}`;
        console.log(`\n--- Testing ${name} User (${uid}) ---`);

        // Setup User
        await db.collection('users').doc(uid).set({
            uid,
            displayName: `${name} User`,
            subscriptionStatus: isSub ? 'active' : 'inactive',
            email: `${name}@test.com`,
            zaps: 100
        }, { merge: true });

        // Setup Queue Item
        await db.collection('generation_queue').doc(rid).set({
            userId: uid,
            prompt: `${name} user test`,
            modelId: "flux-2-dev",
            status: "queued",
            createdAt: new Date(),
            steps: 20,
            cfg: 3.5,
            aspectRatio: "1:1"
        });

        try {
            await processImageTask({
                data: {
                    requestId: rid,
                    userId: uid,
                    modelId: "flux-2-dev",
                    prompt: `${name} user test`,
                    steps: 20,
                    cfg: 3.5,
                    aspectRatio: "1:1"
                }
            });

            // Verify
            const doc = await db.collection('generation_queue').doc(rid).get();
            const data = doc.data();
            if (data.status === 'completed') {
                console.log(`✓ ${name} Request processed successfully.`);
                console.log(`  URL: ${data.imageUrl}`);
            } else {
                console.error(`✗ ${name} Request failed in DB: ${data.status}`);
                if (data.error) console.error(`  Error: ${data.error}`);
            }
        } catch (e) {
            console.error(`✗ ${name} Request threw:`, e.message);
        }
    };

    // Run Tests
    await helperProcess("test_user_free", "Free", false);
    await helperProcess("test_user_pro", "Premium", true);
}

runTest().catch(console.error);
