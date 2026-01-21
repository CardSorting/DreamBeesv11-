import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import SEO from '../components/SEO';
import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { Sparkles, Loader2, CheckCircle2, Heart, Flag } from 'lucide-react';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils';
import { getBalancedRecommendations } from '../utils/relevance';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SuggestedPanel from '../components/SuggestedPanel';
import './Discovery.css';

export default function DiscoveryDesktop() {
    const navigate = useNavigate();

    const {
        getGlobalShowcaseImages,
        globalShowcaseCache,
        isGlobalFeedLoading,
        availableModels,
        hasGlobalFeedEnded,
        getShowcaseImages,
        showcaseCache
    } = useModel();
    const { isLiked, toggleLike, isHidden, hidePost } = useUserInteractions();

    // -- MODEL STATE --
    const { modelId } = useParams();
    // -- MODEL STATE --
    // Sync state with URL param, default to 'all'
    const [activeModelId, setActiveModelId] = useState(modelId || 'all');
    const [searchParams, setSearchParams] = useSearchParams();

    // Update state when URL changes
    useEffect(() => {
        setActiveModelId(modelId || 'all');
    }, [modelId]);

    // Deep Linking for Focused Image
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId && !focusImage) {
            // Find in current data source
            const source = activeModelId === 'all'
                ? globalShowcaseCache
                : (showcaseCache[activeModelId] || []);

            const found = source.find(img => img.id === viewId);
            if (found) {
                setFocusImage(found);
            }
        } else if (!viewId && focusImage) {
            setFocusImage(null);
        }
    }, [searchParams, activeModelId, globalShowcaseCache, showcaseCache, focusImage]);

    // Scroll to top on model change
    const handleModelSelect = (newModelId) => {
        if (activeModelId === newModelId) return;

        // Navigate instead of setting state directly
        if (newModelId === 'all') {
            navigate('/discovery');
        } else {
            navigate(`/discovery/model/${newModelId}`);
        }

        // Immediate scroll to top
        if (window.lenis) window.lenis.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
    };



    // Load specific model data if selected
    useEffect(() => {
        if (activeModelId !== 'all') {
            getShowcaseImages(activeModelId);
        }
    }, [activeModelId, getShowcaseImages]);

    // COMPUTE FILTERED IMAGES
    const displayImages = React.useMemo(() => {
        const source = activeModelId === 'all'
            ? globalShowcaseCache
            : (showcaseCache[activeModelId] || []);

        return source.filter(img => !isHidden(img.id));
    }, [activeModelId, globalShowcaseCache, showcaseCache, isHidden]);

    // Focus View State
    const [focusImage, setFocusImage] = useState(null);
    const [relatedImages, setRelatedImages] = useState([]);
    const [isFocusLoading, setIsFocusLoading] = useState(false);

    // Removed activeShowcaseImage state as we navigate now

    // Track initialization and scroll states with refs for stability
    const hasInitializedRef = useRef(false);
    const observerRef = useRef(null);
    const sentinelRef = useRef(null);
    const isLoadingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const hasReachedEndRef = useRef(false);

    // Configuration
    const MOBILE_BREAKPOINT = 768;
    const DEBOUNCE_MS = 800; // Minimum time between fetch attempts
    const PREFETCH_THRESHOLD = '600px'; // How far before sentinel to start loading

    // Sync loading state to ref for stable callback access
    useEffect(() => {
        isLoadingRef.current = isGlobalFeedLoading;
    }, [isGlobalFeedLoading]);

    // 0. Scroll to top immediately on mount
    useLayoutEffect(() => {
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true });
        } else {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
    }, []);

    // 1. Initial Load - Stable, one-time trigger
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        console.log('[Discovery] 🚀 Initial load triggered');
        getGlobalShowcaseImages(false, 'discovery_init');

        return () => {
            hasInitializedRef.current = false;
            hasReachedEndRef.current = false;
        };
    }, [getGlobalShowcaseImages]);

    // 2. Robust Infinite Scroll Handler - Debounced & Guarded
    const handleLoadMore = useCallback(async () => {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTimeRef.current;

        // Guard conditions - all must pass to fetch
        if (isLoadingRef.current) {
            console.log('[Discovery] ⏳ Already loading, skipping...');
            return;
        }
        // Only infinite scroll on 'all' feed for now
        if (activeModelId !== 'all') {
            return;
        }
        if (hasReachedEndRef.current) {
            console.log('[Discovery] ✅ Already at end of feed');
            return;
        }
        if (timeSinceLastFetch < DEBOUNCE_MS) {
            console.log(`[Discovery] ⏱ Debounce active (${timeSinceLastFetch}ms < ${DEBOUNCE_MS}ms)`);
            return;
        }
        if (globalShowcaseCache.length === 0) {
            console.log('[Discovery] 📭 No initial content yet, skipping load more');
            return;
        }

        // All guards passed - fetch more
        console.log(`[Discovery] 📥 Loading more... (current: ${globalShowcaseCache.length} items)`);
        lastFetchTimeRef.current = now;

        const result = await getGlobalShowcaseImages(true, 'discovery_scroll');

        // Check if component is still mounted before using refs or state
        if (!hasInitializedRef.current) return;

        // Check if we've reached the end (no new items loaded)
        if (result && result.length === globalShowcaseCache.length) {
            console.log('[Discovery] 🏁 End of feed reached');
            hasReachedEndRef.current = true;
        }
    }, [getGlobalShowcaseImages, globalShowcaseCache.length]);

    // 3. Intersection Observer Setup - Stable, no recreation on cache changes
    useEffect(() => {
        // Cleanup previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        // Create new observer with stable callback
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    handleLoadMore();
                }
            },
            {
                rootMargin: PREFETCH_THRESHOLD, // Pre-fetch before sentinel is visible
                threshold: 0.1
            }
        );

        // Observe sentinel when available
        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleLoadMore]); // Only recreate when handler changes

    // Derived state for UI
    const isInitialLoading = (isGlobalFeedLoading && globalShowcaseCache.length === 0 && activeModelId === 'all') || (activeModelId !== 'all' && !showcaseCache[activeModelId]);
    const isLoadingMore = isGlobalFeedLoading && globalShowcaseCache.length > 0 && activeModelId === 'all';
    const hasReachedEnd = hasReachedEndRef.current || hasGlobalFeedEnded;

    // Helper for Like Toggle to prevent bubble up
    const handleToggleLike = (e, imgItem) => {
        e.stopPropagation();
        // find model for this item
        const model = availableModels.find(m => m.id === imgItem.modelId);
        toggleLike(imgItem, model);
    };

    // Handle Image Click (Conditional Navigation)
    const handleImageClick = useCallback((imgItem) => {
        const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

        if (isMobile) {
            navigate(`/discovery/${imgItem.id}`);
        } else {
            setFocusImage(imgItem);
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('view', imgItem.id);
                return next;
            }, { replace: true });
        }
    }, [navigate, setSearchParams]);

    const handleCloseFocus = () => {
        setFocusImage(null);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.delete('view');
            return next;
        }, { replace: true });
    };

    // Fetch Related Images when Focused
    useEffect(() => {
        if (!focusImage) {
            setRelatedImages([]);
            return;
        }

        setIsFocusLoading(true);

        const isMounted = { current: true };

        // Small delay to allow animation to start smoothly
        const timer = setTimeout(() => {
            if (!isMounted.current) return;

            let recommendations = getBalancedRecommendations(
                focusImage,
                globalShowcaseCache,
                {
                    limit: 6,
                    maxSameModel: 4,
                    maxSamePrimaryStyle: 5,
                    maxSameSubjectCategory: 5,
                    explorationRatio: 0.2 // Reduced exploration slightly to prioritize relevance
                }
            );

            // Fallback: Fill up to 6 images if strict diversity filtered too many
            if (recommendations.length < 6 && globalShowcaseCache.length > 0) {
                const existingIds = new Set(recommendations.map(r => r.id));
                existingIds.add(focusImage.id);

                const fillers = globalShowcaseCache
                    .filter(img => !existingIds.has(img.id))
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 6 - recommendations.length);

                recommendations = [...recommendations, ...fillers];
            }

            if (isMounted.current) {
                setRelatedImages(recommendations);
                setIsFocusLoading(false);
            }
        }, 100);

        return () => {
            isMounted.current = false;
            clearTimeout(timer);
        };
    }, [focusImage, globalShowcaseCache]);

    return (
        <div className="feed-layout-wrapper">
            <SEO
                title={focusImage ? `${focusImage.prompt?.slice(0, 60)}...` : "Discover AI Art - Community Showcase"}
                description={focusImage ? focusImage.prompt : "Explore a curated feed of AI-generated artwork. Get inspired by unique styles, prompts, and creative techniques from the DreamBees community."}
                image={focusImage ? (focusImage.thumbnailUrl || focusImage.imageUrl) : undefined}
                keywords="AI art gallery, AI generated images, explore AI artwork, community showcase, AI art inspiration, creative prompts"
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "ImageGallery",
                            "name": "DreamBeesAI Discovery Feed",
                            "description": "A curated showcase of AI-generated artwork from the DreamBees community."
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Discover", "item": "https://dreambeesai.com/discovery" }
                            ]
                        }
                    ]
                }}
            />

            <Sidebar activeId="/discovery" />

            <main className="feed-main-content">


                <div className="discovery-container">

                    {/* HERO / HEADER */}
                    <div style={{
                        padding: '40px 0 20px 0',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <h1 className="page-title" style={{ fontSize: '3rem', margin: 0 }}>
                            {activeModelId === 'all' ? 'DISCOVERY' : availableModels.find(m => m.id === activeModelId)?.name || 'MODEL SHOWCASE'}
                        </h1>
                        <p className="page-subtitle" style={{ maxWidth: '400px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
                            {activeModelId === 'all'
                                ? "Explore the hive mind's latest creations."
                                : `Curated showcase generated with ${availableModels.find(m => m.id === activeModelId)?.name}.`}
                        </p>
                    </div>

                    {/* MODEL SELECTION PILLS - NEW */}
                    <div className="models-header-bar">
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

                    {/* MASONRY GRID */}
                    <section className="gallery-section" aria-label="Discovery Gallery" style={{ minHeight: '60vh' }}>
                        <div className="masonry-grid">
                            {displayImages.map((imgItem, index) => {
                                const ratios = ['1/1', '3/4', '1/1', '2/3', '4/3', '1/1', '3/5'];
                                const ratio = imgItem.aspectRatio || ratios[index % ratios.length];
                                const liked = isLiked(imgItem.id);

                                return (
                                    <article
                                        key={imgItem.id || index}
                                        className="masonry-item group"
                                        onClick={() => handleImageClick(imgItem)}
                                        style={{
                                            animation: `fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(0.1 + ((index * 0.05) % 0.4), 1.0)}s both`,
                                            cursor: 'pointer'
                                        }}
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
                                                    src={getOptimizedImageUrl(imgItem.thumbnailUrl || imgItem.url || imgItem.imageUrl || (typeof imgItem === 'string' ? imgItem : ''))}
                                                    srcSet={getImageSrcSet(imgItem)}
                                                    sizes="(max-width: 500px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                                    alt={`Showcase generation: ${imgItem.prompt ? imgItem.prompt.slice(0, 50) + "..." : "AI Artwork"}`}
                                                    loading={index < 8 ? "eager" : "lazy"}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block'
                                                    }}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                                                    opacity: 0,
                                                    transition: 'opacity 0.3s'
                                                }} className="group-hover:opacity-100" />
                                            </div>
                                            <div className="image-meta" style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={(e) => handleToggleLike(e, imgItem)}
                                                    className="meta-badge"
                                                    style={{
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                >
                                                    <Heart
                                                        size={16}
                                                        fill={liked ? "#ff3040" : "none"}
                                                        color={liked ? "#ff3040" : "white"}
                                                    />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                                        {liked ? "Liked" : "Like"}
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        hidePost(imgItem);
                                                    }}
                                                    className="meta-badge"
                                                    style={{
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                        background: 'rgba(0,0,0,0.4)',
                                                        backdropFilter: 'blur(8px)',
                                                        padding: '6px 10px',
                                                        borderRadius: '20px',
                                                        color: 'white'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                    title="Hide this post"
                                                >
                                                    <Flag
                                                        size={14}
                                                        color="white"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {/* Initial Loading State */}
                        {isInitialLoading && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '40vh',
                                gap: '16px'
                            }}>
                                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-accent, #a855f7)' }} />
                                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Loading discoveries...</p>
                            </div>
                        )}

                        {/* Infinite Scroll Sentinel - ref-based for stable observation */}
                        <div
                            ref={sentinelRef}
                            id="feed-sentinel"
                            style={{
                                margin: '40px 0',
                                textAlign: 'center',
                                minHeight: '60px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {/* Loading More Indicator */}
                            {isLoadingMore && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-accent, #a855f7)' }} />
                                    <span style={{ fontSize: '0.85rem' }}>Loading more...</span>
                                </div>
                            )}

                            {/* End of Feed Indicator */}
                            {hasReachedEnd && !isLoadingMore && globalShowcaseCache.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    opacity: 0.5,
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)'
                                }}>
                                    <CheckCircle2 size={18} style={{ color: 'var(--color-success, #22c55e)' }} />
                                    <span style={{ fontSize: '0.85rem' }}>You've seen it all! Check back later for more.</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* DESKTOP FOCUS OVERLAY */}
                    <AnimatePresence>
                        {focusImage && (
                            <motion.div
                                className="focus-overlay-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleCloseFocus}
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 50,
                                    background: 'rgba(0,0,0,0.85)',
                                    backdropFilter: 'blur(12px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Close Button */}
                                <button
                                    className="focus-close-btn"
                                    onClick={(e) => { e.stopPropagation(); handleCloseFocus(); }}
                                    style={{
                                        position: 'absolute',
                                        top: '30px',
                                        right: '30px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '48px',
                                        height: '48px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'white',
                                        zIndex: 60,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    <X size={24} />
                                </button>

                                {/* Main Focus Image */}
                                <motion.div
                                    layoutId={`image-${focusImage.id}`}
                                    className="focus-main-card"
                                    onClick={(e) => e.stopPropagation()}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    style={{
                                        position: 'relative',
                                        zIndex: 55,
                                        maxWidth: '70vw',
                                        maxHeight: '85vh',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        background: '#1a1a1a'
                                    }}
                                >
                                    <img
                                        src={getOptimizedImageUrl(focusImage.url)}
                                        alt={focusImage.prompt}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            maxHeight: '85vh',
                                            display: 'block',
                                            objectFit: 'contain'
                                        }}
                                    />

                                    {/* Action Bar Overlay on Hover */}
                                    <div className="focus-actions" style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '24px',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-end',
                                        opacity: 1 // Always visible for now, or use group-hover
                                    }}>
                                        <div style={{ maxWidth: '70%' }}>
                                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600 }}>
                                                {focusImage.subject?.category || 'Creation'}
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {focusImage.prompt}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const model = availableModels.find(m => m.id === focusImage.modelId);
                                                    toggleLike(focusImage, model);
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    background: 'white',
                                                    color: 'black',
                                                    border: 'none',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <Heart
                                                    size={18}
                                                    fill={isLiked(focusImage.id) ? "#ff3040" : "none"}
                                                    color={isLiked(focusImage.id) ? "#ff3040" : "black"}
                                                />
                                                <span>{isLiked(focusImage.id) ? "Liked" : "Like"}</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Floating Related Images */}
                                {relatedImages.map((img, index) => {
                                    // Calculate random-ish positions around the center
                                    // We'll use fixed percent offsets to distribute them "organically"
                                    const positions = [
                                        // Left side items (3)
                                        { top: '15%', left: '5%', rotate: '-6deg' },
                                        { top: '45%', left: '3%', rotate: '4deg' },
                                        { bottom: '15%', left: '6%', rotate: '-3deg' },

                                        // Right side items (3)
                                        { top: '18%', right: '5%', rotate: '5deg' },
                                        { top: '48%', right: '3%', rotate: '-4deg' },
                                        { bottom: '12%', right: '6%', rotate: '3deg' }
                                    ];
                                    const pos = positions[index % positions.length];

                                    return (
                                        <motion.div
                                            key={`${focusImage.id}-related-${img.id}`}
                                            className="related-float-card"
                                            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                y: [0, -10, 0], // Subtle float animation
                                                transition: {
                                                    opacity: { delay: 0.2 + (index * 0.1) },
                                                    scale: { delay: 0.2 + (index * 0.1) },
                                                    y: {
                                                        repeat: Infinity,
                                                        duration: 3 + index,
                                                        ease: "easeInOut",
                                                        delay: index * 0.5
                                                    }
                                                }
                                            }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFocusImage(img);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                zIndex: 52, // Behind main image (55) but above backdrop (50)
                                                width: '160px',
                                                aspectRatio: img.aspectRatio || '1/1',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                                cursor: 'pointer',
                                                border: '2px solid rgba(255,255,255,0.1)',
                                                ...pos
                                            }}
                                            whileHover={{
                                                scale: 1.1,
                                                zIndex: 60,
                                                borderColor: 'var(--color-primary, #a855f7)',
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            <img
                                                src={getOptimizedImageUrl(img.thumbnailUrl || img.url)}
                                                alt="Related"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </motion.div>
                                    );
                                })}

                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </main >
            <SuggestedPanel
                currentModel={activeModelId === 'all' ? null : availableModels.find(m => m.id === activeModelId)}
                availableModels={availableModels}
                setActiveFilter={() => { }}
            />
        </div >
    );
}
