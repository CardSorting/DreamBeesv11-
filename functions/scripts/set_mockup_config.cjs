const admin = require("firebase-admin");

// Initialize Firebase Admin
// Try to use application default credentials or fall back to standard init
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
} catch (e) {
    console.log("Failed to init with applicationDefault, trying no-args for emulator/default...");
    try {
        admin.initializeApp();
    } catch (e2) {
        console.error("Could not initialize firebase-admin:", e2.message);
        process.exit(1);
    }
}

const db = admin.firestore();

async function setMockupConfig() {
    const args = process.argv.slice(2);
    let newCost = null;

    // Parse cost argument
    const costArg = args.find(a => a.startsWith("--cost="));
    if (costArg) {
        const val = parseFloat(costArg.split("=")[1]);
        if (!isNaN(val) && val >= 0) {
            newCost = val;
        } else {
            console.error("Invalid cost value. Must be a non-negative number.");
            return;
        }
    }

    if (newCost === null) {
        console.log("Usage: node functions/scripts/set_mockup_config.cjs --cost=0.25");
        // Show current status
        try {
            const doc = await db.collection("sys_config").doc("mockup_studio").get();
            if (doc.exists) {
                console.log("Current Configuration:", doc.data());
            } else {
                console.log("No configuration found for sys_config/mockup_studio (Default: 0.25 Zaps)");
            }
        } catch (e) {
            console.error("Error fetching config:", e.message);
        }
        return;
    }

    const updates = {
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
        updated_by: "script"
    };

    if (newCost !== null) {
        console.log(`Setting 'cost_per_generation' to: ${newCost}`);
        updates.cost_per_generation = newCost;
    }

    try {
        await db.collection("sys_config").doc("mockup_studio").set(updates, { merge: true });
        console.log("Configuration updated successfully.");
    } catch (error) {
        console.error("Failed to update configuration:", error);
    }
}

setMockupConfig().catch(console.error);
