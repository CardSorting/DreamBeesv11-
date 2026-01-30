/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

    // App Likes Logic
    const [likedAppIds, setLikedAppIds] = useState(new Set());
    const [viewedIds, setViewedIds] = useState(new Set());


    // User Profile Data (Centralized Sync)
    const [userProfile, setUserProfile] = useState({
        zaps: 5,
        reels: 0,
        credits: 5,
        subscriptionStatus: 'inactive',
        username: '',
        displayPreference: 'username',
        referralCode: '',
        referredBy: '',
        referralCount: 0
    });
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);
    const [pendingZaps, setPendingZaps] = useState({}); // { requestId: { amount, timestamp } }
    const [pendingReels, setPendingReels] = useState({}); // { requestId: { amount, timestamp } }

    // Track previous creations length to detect new items without re-triggering effect
    const prevCreationsLengthRef = useRef(0);

    useEffect(() => {
        if (!currentUser?.uid) {
            // Defer resets to avoid cascading renders during mount/auth-change
            setTimeout(() => {
                setLikedIds(new Set());
                setBookmarkedIds(new Set());
                setHiddenIds(new Set());
                setLikedAppIds(new Set());
                setLikes([]);
                setBookmarks([]);
                setHidden([]);
                setMockups([]);
                setMemes([]);
                setAppGenerations([]);
                setPersonalCreations([]);
                setMainstreamGenerations([]);
                setIsProfileLoaded(false);
                prevCreationsLengthRef.current = 0;
            }, 0);
            return;
        }

        const uid = currentUser.uid;

        // Listener for Likes
        const likesQuery = query(collection(db, `users/${uid}/likes`), orderBy('createdAt', 'desc'));
        const unsubLikes = onSnapshot(likesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLikes(data);
            setLikedIds(new Set(data.map(item => item.id)));
        }, (_error) => {
            console.warn("Global likes listener failed:", _error);
        });

        // Listener for Bookmarks
        const bookmarksQuery = query(collection(db, `users/${uid}/bookmarks`), orderBy('createdAt', 'desc'));
        const unsubBookmarks = onSnapshot(bookmarksQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBookmarks(data);
            setBookmarkedIds(new Set(data.map(item => item.id)));
        }, (_error) => {
            console.warn("Global bookmarks listener failed:", _error);
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
        const mockupsQuery = query(collection(db, 'mockups'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
        const unsubMockups = onSnapshot(mockupsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMockups(data);
        }, (error) => {
            console.warn("Global mockups listener failed:", error);
        });

        // Listener for Memes
        const memesQuery = query(collection(db, 'memes'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
        const unsubMemes = onSnapshot(memesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMemes(data);
        }, (error) => {
            console.warn("Global memes listener failed:", error);
        });

        const userDocRef = doc(db, 'users', uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const serverLastAction = data.lastActionTime?.toMillis() || 0;

                setPendingZaps(prev => {
                    const next = { ...prev };
                    let changed = false;
                    Object.keys(next).forEach(rid => {
                        if (next[rid].timestamp <= serverLastAction) {
                            delete next[rid];
                            changed = true;
                        }
                    });
                    return changed ? next : prev;
                });

                setPendingReels(prev => {
                    const next = { ...prev };
                    let changed = false;
                    Object.keys(next).forEach(rid => {
                        if (next[rid].timestamp <= serverLastAction) {
                            delete next[rid];
                            changed = true;
                        }
                    });
                    return changed ? next : prev;
                });

                setUserProfile({
                    zaps: data.zaps !== undefined ? data.zaps : (data.credits !== undefined ? data.credits : 5),
                    credits: data.credits !== undefined ? data.credits : 5,
                    reels: data.reels || 0,
                    subscriptionStatus: data.subscriptionStatus || 'inactive',
                    username: data.username || '',
                    isPremium: data.isPremium || false,
                    plan: data.plan || null,
                    createdAt: data.createdAt,
                    displayPreference: data.displayPreference || 'username',
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

        // Listener for all completed generations
        const gensQuery = query(collection(db, 'generation_queue'), where('userId', '==', uid), where('status', '==', 'completed'), orderBy('createdAt', 'desc'));
        const unsubGens = onSnapshot(gensQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const apps = data.filter(item => item.type === 'dress-up' || item.type === 'slideshow' || item.modelId === 'meowacc');
            const mainstream = data.filter(item => !item.type || (item.type !== 'dress-up' && item.type !== 'slideshow' && item.modelId !== 'meowacc'));
            setAppGenerations(apps);
            setMainstreamGenerations(mainstream);
        }, (error) => {
            console.warn("Global generation_queue listener failed:", error);
        });

        // Listener for personal creations
        const personalQuery = query(collection(db, 'images'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
        const unsubPersonal = onSnapshot(personalQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const prevLen = prevCreationsLengthRef.current;

            if (data.length === 1 && prevLen === 0) {
                trackAhaMoment('first_generation_success');
            }

            if (data.length > prevLen) {
                setSessionGenerations(prev => prev + (data.length - prevLen));
            }

            prevCreationsLengthRef.current = data.length;
            setPersonalCreations(data);
        }, (error) => {
            console.warn("Global images listener failed:", error);
        });

        const likedAppsRef = collection(db, 'users', uid, 'likedApps');
        const unsubLikedApps = onSnapshot(likedAppsRef, (snapshot) => {
            const newSet = new Set();
            snapshot.forEach((doc) => newSet.add(doc.id));
            setLikedAppIds(newSet);
        }, (error) => {
            console.warn("Global likedApps listener failed:", error);
        });

        return () => {
            unsubLikes(); unsubBookmarks(); unsubHidden(); unsubMockups(); unsubMemes(); unsubProfile(); unsubGens(); unsubPersonal(); unsubLikedApps();
        };
    }, [currentUser?.uid]);

    // Track Credit Lifecycle
    const lastZapBalanceRef = useRef(null);
    useEffect(() => {
        if (isProfileLoaded && userProfile && userProfile.zaps !== undefined) {
            const zaps = userProfile.zaps;
            if (lastZapBalanceRef.current !== null && lastZapBalanceRef.current !== zaps) {
                if (zaps < lastZapBalanceRef.current) {
                    const diff = lastZapBalanceRef.current - zaps;
                    toast(`-${Number(diff.toFixed(2))} Zaps`, {
                        icon: '⚡',
                        style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '0.8rem', fontWeight: '600' },
                        duration: 2000
                    });
                }
                if (zaps === 0) trackCreditLifecycle('exhausted', zaps);
                else if (zaps <= 2 && lastZapBalanceRef.current > 2) trackCreditLifecycle('low_balance', zaps);
            }
            lastZapBalanceRef.current = zaps;
        }
    }, [userProfile, isProfileLoaded]);

    // Sync GA properties
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
    const isLiked = useCallback((id) => likedIds.has(id), [likedIds]);
    const isBookmarked = useCallback((id) => bookmarkedIds.has(id), [bookmarkedIds]);
    const isHidden = useCallback((id) => hiddenIds.has(id), [hiddenIds]);

    // Actions with debouncing/optimistic updates managed by the caller usually, 
    // but here we provide a verified function.

    const toggleLike = useCallback(async (imgItem, model) => {
        if (!currentUser) { toast.error("Please log in"); return false; }
        const id = imgItem.id;
        const currentlyLiked = likedIds.has(id);
        setLikedIds(prev => {
            const next = new Set(prev);
            if (currentlyLiked) next.delete(id); else next.add(id);
            return next;
        });

        try {
            await apiCall('api', {
                action: 'toggleLike',
                imageId: id,
                modelId: model?.id || 'unknown',
                isLiked: currentlyLiked,
                imgData: { url: imgItem.url || imgItem.imageUrl, thumbnailUrl: imgItem.thumbnailUrl || imgItem.url, prompt: imgItem.prompt || "", aspectRatio: imgItem.aspectRatio || "1/1" }
            }, { toastErrors: true });
            trackEvent(currentlyLiked ? 'unlike_image' : 'like_image', { image_id: id, model_id: model?.id });
            if (!currentlyLiked) toast.success("Added to likes");
        } catch {
            setLikedIds(prev => {
                const next = new Set(prev);
                if (currentlyLiked) next.add(id); else next.delete(id);
                return next;
            });
        }
    }, [currentUser, likedIds, apiCall]);

    const toggleBookmark = useCallback(async (imgItem, model) => {
        if (!currentUser) { toast.error("Please log in"); return false; }
        const id = imgItem.id;
        const currentlySaved = bookmarkedIds.has(id);
        setBookmarkedIds(prev => {
            const next = new Set(prev);
            if (currentlySaved) next.delete(id); else next.add(id);
            return next;
        });

        try {
            await apiCall('api', {
                action: 'toggleBookmark',
                imageId: id,
                modelId: model?.id || 'unknown',
                isBookmarked: currentlySaved,
                imgData: { url: imgItem.url || imgItem.imageUrl, thumbnailUrl: imgItem.thumbnailUrl || imgItem.url, prompt: imgItem.prompt || "", aspectRatio: imgItem.aspectRatio || "1/1" }
            }, { toastErrors: true });
            trackEvent(currentlySaved ? 'unbookmark_image' : 'bookmark_image', { image_id: id, model_id: model?.id });
            toast.success(currentlySaved ? "Removed from bookmarks" : "Saved to bookmarks");
        } catch {
            setBookmarkedIds(prev => {
                const next = new Set(prev);
                if (currentlySaved) next.add(id); else next.delete(id);
                return next;
            });
        }
    }, [currentUser, bookmarkedIds, apiCall]);

    const hidePost = useCallback(async (imgItem) => {
        if (!currentUser) { toast.error("Please log in to hide posts"); return false; }
        const id = imgItem.id;
        if (hiddenIds.has(id)) return;
        setHiddenIds(prev => new Set(prev).add(id));
        try {
            await setDoc(doc(db, `users/${currentUser.uid}/hidden`, id), {
                imageId: id, createdAt: new Date().toISOString(), prompt: imgItem.prompt || "", url: imgItem.url || imgItem.imageUrl || ""
            });
            trackEvent('hide_post', { image_id: id });
            toast.success("Post hidden");
        } catch {
            setHiddenIds(prev => { const next = new Set(prev); next.delete(id); return next; });
            toast.error("Failed to hide post");
        }
    }, [currentUser, hiddenIds]);

    // Track "Seen" posts in session
    const markViewed = useCallback((id) => {
        if (!id) return;
        setViewedIds(prev => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    const reportPost = useCallback(async (imgItem, reason = "user_flagged") => {
        if (!currentUser) { toast.error("Please log in to report content"); return false; }
        const id = imgItem.id;
        if (hiddenIds.has(id)) { toast('Content already hidden', { icon: 'check' }); return; }
        setHiddenIds(prev => new Set(prev).add(id));
        try {
            const hidePromise = setDoc(doc(db, `users/${currentUser.uid}/hidden`, id), {
                imageId: id, createdAt: new Date().toISOString(), reason: reason, type: 'report', prompt: imgItem.prompt || "", url: imgItem.url || imgItem.imageUrl || ""
            });
            const reportPromise = apiCall('api', { action: 'reportGeneration', jobId: id, reason: reason }, { toastErrors: false });
            await Promise.all([hidePromise, reportPromise]);
            trackEvent('report_post', { image_id: id, reason: reason });
            toast.success("Content flagged and hidden", { icon: '🚩' });
        } catch {
            toast.error("Report failed, but hidden locally.");
        }
    }, [currentUser, hiddenIds, apiCall]);

    const unhidePost = useCallback(async (imgItem) => {
        if (!currentUser) return false;
        const id = imgItem.id;
        setHiddenIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        try {
            await deleteDoc(doc(db, `users/${currentUser.uid}/hidden`, id));
            toast.success("Post unhidden");
        } catch {
            setHiddenIds(prev => new Set(prev).add(id));
            toast.error("Failed to unhide post");
        }
    }, [currentUser]);

    const voteOnSafety = useCallback(async (imgItem, verdict) => {
        if (!currentUser) { toast.error("Please log in to vote"); return; }
        try {
            const result = await apiCall('api', { action: 'moderationVote', jobId: imgItem.id, verdict: verdict }, { toastErrors: true });
            if (result.alreadyVoted) { toast("Already voted on this card", { icon: '⚠️' }); return; }
            if (verdict === 'skip') { toast("Skipped", { icon: '⏭️' }); return result; }
            if (verdict === 'unsafe') setHiddenIds(prev => new Set(prev).add(imgItem.id));
            else if (verdict === 'safe' && hiddenIds.has(imgItem.id)) unhidePost(imgItem);
            trackEvent('safety_vote', { image_id: imgItem.id, verdict: verdict });
            return result;
        } catch (error) {
            console.error("Safety vote failed:", error);
            throw error;
        }
    }, [currentUser, apiCall, hiddenIds, unhidePost]);

    const appealPost = useCallback(async (imgItem) => {
        if (!currentUser) return;
        const id = imgItem.id;
        setHiddenIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        try {
            try { await deleteDoc(doc(db, `users/${currentUser.uid}/hidden`, id)); } catch { /* ignore */ }
            await apiCall('api', { action: 'appealGeneration', jobId: id }, { toastErrors: true });
            trackEvent('appeal_post', { image_id: id });
            toast.success("Appeal submitted", { icon: '⚖️' });
        } catch { toast.error("Appeal failed"); }
    }, [currentUser, apiCall]);

    const isAppLiked = useCallback((appId) => likedAppIds.has(appId), [likedAppIds]);

    // Adapted from useAppLikes toggle logic but simplified for context
    // This uses Transaction in a cloud function ideally, but we'll port the client-side transaction logic 
    // from useAppLikes here or keep it simple. useAppLikes used client-side transaction.
    // For consistency with other interactions here, we should ideally use a Callable if available, 
    // but the original code used client SDK transaction. To minimize regression risk, I will port 
    // the client-side transaction logic here.

    // We need to import runTransaction for this.
    const deductZapsOptimistically = useCallback((amount, requestId = 'legacy') => {
        if (typeof amount !== 'number' || amount <= 0) return;
        setPendingZaps(prev => ({ ...prev, [requestId]: { amount, timestamp: Date.now() } }));
    }, []);

    const rollbackZaps = useCallback((_amount, requestId = 'legacy') => {
        setPendingZaps(prev => { const next = { ...prev }; delete next[requestId]; return next; });
    }, []);

    const deductReelsOptimistically = useCallback((amount, requestId = 'legacy') => {
        if (typeof amount !== 'number' || amount <= 0) return;
        setPendingReels(prev => ({ ...prev, [requestId]: { amount, timestamp: Date.now() } }));
    }, []);

    const rollbackReels = useCallback((_amount, requestId = 'legacy') => {
        setPendingReels(prev => { const next = { ...prev }; delete next[requestId]; return next; });
    }, []);

    const toggleAppLike = useCallback(async (appId) => {
        if (!currentUser) return false;
        const uid = currentUser.uid;
        const currentlyLiked = likedAppIds.has(appId);
        setLikedAppIds(prev => {
            const next = new Set(prev);
            if (currentlyLiked) next.delete(appId); else next.add(appId);
            return next;
        });

        try {
            const appRef = doc(db, 'apps', appId);
            const userLikeRef = doc(db, 'users', uid, 'likedApps', appId);
            await runTransaction(db, async (transaction) => {
                const likeDoc = await transaction.get(userLikeRef);
                const exists = likeDoc.exists();
                const appDoc = await transaction.get(appRef);
                if (!appDoc.exists()) throw new Error("App does not exist!");
                const currentLikes = appDoc.data().likeCount || 0;
                let newLikes = currentLikes;
                if (exists) {
                    transaction.delete(userLikeRef);
                    newLikes = Math.max(0, currentLikes - 1);
                } else {
                    transaction.set(userLikeRef, { timestamp: new Date() });
                    newLikes = currentLikes + 1;
                }
                transaction.update(appRef, { likeCount: newLikes });
            });
            trackEvent(currentlyLiked ? 'unlike_app' : 'like_app', { app_id: appId });
            return true;
        } catch {
            setLikedAppIds(prev => {
                const next = new Set(prev);
                if (currentlyLiked) next.add(appId); else next.delete(appId);
                return next;
            });
            return false;
        }
    }, [currentUser, likedAppIds]);

    const appCreations = useMemo(() => [
        ...mockups,
        ...memes,
        ...appGenerations,
        ...personalCreations
    ].sort((a, b) => {
        const dateA = a.createdAt?.seconds || (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0));
        const dateB = b.createdAt?.seconds || (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0));
        return dateB - dateA;
    }), [mockups, memes, appGenerations, personalCreations]);

    const optimizedUserProfile = useMemo(() => {
        const totalPendingZaps = Object.values(pendingZaps).reduce((acc, curr) => acc + curr.amount, 0);
        const totalPendingReels = Object.values(pendingReels).reduce((acc, curr) => acc + curr.amount, 0);
        return {
            ...userProfile,
            zaps: Math.max(0, (userProfile.zaps || 0) - totalPendingZaps),
            reels: Math.max(0, (userProfile.reels || 0) - totalPendingReels)
        };
    }, [userProfile, pendingZaps, pendingReels]);

    const value = useMemo(() => ({
        likedIds,
        bookmarkedIds,
        likes,
        bookmarks,
        mockups,
        memes,
        appCreations,
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
        userProfile: optimizedUserProfile,
        likedAppIds,
        isAppLiked,
        toggleAppLike,
        isProfileLoaded,
        viewedIds,
        markViewed,
        deductZapsOptimistically,
        rollbackZaps,
        deductReelsOptimistically,
        rollbackReels,
        _isLiked: isLiked,
        _toggleLike: toggleLike,
        _hidePost: hidePost,
        _reportPost: reportPost,
        _isHidden: isHidden,
        hidden
    }), [
        likedIds, bookmarkedIds, likes, bookmarks, mockups, memes, appCreations, mainstreamGenerations,
        isLiked, isBookmarked, hidePost, unhidePost, reportPost, appealPost, voteOnSafety,
        hiddenIds, isHidden, toggleLike, toggleBookmark, optimizedUserProfile,
        likedAppIds, isAppLiked, toggleAppLike, isProfileLoaded,
        deductZapsOptimistically, rollbackZaps, deductReelsOptimistically, rollbackReels,
        hidden, viewedIds, markViewed
    ]);

    return (
        <UserInteractionsContext.Provider value={value}>
            {children}
        </UserInteractionsContext.Provider>
    );
}

export default UserInteractionsContext;
