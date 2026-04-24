import { HttpsError } from "firebase-functions/v2/https";
import { SocialFollowingService } from "../lib/social.js";
import { handleError } from "../lib/utils.js";
export const handleToggleFollow = async (request) => {
    const uid = request.auth.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Must be logged in.');
    }
    const targetUid = request.data?.targetUid;
    if (!targetUid) {
        throw new HttpsError('invalid-argument', 'Target user ID required.');
    }
    try {
        const result = await SocialFollowingService.toggleFollow(uid, targetUid);
        return { success: true, ...result };
    }
    catch (error) {
        throw handleError(error, { uid, targetUid });
    }
};
//# sourceMappingURL=social.js.map