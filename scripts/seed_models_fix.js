import admin from "firebase-admin";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root
dotenv.config({ path: join(__dirname, "..", ".env") });

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "dreambees-alchemist";

console.log(`--- Seeding Models for Project: ${projectId} ---`);

// Initialize Admin SDK
// This assumes the user is logged in via 'firebase login' or has GOOGLE_APPLICATION_CREDENTIALS set.
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId
    });
} catch (e) {
    // If already initialized, just use the existing app
    if (!admin.apps.length) {
        throw e;
    }
}

const db = admin.firestore();

async function seed() {
    const models = [
        {
            id: "galmix",
            data: {
                name: "GalMix",
                description: "High-performance custom model for rapid experimentation. Free for all users.",
                isActive: true,
                isFree: true,
                order: -1,
                tags: ["Fast", "Free", "Universal"],
                image: "/models/galmix.png",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        },
        {
            id: "wai-illustrious",
            data: {
                image: "/models/wai-illustrious.png",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        }
    ];

    for (const model of models) {
        console.log(`Updating model: ${model.id}...`);
        try {
            await db.collection("models").doc(model.id).set(model.data, { merge: true });
            console.log(`✓ ${model.id} updated successfully.`);
        } catch (err) {
            console.error(`✗ Error updating ${model.id}:`, err.message);
        }
    }

    console.log("--- Seeding Finished ---");
    process.exit();
}

seed().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
