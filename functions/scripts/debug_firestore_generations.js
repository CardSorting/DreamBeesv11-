
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

try {
    initializeApp({ projectId: "dreambees-alchemist" });
} catch {
    // ignore
}

const db = getFirestore();

async function debugGenerations() {
    console.log("--- Debugging generations collection ---");
    const snapshot = await db.collection("generations")
        .where('type', '==', 'mockup')
        .limit(20)
        .get();

    if (snapshot.empty) {
        console.log("Collection 'generations' (type=mockup) is EMPTY.");
        return;
    }

    console.log(`Found ${snapshot.size} sample docs.`);
    let localPathCount = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const url = data.url || data.imageUrl;

        if (url && (url.startsWith('/') || !url.startsWith('http'))) {
            console.log(`[SUSPICIOUS] ID: ${doc.id}, URL: ${url}`);
            localPathCount++;
        }
    });

    console.log(`\nFound ${localPathCount} suspicious (local/relative) URLs in sample.`);
}

debugGenerations();
