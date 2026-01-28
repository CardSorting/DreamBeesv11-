
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
    console.log("=== DISTILL BACKEND INTEGRATION TEST ===");

    // Dynamic imports
    console.log("Importing modules...");
    const { handleDistillRequest } = await import('../handlers/distill.js');

    // Sample images (using public URLs for testing)
    const testImages = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=512",
        "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=512",
        "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=512"
    ];

    const mockRequest = {
        data: {
            images: testImages
        },
        auth: {
            uid: "test_user_distill"
        }
    };

    console.log(`\n--- Calling handleDistillRequest with ${testImages.length} images ---`);

    try {
        const result = await handleDistillRequest(mockRequest);

        if (result.success) {
            console.log("✓ Distillation successful!");
            console.log("\n--- Aesthetic Pack JSON ---");
            console.log(JSON.stringify(result.aestheticPack, null, 2));
        } else {
            console.error("✗ Distillation failed. No success flag.");
        }
    } catch (e) {
        console.error("✗ Distillation threw an error:");
        console.error(e);
        if (e.message) console.error("Message:", e.message);
        if (e.details) console.error("Details:", e.details);
    }
}

runTest().catch(console.error);
