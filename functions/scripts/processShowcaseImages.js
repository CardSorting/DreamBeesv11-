
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// --- Configuration ---
const PROJECT_ID = "dreambees-alchemist"; // Replace with your actual Project ID if different
const SHOWCASE_DIR = "../../public/showcase"; // Relative to this script

// Initialize Firebase Admin (Assumes ADC or configured environment)
// Note: Run with GOOGLE_APPLICATION_CREDENTIALS set if not using `firebase functions:shell` or similar context
try {
    initializeApp({
        projectId: PROJECT_ID,
        serviceAccountId: `${PROJECT_ID}@appspot.gserviceaccount.com` // Required for Task Queue signing locally
    });
} catch (_e) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn("Warning: standard firebase initialization failed and no GOOGLE_APPLICATION_CREDENTIALS found. Ensure you are authenticated.");
    }
}

const db = getFirestore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ABS_SHOWCASE_DIR = path.resolve(__dirname, SHOWCASE_DIR);

/**
 * Main processing function.
 */
async function processShowcase() {
    // CLI Args: node script.js [categoryFilter]
    // Example: node functions/scripts/processShowcaseImages.js ani-detox
    const targetCategory = process.argv[2];

    console.log(`Scanning directory: ${ABS_SHOWCASE_DIR}`);
    if (targetCategory) console.log(`Filter: ${targetCategory}`);

    // Get Task Queue reference
    const LOCATION = "us-central1";
    const queue = getFunctions().taskQueue(`locations/${LOCATION}/functions/backgroundWorker`);

    const stats = {
        found: 0,
        skipped: 0,
        enqueued: 0,
        errors: 0,
        categories: 0
    };

    try {
        const dirs = await fs.readdir(ABS_SHOWCASE_DIR, { withFileTypes: true });

        // Simple Concurrency Helper
        const CONCURRENCY_LIMIT = 1;
        let activePromises = [];

        const runTask = async (taskFn) => {
            if (activePromises.length >= CONCURRENCY_LIMIT) {
                await Promise.race(activePromises);
            }
            const p = taskFn().then(() => {
                activePromises.splice(activePromises.indexOf(p), 1);
            });
            activePromises.push(p);
            return p;
        };

        for (const dir of dirs) {
            if (!dir.isDirectory()) continue;

            const categoryName = dir.name;
            if (targetCategory && categoryName !== targetCategory) continue;

            stats.categories++;
            const dirPath = path.join(ABS_SHOWCASE_DIR, categoryName);
            const manifestPath = path.join(dirPath, "manifest.json");

            console.log(`\nProcessing Category: ${categoryName}`);

            // Try to read manifest
            let manifest = [];
            try {
                const manifestContent = await fs.readFile(manifestPath, "utf-8");
                manifest = JSON.parse(manifestContent);
            } catch (_e) {
                // Warning suppressed for cleaner output
            }

            const manifestMap = new Map();
            manifest.forEach(item => {
                manifestMap.set(item.name, item);
            });

            const files = await fs.readdir(dirPath);

            for (const file of files) {
                if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
                stats.found++;

                await runTask(async () => {
                    try {
                        const nameWithoutExt = path.parse(file).name;
                        const manifestEntry = manifestMap.get(nameWithoutExt);
                        let publicUrl = manifestEntry?.imageUrl || manifestEntry?.url;

                        if (!publicUrl) {
                            publicUrl = `https://cdn.dreambeesai.com/file/printeregg/showcase/${categoryName}/${file}`;
                        }

                        const manifestName = manifestEntry?.name || nameWithoutExt;
                        let existingDocSnapshot = null;

                        // 1. Check by Manifest ID (Preferred stable ID)
                        if (manifestName) {
                            const idQuery = await db.collection("model_showcase_images")
                                .where("manifestId", "==", manifestName)
                                .get();

                            // Filter in memory for the correct category
                            if (!idQuery.empty) {
                                const match = idQuery.docs.find(d => d.data().showcaseCategory === categoryName);
                                if (match) existingDocSnapshot = match;
                            }
                        }

                        // 2. Fallback: Check by URL if not found by ID
                        if (!existingDocSnapshot) {
                            const urlQuery = await db.collection("model_showcase_images")
                                .where("imageUrl", "==", publicUrl)
                                .limit(1)
                                .get();
                            if (!urlQuery.empty) existingDocSnapshot = urlQuery.docs[0];
                        }

                        if (existingDocSnapshot) {
                            const data = existingDocSnapshot.data();
                            // STRICT V2 CHECK: Must have 'vibe' and 'gender' fields
                            if (data.vibe && data.tags && data.tags.length > 0 && data.subject && data.subject.gender) {
                                stats.skipped++;
                                process.stdout.write("s");
                                return;
                            }
                        }

                        // ENQUEUE TASK
                        const taskPayload = {
                            taskType: "showcase",
                            imageUrl: publicUrl,
                            manifestId: manifestName,
                            categoryName: categoryName,
                            manifestEntry: manifestEntry || { name: nameWithoutExt, imageUrl: publicUrl },
                            id: manifestName
                        };

                        await queue.enqueue(taskPayload, {
                            dispatchDeadlineSeconds: 540 // Max timeout for Gen 2 Cloud Tasks
                        });

                        stats.enqueued++;
                        process.stdout.write("E"); // E = Enqueued (capital E for visibility)

                    } catch (err) {
                        stats.errors++;
                        process.stdout.write("X");
                        console.error(`\nError processing ${file}:`, err.message);
                    }
                });
            }
        }

        // Wait for remaining tasks
        await Promise.all(activePromises);

        console.log("\n\n--- Processing Complete ---");
        console.table(stats);

    } catch (err) {
        console.error("Fatal Script Error:", err);
    }
}

processShowcase();
