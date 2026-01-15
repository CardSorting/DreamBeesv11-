import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { db, functions } from '../firebase';
import { collection, getDocs, query, orderBy, where, limit, startAfter } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getOptimizedImageUrl } from '../utils';

const ModelContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useModel() {
    return useContext(ModelContext);
}

export function ModelProvider({ children }) {
    const [availableModels, setAvailableModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

                setAvailableModels(models);

                // Prioritize saved model, then current selection (if any), then ZIT-model, then first available
                if (models.length > 0) {
                    let targetModel = null;

                    if (savedModelId) {
                        targetModel = models.find(m => m.id === savedModelId);
                    }

                    // Only set default if no saved model and no current selection
                    // Use a ref to check current state without causing dependency issues
                    if (!targetModel && !selectedModel) {
                        // Default to wai-illustrious if not saved
                        targetModel = models.find(m => m.id === 'wai-illustrious') || models[0];
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
    }, []); // Intentionally empty - only run on mount

    // Persist selection
    useEffect(() => {
        if (selectedModel) {
            localStorage.setItem('selectedModelId', selectedModel.id);
        }
    }, [selectedModel]);

    const [showcaseCache, setShowcaseCache] = useState({});
    // const [globalShowcaseCache, setGlobalShowcaseCache] = useState(null); // MOVED TO GLOBAL HELPER SECTION

    // Fetch and cache showcase images for a model
    const getShowcaseImages = async (modelId) => {
        // 1. Check cache
        if (showcaseCache[modelId]) {
            return showcaseCache[modelId];
        }

        // 2. Try Local Manifest First
        try {
            console.log(`[Cache Miss] Fetching local showcase for ${modelId}`);
            const response = await fetch(`/showcase/${modelId}/manifest.json`);
            if (response.ok) {
                const localData = await response.json();
                console.log(`[Local Showcase] Found ${localData.length} items for ${modelId}`);

                // Transform to match Firestore shape if needed, though they seem similar
                // Optimize all URLs to use CDN
                const images = localData.map((item, index) => ({
                    id: `local_${modelId}_${index}`,
                    imageUrl: getOptimizedImageUrl(item.url || item.imageUrl), // manifest uses 'url', optimize to CDN
                    url: getOptimizedImageUrl(item.url || item.imageUrl), // Also set url for consistency
                    ...item
                }));

                // Update Cache and Return
                setShowcaseCache(prev => ({ ...prev, [modelId]: images }));
                return images;
            }
        } catch (localErr) {
            console.warn(`[Local Showcase] Failed to load manifest for ${modelId}`, localErr);
            // Fallthrough to Firestore on error
        }

        // 3. Fallback to Firestore
        try {
            console.log(`[Firestore Fallback] Fetching showcase for ${modelId}`);
            const q = query(
                collection(db, 'model_showcase_images'),
                where('modelId', '==', modelId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(q);

            let images = [];
            if (!snapshot.empty) {
                images = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Optimize image URLs to use CDN
                    const optimizedUrl = getOptimizedImageUrl(data.imageUrl || data.url);
                    return {
                        id: doc.id,
                        modelId: modelId, // Explicitly inject modelId to ensure linkage
                        ...data,
                        imageUrl: optimizedUrl,
                        url: optimizedUrl, // Ensure both fields are set
                        likesCount: data.likesCount || 0, // Ensure likesCount is available
                        bookmarksCount: data.bookmarksCount || 0, // Ensure bookmarksCount is available
                        rating: data.rating || 0 // Legacy support
                    };
                });
            }

            // 4. Update Cache
            setShowcaseCache(prev => ({ ...prev, [modelId]: images }));
            return images;
        } catch (err) {
            console.error("Error fetching showcase images:", err);
            return [];
        }
    };

    // --- GLOBAL FEED HELPERS ---
    const globalFeedLoadingRef = useRef(false);
    const [globalShowcaseCache, setGlobalShowcaseCache] = useState([]); // Array of all loaded images
    const [lastGlobalDoc, setLastGlobalDoc] = useState(null); // Tracker for pagination
    const [isGlobalFeedLoading, setIsGlobalFeedLoading] = useState(false); // Reactive loading state

    // Reset global feed (e.g. on pull to refresh)
    const resetGlobalFeed = useCallback(() => {
        setGlobalShowcaseCache([]);
        setLastGlobalDoc(null);
        globalFeedLoadingRef.current = false;
    }, []);

    // Fetch aggregated global showcase (All Models) - PAGINATED & ROBUST
    const getGlobalShowcaseImages = useCallback(async (loadMore = false) => {
        // Prevent duplicate fetches
        if (globalFeedLoadingRef.current) return globalShowcaseCache;

        // If not loading more and we have cache, return valid cache (unless empty, then try fetching)
        if (!loadMore && globalShowcaseCache.length > 0) return globalShowcaseCache;

        try {
            globalFeedLoadingRef.current = true;
            console.log(`[Global Feed] Fetching... (Load More: ${loadMore})`);

            const pageSize = 24;
            let q = query(
                collection(db, 'model_showcase_images'),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );

            // Pagination: start after the last doc we have
            if (loadMore && lastGlobalDoc) {
                const startAfterDoc = lastGlobalDoc;
                q = query(
                    collection(db, 'model_showcase_images'),
                    orderBy('createdAt', 'desc'),
                    startAfter(startAfterDoc),
                    limit(pageSize)
                );
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.log("[Global Feed] No more images found.");
                globalFeedLoadingRef.current = false;
                setIsGlobalFeedLoading(false); // Stop loading
                return loadMore ? globalShowcaseCache : [];
            }

            // Update pagination cursor
            setLastGlobalDoc(snapshot.docs[snapshot.docs.length - 1]);

            const newImages = snapshot.docs.map(doc => {
                const data = doc.data();
                const optimizedUrl = getOptimizedImageUrl(data.imageUrl || data.url);

                if (!optimizedUrl) return null;

                // Note: We do not enrich with _model here to avoid dependency cycles.
                // The UI layer (Discovery.jsx) handles model lookup via Context.

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

            // Deduplicate against existing cache just in case
            const existingIds = new Set(globalShowcaseCache.map(i => i.id));
            const uniqueNewImages = newImages.filter(i => !existingIds.has(i.id));

            let finalImages;
            if (loadMore) {
                finalImages = [...globalShowcaseCache, ...uniqueNewImages];
            } else {
                finalImages = uniqueNewImages;
            }

            setGlobalShowcaseCache(finalImages);
            globalFeedLoadingRef.current = false;
            setIsGlobalFeedLoading(false); // Stop loading
            return finalImages;
        } catch (err) {
            console.error("Error fetching global showcase:", err);
            globalFeedLoadingRef.current = false;
            setIsGlobalFeedLoading(false); // Stop loading
            return loadMore ? globalShowcaseCache : [];
        }
    }, [globalShowcaseCache, lastGlobalDoc]); // Removed availableModels dependency

    // Fetch user videos for mixing into feed
    const getUserVideos = useCallback(async (userId) => {
        try {
            console.log(`[Video Fetch] Fetching videos for ${userId}`);
            const q = query(
                collection(db, 'videos'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(q);
            console.log(`[Video Fetch] Found ${snapshot.size} videos`);

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    type: 'video',
                    // Feed requires 'url' property for filtering/dedup logic
                    url: data.videoUrl,
                    // Fallbacks for display
                    imageUrl: getOptimizedImageUrl(data.imageSnapshotUrl || data.thumbnailUrl || data.videoUrl),
                    videoUrl: data.videoUrl,
                    // Mock ratings for now if missing, to help them float up in sorted feeds
                    rating: data.rating || 0
                };
            });
        } catch (error) {
            console.error("Error fetching user videos:", error);
            return [];
        }
    }, []);

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
            const api = httpsCallable(functions, 'api');
            const promises = Array.from(queueSnapshot.values()).map(({ jobId, rating }) => {
                return api({ action: 'rateGeneration', jobId, rating }).catch(err => {
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
    }, []);

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
            const api = httpsCallable(functions, 'api');
            await api({ action: 'rateShowcaseImage', imageId, rating });

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
        hasMoreGlobal: !!lastGlobalDoc, // Helper boolean
        rateGeneration,    // EXPORTED
        rateShowcaseImage, // EXPORTED
        getUserVideos,     // EXPORTED
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
}
