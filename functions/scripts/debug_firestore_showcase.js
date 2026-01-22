
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

try {
    initializeApp({ projectId: "dreambees-alchemist" });
} catch (_e) {
    // ignore
}

const db = getFirestore();

async function debugShowcase() {
    console.log("--- Debugging model_showcase_images Queries ---");

    // 1. Global Feed Query
    console.log("\n[Test] Global Feed Query (orderBy createdAt desc)");
    try {
        const q1 = db.collection("model_showcase_images")
            .orderBy('createdAt', 'desc')
            .limit(5);
        const snap1 = await q1.get();
        console.log(`Global Feed returned ${snap1.size} docs.`);
        if (!snap1.empty) {
            const first = snap1.docs[0].data();
            console.log(`Sample: ID=${snap1.docs[0].id}, Time=${first.createdAt ? first.createdAt._seconds : 'N/A'}, URL=${first.imageUrl || first.url}`);
        }
    } catch (_e) {
        console.error("Global Feed Query FAILED:", e.message);
    }

    // 2. Model Specific Query
    console.log("\n[Test] Model Specific Query (where modelId == 'flux-klein-4b')");
    try {
        const q2 = db.collection("model_showcase_images")
            .where('modelId', '==', 'flux-klein-4b')
            .orderBy('createdAt', 'desc')
            .limit(5);
        const snap2 = await q2.get();
        console.log(`Model Feed returned ${snap2.size} docs.`);
        if (!snap2.empty) {
            const first = snap2.docs[0].data();
            console.log(`Sample: ID=${snap2.docs[0].id}`);
        }
    } catch (_e) {
        console.error("Model Feed Query FAILED:", e.message);
        if (e.message.includes("indexes")) console.log("--> This suggests a MISSING INDEX.");
    }
}

debugShowcase();
