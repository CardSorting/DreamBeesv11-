
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

    console.log(`\n--- Calling handleStudentComposeRequest with pack: ${packFile} ---`);

    try {
        const result = await handleStudentComposeRequest(mockRequest);

        if (result.success) {
            console.log("✓ Student composition and generation trigger successful!");
            console.log("\n--- Response JSON ---");
            console.log(JSON.stringify(result, null, 2));
            if (result.generation && result.generation.requestId) {
                console.log(`\n✓ Generation enqueued with ID: ${result.generation.requestId}`);
            }
        } else {
            console.error("✗ Student composition failed or was refused.");
            console.log(JSON.stringify(result, null, 2));
        }
    } catch (e) {
        console.error("✗ Student composition threw an error:");
        console.error(e);
        if (e.message) console.error("Message:", e.message);
    }
}

runTest().catch(console.error);
