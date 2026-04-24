
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load Environment FIRST ---
console.log("Loading environment...");
const envPath = path.resolve(__dirname, "../.env");
try {
    const envFile = fsSync.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value && !key.startsWith("#")) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn("Could not read .env file, assuming env vars are set.", e.message);
}

async function runTeacherBatch() {
    console.log("=== TEACHER BATCH RUN (SEQUENCED PROCESSING) ===");

    const targetDir = "/Users/bozoegg/Desktop/DreamBeesv11/functions/assets/images";

    // Dynamic imports
    console.log("Importing modules...");
    const { handleDistillRequest } = await import('../handlers/distill.js');

    // 1. Read files from directory
    const files = await fs.readdir(targetDir);
    const imageFiles = files.filter(f => {
        const ext = path.extname(f).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    }).map(f => path.join(targetDir, f));

    if (imageFiles.length === 0) {
        console.error("✗ No images found in the target directory.");
        return;
    }

    // 2. Determine chunking strategy
    const CHUNK_SIZE = 10;
    const targetImages = imageFiles; // Process EVERYTHING

    console.log(`Found ${imageFiles.length} images. Processing entire dataset in chunks of ${CHUNK_SIZE}...`);

    let currentPack = null;
    let iterations = Math.ceil(targetImages.length / CHUNK_SIZE);

    for (let i = 0; i < iterations; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, targetImages.length);
        const chunk = targetImages.slice(start, end);

        console.log(`\n--- Iteration ${i + 1}/${iterations} (Images ${start + 1}-${end}) ---`);

        const mockRequest = {
            data: {
                images: chunk,
                basePack: currentPack
            },
            auth: {
                uid: "teacher_sequenced_run"
            }
        };

        try {
            const result = await handleDistillRequest(mockRequest);

            if (result.success) {
                console.log(`✓ Iteration ${i + 1} successful: ${result.aestheticPack.aesthetic_name}`);
                currentPack = result.aestheticPack;

                // --- SAVE PROGRESS (Auto-Save) ---
                // We save every iteration so we don't lose progress on large sets
                const progressFilename = `progress_${currentPack.aesthetic_name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
                const progressPath = path.join(__dirname, "../packs", progressFilename);
                fsSync.writeFileSync(progressPath, JSON.stringify(currentPack, null, 2));
                console.log(`[Auto-Save] Progress saved to ${progressFilename}`);

                // Show a brief update on confidence scores
                console.log("Current Confidence:", JSON.stringify(currentPack.confidence_score_per_rule));
            } else {
                console.error(`✗ Iteration ${i + 1} failed. Skipping.`);
            }
        } catch (e) {
            if (e.message.includes("blocked the prompt")) {
                console.warn(`⚠ Iteration ${i + 1} was blocked by safety filters. Skipping visual evidence.`);
                continue;
            }
            console.error(`✗ Iteration ${i + 1} threw a critical error:`, e.message);
            break;
        }
    }

    if (currentPack) {
        console.log("\n=== SEQUENCED DISTILLATION COMPLETE ===");
        console.log(`✓ Final Aesthetic Pack: ${currentPack.aesthetic_name}`);
        console.log(`✓ Motif Count: ${currentPack.motif_inventory?.length}`);

        const finalFilename = `${currentPack.aesthetic_name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
        console.log(`✓ Final JSON: functions/packs/${finalFilename}`);
        console.log("\nFinal confidence scores:", JSON.stringify(currentPack.confidence_score_per_rule, null, 2));
    }
}

runTeacherBatch().catch(console.error);
