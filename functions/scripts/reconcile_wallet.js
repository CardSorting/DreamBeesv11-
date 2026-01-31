
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

try {
    initializeApp();
} catch { }

const db = getFirestore();

async function reconcileUsers() {
    console.log("Starting Wallet Reconciliation...");

    const usersSnap = await db.collection('users').get();
    let totalDiscrepancies = 0;

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();
        const storedZaps = userData.zaps || 0;
        const storedReels = userData.reels || 0;

        // Fetch all transactions for this user
        // Note: For large datasets, this needs pagination or BigQuery. 
        // For script usage, standard query is okay for <10k txs per user.
        const txSnap = await db.collection('wallet_transactions')
            .where('userId', '==', uid)
            .orderBy('timestamp', 'asc') // Order by time to replay history
            .get();

        let calculatedZaps = 0;
        let calculatedReels = 0;

        // Replay history
        // Assuming starting balance was 0. A more robust system uses periodic snapshots.
        // For DreamBees, let's assume 0 start or handle 'manual_adjustment' types if they exist.
        // If we migrated from legacy content, legacy balance might be the 'start'.
        // But for this check, we just sum credits/debits and look for variance.

        txSnap.docs.forEach(doc => {
            const tx = doc.data();
            const currency = tx.currency || 'zaps';
            const amount = tx.amount || 0;

            if (currency === 'zaps') {
                if (tx.type === 'credit') calculatedZaps += amount;
                else if (tx.type === 'debit') calculatedZaps -= amount;
            } else if (currency === 'reels') {
                if (tx.type === 'credit') calculatedReels += amount;
                else if (tx.type === 'debit') calculatedReels -= amount;
            }
        });

        const zapDiff = Math.abs(storedZaps - calculatedZaps);
        const reelDiff = Math.abs(storedReels - calculatedReels);

        // Tolerance for floating point (though we should use integers in cents/points)
        // Balances seem to be floats in this system.
        const TOLERANCE = 0.5;

        if (zapDiff > TOLERANCE || reelDiff > TOLERANCE) {
            console.error(`[DISCREPANCY] User: ${uid}`);
            console.error(`  Zaps: Stored=${storedZaps}, Calc=${calculatedZaps}, Diff=${storedZaps - calculatedZaps}`);
            console.error(`  Reels: Stored=${storedReels}, Calc=${calculatedReels}, Diff=${storedReels - calculatedReels}`);
            totalDiscrepancies++;
        } else {
            // console.log(`[OK] User: ${uid}`);
        }
    }

    console.log(`Reconciliation Complete. Found ${totalDiscrepancies} discrepant users.`);
}

reconcileUsers().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
