import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import SEO from '../components/SEO';
import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { Sparkles, Loader2, CheckCircle2, Heart } from 'lucide-react';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

import './Discovery.css';

export default function Discovery() {
    const navigate = useNavigate();
    const {
        getGlobalShowcaseImages,
        globalShowcaseCache,
        isGlobalFeedLoading,
        availableModels,
        hasGlobalFeedEnded
    } = useModel();
    const { isLiked, toggleLike } = useUserInteractions();

    // Removed activeShowcaseImage state as we navigate now

    // Track initialization and scroll states with refs for stability
    const hasInitializedRef = useRef(false);
    const observerRef = useRef(null);
    const sentinelRef = useRef(null);
    const isLoadingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const hasReachedEndRef = useRef(false);

    // Configuration
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
    const isInitialLoading = isGlobalFeedLoading && globalShowcaseCache.length === 0;
    const isLoadingMore = isGlobalFeedLoading && globalShowcaseCache.length > 0;
    const hasReachedEnd = hasReachedEndRef.current || hasGlobalFeedEnded;

    // Helper for Like Toggle to prevent bubble up
    const handleToggleLike = (e, imgItem) => {
        e.stopPropagation();
        // find model for this item
        const model = availableModels.find(m => m.id === imgItem.modelId);
        toggleLike(imgItem, model);
    };

    return (
        <div className="feed-layout-wrapper">
            <SEO title="Discovery Engine - DreamBees" description="Explore AI Art by Vibe, Collection, and Color." />

            <Sidebar activeId="/discovery" />

            <main className="feed-main-content">
                <header className="mobile-feed-header">
                    <div className="header-title">
                        <span>DISCOVERY</span>
                        <Sparkles size={16} className="text-purple-500 fill-purple-500" />
                    </div>
                </header>

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
                        <h1 className="page-title" style={{ fontSize: '3rem', margin: 0 }}>DISCOVERY</h1>
                        <p className="page-subtitle" style={{ maxWidth: '400px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
                            Explore the hive mind's latest creations.
                        </p>
                    </div>

                    {/* MASONRY GRID */}
                    <section className="gallery-section" aria-label="Discovery Gallery" style={{ minHeight: '60vh' }}>
                        <div className="masonry-grid">
                            {globalShowcaseCache.map((imgItem, index) => {
                                const ratios = ['1/1', '3/4', '1/1', '2/3', '4/3', '1/1', '3/5'];
                                const ratio = imgItem.aspectRatio || ratios[index % ratios.length];
                                const liked = isLiked(imgItem.id);

                                return (
                                    <article
                                        key={imgItem.id || index}
                                        className="masonry-item group"
                                        onClick={() => navigate(`/discovery/${imgItem.id}`)}
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
                                            <div className="image-meta">
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

                </div>
            </main>
        </div>
    );
}
