import { db, FieldValue } from "../firebaseInit.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "./utils.js";
/**
 * Wallet Service
 * centralized handling of all user balances (Zaps) with:
 * - Atomic transactions
 * - Idempotency via requestId
 * - Immutable Ledger (wallet_transactions)
 */
export class Wallet {
    /**
     * Debit funds from a user.
     */
    static async debit(uid, amount, requestId, metadata = {}, currency = 'zaps', externalTransaction = null) {
        if (!uid) {
            throw new HttpsError('unauthenticated', 'User must be authenticated.');
        }
        if (!requestId) {
            throw new HttpsError('invalid-argument', 'requestId is required for financial transactions.');
        }
        if (amount < 0) {
            throw new HttpsError('invalid-argument', 'Debit amount cannot be negative.');
        }
        const userRef = db.collection('users').doc(uid);
        const transactionRef = db.collection('wallet_transactions').doc(requestId);
        const run = async (t) => {
            // 1. Idempotency Check
            const existingTx = await t.get(transactionRef);
            if (existingTx.exists) {
                logger.info(`[Wallet] Idempotent debit skipped: ${requestId}`);
                const data = existingTx.data();
                return {
                    success: true,
                    idempotent: true,
                    transactionId: requestId,
                    newBalance: data.newBalance,
                    previousBalance: data.previousBalance
                };
            }
            // 2. Balance Check
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'User not found.');
            }
            const userData = userDoc.data();
            const currentBalance = userData[currency] || 0;
            if (amount > 0 && currentBalance < amount) {
                logger.warn(`[Wallet] Insufficient funds: ${uid} has ${currentBalance} ${currency}, needs ${amount}`);
                throw new HttpsError('resource-exhausted', `Insufficient ${currency}. Need ${amount}, have ${currentBalance.toFixed(1)}`);
            }
            // 3. Execution
            const newBalance = Math.max(0, currentBalance - amount);
            // Update User
            const userUpdate = {
                [currency]: newBalance,
                lastTransactionTime: FieldValue.serverTimestamp()
            };
            t.update(userRef, userUpdate);
            // Log Transaction (Ledger)
            const ledgerEntry = {
                userId: uid,
                type: 'debit',
                currency,
                amount,
                previousBalance: currentBalance,
                newBalance,
                requestId,
                metadata,
                timestamp: FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            };
            t.set(transactionRef, ledgerEntry);
            return {
                success: true,
                transactionId: requestId,
                newBalance,
                previousBalance: currentBalance,
                idempotent: false
            };
        };
        if (externalTransaction) {
            return await run(externalTransaction);
        }
        else {
            return await db.runTransaction(run);
        }
    }
    /**
     * Credit funds to a user (refunds, purchases, rewards).
     */
    static async credit(uid, amount, requestId, metadata = {}, currency = 'zaps', externalTransaction = null) {
        if (!uid) {
            throw new HttpsError('unauthenticated', 'User must be authenticated.');
        }
        if (!requestId) {
            throw new HttpsError('invalid-argument', 'requestId is required.');
        }
        if (amount < 0) {
            throw new HttpsError('invalid-argument', 'Credit amount cannot be negative.');
        }
        const userRef = db.collection('users').doc(uid);
        const transactionRef = db.collection('wallet_transactions').doc(requestId);
        const run = async (t) => {
            // 1. Idempotency Check
            const existingTx = await t.get(transactionRef);
            if (existingTx.exists) {
                logger.info(`[Wallet] Idempotent credit skipped: ${requestId}`);
                const data = existingTx.data();
                return {
                    success: true,
                    idempotent: true,
                    transactionId: requestId,
                    newBalance: data.newBalance,
                    previousBalance: data.previousBalance
                };
            }
            // 2. Get User State
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'User not found.');
            }
            const userData = userDoc.data();
            const currentBalance = userData[currency] || 0;
            // 3. Execution
            const newBalance = currentBalance + amount;
            // Update User
            const userUpdate = {
                [currency]: newBalance,
                lastTransactionTime: FieldValue.serverTimestamp()
            };
            t.update(userRef, userUpdate);
            // Log Transaction (Ledger)
            const ledgerEntry = {
                userId: uid,
                type: 'credit',
                currency,
                amount,
                previousBalance: currentBalance,
                newBalance,
                requestId,
                metadata,
                timestamp: FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            };
            t.set(transactionRef, ledgerEntry);
            return {
                success: true,
                transactionId: requestId,
                newBalance,
                previousBalance: currentBalance,
                idempotent: false
            };
        };
        if (externalTransaction) {
            return await run(externalTransaction);
        }
        else {
            return await db.runTransaction(run);
        }
    }
    static async getBalance(uid) {
        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) {
            throw new HttpsError('not-found', 'User not found');
        }
        const data = doc.data();
        return {
            zaps: data.zaps || 0
        };
    }
}
//# sourceMappingURL=wallet.js.map