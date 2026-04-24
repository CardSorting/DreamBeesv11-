import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";

export class SocialFollowingService {
    /**
     * Toggles a follow relationship between two users.
     */
    static async toggleFollow(followerUid: string, targetUid: string): Promise<{ isFollowing: boolean }> {
        if (followerUid === targetUid) throw new Error("You cannot follow yourself.");

        const followRef = db.collection('users').doc(followerUid).collection('following').doc(targetUid);
        const followerRef = db.collection('users').doc(targetUid).collection('followers').doc(followerUid);

        const userRef = db.collection('users').doc(followerUid);
        const targetUserRef = db.collection('users').doc(targetUid);

        return await db.runTransaction(async (t) => {
            const followDoc = await t.get(followRef);
            const isFollowing = followDoc.exists;

            if (isFollowing) {
                // Unfollow
                t.delete(followRef);
                t.delete(followerRef);

                t.update(userRef, {
                    followingCount: FieldValue.increment(-1)
                });
                t.update(targetUserRef, {
                    followerCount: FieldValue.increment(-1)
                });

                return { isFollowing: false };
            } else {
                // Follow
                const followerDoc = await t.get(userRef);
                const targetDoc = await t.get(targetUserRef);

                const followerData = followerDoc.data() as any;
                const targetData = targetDoc.data() as any;

                t.set(followRef, {
                    uid: targetUid,
                    username: targetData.username || 'Anonymous',
                    photoURL: targetData.photoURL || null,
                    createdAt: FieldValue.serverTimestamp()
                });

                t.set(followerRef, {
                    uid: followerUid,
                    username: followerData.username || 'Anonymous',
                    photoURL: followerData.photoURL || null,
                    createdAt: FieldValue.serverTimestamp()
                });

                t.update(userRef, {
                    followingCount: FieldValue.increment(1)
                });

                t.update(targetUserRef, {
                    followerCount: FieldValue.increment(1)
                });

                return { isFollowing: true };
            }
        });
    }
}
