import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json");

// Initialize Firebase Admin
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Import the task handler directly
// We'll need to manually invoke the logic since we can't import the exported function easily
// Instead, let's test by creating a proper queue item and manually triggering the task

async function testInference() {
    const userId = "test-user-" + Date.now();
    const requestId = "test-req-" + Date.now();

    console.log(`\n=== Testing Backend Inference ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Request ID: ${requestId}`);

    try {
        // 1. Setup Test User
        console.log(`\n1. Creating test user...`);
        await db.collection('users').doc(userId).set({
            email: "test@example.com",
            credits: 10,
            subscriptionStatus: "inactive", // Free tier user
            lastDailyReset: new Date(),
            lastGenerationTime: new Date(Date.now() - 10000) // 10 seconds ago to avoid rate limit
        }, { merge: true });
        console.log("   ✓ User created");

        // 2. Create queue document
        console.log(`\n2. Creating generation queue document...`);
        const queueRef = db.collection('generation_queue').doc(requestId);
        await queueRef.set({
            userId: userId,
            prompt: "A beautiful sunset over mountains, cinematic lighting, 4k quality",
            negative_prompt: "blurry, low quality, distorted",
            modelId: "cat-carrier",
            aspectRatio: "16:9",
            steps: 30,
            cfg: 7.0,
            scheduler: "DPM++ 2M Karras",
            status: "queued",
            createdAt: new Date()
        });
        console.log("   ✓ Queue document created");

        // 3. Manually enqueue the task
        console.log(`\n3. Enqueueing task...`);
        const queue = getFunctions().taskQueue('processImageTask');
        await queue.enqueue({
            requestId: requestId,
            userId: userId,
            prompt: "A beautiful sunset over mountains, cinematic lighting, 4k quality",
            negative_prompt: "blurry, low quality, distorted",
            modelId: "cat-carrier",
            steps: 30,
            cfg: 7.0,
            aspectRatio: "16:9",
            scheduler: "DPM++ 2M Karras"
        });
        console.log("   ✓ Task enqueued");

        // 4. Monitor the queue document for status changes
        console.log(`\n4. Monitoring generation status (timeout: 180s)...`);
        console.log("   Waiting for task to process...\n");

        let startTime = Date.now();
        let completed = false;
        let lastStatus = "queued";

        const unsubscribe = queueRef.onSnapshot((doc) => {
            if (!doc.exists) return;
            const data = doc.data();
            const status = data.status;

            if (status !== lastStatus) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`   [${elapsed}s] Status: ${lastStatus} → ${status}`);
                lastStatus = status;

                if (status === 'processing') {
                    console.log("   → Task is now processing...");
                } else if (status === 'completed') {
                    console.log(`\n   ✓ SUCCESS! Generation completed`);
                    console.log(`   Image URL: ${data.imageUrl || 'N/A'}`);
                    console.log(`   Thumbnail URL: ${data.thumbnailUrl || 'N/A'}`);
                    console.log(`   Result Image ID: ${data.resultImageId || 'N/A'}`);
                    completed = true;
                } else if (status === 'failed') {
                    console.error(`\n   ✗ FAILED! Generation failed`);
                    console.error(`   Error: ${data.error || 'Unknown error'}`);
                    completed = true;
                }
            }
        });

        // Wait for completion or timeout
        while (!completed) {
            if (Date.now() - startTime > 180000) {
                console.error("\n   ✗ TIMEOUT! Test timed out after 180s");
                const finalDoc = await queueRef.get();
                if (finalDoc.exists) {
                    const finalData = finalDoc.data();
                    console.log(`   Final status: ${finalData.status}`);
                    if (finalData.error) {
                        console.log(`   Error: ${finalData.error}`);
                    }
                }
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        unsubscribe();

        // 5. Check final result
        const finalDoc = await queueRef.get();
        if (finalDoc.exists) {
            const finalData = finalDoc.data();
            if (finalData.status === 'completed') {
                console.log(`\n=== Test PASSED ===`);
                console.log(`Final image URL: ${finalData.imageUrl}`);
                process.exit(0);
            } else {
                console.log(`\n=== Test FAILED ===`);
                console.log(`Final status: ${finalData.status}`);
                if (finalData.error) {
                    console.log(`Error: ${finalData.error}`);
                }
                process.exit(1);
            }
        } else {
            console.log(`\n=== Test FAILED ===`);
            console.log("Queue document was deleted or not found");
            process.exit(1);
        }

    } catch (error) {
        console.error("\n=== Test ERROR ===");
        console.error(error);
        process.exit(1);
    }
}

testInference().catch(console.error);

