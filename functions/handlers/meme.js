import { HttpsError } from "firebase-functions/v2/https";
import { db, FieldValue } from "../firebaseInit.js";
import { handleError, logger, retryOperation } from "../lib/utils.js";
import { formatMemeWithGemini } from "../lib/ai.js";
import { CostManager } from "../lib/costs.js";
import { Billing } from "../lib/billing.js";

export const handleFormatMeme = async (request) => {
    const uid = request.auth?.uid;
    if (!uid) { throw new HttpsError('unauthenticated', "User must be authenticated"); }

    const { image, imageUrl, text, requestId } = request.data;
    if (!image && !imageUrl) { throw new HttpsError('invalid-argument', "Image required"); }

    const COST = await CostManager.get('MEME_FORMAT');

    try {

        const result = await formatMemeWithGemini(imageUrl, text, uid);

        return result;

    } catch (error) {
        // Refund logic
        if (error.code !== 'resource-exhausted') {
            if (error.code !== 'resource-exhausted') {
                try {
                    await Wallet.credit(uid, COST, `refund_meme_${requestId}`, { reason: 'meme_gen_failed' });
                } catch (refundErr) { logger.error("Refund failed", refundErr); }
            }
        }
        throw handleError(error, { uid });
    }
};
