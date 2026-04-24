import { db, FieldValue } from "./firebaseInit.js";
import { handleCreateGenerationRequest } from "./handlers/generation.js";
import { handleRegisterDiscordGrid } from "./handlers/discord.js";
import { logger } from "./lib/utils.js";

async function testSync() {
    const testUid = "test-user-discord-sync";
    const testRequestId = "test-req-" + Date.now();

    console.log("--- Testing handleCreateGenerationRequest with shouldBookmark ---");
    try {
        // We need to mock the RequestWithAuth
        const mockRequest: any = {
            auth: { uid: testUid, token: { role: 'system' } },
            data: {
                prompt: "A beautiful sunset over a robotic meadow",
                modelId: "wai-illustrious",
                aspectRatio: "1:1",
                targetUserId: testUid,
                shouldBookmark: true,
                requestId: testRequestId
            }
        };

        const result = await handleCreateGenerationRequest(mockRequest);
        console.log("Generation request created:", result);

        // Verify queue doc
        const queueDoc = await db.collection("generation_queue").doc(testRequestId).get();
        if (queueDoc.exists) {
            console.log("Queue doc created successfully.");
            // Note: The task queue won't actually run in this test environment 
            // without a full emulator/production setup, but we've verified the API part.
        } else {
            console.error("Queue doc NOT found!");
        }

    } catch (err) {
        console.error("Error in handleCreateGenerationRequest test:", err);
    }

    console.log("\n--- Testing handleRegisterDiscordGrid ---");
    try {
        const mockGridRequest: any = {
            auth: { uid: "system", token: { role: 'system' } },
            data: {
                gridUrl: "https://example.com/grid.webp",
                prompt: "A beautiful sunset over a robotic meadow (Grid)",
                modelId: "wai-illustrious",
                targetUserId: testUid,
                requestId: testRequestId + "-grid"
            }
        };

        const gridResult = await handleRegisterDiscordGrid(mockGridRequest);
        console.log("Grid registered:", gridResult);

        // Verify image doc
        const imageDoc = await db.collection("images").doc(gridResult.imageId).get();
        if (imageDoc.exists) {
            console.log("Grid image doc created successfully.");
            const imageData = imageDoc.data();
            if (imageData?._type === 'discord_grid') {
                console.log("Grid image has correct metadata.");
            }
        }

        // Verify bookmark doc
        const bookmarkDoc = await db.collection("users").doc(testUid).collection("bookmarks").doc(gridResult.imageId).get();
        if (bookmarkDoc.exists) {
            console.log("Grid bookmark created successfully.");
        }

    } catch (err) {
        console.error("Error in handleRegisterDiscordGrid test:", err);
    }
}

// Note: Running this requires a valid service account or local emulator environment.
// For now, I'll just use this as a logic check/documentation of the test flow.
// testSync().then(() => console.log("Test finished."));
