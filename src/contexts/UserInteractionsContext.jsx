import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from './AuthContext';
import { useModel } from './ModelContext'; // For global rate stats if needed
import toast from 'react-hot-toast';

const UserInteractionsContext = createContext();

export function useUserInteractions() {
    return useContext(UserInteractionsContext);
}

export function UserInteractionsProvider({ children }) {
    const { currentUser } = useAuth();
    const { rateShowcaseImage } = useModel();

    // Sets for O(1) checks, Arrays for UI lists
    const [likedIds, setLikedIds] = useState(new Set());
    const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
    const [hiddenIds, setHiddenIds] = useState(new Set());
    const [likes, setLikes] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [hidden, setHidden] = useState([]);

    // User Profile Data (Centralized Sync)
    const [userProfile, setUserProfile] = useState({
        zaps: 5,
        reels: 0,
        credits: 5,
        subscriptionStatus: 'inactive'
    });

    useEffect(() => {
        if (!currentUser?.uid) {
            setLikedIds(new Set());
            setBookmarkedIds(new Set());
            setHiddenIds(new Set());
            setLikes([]);
            setBookmarks([]);
            setHidden([]);
            return;
        }

        const uid = currentUser.uid;

        // Listener for Likes
        const likesQuery = query(collection(db, `users/${uid}/likes`), orderBy('createdAt', 'desc'));
        const unsubLikes = onSnapshot(likesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLikes(data);
            setLikedIds(new Set(data.map(item => item.id)));
        }, (error) => {
            console.warn("Global likes listener failed:", error);
        });

        // Listener for Bookmarks
        const bookmarksQuery = query(collection(db, `users/${uid}/bookmarks`), orderBy('createdAt', 'desc'));
        const unsubBookmarks = onSnapshot(bookmarksQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBookmarks(data);
            setBookmarkedIds(new Set(data.map(item => item.id)));
        }, (error) => {
            console.warn("Global bookmarks listener failed:", error);
        });

        // Listener for Hidden Posts
        const hiddenQuery = query(collection(db, `users/${uid}/hidden`), orderBy('createdAt', 'desc'));
        const unsubHidden = onSnapshot(hiddenQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHidden(data);
            setHiddenIds(new Set(data.map(item => item.id)));
        }, (error) => {
            console.warn("Global hidden listener failed:", error);
        });

        // Listener for User Profile (Zaps, Credits, Subscription)
        const userDocRef = doc(db, 'users', uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserProfile({
                    zaps: data.zaps !== undefined ? data.zaps : (data.credits !== undefined ? data.credits : 5),
                    credits: data.credits !== undefined ? data.credits : 5,
                    reels: data.reels || 0,
                    subscriptionStatus: data.subscriptionStatus || 'inactive'
                });
            }
        }, (error) => {
            console.warn("Global profile listener failed:", error);
        });

        return () => {
            unsubLikes();
            unsubBookmarks();
            unsubHidden();
            unsubProfile();
        };
    }, [currentUser?.uid]);

    // Helpers
    const isLiked = (id) => likedIds.has(id);
    const isBookmarked = (id) => bookmarkedIds.has(id);
    const isHidden = (id) => hiddenIds.has(id);

    // Actions with debouncing/optimistic updates managed by the caller usually, 
    // but here we provide a verified function.

    const toggleLike = async (imgItem, model) => {
        if (!currentUser) {
            toast.error("Please log in");
            return false;
        }

        const id = imgItem.id;
        const currentlyLiked = likedIds.has(id);

        // Optimistic update
        const newSet = new Set(likedIds);
        if (currentlyLiked) newSet.delete(id);
        else newSet.add(id);
        setLikedIds(newSet); // Update local state immediately

        try {
            const api = httpsCallable(functions, 'api');
            await api({
                action: 'toggleLike',
                imageId: id,
                modelId: model?.id || 'unknown',
                isLiked: currentlyLiked,
                imgData: {
                    url: imgItem.url || imgItem.imageUrl,
                    thumbnailUrl: imgItem.thumbnailUrl || imgItem.url,
                    prompt: imgItem.prompt || "",
                    aspectRatio: imgItem.aspectRatio || "1/1"
                }
            });

            if (currentlyLiked) {
                // Was liked, so we unliked it
                // toast.success("Removed from likes"); // Optional: reduce noise
            } else {
                toast.success("Added to likes");
            }

        } catch (error) {
            console.error("Toggle like failed:", error);
            // Revert on error
            setLikedIds(prev => {
                const revertSet = new Set(prev);
                if (currentlyLiked) revertSet.add(id);
                else revertSet.delete(id);
                return revertSet;
            });
            toast.error("Action failed. Try again.");
        }
    };

    const toggleBookmark = async (imgItem, model) => {
        if (!currentUser) {
            toast.error("Please log in");
            return false;
        }

        const id = imgItem.id;
        const currentlySaved = bookmarkedIds.has(id);

        // Optimistic update
        const newSet = new Set(bookmarkedIds);
        if (currentlySaved) newSet.delete(id);
        else newSet.add(id);
        setBookmarkedIds(newSet);

        try {
            const api = httpsCallable(functions, 'api');
            await api({
                action: 'toggleBookmark',
                imageId: id,
                modelId: model?.id || 'unknown',
                isBookmarked: currentlySaved,
                imgData: {
                    url: imgItem.url || imgItem.imageUrl,
                    thumbnailUrl: imgItem.thumbnailUrl || imgItem.url,
                    prompt: imgItem.prompt || "",
                    aspectRatio: imgItem.aspectRatio || "1/1"
                }
            });

            if (currentlySaved) {
                toast.success("Removed from bookmarks");
            } else {
                toast.success("Saved to bookmarks");
            }
        } catch (error) {
            console.error("Toggle bookmark failed:", error);
            // Revert on error
            setBookmarkedIds(prev => {
                const revertSet = new Set(prev);
                if (currentlySaved) revertSet.add(id);
                else revertSet.delete(id);
                return revertSet;
            });
            toast.error("Action failed. Try again.");
        }
    };

    const hidePost = async (imgItem) => {
        if (!currentUser) {
            toast.error("Please log in to hide posts");
            return false;
        }

        const id = imgItem.id;
        if (hiddenIds.has(id)) return; // Already hidden

        // Optimistic update
        setHiddenIds(prev => new Set(prev).add(id));

        try {
            await setDoc(doc(db, `users/${currentUser.uid}/hidden`, id), {
                imageId: id,
                createdAt: new Date().toISOString(),
                prompt: imgItem.prompt || "",
                url: imgItem.url || imgItem.imageUrl || ""
            });
            toast.success("Post hidden");
        } catch (error) {
            console.error("Hide post failed:", error);
            // Revert
            setHiddenIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            toast.error("Failed to hide post");
        }
    };

    // --- App Likes Logic (Moved from useAppLikes) ---
    const [likedAppIds, setLikedAppIds] = useState(new Set());

    useEffect(() => {
        if (!currentUser?.uid) {
            setLikedAppIds(new Set());
            return;
        }

        const uid = currentUser.uid;
        const likedAppsRef = collection(db, 'users', uid, 'likedApps');

        const unsubLikedApps = onSnapshot(likedAppsRef, (snapshot) => {
            const newSet = new Set();
            snapshot.forEach((doc) => {
                newSet.add(doc.id);
            });
            setLikedAppIds(newSet);
        }, (error) => {
            console.warn("Global likedApps listener failed:", error);
        });

        return () => {
            unsubLikedApps();
        };
    }, [currentUser?.uid]);

    const isAppLiked = (appId) => likedAppIds.has(appId);

    // Adapted from useAppLikes toggle logic but simplified for context
    // This uses Transaction in a cloud function ideally, but we'll port the client-side transaction logic 
    // from useAppLikes here or keep it simple. useAppLikes used client-side transaction.
    // For consistency with other interactions here, we should ideally use a Callable if available, 
    // but the original code used client SDK transaction. To minimize regression risk, I will port 
    // the client-side transaction logic here.

    // We need to import runTransaction for this.
    const toggleAppLike = async (appId) => {
        if (!currentUser) return false;

        const uid = currentUser.uid;
        // Optimistic update
        const currentlyLiked = likedAppIds.has(appId);
        setLikedAppIds(prev => {
            const next = new Set(prev);
            if (currentlyLiked) next.delete(appId);
            else next.add(appId);
            return next;
        });

        try {
            const { runTransaction } = await import('firebase/firestore'); // Dynamic import or ensure top-level import
            const { doc } = await import('firebase/firestore');

            const appRef = doc(db, 'apps', appId);
            const userLikeRef = doc(db, 'users', uid, 'likedApps', appId);

            await runTransaction(db, async (transaction) => {
                const likeDoc = await transaction.get(userLikeRef);
                const exists = likeDoc.exists();

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
            console.error("Error toggling app like:", error);
            // Revert
            setLikedAppIds(prev => {
                const next = new Set(prev);
                if (currentlyLiked) next.add(appId);
                else next.delete(appId);
                return next;
            });
            return false;
        }
    };

    const value = {
        likedIds,
        bookmarkedIds,
        likes,
        bookmarks,
        isLiked,
        isBookmarked,
        hidePost,
        hiddenIds,
        isHidden,
        toggleLike,
        toggleBookmark,
        userProfile, // Global Sync
        // New App Likes
        likedAppIds,
        isAppLiked,
        toggleAppLike
    };

    return (
        <UserInteractionsContext.Provider value={value}>
            {children}
        </UserInteractionsContext.Provider>
    );
}

export default UserInteractionsContext;
