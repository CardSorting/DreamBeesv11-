
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "../firebaseInit.js";
import { logger } from "../lib/utils.js";

/**
 * WALLET GUARD TRIGGER
 * 
 * This trigger acts as a system-wide integrity check.
 * It monitors the 'users/{userId}' collection for any changes to 'zaps' or 'reels'.
 * 
 * Policy:
 * EVERY change to a user's financial balance MUST be accompanied by a 
 * record in the 'wallet_transactions' collection (The Ledger).
 * 
 * If a balance modification is detected WITHOUT a corresponding recent ledger entry,
 * this trigger flags it as a [WALLET_VIOLATION].
 */
export const walletGuard = onDocumentUpdated("users/{userId}", async (event) => {
    const userId = event.params.userId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    // 1. Detect Financial Changes
    const zapsChanged = (before.zaps || 0) !== (after.zaps || 0);
    const reelsChanged = (before.reels || 0) !== (after.reels || 0);

    if (!zapsChanged && !reelsChanged) {
        return; // No financial movement, ignore.
    }

    const zapsDelta = (after.zaps || 0) - (before.zaps || 0);
    const reelsDelta = (after.reels || 0) - (before.reels || 0);

    // 2. Audit against Ledger
    try {
        // We look for a ledger entry created very recently (within the last 10 seconds is plenty safe).
        // Since Wallet writes are atomic (same transaction), the ledger doc exists INSTANTLY.
        // We query by userId and sort by desc to get the latest.
        const recentLedgerSnap = await db.collection('wallet_transactions')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        let violation = false;
        let violationReason = "";

        if (recentLedgerSnap.empty) {
            violation = true;
            violationReason = "No ledger entries ever found for user";
        } else {
            const latestTx = recentLedgerSnap.docs[0].data();
            const txTime = latestTx.timestamp?.toDate ? latestTx.timestamp.toDate() : new Date(latestTx.createdAt);
            const updateTime = new Date(event.time); // Event timestamp

            // Skew tolerance: 30 seconds (generous for cloud clock Skew/Trigger delays)
            // But real atomic txs have identical server timestamps usually.
            const diffMs = Math.abs(updateTime.getTime() - txTime.getTime());

            if (diffMs > 30000) {
                violation = true;
                violationReason = `Latest ledger entry is too old (${diffMs}ms ago). ID: ${recentLedgerSnap.docs[0].id}`;
            }

            // Optional Stronger Check: Verify amount matches delta
            // This is complex if multiple transactions happened rapidly, but for single ops:
            // if (zapsChanged && latestTx.amount !== Math.abs(zapsDelta)) ...
        }

        if (violation) {
            logger.error(`[WALLET_VIOLATION] INTEGRITY BREACH DETECTED`, {
                userId,
                zapsDelta,
                reelsDelta,
                reason: violationReason,
                beforeZaps: before.zaps,
                afterZaps: after.zaps
            });

            // ALERTING: In a real prod env, we'd send a PagerDuty/Slack alert here.
            // For now, the ERROR log is our alert.
        } else {
            // logger.info(`[WALLET_GUARD] Verified transaction for ${userId}. Delta: Z=${zapsDelta}, R=${reelsDelta}`);
        }

    } catch (error) {
        logger.error(`[WALLET_GUARD_ERROR] Failed to audit transaction`, error);
    }
});
