import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load Environment ---
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
    console.warn("Could not read .env file, assuming env vars are set.");
}

async function runSample() {
    console.log("=== IMAGE GENERATION ENDPOINTS TEST ===");

    const { processImageTask } = await import('../workers/image.js');
    const { db } = await import('../firebaseInit.js');

    const testModels = [
        { id: "wai-illustrious", name: "SDXL (Illustrious)" },
        { id: "galmix", name: "Galmix" }
    ];

    for (const model of testModels) {
        const rid = `test_${model.id.replace(/-/g, '_')}_${Date.now()}`;
        const uid = "sample_user";

        console.log(`\n--- Testing Model: ${model.name} (${rid}) ---`);

        await db.collection('generation_queue').doc(rid).set({
            userId: uid,
            prompt: `A beautiful digital bee themed artwork, ${model.name} style`,
            modelId: model.id,
            status: "queued",
            createdAt: new Date(),
            steps: model.id === 'flux-2-dev' ? 20 : 30,
            aspectRatio: "1:1"
        });

        try {
            await processImageTask({
                data: {
                    requestId: rid,
                    userId: uid,
                    modelId: model.id,
                    prompt: `A beautiful digital bee themed artwork, ${model.name} style`,
                    steps: model.id === 'flux-2-dev' ? 20 : 30,
                    aspectRatio: "1:1"
                }
            });

            const doc = await db.collection('generation_queue').doc(rid).get();
            const data = doc.data();
            if (data.status === 'completed') {
                console.log(`✓ ${model.name} processed successfully!`);
                console.log(`  URL: ${data.imageUrl}`);
            } else {
                console.error(`✗ ${model.name} failed with status: ${data.status}`);
                if (data.error) console.error(`  Error: ${data.error}`);
            }
        } catch (e) {
            console.error(`✗ ${model.name} threw an exception:`, e.message);
        }
    }
}

runSample().catch(console.error);
