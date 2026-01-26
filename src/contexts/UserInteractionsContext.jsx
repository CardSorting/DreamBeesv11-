/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, orderBy, runTransaction } from 'firebase/firestore';
// import { httpsCallable } from 'firebase/functions'; // Removed, using useApi
import { useAuth } from './AuthContext';
import { useModel } from './ModelContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { trackEvent, setUserProperties, trackAhaMoment, trackCreditLifecycle } from '../utils/analytics';

const UserInteractionsContext = createContext();

export const useUserInteractions = () => {
    const context = useContext(UserInteractionsContext);
    if (context === undefined) {
        throw new Error('useUserInteractions must be used within a UserInteractionsProvider');
    }
    return context;
};

export function UserInteractionsProvider({ children }) {
    const { currentUser } = useAuth();
    const { rateShowcaseImage: _rateShowcaseImage } = useModel();

    const { call: apiCall } = useApi();

    // Sets for O(1) checks, Arrays for UI lists
    const [likedIds, setLikedIds] = useState(new Set());
    const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
    const [hiddenIds, setHiddenIds] = useState(new Set());
    const [likes, setLikes] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [hidden, setHidden] = useState([]);
    const [mockups, setMockups] = useState([]);
    const [memes, setMemes] = useState([]);
    const [appGenerations, setAppGenerations] = useState([]); // from generation_queue
    const [personalCreations, setPersonalCreations] = useState([]); // from images
    const [mainstreamGenerations, setMainstreamGenerations] = useState([]);
    const [sessionGenerations, setSessionGenerations] = useState(0);

    // User Profile Data (Centralized Sync)
    const [userProfile, setUserProfile] = useState({
        zaps: 5,
        reels: 0,
        credits: 5,
        subscriptionStatus: 'inactive',
        username: '',
        displayPreference: 'name',
        referralCode: '',
        referredBy: '',
        referralCount: 0
    });
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);

    useEffect(() => {
        if (!currentUser?.uid) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLikedIds(new Set());
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBookmarkedIds(new Set());
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHiddenIds(new Set());
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLikes([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBookmarks([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHidden([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMockups([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMemes([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAppGenerations([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPersonalCreations([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMainstreamGenerations([]);
            setIsProfileLoaded(false);
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

        // Listener for Mockups
        const mockupsQuery = query(
            collection(db, 'mockups'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc')
        );
        const unsubMockups = onSnapshot(mockupsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMockups(data);
        }, (error) => {
            console.warn("Global mockups listener failed:", error);
        });

        // Listener for Memes
        const memesQuery = query(
            collection(db, 'memes'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc')
        );
        const unsubMemes = onSnapshot(memesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMemes(data);
        }, (error) => {
            console.warn("Global memes listener failed:", error);
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
                    subscriptionStatus: data.subscriptionStatus || 'inactive',
                    username: data.username || '',
                    displayPreference: data.displayPreference || 'name',
                    karma: data.karma !== undefined ? data.karma : 0,
                    birthday: data.birthday || null,
                    referralCode: data.referralCode || '',
                    referredBy: data.referredBy || '',
                    referralCount: data.referralCount || 0
                });
            }
            setIsProfileLoaded(true);
        }, (error) => {
            console.warn("Global profile listener failed:", error);
            setIsProfileLoaded(true);
        });

        // Listener for all completed generations in generation_queue
        const gensQuery = query(
            collection(db, 'generation_queue'),
            where('userId', '==', uid),
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc')
        );
        const unsubGens = onSnapshot(gensQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Separate app-specific vs mainstream
            const apps = data.filter(item => item.type === 'dress-up' || item.type === 'slideshow' || item.modelId === 'meowacc');
            const mainstream = data.filter(item => !item.type || (item.type !== 'dress-up' && item.type !== 'slideshow' && item.modelId !== 'meowacc'));
            setAppGenerations(apps);
            setMainstreamGenerations(mainstream);
        }, (error) => {
            console.warn("Global generation_queue listener failed:", error);
        });

        // Listener for personal creations in 'images' collection
        const personalQuery = query(
            collection(db, 'images'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc')
        );
        const unsubPersonal = onSnapshot(personalQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // AHA Moment: First successful generation
            if (data.length === 1 && personalCreations.length === 0) {
                trackAhaMoment('first_generation_success');
            }

            if (data.length > personalCreations.length) {
                setSessionGenerations(prev => prev + (data.length - personalCreations.length));
            }
            setPersonalCreations(data);
        }, (error) => {
            console.warn("Global images listener failed:", error);
        });

        return () => {
            unsubLikes();
            unsubBookmarks();
            unsubHidden();
            unsubMockups();
            unsubMemes();
            unsubProfile();
            unsubGens();
            unsubPersonal();
        };
    }, [currentUser?.uid]);

    // Track Credit Lifecycle Lifecycle
    const lastZapBalanceRef = React.useRef(null);
    useEffect(() => {
        if (isProfileLoaded && userProfile && userProfile.zaps !== undefined) {
            const zaps = userProfile.zaps;

            // Initial check or balance change
            if (lastZapBalanceRef.current !== null && lastZapBalanceRef.current !== zaps) {
                if (zaps === 0) {
                    trackCreditLifecycle('exhausted', zaps);
                } else if (zaps <= 2 && lastZapBalanceRef.current > 2) {
                    trackCreditLifecycle('low_balance', zaps);
                }
            }

            lastZapBalanceRef.current = zaps;
        }
    }, [userProfile.zaps, isProfileLoaded]);

    // Sync user profile properties to GA
    useEffect(() => {
        if (isProfileLoaded && userProfile) {
            const totalGens = personalCreations.length + mainstreamGenerations.length;
            let maturity = 'newbie';
            if (totalGens > 200) maturity = 'legend';
            else if (totalGens > 50) maturity = 'artisan';
            else if (totalGens > 10) maturity = 'creator';
            else if (totalGens > 0) maturity = 'explorer';

            setUserProperties({
                is_premium: !!userProfile.isPremium,
                user_tier: userProfile.plan || (userProfile.isPremium ? 'premium' : 'free'),
                join_date: userProfile.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toISOString() : 'unknown',
                total_generations: totalGens,
                user_maturity: maturity,
                session_generations: sessionGenerations
            });
        }
    }, [userProfile, isProfileLoaded, personalCreations.length, mainstreamGenerations.length, sessionGenerations]);

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
            await apiCall('api', {
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
            }, { toastErrors: true }); // Let useApi handle error toasts

            if (currentlyLiked) {
                // Was liked, so we unliked it
                trackEvent('unlike_image', { image_id: id, model_id: model?.id });
                // toast.success("Removed from likes"); // Optional: reduce noise
            } else {
                trackEvent('like_image', { image_id: id, model_id: model?.id });
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
            // Error toast handled by useApi
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
            await apiCall('api', {
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
            }, { toastErrors: true });

            if (currentlySaved) {
                trackEvent('unbookmark_image', { image_id: id, model_id: model?.id });
                toast.success("Removed from bookmarks");
            } else {
                trackEvent('bookmark_image', { image_id: id, model_id: model?.id });
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
            // Error toast handled by useApi
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
            trackEvent('hide_post', { image_id: id });
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

    const reportPost = async (imgItem, reason = "user_flagged") => {
        if (!currentUser) {
            toast.error("Please log in to report content");
            return false;
        }

        const id = imgItem.id;
        if (hiddenIds.has(id)) {
            toast('Content already hidden', { icon: 'check' });
            return;
        }

        // 1. Immediate Personal Hide (Optimistic)
        setHiddenIds(prev => new Set(prev).add(id));

        try {
            // 2. Persist Personal Hide
            const hidePromise = setDoc(doc(db, `users/${currentUser.uid}/hidden`, id), {
                imageId: id,
                createdAt: new Date().toISOString(),
                reason: reason,
                type: 'report',
                prompt: imgItem.prompt || "",
                url: imgItem.url || imgItem.imageUrl || ""
            });

            // 3. Send Global Report
            const reportPromise = apiCall('api', {
                action: 'reportGeneration',
                jobId: id, // Assuming imgItem.id IS the jobId for generations
                reason: reason
            }, { toastErrors: false });

            await Promise.all([hidePromise, reportPromise]);

            trackEvent('report_post', { image_id: id, reason: reason });
            toast.success("Content flagged and hidden", { icon: '🚩' });
        } catch (error) {
            console.error("Report failed:", error);
            // Don't revert the hide, assuming user wants it gone regardless of backend success
            // But maybe show error toast
            toast.error("Verified report failed, but hidden locally.");
        }
    };

    const unhidePost = async (imgItem) => {
        if (!currentUser) return false;
        const id = imgItem.id;

        // Optimistic update
        setHiddenIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        try {
            await deleteDoc(doc(db, `users/${currentUser.uid}/hidden`, id));
            toast.success("Post unhidden");
        } catch (error) {
            console.error("Unhide post failed:", error);
            // Revert
            setHiddenIds(prev => new Set(prev).add(id));
            toast.error("Failed to unhide post");
        }
    };

    const voteOnSafety = async (imgItem, verdict) => {
        if (!currentUser) {
            toast.error("Please log in to vote");
            return;
        }

        // Optimistic UI Removal happen in the component usually, 
        // but here we just handle the API and global state sync.

        try {
            const result = await apiCall('api', {
                action: 'moderationVote',
                jobId: imgItem.id,
                verdict: verdict
            }, { toastErrors: true });

            if (result.alreadyVoted) {
                toast("Already voted on this card", { icon: '⚠️' });
                return;
            }

            // Feedback based on result
            if (verdict === 'skip') {
                toast("Skipped", { icon: '⏭️' });
                return result;
            }

            const karma = result.karmaAwarded || 0;
            if (karma > 0) {
                // We could show a custom toast or let the component do it
                // toast.success(`Voted! +${karma} karma`);
            }

            if (verdict === 'unsafe') {
                // If we voted unsafe, user probably expects it to be hidden from THEM at least
                setHiddenIds(prev => new Set(prev).add(imgItem.id));
            } else if (verdict === 'safe') {
                // If it was locally hidden, maybe unhide?
                if (hiddenIds.has(imgItem.id)) {
                    unhidePost(imgItem);
                }
            }

            trackEvent('safety_vote', { image_id: imgItem.id, verdict: verdict });
            return result;
        } catch (error) {
            console.error("Safety vote failed:", error);
            throw error;
        }
    };

    const appealPost = async (imgItem) => {
        if (!currentUser) return;
        const id = imgItem.id;

        // Optimistic unhide locally
        setHiddenIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        try {
            // Also ensure we remove from local hidden persistence if present
            try {
                await deleteDoc(doc(db, `users/${currentUser.uid}/hidden`, id));
            } catch (_error) { /* ignore */ }

            await apiCall('api', {
                action: 'appealGeneration',
                jobId: id
            }, { toastErrors: true });

            trackEvent('appeal_post', { image_id: id });
            toast.success("Appeal submitted", { icon: '⚖️' });
        } catch (error) {
            console.error("Appeal failed:", error);
            toast.error("Appeal failed");
        }
    };

    // --- App Likes Logic (Moved from useAppLikes) ---
    const [likedAppIds, setLikedAppIds] = useState(new Set());

    useEffect(() => {
        if (!currentUser?.uid) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
            // Dynamic imports removed in favor of top-level imports
            // const { runTransaction } = await import('firebase/firestore'); 
            // const { doc } = await import('firebase/firestore');

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
            trackEvent(currentlyLiked ? 'unlike_app' : 'like_app', { app_id: appId });
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
        mockups,
        memes,
        appCreations: React.useMemo(() => [
            ...mockups,
            ...memes,
            ...appGenerations,
            ...personalCreations
        ].sort((a, b) => {
            const dateA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0));
            const dateB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0));
            return dateB - dateA;
        }), [mockups, memes, appGenerations, personalCreations]),
        mainstreamGenerations,
        isLiked,
        isBookmarked,
        hidePost,
        unhidePost,
        reportPost,
        appealPost,
        voteOnSafety,
        hiddenIds,
        isHidden,
        toggleLike,
        toggleBookmark,
        userProfile, // Global Sync
        // New App Likes
        likedAppIds,
        isAppLiked,
        toggleAppLike,
        isProfileLoaded,
        // Aligned/Legacy underscores
        _isLiked: isLiked,
        _toggleLike: toggleLike,
        _hidePost: hidePost,
        _reportPost: reportPost,
        _isHidden: isHidden,
        hidden
    };

    return (
        <UserInteractionsContext.Provider value={value}>
            {children}
        </UserInteractionsContext.Provider>
    );
}

export default UserInteractionsContext;
