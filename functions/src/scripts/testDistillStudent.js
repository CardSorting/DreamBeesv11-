
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load Environment FIRST ---
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

async function runTest() {
    console.log("=== DISTILL STUDENT INTEGRATION TEST ===");

    // Dynamic imports
    console.log("Importing modules...");
    const { handleStudentComposeRequest } = await import('../handlers/distillStudent.js');

    // Load an existing pack
    const packsDir = path.resolve(__dirname, "../packs");
    const files = await fs.readdir(packsDir);
    const packFile = files.find(f => f.endsWith(".json"));

    if (!packFile) {
        console.error("✗ No packs found in functions/packs/. Run testDistill.js first.");
        return;
    }

    console.log(`Using pack: ${packFile}`);

    const mockRequest = {
        data: {
            packId: packFile,
            userRequest: "A flowing cosmic energy dance, emphasizing soft light transitions and ethereal movement.",
            modelId: "flux-2-dev",
            aspectRatio: "16:9"
        },
        auth: {
            uid: "anonymous-galmix-test"
        }
    };

    console.log(`\n--- Running 3 iterations of handleStudentComposeRequest to verify variance ---`);

    for (let i = 1; i <= 3; i++) {
        console.log(`\n[Iteration ${i}] Calling handleStudentComposeRequest...`);
        try {
            const result = await handleStudentComposeRequest(mockRequest);
            if (result.success) {
                console.log(`✓ Iteration ${i} successful:`);
                console.log(`  Pack: ${result.composed.pack_name}`);
                console.log(`  Prompt: ${result.composed.prompt}`);
                console.log(`  Notes: ${result.composed.style_lock_notes.join(', ')}`);
            } else {
                console.warn(`⚠ Iteration ${i} refused/failed:`, result);
            }
        } catch (e) {
            console.error(`✗ Iteration ${i} threw an error:`, e.message);
        }
    }
}

runTest().catch(console.error);
