import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load Environment FIRST ---
console.log("Loading environment...");
const envPath = path.resolve(__dirname, "../.env");
try {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value && !key.startsWith("#")) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn("Could not read .env file, assuming env vars are set.", e.message);
}

async function testStudentBatch() {
    console.log("=== TESTING STUDENT BATCH ENDPOINT ===");

    const { handleStudentBatchComposeRequest } = await import('../handlers/distillStudentBatch.js');

    const args = process.argv.slice(2);
    const packArg = args.find(arg => arg.startsWith("--pack="))?.split("=")[1];
    const packId = packArg || "soft_focus_idol_portraiture";

    console.log(`Using Pack ID: ${packId}`);

    const mockRequest = {
        data: {
            packId: packId,
            batchCount: 10,
            userRequest: "A diverse batch of high-fidelity prompts.",
            triggerGeneration: false // Don't trigger actual generations to save quota/time
        },
        auth: {
            uid: "test_user_batch"
        }
    };

    try {
        console.log("Calling handleStudentBatchComposeRequest...");
        const result = await handleStudentBatchComposeRequest(mockRequest);

        if (result.success) {
            console.log("✓ Batch Composition Successful!");
            console.log(`Pack Name: ${result.pack_name}`);
            console.log(`Batch Size: ${result.batch.length}`);

            result.batch.forEach((item, index) => {
                console.log(`\n--- Prompt ${index + 1} ---`);
                console.log(`Internal Mode: ${item.internal_mode}`);
                console.log(`Prompt: ${item.prompt}`);
                console.log(`Negative: ${item.negative_prompt}`);
            });
        } else {
            console.error("✗ Batch Composition Failed:", result.error);
        }
    } catch (e) {
        console.error("✗ Critical error during test:", e.message);
        console.error(e.stack);
    }
}

testStudentBatch().catch(console.error);
