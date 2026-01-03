import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json");

// Initialize Firebase Admin
if (!process.env.FIREBASE_CONFIG) {
    // Mimic the config if needed or just init with cert
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

async function runTest() {
    const userId = "test-user-integration-" + Date.now();
    const requestId = "req-" + Date.now();

    console.log(`\n=== Starting Integration Test ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Request ID: ${requestId}`);

    // 1. Setup Test User with Credits
    console.log(`\n1. Creating/Updating Test User...`);
    await db.collection('users').doc(userId).set({
        email: "test@example.com",
        credits: 10,
        subscriptionStatus: "active", // Ensure pro to bypass some limits if needed, or stick to free
        lastDailyReset: new Date()
    }, { merge: true });
    console.log("   User setup complete.");

    // 2. Create Generation Request
    console.log(`\n2. Submitting Generation Request...`);
    const requestData = {
        userId: userId,
        prompt: "A futuristic city with flying cars, cyberpunk style, neon lights",
        negative_prompt: "blurry, low quality",
        modelId: "cat-carrier", // Ensure we use a valid model ID from index.js logic
        aspectRatio: "16:9",
        steps: 20,
        cfg: 7,
        status: "pending",
        createdAt: new Date()
    };

    const docRef = db.collection('generation_queue').doc(requestId);
    await docRef.set(requestData);
    console.log(`   Request written to generation_queue/${requestId} with status 'pending'`);

    // 3. Poll for Status Updates
    console.log(`\n3. Polling for Status Updates (Timeout: 120s)...`);

    let startTime = Date.now();
    let completed = false;
    let lastStatus = "pending";

    // Set up a listener
    const unsubscribe = docRef.onSnapshot((doc) => {
        if (!doc.exists) return;
        const data = doc.data();
        const status = data.status;

        if (status !== lastStatus) {
            console.log(`   [${new Date().toISOString().split('T')[1]}] Status changed: ${lastStatus} -> ${status}`);
            lastStatus = status;
        }

        if (status === 'queued') {
            // Good, ingestion worked
        } else if (status === 'processing') {
            // Good, task started
        } else if (status === 'completed') {
            console.log(`\n   SUCCESS! Generation completed.`);
            console.log(`   Image URL: ${data.imageUrl}`);
            console.log(`   Result Image ID: ${data.resultImageId}`);
            completed = true;
        } else if (status === 'failed') {
            console.error(`\n   FAILED! Generation failed.`);
            console.error(`   Error: ${data.error}`);
            completed = true; // Stop polling on failure
        }
    });

    // Wait loop
    while (!completed) {
        if (Date.now() - startTime > 120000) {
            console.error("\n   TIMEOUT! Test timed out after 120s.");
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    unsubscribe();

    if (completed && lastStatus === 'completed') {
        console.log(`\n=== Test PASSED ===`);
        process.exit(0);
    } else {
        console.log(`\n=== Test FAILED ===`);
        process.exit(1);
    }
}

runTest().catch(console.error);
