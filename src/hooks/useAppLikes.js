import { useState, useEffect, useCallback } from 'react';
import { doc, runTransaction, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase';

export const useAppLikes = (userId) => {
    const [likedApps, setLikedApps] = useState(new Set());
    const [loading, setLoading] = useState(true);

    // Subscribe to user's liked apps
    useEffect(() => {
        if (!userId) {
            setLikedApps(new Set());
            setLoading(false);
            return;
        }

        const userLikesRef = collection(db, 'users', userId, 'likedApps');
        const unsubscribe = onSnapshot(userLikesRef, (snapshot) => {
            const newLikes = new Set();
            snapshot.forEach((doc) => {
                newLikes.add(doc.id);
            });
            setLikedApps(newLikes);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const toggleLike = useCallback(async (appId) => {
        if (!userId) return false;

        const appRef = doc(db, 'apps', appId);
        const userLikeRef = doc(db, 'users', userId, 'likedApps', appId);

        try {
            await runTransaction(db, async (transaction) => {
                const likeDoc = await transaction.get(userLikeRef);
                const exists = likeDoc.exists();

                // Update App count
                // We rely on Firestore incrementing, but inside transaction we read-modify-write for consistency if we wanted, 
                // but increment is atomic. However, we need to know accurate count.
                // Simpler: Just increment/decrement.

                // Get current app data just in case? No need if just incrementing.
                // Actually to ensure document exists:
                const appDoc = await transaction.get(appRef);
                if (!appDoc.exists()) {
                    throw new Error("App does not exist!");
                }

                const currentLikes = appDoc.data().likeCount || 0;
                let newLikes = currentLikes;

                if (exists) {
                    transaction.delete(userLikeRef);
                    newLikes = Math.max(0, currentLikes - 1);
                } else {
                    transaction.set(userLikeRef, {
                        timestamp: new Date()
                    });
                    newLikes = currentLikes + 1;
                }

                transaction.update(appRef, { likeCount: newLikes });
            });
            return true;
        } catch (error) {
            console.error("Error toggling like:", error);
            return false;
        }
    }, [userId]);

    const isLiked = useCallback((appId) => likedApps.has(appId), [likedApps]);

    return { likedApps, isLiked, toggleLike, loading };
};
