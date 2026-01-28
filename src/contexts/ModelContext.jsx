import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
// toast removed - errors handled in apiCall
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, limit, startAfter } from 'firebase/firestore';
import { useApi } from '../hooks/useApi';
import { getOptimizedImageUrl } from '../utils';
import { useAuth } from './AuthContext';

const ModelContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useModel() {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error('useModel must be used within a ModelProvider');
    }
    return context;
}

export function ModelProvider({ children }) {
    const { currentUser } = useAuth();
    const [availableModels, setAvailableModels] = useState([]); // Models should always be an array
    const [selectedModel, setSelectedModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { call: apiCall } = useApi();

    // Load initialization
    useEffect(() => {
        const savedModelId = localStorage.getItem('selectedModelId');

        const fetchModels = async () => {
            try {
                setLoading(true);
                const modelsRef = collection(db, 'models');
                const q = query(modelsRef, orderBy('order', 'asc'));
                const querySnapshot = await getDocs(q);

                const models = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    models.push({
                        id: doc.id,
                        ...data,
                        tags: Array.isArray(data.tags) ? data.tags : []
                    });
                });

                // Ensure MeowAcc/DressUp are present for feed visibility even if not in Firestore
                if (!models.find(m => m.id === 'meowacc')) {
                    models.push({
                        id: 'meowacc',
                        name: 'MeowAcc Transformer',
                        description: 'Transform your photos into the cozy, playful, and pastel Y2K MEOWACC aesthetic.',
                        type: 'Transformer',
                        order: 100,
                        isActive: true,
                        hideFromGenerator: true,
                        image: '/app-previews/meowacc.png',
                        tags: ['cat', 'aesthetic', 'transformer', 'fun']
                    });
                }

                if (!models.find(m => m.id === 'dressup')) {
                    models.push({
                        id: 'dressup',
                        name: 'Magic Wardrobe',
                        description: 'Try on digital outfits instantly. Your style, reimagined.',
                        type: 'Transformer',
                        order: 101,
                        isActive: true,
                        hideFromGenerator: true,
                        image: '/app-previews/wardrobe.png',
                        tags: ['fashion', 'lifestyle', 'magic', 'transformer']
                    });
                }

                if (!models.find(m => m.id === 'nekomimi')) {
                    models.push({
                        id: 'nekomimi',
                        name: 'Nekomimi Academy',
                        description: 'Turn ideas into Kawaii children\'s educational art.',
                        type: 'Transformer',
                        order: 102,
                        isActive: true,
                        hideFromGenerator: true,
                        image: '/app-previews/slides.png',
                        tags: ['education', 'kawaii', 'slideshow', 'poster']
                    });
                }

                if (!models.find(m => m.id === 'zit-base-model')) {
                    models.push({
                        id: 'zit-base-model',
                        name: 'Z-Image Base',
                        description: 'High-quality stable base model for hyper-realistic and cinematic generations.',
                        type: 'Generator',
                        order: 5,
                        isActive: true,
                        image: '/showcase/zit-base-model/cover.png',
                        tags: ['realistic', 'cinematic', 'high-quality', 'base']
                    });
                }

                console.log(`[ModelContext] Fetched ${models.length} models. Checked MeowAcc.`);
                setAvailableModels(models);

                // Prioritize saved model, then current selection (if any), then ZIT-model, then first available
                if (models.length > 0) {
                    let targetModel = null;

                    // CHECK AUTH STATUS: Unauthenticated users MUST start with galmix
                    if (!currentUser) {
                        targetModel = models.find(m => m.id === 'galmix');
                        if (targetModel) {
                            console.log(`[ModelContext] Unauthenticated user. Enforcing default: ${targetModel.id}`);
                        }
                    }

                    // If authenticated (or galmix not found for some reason), try saved model
                    if (!targetModel && savedModelId) {
                        targetModel = models.find(m => m.id === savedModelId);
                    }

                    // Only set default if no saved model and no current selection
                    // Use a ref to check current state without causing dependency issues
                    if (!targetModel && !selectedModel) {
                        // Default to galmix if not saved, fallback to wai-illustrious
                        targetModel = models.find(m => m.id === 'galmix') || models.find(m => m.id === 'wai-illustrious') || models[0];
                        console.log(`[ModelContext] Defaulting to: ${targetModel?.id}`);
                    }

                    if (targetModel && (!selectedModel || selectedModel.id !== targetModel.id)) {
                        setSelectedModel(targetModel);
                    } else if (!selectedModel) {
                        setSelectedModel(models[0]);
                    }
                }
                setLoading(false);
            } catch (err) {
                // ... error handling ...
                console.error("Error fetching models:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchModels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty - only run on mount (currentUser is captured as initial value, which is fine due to AuthProvider blocking)


    // Enforce Galmix for unauthenticated users (e.g. on logout)
    useEffect(() => {
        if (!loading && !currentUser && selectedModel && selectedModel.id !== 'galmix') {
            const galmix = availableModels.find(m => m.id === 'galmix');
            if (galmix) {
                console.log("[ModelContext] User unauthenticated and on restricted model. Switching to galmix.");
                setSelectedModel(galmix);
            }
        }
    }, [currentUser, selectedModel, availableModels, loading]);

    // Persist selection
    useEffect(() => {
        if (selectedModel) {
            localStorage.setItem('selectedModelId', selectedModel.id);
        }
    }, [selectedModel]);

    const [showcaseCache, setShowcaseCache] = useState({});

    // Refs for stable caching (prevents re-renders and unstable function references)
    const showcaseCacheRef = useRef({});

    // Sync state cache with ref query (optional, for other consumers)
    useEffect(() => {
        showcaseCacheRef.current = showcaseCache;
    }, [showcaseCache]);


    // Fetch and cache showcase images for a model
    const [isModelShowcaseLoading, setIsModelShowcaseLoading] = useState(false);
    const lastShowcaseDocRef = useRef({}); // { modelId: lastDoc }
    const hasShowcaseEndedRef = useRef({}); // { modelId: boolean }

    const getShowcaseImages = useCallback(async (modelId, loadMore = false) => {
        // 1. Check cache and guards
        const currentImages = showcaseCacheRef.current[modelId] || [];

        if (!loadMore && currentImages.length > 0) {
            return currentImages;
        }

        if (loadMore && hasShowcaseEndedRef.current[modelId]) {
            return currentImages;
        }

        // 3. Fetch from Firestore
        try {
            console.log(`[Firestore] Fetching showcase for ${modelId} (Load More: ${loadMore})`);
            setIsModelShowcaseLoading(true);

            const pageSize = 50;
            let q = query(
                collection(db, 'model_showcase_images'),
                where('modelId', '==', modelId),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );

            if (loadMore && lastShowcaseDocRef.current[modelId]) {
                q = query(
                    collection(db, 'model_showcase_images'),
                    where('modelId', '==', modelId),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastShowcaseDocRef.current[modelId]),
                    limit(pageSize)
                );
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.log(`[Firestore] End of showcase reached for ${modelId}`);
                hasShowcaseEndedRef.current = { ...hasShowcaseEndedRef.current, [modelId]: true };
                setIsModelShowcaseLoading(false);
                return currentImages;
            }

            const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
            lastShowcaseDocRef.current = { ...lastShowcaseDocRef.current, [modelId]: newLastDoc };

            const fetchedImages = snapshot.docs.map(doc => {
                const data = doc.data();
                const optimizedUrl = getOptimizedImageUrl(data.imageUrl || data.url);
                return {
                    id: doc.id,
                    modelId: modelId,
                    ...data,
                    imageUrl: optimizedUrl,
                    url: optimizedUrl,
                    likesCount: data.likesCount || 0,
                    bookmarksCount: data.bookmarksCount || 0,
                    rating: data.rating || 0
                };
            });

            // Update Cache
            let updatedImages;
            if (loadMore) {
                // Deduplicate
                const existingIds = new Set(currentImages.map(i => i.id));
                const uniqueNew = fetchedImages.filter(i => !existingIds.has(i.id));
                updatedImages = [...currentImages, ...uniqueNew];
            } else {
                updatedImages = fetchedImages;
            }

            const newCache = { ...showcaseCacheRef.current, [modelId]: updatedImages };
            showcaseCacheRef.current = newCache;
            setShowcaseCache(newCache);
            setIsModelShowcaseLoading(false);
            return updatedImages;
        } catch (err) {
            console.error("Error fetching showcase images:", err);
            setIsModelShowcaseLoading(false);
            return currentImages;
        }
    }, []);

    // --- GLOBAL FEED HELPERS ---
    const globalFeedLoadingRef = useRef(false);
    const [globalShowcaseCache, setGlobalShowcaseCache] = useState([]); // Array of all loaded images
    const [lastGlobalDoc, setLastGlobalDoc] = useState(null); // Tracker for pagination
    const [isGlobalFeedLoading, setIsGlobalFeedLoading] = useState(false); // Reactive loading state
    const [hasGlobalFeedEnded, setHasGlobalFeedEnded] = useState(false); // Reactive end-of-feed state

    // Refs for stable callback access (prevents dependency array changes)
    const globalShowcaseCacheRef = useRef([]);
    const lastGlobalDocRef = useRef(null);
    const hasEndedRef = useRef(false); // Track if we've reached the end of the feed

    // Sync refs with state
    useEffect(() => {
        globalShowcaseCacheRef.current = globalShowcaseCache;
    }, [globalShowcaseCache]);

    useEffect(() => {
        lastGlobalDocRef.current = lastGlobalDoc;
    }, [lastGlobalDoc]);

    // Reset global feed (e.g. on pull to refresh)
    const resetGlobalFeed = useCallback(() => {
        setGlobalShowcaseCache([]);
        setLastGlobalDoc(null);
        globalFeedLoadingRef.current = false;
        hasEndedRef.current = false;
        setHasGlobalFeedEnded(false);
    }, []);

    // Fetch aggregated global showcase (All Models) - PAGINATED & ROBUST
    // Using refs inside callback to keep the function reference STABLE
    const getGlobalShowcaseImages = useCallback(async (loadMore = false, source = 'unknown') => {
        // Read from refs for stable access
        const currentCache = globalShowcaseCacheRef.current;
        const currentLastDoc = lastGlobalDocRef.current;

        // Prevent duplicate fetches - check ref immediately
        if (globalFeedLoadingRef.current) {
            console.log(`[Global Feed] [from:${source}] Already loading, skipping duplicate call.`);
            return currentCache;
        }

        // If not loading more and we have cache, return immediately
        if (!loadMore && currentCache.length > 0) {
            console.log(`[Global Feed] [from:${source}] Returning cached data: ${currentCache.length}`);
            return currentCache;
        }

        // If loading more but we've already reached the end, skip
        if (loadMore && hasEndedRef.current) {
            console.log(`[Global Feed] [from:${source}] Already at end of feed, skipping.`);
            return currentCache;
        }

        try {
            // Set loading guards IMMEDIATELY
            globalFeedLoadingRef.current = true;
            setIsGlobalFeedLoading(true);
            console.log(`[Global Feed] [from:${source}] Fetching... (Load More: ${loadMore})`);

            // Fetch a larger pool to allow for "Smart Mixing" (Diversity) client-side
            // If we only fetch 24 and they are all from the same model, no amount of shuffling helps.
            const pageSize = 75;
            let q = query(
                collection(db, 'model_showcase_images'),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );

            // Pagination: start after the last doc we have
            if (loadMore && currentLastDoc) {
                q = query(
                    collection(db, 'model_showcase_images'),
                    orderBy('createdAt', 'desc'),
                    startAfter(currentLastDoc),
                    limit(pageSize)
                );
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.log(`[Global Feed] [from:${source}] No more images found - end of feed reached.`);
                hasEndedRef.current = true; // Mark as ended
                setHasGlobalFeedEnded(true); // Reactive state update
                globalFeedLoadingRef.current = false;
                setIsGlobalFeedLoading(false);
                return currentCache;
            }

            // Update pagination cursor
            const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
            setLastGlobalDoc(newLastDoc);
            lastGlobalDocRef.current = newLastDoc; // Also update ref immediately

            const newImages = snapshot.docs.map(doc => {
                const data = doc.data();
                // Defensive check to ensure we have a valid object to optimize
                if (!data || (!data.imageUrl && !data.url)) {
                    console.warn('[Global Feed] Skipping invalid doc:', doc.id);
                    return null;
                }
                const optimizedUrl = getOptimizedImageUrl(data.imageUrl || data.url);

                // Stricter URL validation - must be valid and at least 10 chars
                if (!optimizedUrl || typeof optimizedUrl !== 'string' || optimizedUrl.length < 10) {
                    console.warn('[Global Feed] Skipping image with invalid URL:', doc.id);
                    return null;
                }

                // Must start with valid protocol
                if (!optimizedUrl.startsWith('http://') && !optimizedUrl.startsWith('https://') && !optimizedUrl.startsWith('/')) {
                    console.warn('[Global Feed] Skipping image with invalid URL protocol:', doc.id);
                    return null;
                }

                return {
                    id: doc.id,
                    ...data,
                    imageUrl: optimizedUrl,
                    url: optimizedUrl,
                    likesCount: data.likesCount || 0,
                    bookmarksCount: data.bookmarksCount || 0,
                    rating: data.rating || 0
                };
            }).filter(item => item !== null);

            // Deduplicate against existing cache
            const existingIds = new Set(currentCache.map(i => i.id));
            const uniqueNewImages = newImages.filter(i => !existingIds.has(i.id));

            let finalImages;
            if (loadMore) {
                finalImages = [...currentCache, ...uniqueNewImages];
            } else {
                finalImages = uniqueNewImages;
            }

            setGlobalShowcaseCache(finalImages);
            globalShowcaseCacheRef.current = finalImages; // Also update ref immediately
            globalFeedLoadingRef.current = false;
            setIsGlobalFeedLoading(false);

            console.log(`[Global Feed] [from:${source}] Loaded ${uniqueNewImages.length} new images. Total: ${finalImages.length}`);
            return finalImages;
        } catch (err) {
            console.error(`[Global Feed] [from:${source}] Error fetching global showcase:`, err);
            globalFeedLoadingRef.current = false;
            setIsGlobalFeedLoading(false);
            return currentCache;
        }
    }, []); // EMPTY dependency array - function is now stable!



    // --- High Velocity Rating Logic (Buffered) ---
    const ratingQueue = useRef(new Map()); // stores { jobId, rating, timestamp } by jobId
    const flushInterval = useRef(null);

    // Process the queue every 3 seconds or on unmount
    useEffect(() => {
        const processQueue = async () => {
            if (ratingQueue.current.size === 0) return;

            const queueSnapshot = new Map(ratingQueue.current);
            ratingQueue.current.clear(); // Clear immediately to allow potentially new fast updates

            console.log(`[Batch] Flushing ${queueSnapshot.size} ratings...`);

            // Process each rating through cloud function
            // Process each rating through cloud function
            // Use apiCall but in fire-and-forget mode for individual items? 
            // Actually, apiCall is async. We can just use it.
            // Since this is a batch, we might want to just map over them.
            // Note: apiCall handles auth automatically.

            const promises = Array.from(queueSnapshot.values()).map(({ jobId, rating }) => {
                return apiCall('api', { action: 'rateGeneration', jobId, rating }, { toastErrors: false, timeout: 10000 })
                    .catch(err => {
                        console.error(`[Batch] Failed to rate ${jobId}:`, err);
                        return null;
                    });
            });

            try {
                await Promise.all(promises);
                console.log("[Batch] Successfully processed ratings.");
            } catch (err) {
                console.error("[Batch] Failed to process ratings:", err);
            }
        };

        flushInterval.current = setInterval(processQueue, 3000); // Flush every 3s

        return () => {
            if (flushInterval.current) clearInterval(flushInterval.current);
            processQueue();
        };
    }, [apiCall]);

    // Rate a generation (Buffered / Fire & Forget)
    const rateGeneration = async (job, rating) => {
        if (!job || !job.id) return;

        // Add to queue (Debounces automatically by Map key)
        ratingQueue.current.set(job.id, { jobId: job.id, rating, timestamp: Date.now() });
        console.log(`[Rate] Queued rating ${rating} for ${job.id}`);
        return true;
    };

    // Rate a showcase image (Direct Update, No Hide on Downvote)
    const rateShowcaseImage = async (imageId, rating, modelId) => {
        if (!imageId || !modelId) return;

        try {
            console.log(`[Rate Showcase] Rating ${rating} for ${imageId}`);
            await apiCall('api', { action: 'rateShowcaseImage', imageId, rating }, { toastErrors: true });

            // Optimistically update cache
            setShowcaseCache(prev => {
                const currentImages = prev[modelId] || [];
                return {
                    ...prev,
                    [modelId]: currentImages.map(img => {
                        if (img.id === imageId) {
                            // Calculate new likesCount optimistically
                            // If rating was 1, we increment. If -1, we decrement.
                            const currentLikes = img.likesCount || 0;
                            return {
                                ...img,
                                rating: rating,
                                likesCount: currentLikes + rating
                            };
                        }
                        return img;
                    })
                };
            });
            return true;
        } catch (e) {
            console.error("Error rating showcase image:", e);
            return false;
        }
    };

    const value = {
        selectedModel,
        setSelectedModel,
        availableModels,
        loading,
        error,
        getShowcaseImages, // Exported function
        getGlobalShowcaseImages, // EXPORTED - New optimization
        resetGlobalFeed, // EXPORTED
        showcaseCache,     // Exported state
        globalShowcaseCache, // EXPORTED state for instant load
        isGlobalFeedLoading, // EXPORTED reactive loading state
        hasGlobalFeedEnded, // EXPORTED - true when no more content to load
        hasMoreGlobal: !hasGlobalFeedEnded && globalShowcaseCache.length > 0, // Helper boolean
        isModelShowcaseLoading, // EXPORTED
        hasShowcaseEnded: (modelId) => !!hasShowcaseEndedRef.current[modelId], // EXPORTED helper
        rateGeneration,    // EXPORTED
        rateShowcaseImage, // EXPORTED
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
}
