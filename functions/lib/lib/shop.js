import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";
export const SHOP_ITEMS = {};
export class KarmaShopService {
    /**
     * Purchases an item using Karma.
     */
    static async purchaseItem(uid, itemId) {
        const item = SHOP_ITEMS[itemId];
        if (!item)
            return { success: false, message: "Item not found" };
        const userRef = db.collection('users').doc(uid);
        try {
            return await db.runTransaction(async (t) => {
                const userDoc = await t.get(userRef);
                const userData = userDoc.data();
                const currentKarma = userData?.karma || 0;
                if (currentKarma < item.cost) {
                    return { success: false, message: `Insufficient Karma. Need ${item.cost}` };
                }
                t.update(userRef, {
                    karma: FieldValue.increment(-item.cost),
                    [`inventory.${itemId}`]: FieldValue.increment(1),
                    lastPurchaseAt: FieldValue.serverTimestamp()
                });
                // Log purchase
                t.set(db.collection('karma_purchases').doc(), {
                    uid,
                    itemId,
                    cost: item.cost,
                    createdAt: FieldValue.serverTimestamp()
                });
                return { success: true, message: `Successfully purchased ${item.name}!` };
            });
        }
        catch (error) {
            logger.error(`[KarmaShop] Purchase failed for ${uid} item ${itemId}`, error);
            return { success: false, message: "Internal server error during purchase" };
        }
    }
}
//# sourceMappingURL=shop.js.map