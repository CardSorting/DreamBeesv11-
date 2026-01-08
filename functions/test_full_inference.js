/**
 * Full integration test of backend inference through Firebase Functions
 * This tests the complete flow: API call -> Task Queue -> Inference -> B2 Upload
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json");

// Initialize Firebase Admin
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function testFullInference() {
    const userId = "test-user-full-" + Date.now();
    const requestId = "test-req-full-" + Date.now();

    console.log(`\n=== Full Backend Inference Test ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Testing complete flow: API → Queue → Inference → B2 → Firestore\n`);

    try {
        // 1. Setup Test User
        console.log(`[1/5] Creating test user...`);
        await db.collection('users').doc(userId).set({
            email: "test@example.com",
            credits: 10,
            subscriptionStatus: "inactive",
            lastDailyReset: new Date(),
            lastGenerationTime: new Date(Date.now() - 10000)
        }, { merge: true });
        console.log(`   ✓ User created with 10 credits\n`);

        // 2. Create queue document (simulating API call)
        console.log(`[2/5] Creating generation queue document...`);
        const queueRef = db.collection('generation_queue').doc(requestId);
        await queueRef.set({
            userId: userId,
            prompt: "A beautiful sunset over mountains, cinematic lighting, 4k quality, detailed",
            negative_prompt: "blurry, low quality, distorted",
            modelId: "cat-carrier",
            aspectRatio: "16:9",
            steps: 30,
            cfg: 7.0,
            scheduler: "DPM++ 2M Karras",
            status: "queued",
            createdAt: new Date()
        });
        console.log(`   ✓ Queue document created\n`);

        // 3. Enqueue the task (simulating what the API does)
        console.log(`[3/5] Enqueueing task to processImageTask...`);
        const queue = getFunctions().taskQueue('processImageTask');
        await queue.enqueue({
            requestId: requestId,
            userId: userId,
            prompt: "A beautiful sunset over mountains, cinematic lighting, 4k quality, detailed",
            negative_prompt: "blurry, low quality, distorted",
            modelId: "cat-carrier",
            steps: 30,
            cfg: 7.0,
            aspectRatio: "16:9",
            scheduler: "DPM++ 2M Karras"
        });
        console.log(`   ✓ Task enqueued (this will be processed by Cloud Functions)\n`);

        // 4. Monitor status
        console.log(`[4/5] Monitoring generation status...`);
        console.log(`   Waiting for task processing (timeout: 180s)...\n`);

        let startTime = Date.now();
        let completed = false;
        let lastStatus = "queued";
        const statusHistory = [];

        const unsubscribe = queueRef.onSnapshot((doc) => {
            if (!doc.exists) return;
            const data = doc.data();
            const status = data.status;

            if (status !== lastStatus) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                statusHistory.push({ status, elapsed: parseFloat(elapsed) });
                console.log(`   [${elapsed}s] Status: ${lastStatus} → ${status}`);
                lastStatus = status;

                if (status === 'processing') {
                    console.log(`   → Task is processing inference...`);
                } else if (status === 'completed') {
                    console.log(`\n   ✓ SUCCESS! Generation completed`);
                    console.log(`   Image URL: ${data.imageUrl || 'N/A'}`);
                    console.log(`   Thumbnail: ${data.thumbnailUrl || 'N/A'}`);
                    console.log(`   Image ID: ${data.resultImageId || 'N/A'}`);
                    completed = true;
                } else if (status === 'failed') {
                    console.error(`\n   ✗ FAILED! Generation failed`);
                    console.error(`   Error: ${data.error || 'Unknown error'}`);
                    completed = true;
                }
            }
        });

        // Wait for completion
        while (!completed) {
            if (Date.now() - startTime > 180000) {
                console.error(`\n   ✗ TIMEOUT after 180s`);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        unsubscribe();

        // 5. Verify results
        console.log(`\n[5/5] Verifying results...`);
        const finalDoc = await queueRef.get();
        
        if (!finalDoc.exists) {
            console.log(`   ✗ Queue document not found`);
            process.exit(1);
        }

        const finalData = finalDoc.data();
        console.log(`   Final status: ${finalData.status}`);

        if (finalData.status === 'completed') {
            // Verify image document was created
            if (finalData.resultImageId) {
                const imageDoc = await db.collection('images').doc(finalData.resultImageId).get();
                if (imageDoc.exists) {
                    const imageData = imageDoc.data();
                    console.log(`   ✓ Image document created in Firestore`);
                    console.log(`   ✓ Image URL: ${imageData.imageUrl}`);
                    console.log(`   ✓ Thumbnail URL: ${imageData.thumbnailUrl ? 'Yes' : 'No'}`);
                    console.log(`   ✓ LQIP: ${imageData.lqip ? 'Yes' : 'No'}`);
                } else {
                    console.log(`   ⚠ Image document not found (ID: ${finalData.resultImageId})`);
                }
            }

            // Print timing summary
            console.log(`\n   Timing Summary:`);
            statusHistory.forEach(({ status, elapsed }) => {
                console.log(`     ${status}: ${elapsed}s`);
            });

            console.log(`\n=== Test PASSED ===`);
            console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
            process.exit(0);
        } else {
            console.log(`\n=== Test FAILED ===`);
            if (finalData.error) {
                console.log(`Error: ${finalData.error}`);
            }
            process.exit(1);
        }

    } catch (error) {
        console.error(`\n=== Test ERROR ===`);
        console.error(error);
        process.exit(1);
    }
}

testFullInference().catch(console.error);

