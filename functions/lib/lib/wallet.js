import { db, FieldValue } from "../firebaseInit.js";
import { HttpsError } from "firebase-functions/v2/https";
/**
 * Wallet Service
 * centralized handling of all user balances (Zaps) with:
 * - Atomic transactions
 * - Idempotency via requestId
 * - Immutable Ledger (wallet_transactions)
 */
export class Wallet {
    static async debit(uid, amount, requestId, metadata = {}, currency = 'zaps', externalTransaction = null, turbo = false) {
        if (!uid) {
            throw new HttpsError('unauthenticated', 'User must be authenticated.');
        }
        if (!requestId) {
            throw new HttpsError('invalid-argument', 'requestId is required.');
        }
        if (amount < 0) {
            throw new HttpsError('invalid-argument', 'Debit amount cannot be negative.');
        }
        const userRef = db.collection('users').doc(uid);
        const transactionRef = db.collection('wallet_transactions').doc(requestId);
        const run = async (t) => {
            // HYBRID TURBO: Choose metabolic (direct) vs transactional based on context
            if (turbo) {
                if (t) {
                    t.update(userRef, {
                        [currency]: FieldValue.increment(-amount),
                        lastTransactionTime: FieldValue.serverTimestamp()
                    });
                }
                else {
                    await userRef.update({
                        [currency]: FieldValue.increment(-amount),
                        lastTransactionTime: FieldValue.serverTimestamp()
                    });
                }
                return { success: true, transactionId: requestId, newBalance: 0, previousBalance: 0, idempotent: false };
            }
            // 1. Idempotency Check
            const existingTx = await t.get(transactionRef);
            if (existingTx.exists) {
                const data = existingTx.data();
                return { success: true, idempotent: true, transactionId: requestId, newBalance: data.newBalance, previousBalance: data.previousBalance };
            }
            // 2. Balance Check
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'User not found.');
            }
            const userData = userDoc.data();
            const currentBalance = userData[currency] || 0;
            if (amount > 0 && currentBalance !== 'unlimited' && currentBalance < amount) {
                throw new HttpsError('resource-exhausted', `Insufficient ${currency}.`);
            }
            // 3. Execution
            if (currentBalance === 'unlimited') {
                t.update(userRef, { lastTransactionTime: FieldValue.serverTimestamp() });
                // Log Transaction (Ledger)
                t.set(transactionRef, {
                    userId: uid, type: 'debit', currency, amount: 0, previousBalance: 'unlimited', newBalance: 'unlimited',
                    requestId, auditType: metadata.auditType || 'standard', metadata, timestamp: FieldValue.serverTimestamp(), createdAt: new Date().toISOString()
                });
                return { success: true, transactionId: requestId, newBalance: 0, previousBalance: 0, idempotent: false };
            }
            const newBalance = Math.max(0, currentBalance - amount);
            t.update(userRef, { [currency]: newBalance, lastTransactionTime: FieldValue.serverTimestamp() });
            // Log Transaction (Ledger)
            t.set(transactionRef, {
                userId: uid, type: 'debit', currency, amount, previousBalance: currentBalance, newBalance,
                requestId, auditType: metadata.auditType || 'standard', metadata, timestamp: FieldValue.serverTimestamp(), createdAt: new Date().toISOString()
            });
            return { success: true, transactionId: requestId, newBalance, previousBalance: currentBalance, idempotent: false };
        };
        if (externalTransaction)
            return await run(externalTransaction);
        if (turbo)
            return await run(null); // Metabolic direct update
        return await db.runTransaction(run);
    }
    /**
     * Credit funds to a user (refunds, purchases, rewards).
     */
    static async credit(uid, amount, requestId, metadata = {}, currency = 'zaps', externalTransaction = null, turbo = false) {
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
            // HYBRID TURBO: Choose metabolic (direct) vs transactional based on context
            if (turbo) {
                if (t) {
                    t.update(userRef, {
                        [currency]: FieldValue.increment(amount),
                        lastTransactionTime: FieldValue.serverTimestamp()
                    });
                }
                else {
                    await userRef.update({
                        [currency]: FieldValue.increment(amount),
                        lastTransactionTime: FieldValue.serverTimestamp()
                    });
                }
                return { success: true, transactionId: requestId, newBalance: 0, previousBalance: 0, idempotent: false };
            }
            // 1. Idempotency Check
            const existingTx = await t.get(transactionRef);
            if (existingTx.exists) {
                const data = existingTx.data();
                return { success: true, idempotent: true, transactionId: requestId, newBalance: data.newBalance, previousBalance: data.previousBalance };
            }
            // 2. Execution
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'User not found.');
            }
            const userData = userDoc.data();
            const currentBalance = userData[currency] || 0;
            if (currentBalance === 'unlimited') {
                t.update(userRef, { lastTransactionTime: FieldValue.serverTimestamp() });
                return { success: true, transactionId: requestId, newBalance: 0, previousBalance: 0, idempotent: false };
            }
            const newBalance = currentBalance + amount;
            t.update(userRef, { [currency]: newBalance, lastTransactionTime: FieldValue.serverTimestamp() });
            // Log Transaction (Ledger)
            t.set(transactionRef, {
                userId: uid, type: 'credit', currency, amount, previousBalance: currentBalance, newBalance,
                requestId, auditType: metadata.auditType || 'standard', metadata, timestamp: FieldValue.serverTimestamp(), createdAt: new Date().toISOString()
            });
            return { success: true, transactionId: requestId, newBalance, previousBalance: currentBalance, idempotent: false };
        };
        if (externalTransaction)
            return await run(externalTransaction);
        if (turbo)
            return await run(null); // Metabolic direct update
        return await db.runTransaction(run);
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