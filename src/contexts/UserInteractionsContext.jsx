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
    const [likes, setLikes] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);

    useEffect(() => {
        if (!currentUser) {
            setLikedIds(new Set());
            setBookmarkedIds(new Set());
            setLikes([]);
            setBookmarks([]);
            return;
        }

        // Listener for Likes
        const likesQuery = query(collection(db, `users/${currentUser.uid}/likes`), orderBy('createdAt', 'desc'));
        const unsubLikes = onSnapshot(likesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLikes(data);
            setLikedIds(new Set(data.map(item => item.id)));
        }, (error) => {
            console.warn("Global likes listener failed:", error);
        });

        // Listener for Bookmarks
        const bookmarksQuery = query(collection(db, `users/${currentUser.uid}/bookmarks`), orderBy('createdAt', 'desc'));
        const unsubBookmarks = onSnapshot(bookmarksQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBookmarks(data);
            setBookmarkedIds(new Set(data.map(item => item.id)));
        }, (error) => {
            console.warn("Global bookmarks listener failed:", error);
        });

        return () => {
            unsubLikes();
            unsubBookmarks();
        };
    }, [currentUser]);

    // Helpers
    const isLiked = (id) => likedIds.has(id);
    const isBookmarked = (id) => bookmarkedIds.has(id);

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
            if (currentlyLiked) {
                await deleteDoc(doc(db, `users/${currentUser.uid}/likes/${id}`));
                // rateShowcaseImage(id, 0, model.id); // Optional decrement
            } else {
                await setDoc(doc(db, `users/${currentUser.uid}/likes/${id}`), {
                    imageId: id,
                    modelId: model?.id || 'unknown',
                    url: imgItem.url || imgItem.imageUrl,
                    thumbnailUrl: imgItem.thumbnailUrl || imgItem.url,
                    prompt: imgItem.prompt || "",
                    createdAt: new Date(),
                    aspectRatio: imgItem.aspectRatio || "1/1"
                });
                if (model?.id) rateShowcaseImage(id, 1, model.id);
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

    const value = {
        likedIds,
        bookmarkedIds,
        likes,
        bookmarks,
        isLiked,
        isBookmarked,
        toggleLike,
        toggleBookmark
    };

    return (
        <UserInteractionsContext.Provider value={value}>
            {children}
        </UserInteractionsContext.Provider>
    );
}

export default UserInteractionsContext;
