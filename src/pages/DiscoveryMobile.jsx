import React, { useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { Sparkles, Loader2, CheckCircle2, Heart, Flag } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import FeedSwitcher from '../components/FeedSwitcher';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils';

import { useNavigate, useParams } from 'react-router-dom';
import { slugify } from '../utils/urlHelpers';
import './Discovery.css';

export default function DiscoveryMobile() {
    const navigate = useNavigate();
    const {
        getGlobalShowcaseImages,
        globalShowcaseCache,
        isGlobalFeedLoading,
        availableModels,
        hasGlobalFeedEnded,
        getShowcaseImages,
        showcaseCache,
        isModelShowcaseLoading,
        hasShowcaseEnded
    } = useModel();
    const { _isLiked, _toggleLike, _isHidden, _hidePost: _hidePost } = useUserInteractions();

    // -- MODEL STATE --
    const { modelId } = useParams();
    const activeModelId = modelId || 'all';
    // Scroll to top on model change
    const handleModelSelect = (newModelId) => {
        if (activeModelId === newModelId) return;

        // Navigate
        if (newModelId === 'all') {
            navigate('/discovery');
        } else {
            navigate(`/discovery/model/${newModelId}`);
        }

        window.scrollTo(0, 0);
    };

    // Load specific model data if selected
    useEffect(() => {
        if (activeModelId !== 'all') {
            getShowcaseImages(activeModelId);
        }
    }, [activeModelId, getShowcaseImages]);

    // COMPUTE FILTERED IMAGES
    const displayImages = useMemo(() => {
        const source = activeModelId === 'all'
            ? globalShowcaseCache
            : (showcaseCache[activeModelId] || []);

        return source.filter(img => !_isHidden(img.id));
    }, [activeModelId, globalShowcaseCache, showcaseCache, _isHidden]);

    // Track initialization and scroll states with refs for stability
    const hasInitializedRef = useRef(false);
    const observerRef = useRef(null);
    const sentinelRef = useRef(null);
    const isLoadingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const hasReachedEndRef = useRef(false);

    // Configuration
    const DEBOUNCE_MS = 200; // Minimum time between fetch attempts
    const PREFETCH_THRESHOLD = '600px'; // How far before sentinel to start loading

    // Sync loading state to ref for stable callback access
    useEffect(() => {
        isLoadingRef.current = activeModelId === 'all' ? isGlobalFeedLoading : isModelShowcaseLoading;
    }, [isGlobalFeedLoading, isModelShowcaseLoading, activeModelId]);

    // 0. Scroll to top immediately on mount
    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, []);

    // 1. Initial Load - Stable, one-time trigger
    useEffect(() => {
        // Skip if we already have data to prevent re-fetching on view mode switch if desired, 
        // but for now we'll prioritize ensuring content is there.
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        if (globalShowcaseCache.length === 0) {
            getGlobalShowcaseImages(false, 'discovery_mobile_init');
        }

        return () => {
            hasInitializedRef.current = false;
            hasReachedEndRef.current = false;
        };
    }, [getGlobalShowcaseImages, globalShowcaseCache.length]);

    // 2. Robust Infinite Scroll Handler - Stabilized with refs to prevent observer recreation
    const handleLoadMore = useCallback(async () => {
        if (isLoadingRef.current) return;

        const isEnd = activeModelId === 'all' ? hasGlobalFeedEnded : hasShowcaseEnded(activeModelId);
        if (isEnd) return;

        const now = Date.now();
        if (now - lastFetchTimeRef.current < DEBOUNCE_MS) return;

        lastFetchTimeRef.current = now;

        if (activeModelId === 'all') {
            await getGlobalShowcaseImages(true, 'discovery_mobile_scroll');
        } else {
            await getShowcaseImages(activeModelId, true);
        }
    }, [getGlobalShowcaseImages, getShowcaseImages, activeModelId, hasGlobalFeedEnded, hasShowcaseEnded]);

    // 3. Intersection Observer Setup - with force-check for already-visible sentinel
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    handleLoadMore();
                }
            },
            { rootMargin: PREFETCH_THRESHOLD, threshold: 0.1 }
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);

            // Force-check: if sentinel is already visible, trigger load immediately
            // This handles the case where observer recreation doesn't fire for already-visible elements
            const rect = sentinelRef.current.getBoundingClientRect();
            const prefetchOffset = parseInt(PREFETCH_THRESHOLD) || 600;
            const isVisible = rect.top < window.innerHeight + prefetchOffset;
            if (isVisible) {
                handleLoadMore();
            }
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [handleLoadMore]);

    // Derived state for UI
    const isInitialLoading = (activeModelId === 'all' && isGlobalFeedLoading && globalShowcaseCache.length === 0) ||
        (activeModelId !== 'all' && isModelShowcaseLoading && (!showcaseCache[activeModelId] || showcaseCache[activeModelId].length === 0));
    const isLoadingMore = (activeModelId === 'all' ? isGlobalFeedLoading && globalShowcaseCache.length > 0 : isModelShowcaseLoading && showcaseCache[activeModelId]?.length > 0);
    const hasReachedEnd = activeModelId === 'all' ? hasGlobalFeedEnded : hasShowcaseEnded(activeModelId);

    // Helper for Like Toggle to prevent bubble up
    const handleToggleLike = (e, imgItem) => {
        e.stopPropagation();
        const model = availableModels?.find(m => m.id === imgItem.modelId);
        _toggleLike(imgItem, model);
    };

    const handleImageClick = useCallback((imgItem) => {
        const slug = slugify(imgItem.prompt?.slice(0, 40) || 'artwork');
        navigate(`/discovery/${slug}-${imgItem.id}`);
    }, [navigate]);

    return (
        <div className="mobile-discovery-wrapper" style={{ paddingBottom: '80px', background: '#000', minHeight: '100vh' }}>
            <SEO
                title={modelId ? `${availableModels?.find(m => m.id === modelId)?.name || 'Model'} Showcase - DreamBees` : "Discover AI Art - DreamBees"}
                description={modelId ? `Explore the best AI-generated artwork created with the ${availableModels?.find(m => m.id === modelId)?.name || 'selected'} model.` : "Explore a curated feed of AI-generated artwork. Get inspired by unique styles and prompts from the DreamBees community."}
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "ImageGallery",
                            "name": modelId ? `${availableModels?.find(m => m.id === modelId)?.name || 'AI'} Art Gallery` : "DreamBees AI Art Discovery",
                            "description": "A curated showcase of AI-generated artwork.",
                            "image": displayImages.slice(0, 5).map(img => img.thumbnailUrl || img.url)
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Discover", "item": "https://dreambeesai.com/discovery" },
                                ...(modelId ? [{ "@type": "ListItem", "position": 3, "name": availableModels?.find(m => m.id === modelId)?.name || 'Model', "item": `https://dreambeesai.com/discovery/model/${modelId}` }] : [])
                            ]
                        }
                    ]
                }}
            />


            <FeedSwitcher />

            {/* Model Selection Pills */}
            <div className="models-header-bar" style={{ padding: '0 16px 16px 16px', margin: '16px 0' }}>
                <button
                    className={`model-pill ${activeModelId === 'all' ? 'active' : ''}`}
                    onClick={() => handleModelSelect('all')}
                >
                    All Models
                </button>
                {availableModels.map(model => (
                    <button
                        key={model.id}
                        className={`model-pill ${activeModelId === model.id ? 'active' : ''}`}
                        onClick={() => handleModelSelect(model.id)}
                    >
                        {model.name}
                    </button>
                ))}
            </div>

            {/* Content Container - Single Column */}
            <div className="discovery-container" style={{ padding: '0 12px' }}>
                <motion.div
                    className="masonry-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {displayImages.map((imgItem, index) => {
                        const ratio = imgItem.aspectRatio || '1/1';
                        const liked = _isLiked(imgItem.id);

                        return (
                            <article
                                key={imgItem.id || index}
                                className="masonry-item"
                                onClick={() => handleImageClick(imgItem)}
                                style={{ marginBottom: '8px' }}
                            >
                                <div className="image-card">
                                    <div className="image-wrapper" style={{
                                        aspectRatio: ratio,
                                        background: imgItem.lqip ? `url(${imgItem.lqip}) center/cover no-repeat` : 'rgba(255,255,255,0.02)',
                                        filter: imgItem.lqip ? 'blur(10px)' : 'none',
                                        transition: 'filter 0.5s ease',
                                        overflow: 'hidden'
                                    }}>
                                        <img
                                            src={getOptimizedImageUrl(imgItem.thumbnailUrl || imgItem.url)}
                                            srcSet={getImageSrcSet(imgItem)}
                                            alt={imgItem.prompt}
                                            onLoad={(e) => {
                                                e.target.parentElement.style.filter = 'none';
                                                e.target.parentElement.style.background = 'transparent';
                                            }}
                                            onError={(e) => {
                                                console.error(`[Discovery Mobile] Image failed to load: ${e.target.src}`);
                                                e.target.parentElement.style.filter = 'none';
                                                e.target.parentElement.style.background = 'rgba(255,255,255,0.05)';
                                            }}
                                            loading={index < 4 ? "eager" : "lazy"}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block'
                                            }}
                                        />
                                    </div>
                                    <div className="image-meta" style={{ opacity: 1, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                                        <button
                                            onClick={(e) => handleToggleLike(e, imgItem)}
                                            className="meta-badge"
                                            style={{ border: 'none', background: 'transparent' }}
                                        >
                                            <Heart
                                                size={18}
                                                fill={liked ? "#ff3040" : "rgba(255,255,255,0.8)"}
                                                color={liked ? "#ff3040" : "rgba(255,255,255,0.8)"}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </motion.div>

                {/* Loading States */}
                {isInitialLoading && (
                    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: '#a855f7' }} />
                    </div>
                )}

                <div ref={sentinelRef} style={{ padding: '20px', textAlign: 'center', minHeight: '40px' }}>
                    {isLoadingMore && <Loader2 size={24} className="animate-spin" style={{ color: '#a855f7', margin: '0 auto' }} />}
                    {hasReachedEnd && !isLoadingMore && displayImages.length > 0 && (
                        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>End of feed</span>
                    )}
                </div>
                {/* Integrated BottomNav for seamless transition */}
                <div style={{ position: 'sticky', bottom: 0, zIndex: 100, width: '100%' }}>
                    <BottomNav />
                </div>
            </div>
        </div>
    );
}
