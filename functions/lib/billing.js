import { db, FieldValue } from "../firebaseInit.js";
import { logger, retryOperation } from "./utils.js";
import { Wallet } from "./wallet.js";
import { CostManager } from "./costs.js";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * Billing Wrapper Utility
 * Abstracting the repetitive patterns of:
 * 1. Fetching Dynamic Cost
 * 2. executing Wallet Debit
 * 3. Handling Idempotency
 * 4. Running a DB Write (Atomic) OR Running a Sync Action (Async with Refund)
 * 5. Handling Two-Phase Flows (Atomic Init + Async Work + Refund on Failure)
 */
export class Billing {

    /**
     * Executes an Atomic Transaction: Debit + Database Writes (e.g., Queue Creation).
     * @param {string} uid - User ID
     * @param {string} costKey - Key in ZAP_COSTS (e.g. 'IMAGE_GENERATION')
     * @param {string} requestId - Unique Request ID
     * @param {object} metadata - Metadata for the wallet ledger
     * @param {function(FirebaseFirestore.Transaction, number): Promise<void>} dbCallback - Function to execute DB writes. Receives (transaction, cost).
     * @returns {Promise<{success: boolean, requestId: string, cost: number, idempotent?: boolean}>}
     */
    static async runAtomic(uid, costOrKey, requestId, metadata, dbCallback) {
        if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }

        try {
            const cost = (typeof costOrKey === 'number') ? costOrKey : await CostManager.get(costOrKey);

            // Allow metadata to override cost if needed (e.g. custom user selection logic passed in)
            // But usually costKey is sufficient.

            let result = { success: false };

            await db.runTransaction(async (t) => {
                // 1. Idempotency Check (via Wallet or Manual? Wallet handles it if we pass requestId)
                // However, Wallet.debit returns a value, it doesn't just block.
                // We need to know if it was idempotent to skip the dbCallback?
                // Wallet.debit throws if Insufficient Funds.
                // If Idempotent, it returns { success: true, idempotent: true }

                const debitResult = await Wallet.debit(uid, cost, requestId, metadata, 'zaps', t);

                if (debitResult.idempotent) {
                    result = debitResult;
                    return;
                }

                // 2. Run the custom DB writes (Queue creation, etc)
                // We pass 'cost' in case they want to record the exact charged amount
                await dbCallback(t, cost);

                result = { success: true, requestId, cost };
            });

            return result;

        } catch (error) {
            // No refund needed for Atomic, because the transaction failed, so Debit was rolled back.
            // Just rethrow or normalize
            if (error instanceof HttpsError) { throw error; }
            throw new HttpsError('internal', error.message);
        }
    }

    /**
     * Executes an Async Action: Debit -> Action -> (Refund on Failure).
     * Used for synchronous generations (Mockups, E-commerce) where we wait for result.
     * @param {string} uid - User ID
     * @param {string|number} costOrKey - Key in ZAP_COSTS or direct amount
     * @param {string} requestId - Unique ID
     * @param {object} metadata - Ledger metadata
     * @param {function(number): Promise<any>} actionCallback - Async function to run. Receives (cost).
     * @param {object} options - Options like { retries: 3 }
     * @returns {Promise<any>} Result of actionCallback, or throws error.
     */
    static async runAsync(uid, costOrKey, requestId, metadata, actionCallback, options = {}) {
        if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }

        const cost = (typeof costOrKey === 'number') ? costOrKey : await CostManager.get(costOrKey);

        // 1. Debit (Atomic within itself)
        const debitResult = await Wallet.debit(uid, cost, requestId, metadata);

        if (debitResult.idempotent) {
            // If it was already paid, we ideally want to return the cached result?
            // But we don't assume we have it. 
            // For now, we just return success: true meant for "don't run action again".
            return { success: true, idempotent: true };
        }

        // 2. Run Action with Retry
        try {
            return await retryOperation(async () => {
                return await actionCallback(cost);
            }, { retries: options.retries || 0, context: `Billing.runAsync(${requestId})` });

        } catch (error) {
            // 3. Refund on Failure
            logger.error(`[Billing] Action failed for ${requestId}, initiating refund.`, error);

            try {
                await Wallet.credit(uid, cost, `refund_${requestId}`, {
                    type: 'refund',
                    originalRequestId: requestId,
                    reason: error.message
                });
            } catch (refundError) {
                logger.error(`[Billing] CRITICAL: Refund failed for ${requestId}`, refundError);
                // DLQ: Persist failed refund to DB
                try {
                    await db.collection('failed_refunds').add({
                        uid, cost, requestId,
                        originalError: error.message,
                        refundError: refundError.message,
                        metadata: metadata || {},
                        createdAt: FieldValue.serverTimestamp(),
                        status: 'pending_manual_review'
                    });
                } catch (dlqError) {
                    logger.error(`[Billing] SUPER CRITICAL: Failed to write to DLQ for ${requestId}`, dlqError);
                }
            }

            throw error; // Re-throw to client
        }
    }

    /**
     * Executes a Two-Phase Flow: 
     * Phase 1 (Atomic): Debit + Run 'initCallback' (e.g., create processing doc).
     * Phase 2 (Async): Run 'actionCallback' (e.g., long-running AI).
     * Failure: If Phase 2 fails, auto-refund.
     * 
     * @param {string} uid 
     * @param {string|number} costOrKey 
     * @param {string} requestId 
     * @param {object} metadata 
     * @param {function(FirebaseFirestore.Transaction): Promise<void>} initCallback - Transactional init
     * @param {function(number): Promise<any>} actionCallback - Async work
     * @param {object} options 
     */
    static async runTwoPhase(uid, costOrKey, requestId, metadata, initCallback, actionCallback, options = {}) {
        if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }

        const cost = (typeof costOrKey === 'number') ? costOrKey : await CostManager.get(costOrKey);
        let idempotent = false;

        // Phase 1: Debit + Init
        await db.runTransaction(async (t) => {
            const debitResult = await Wallet.debit(uid, cost, requestId, metadata, 'zaps', t);
            if (debitResult.idempotent) {
                idempotent = true;
                return;
            }
            await initCallback(t);
        });

        if (idempotent) { return { success: true, idempotent: true }; }

        // Phase 2: Async Action
        try {
            return await retryOperation(async () => {
                return await actionCallback(cost);
            }, { retries: options.retries || 0, context: `Billing.runTwoPhase(${requestId})` });

        } catch (error) {
            // Phase 2 Failed -> Refund
            logger.error(`[Billing] TwoPhase Action failed for ${requestId}, refunding.`, error);
            try {
                await Wallet.credit(uid, cost, `refund_${requestId}`, {
                    type: 'refund',
                    originalRequestId: requestId,
                    reason: error.message
                });
            } catch (refundError) {
                logger.error(`[Billing] CRITICAL: Refund failed for ${requestId}`, refundError);
                // DLQ: Persist failed refund to DB
                try {
                    await db.collection('failed_refunds').add({
                        uid, cost, requestId,
                        originalError: error.message,
                        refundError: refundError.message,
                        metadata: metadata || {},
                        createdAt: FieldValue.serverTimestamp(),
                        status: 'pending_manual_review'
                    });
                } catch (dlqError) {
                    logger.error(`[Billing] SUPER CRITICAL: Failed to write to DLQ for ${requestId}`, dlqError);
                }
            }
            throw error;
        }
    }
}
