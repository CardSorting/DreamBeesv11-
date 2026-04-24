import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";

/**
 * Robustly ensures a user document exists in the 'users' collection.
 * Supports external transactions to enable atomic JIT provisioning.
 * 
 * @param uid The unique identifier for the user (standard: `discord:snowflake`).
 * @param displayName Currently provided name from the Discord handle.
 * @param photoURL Currently provided avatar URL from Discord.
 * @param t Optional Firestore Transaction for atomic operations.
 * @returns Promise<boolean> True if user state is synchronized or created.
 */
export async function ensureUserExists(
    uid: string, 
    displayName?: string, 
    photoURL?: string,
    t?: FirebaseFirestore.Transaction
): Promise<boolean> {
    // 1. Validation (Snowflake Enforcement)
    if (uid.startsWith("discord:")) {
        const snowflake = uid.split(":")[1];
        if (!snowflake || !/^\d+$/.test(snowflake)) {
            logger.warn(`[UserSync] Blocked invalid shadow identity: ${uid}`);
            return false;
        }
    }

    const logic = async (transaction: FirebaseFirestore.Transaction) => {
        const userRef = db.collection("users").doc(uid);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists) {
            // --- CASE 1: PROVISION NEW ---
            if (uid.startsWith("discord:")) {
                const identifier = displayName || uid.split(":")[1] || "Unknown Explorer";
                const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(identifier)}&background=fbbf24&color=fff`;

                transaction.set(userRef, {
                    uid,
                    displayName: identifier,
                    photoURL: photoURL || fallbackPhoto,
                    createdAt: FieldValue.serverTimestamp(),
                    lastSeenAt: FieldValue.serverTimestamp(),
                    zaps: 0,
                    role: 'user',
                    _type: 'discord_shadow'
                });
                logger.info(`[UserSync] Provisioned new shadow user: ${uid} (Name: ${identifier})`);
            }
        } else {
            // --- CASE 2: SYNC EXISTING ---
            const data = userSnap.data();
            if (data?._type === 'discord_shadow') {
                const updates: any = { lastSeenAt: FieldValue.serverTimestamp() };
                let changed = false;

                if (displayName && data.displayName !== displayName) {
                    updates.displayName = displayName;
                    changed = true;
                }
                if (photoURL && data.photoURL !== photoURL) {
                    updates.photoURL = photoURL;
                    changed = true;
                }

                if (changed) {
                    transaction.update(userRef, updates);
                    logger.info(`[UserSync] Synchronized identity for shadow user: ${uid}`);
                }
            }
        }
        return true;
    };

    try {
        if (t) {
            // Use existing transaction
            return await logic(t);
        } else {
            // Start a new transaction
            return await db.runTransaction(logic);
        }
    } catch (err: any) {
        logger.error(`[UserSync] CRITICAL: Transaction failed for ${uid}`, err);
        return false;
    }
}
