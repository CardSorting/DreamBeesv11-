import React, { useEffect, useState, useMemo, useRef } from 'react';
import SEO from '../components/SEO';
import { useParams, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AppCard from '../components/AppCard';
import { ArrowLeft, Loader2, BadgeCheck, Zap, Settings, LayoutGrid, Music, Sparkles, Presentation, Hexagon, Home, ChevronDown, ChevronRight, LayoutTemplate, User, Film, Palette, Gamepad2, Star, Clock, Search, Heart, Smile } from 'lucide-react';
import { getOptimizedImageUrl, preloadImage } from '../utils';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import FeedPost from '../components/FeedPost';
import ShowcaseModal from '../components/ShowcaseModal';
import SafeImage from '../components/SafeImage';
import './ModelFeed.css';

const FeedPostSkeleton = () => (
    <div className="post-skeleton animate-pulse">
        <div className="sk-header">
            <div className="sk-avatar" />
            <div className="sk-name" />
        </div>
        <div className="sk-image" />
        <div className="sk-footer">
            <div className="sk-line" />
            <div className="sk-line" style={{ width: '40%' }} />
        </div>
    </div>
);



import Sidebar from '../components/Sidebar';
import FeedSwitcher from '../components/FeedSwitcher';

import SuggestedPanel from '../components/SuggestedPanel';
const SuggestedPanelMemo = SuggestedPanel;

export default function ModelFeed() {
    const { id, filter } = useParams();
    const navigate = useNavigate();
    const { availableModels, getShowcaseImages, getGlobalShowcaseImages, rateShowcaseImage, globalShowcaseCache, showcaseCache, hasGlobalFeedEnded } = useModel();

    // "feedItems" is the master list of all content, shuffled or sorted
    // Initialize from cache if available to prevent flash of loading
    const [feedItems, setFeedItems] = useState(() => {
        if (!id && globalShowcaseCache) return globalShowcaseCache;
        if (id && showcaseCache[id]) return showcaseCache[id];
        return [];
    });

    // Sync feedItems with globalShowcaseCache updates from other components
    useEffect(() => {
        if (!id && globalShowcaseCache && globalShowcaseCache.length > feedItems.length) {
            // Cache has more items than our local state - sync it
            console.log(`[ModelFeed] Syncing cache: ${feedItems.length} -> ${globalShowcaseCache.length}`);
            setFeedItems(globalShowcaseCache);
        }
    }, [id, globalShowcaseCache, feedItems.length]);


    // Loading state - false if we have data already
    const [isLoading, setIsLoading] = useState(() => {
        if (!id && globalShowcaseCache) return false;
        if (id && showcaseCache[id]) return false;
        return true;
    });

    const [displayPage, setDisplayPage] = useState(2);
    const [fetchedShowcaseImage, setFetchedShowcaseImage] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Derived State: The image currently being viewed in the modal
    const activeShowcaseImage = useMemo(() => {
        const viewId = searchParams.get('view');
        if (!viewId) return null;
        // Check local feed cache first
        const found = feedItems.find(img => img.id === viewId);
        if (found) return found;
        // Check fetched fallback
        if (fetchedShowcaseImage?.id === viewId) return fetchedShowcaseImage;
        return null;
    }, [searchParams, feedItems, fetchedShowcaseImage]);

    // Deep Linking: Async fallback for missing items
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (!viewId) {
            if (fetchedShowcaseImage) setFetchedShowcaseImage(null);
            return;
        }

        // Only fetch if not already in local cache or fetched cache
        const inCache = feedItems.some(img => img.id === viewId);
        if (inCache || fetchedShowcaseImage?.id === viewId) return;

        const fetchImage = async () => {
            try {
                let docRef = doc(db, 'model_showcase_images', viewId);
                let snapshot = await getDoc(docRef);

                if (!snapshot.exists()) {
                    docRef = doc(db, 'generations', viewId);
                    snapshot = await getDoc(docRef);
                }

                if (snapshot.exists()) {
                    setFetchedShowcaseImage({ id: snapshot.id, ...snapshot.data() });
                }
            } catch (err) {
                console.error("Error fetching model feed deep-linked image:", err);
            }
        };
        fetchImage();
    }, [searchParams, feedItems, fetchedShowcaseImage]);

    const openShowcase = (img) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', img.id);
            return next;
        });
    };

    const closeShowcase = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.delete('view');
            return next;
        });
    };
    const imagesPerPage = 12;

    const location = useLocation();

    // Use URL param for filter if present, otherwise default to 'All'
    // This allows deep linking to filters (e.g. /filter/Videos)
    const [activeFilter, setActiveFilter] = useState(filter || 'All');

    // Sync state with URL param
    useEffect(() => {
        if (filter) {
            setActiveFilter(filter);
        } else {
            setActiveFilter('All');
        }
    }, [filter]);



    // Stable Global Model Object
    const GLOBAL_MODEL = useMemo(() => ({ name: "Global", image: "/dreambees_icon.png" }), []);

    const model = useMemo(() => {
        if (!id) return GLOBAL_MODEL;
        if (availableModels.length > 0) {
            return availableModels.find(m => m.id === id) || null;
        }
        return null; // Return null if waiting for models
    }, [id, availableModels, GLOBAL_MODEL]);

    // --- Helper: Smart Mix (Diversity Shuffle) ---
    const smartMix = (array) => {
        if (!array || array.length === 0) return [];

        // 1. Group by modelId
        const groups = {};
        array.forEach(item => {
            const mId = item.modelId || 'unknown';
            if (!groups[mId]) groups[mId] = [];
            groups[mId].push(item);
        });

        // 2. Interleave with per-round shuffle (Organically Randomized Round Robin)
        const result = [];
        let maxLen = 0;
        const modelIds = Object.keys(groups);
        modelIds.forEach(id => maxLen = Math.max(maxLen, groups[id].length));

        // Create a working copy of IDs to shuffle each round
        let roundIds = [...modelIds];

        for (let i = 0; i < maxLen; i++) {
            // Shuffle the order of models for THIS specific round
            // This prevents "A, B, C, A, B, C" patterns and makes it "A, C, B, C, A, B" etc.
            for (let k = roundIds.length - 1; k > 0; k--) {
                const j = Math.floor(Math.random() * (k + 1));
                [roundIds[k], roundIds[j]] = [roundIds[j], roundIds[k]];
            }

            roundIds.forEach(id => {
                const group = groups[id];
                if (i < group.length) {
                    result.push(group[i]);
                }
            });
        }

        return result;
    };

    // Track initialization to prevent duplicate fetches on navigation
    // We use a ref that survives re-renders but we need to be careful about when we reset it
    const hasInitializedRef = useRef(false);
    const lastIdRef = useRef(id);

    // Track raw fetched count to calculate diffs for mixing
    const fetchedCountRef = useRef(0);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const isFetchingMoreRef = useRef(false);
    const hasGlobalFeedEndedRef = useRef(false);

    // Sync refs for stable callback access
    useEffect(() => {
        isFetchingMoreRef.current = isFetchingMore;
    }, [isFetchingMore]);

    useEffect(() => {
        hasGlobalFeedEndedRef.current = hasGlobalFeedEnded;
    }, [hasGlobalFeedEnded]);

    // --- Data Loading Effect ---
    useEffect(() => {
        // Reset initialization when id changes (navigating to different model)
        if (lastIdRef.current !== id) {
            hasInitializedRef.current = false;
            lastIdRef.current = id;
            fetchedCountRef.current = 0; // Reset raw count
        }

        // Skip if already initialized for this id to prevent double-fetching
        if (hasInitializedRef.current) {
            return;
        }

        const loadShowcase = async () => {
            // Mark as initialized immediately
            hasInitializedRef.current = true;

            // Reset state ONLY if we don't have cache, to prevent white flash
            const hasCache = (!id && globalShowcaseCache?.length > 0) || (id && showcaseCache[id]);
            if (!hasCache) {
                setFeedItems([]);
                setIsLoading(true);
            }

            try {
                let images = [];
                if (id) {
                    // Single Model Mode - Fetch using ID directly (don't wait for model metadata)
                    console.log(`[ModelFeed] Loading showcase for model: ${id}`);
                    images = await getShowcaseImages(id);
                } else {
                    // Global Feed Mode - use context's robust fetcher
                    console.log("[ModelFeed] Loading global showcase");
                    images = await getGlobalShowcaseImages(false, 'modelfeed_init');
                }

                if (images && images.length > 0) {
                    // Initial Sort/Shuffle
                    let processedImages = [...images];

                    // Track raw count for paginated diffing
                    fetchedCountRef.current = processedImages.length;

                    // Default to smart mix for diversity
                    processedImages = smartMix(processedImages);

                    setFeedItems(processedImages);


                    // Preload top 4 images from the PROCESSED list
                    processedImages.slice(0, 4).forEach(img => {
                        if (img.type !== 'video') {
                            const preloadUrl = getOptimizedImageUrl(img.thumbnailUrl || img.url || img.imageUrl);
                            preloadImage(preloadUrl, 'high');
                        }
                    });
                }
            } catch (error) {
                console.error("Error fetching showcase:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Initialize immediately - detached from model metadata availability
        loadShowcase();

        // Cleanup: reset on unmount
        // REMOVED cleanup to prevent StrictMode double-fetch

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, getShowcaseImages, getGlobalShowcaseImages]); // Minimized dependencies





    // --- Derived Data for Render ---
    // Helper: Validate if a URL is potentially loadable
    const isValidImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        if (url.length < 10) return false; // Too short to be a real URL
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:')) return true;
        return false;
    };

    const imagesToRender = useMemo(() => {
        // SELECT SOURCE
        let sourceData = feedItems;

        const seenUrls = new Set();
        let filtered = (Array.isArray(sourceData) ? sourceData : [])
            .filter(img => {
                if (!img) return false;

                // Check for a valid URL in either url or imageUrl field
                const primaryUrl = img.url || img.imageUrl;
                if (!isValidImageUrl(primaryUrl)) return false;

                // Dedupe by URL
                if (seenUrls.has(primaryUrl)) return false;
                seenUrls.add(primaryUrl);
                return true;
            })
            .map(img => {
                // Attach model if missing (essential for filtering by tag)
                if (!id && img.modelId) {
                    const sourceModel = availableModels?.find(m => m.id === img.modelId);
                    if (sourceModel) {
                        return { ...img, _model: sourceModel };
                    }
                }
                return img;
            });

        // Filter Logic
        if (!id && activeFilter !== 'All') {
            filtered = filtered.filter(img => {
                // Check Model Tags
                const modelTags = img?._model?.tags || [];
                if (modelTags.includes(activeFilter)) return true;



                // Check explicit Tags
                if (img.tags && img.tags.includes(activeFilter)) return true;

                return false;
            });
        }

        return filtered;
    }, [feedItems, id, availableModels, activeFilter]);



    const visibleImages = useMemo(() => {
        return imagesToRender.slice(0, displayPage * imagesPerPage);
    }, [imagesToRender, displayPage]);


    // --- Infinite Scroll Logic (Robust Backend Fetching) ---
    const handleLoadMore = useCallback(async () => {
        if (isFetchingMoreRef.current) return;

        try {
            setIsFetchingMore(true);
            let allFetchedImages;

            if (id) {
                // Model Specific Feed
                if (hasShowcaseEnded(id)) {
                    setIsFetchingMore(false);
                    return;
                }
                console.log(`[ModelFeed] Sentinel triggered: Loading more images for model: ${id}`);
                allFetchedImages = await getShowcaseImages(id, true);
            } else {
                // Global Feed
                if (hasGlobalFeedEnded) {
                    setIsFetchingMore(false);
                    return;
                }
                console.log("[ModelFeed] Sentinel triggered: Loading more global images");
                allFetchedImages = await getGlobalShowcaseImages(true, 'infinite_scroll');
            }

            // Calculate Diff (New Items Only)
            const currentIds = new Set(feedItems.map(img => img.id));
            const newImages = (allFetchedImages || []).filter(img => !currentIds.has(img.id));

            if (newImages.length > 0) {
                console.log(`[Infinite Scroll] Found ${newImages.length} new items. Mixing and appending...`);

                // Mix ONLY the new batch to preserve history
                const mixedNewImages = smartMix(newImages);

                // Append
                setFeedItems(prev => [...prev, ...mixedNewImages]);
                fetchedCountRef.current = allFetchedImages.length;
            }
        } catch (err) {
            console.error("Error loading more images:", err);
        } finally {
            setIsFetchingMore(false);
        }
    }, [id, hasShowcaseEnded, hasGlobalFeedEnded, getShowcaseImages, getGlobalShowcaseImages, feedItems]);

    // Robust Infinite Scroll Observer
    const sentinelRef = useIntersectionObserver({
        onIntersect: () => {
            // 1. Local Pagination (Reveal more of what we have)
            if (visibleImages.length < imagesToRender.length) {
                setDisplayPage(prev => prev + 1);
            }

            // 2. Backend Fetch (Get more if we are running low or hit the end of current buffer)
            if (visibleImages.length >= imagesToRender.length - 8) {
                handleLoadMore();
            }
        },
        enabled: !isLoading && (!hasGlobalFeedEnded || !!id), // Keep enabled for model feeds to allow pagination check
        rootMargin: '0px 0px 1200px 0px'
    });

    if (!model) {
        return (
            <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                <div className="loading-pulse">LOADING FEED...</div>
            </div>
        );
    }

    return (
        <div className="feed-layout-wrapper">
            <SEO
                title={activeShowcaseImage ? `${activeShowcaseImage.prompt?.slice(0, 50)}...` : `${model.name} Feed - DreamBees`}
                description={activeShowcaseImage ? activeShowcaseImage.prompt : `Instagram-style showcase feed for the ${model.name} AI model.`}
                image={activeShowcaseImage ? (activeShowcaseImage.url || activeShowcaseImage.imageUrl) : model.image}
                canonical={activeShowcaseImage ? `/model/${model.id || 'global'}/image/${activeShowcaseImage.id}` : undefined}
            />

            <Sidebar activeId={id ? `/models` : location.pathname} /> {/* Dynamic active ID */}

            <main className="feed-main-content">

                <FeedSwitcher />




                <div className="feed-posts-container">
                    {visibleImages.map((imgItem, index) => (
                        <FeedPost
                            key={imgItem.id || index}
                            imgItem={imgItem}
                            index={index}
                            model={model.name === "Global" ? (imgItem._model || availableModels?.find(m => m.id === imgItem.modelId) || model) : model}
                            getOptimizedImageUrl={getOptimizedImageUrl}
                            rateShowcaseImage={rateShowcaseImage}
                            navigate={navigate}
                            setActiveShowcaseImage={openShowcase}
                        />
                    ))}

                    {isLoading && (
                        <div className="feed-loader-skeletons">
                            {[...Array(3)].map((_, i) => <FeedPostSkeleton key={i} />)}
                        </div>
                    )}

                    {!isLoading && visibleImages.length === 0 && (
                        <div className="empty-feed-state">
                            <Sparkles size={48} />
                            <h3>No posts found</h3>
                            <p>Try adjusting your filters or check back later.</p>
                            <button onClick={() => setActiveFilter('All')} className="reset-filter-btn">
                                Clear Filters
                            </button>
                        </div>
                    )}

                    {/* Sentinel for Infinite Scroll Trigger */}
                    <div ref={sentinelRef} style={{ height: '20px', width: '100%', marginTop: '40px' }} aria-hidden="true" />

                    {!isLoading && visibleImages.length > 0 && (visibleImages.length < imagesToRender.length || (id ? !hasShowcaseEnded(id) : !hasGlobalFeedEnded)) && (
                        <div className="feed-loader-skeletons">
                            {[...Array(1)].map((_, i) => <FeedPostSkeleton key={i} />)}
                        </div>
                    )}
                </div>
            </main>

            <SuggestedPanelMemo
                currentModel={model}
                availableModels={availableModels}
                setActiveFilter={(newFilter) => {
                    if (id) {
                        navigate(`/model/${id}/feed/filter/${newFilter}`);
                    } else {
                        navigate(`/filter/${newFilter}`);
                    }
                }}
            />

            {activeShowcaseImage && (
                <ShowcaseModal
                    image={activeShowcaseImage}
                    model={model}
                    onClose={closeShowcase}
                />
            )}


        </div>
    );
}
