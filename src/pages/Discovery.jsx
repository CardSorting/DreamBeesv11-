import React, { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { Sparkles, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils'; // Added getImageSrcSet
import Sidebar from '../components/Sidebar';

import ShowcaseModal from '../components/ShowcaseModal';
import './Discovery.css';

export default function Discovery() {
    const navigate = useNavigate();
    const { getGlobalShowcaseImages, globalShowcaseCache, isGlobalFeedLoading, availableModels } = useModel();
    const [activeShowcaseImage, setActiveShowcaseImage] = useState(null);

    // Track initialization to prevent duplicate calls
    const hasInitializedRef = useRef(false);

    // 0. Scroll to top immediately on mount
    useLayoutEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto' // Instant scroll, no animation
        });
    }, []);

    // 1. Initial Load (One-time trigger per mount)
    useEffect(() => {
        // Only trigger once per component mount, not on every render
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        console.log("[Discovery] Initial load triggered");
        getGlobalShowcaseImages(false, 'discovery_init');

        // Reset on unmount so next mount will fetch fresh if needed
        return () => {
            hasInitializedRef.current = false;
        };
    }, [getGlobalShowcaseImages]);

    // 2. Infinite Scroll Observer - with cooldown and strict guards
    const isLoadingRef = useRef(isGlobalFeedLoading);
    const lastLoadTimeRef = useRef(0);
    const lastCacheLengthRef = useRef(0);
    const COOLDOWN_MS = 1000; // Minimum time between fetches

    useEffect(() => {
        isLoadingRef.current = isGlobalFeedLoading;
        // Update cache length ref only when NOT loading to establish a baseline for next trigger
        if (!isGlobalFeedLoading) {
            lastCacheLengthRef.current = globalShowcaseCache.length;
        }
    }, [isGlobalFeedLoading, globalShowcaseCache.length]);

    useEffect(() => {
        const sentinel = document.getElementById('feed-sentinel');
        if (!sentinel) return;

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            const now = Date.now();
            const timeSinceLastLoad = now - lastLoadTimeRef.current;

            // Strict Guards:
            // 1. Must be intersecting
            // 2. Must NOT be currently loading
            // 3. Must have cooldown elapsed
            // 4. Must have existing content (don't trigger on empty)
            // 5. Must have new content loaded previously (or be initial load)
            if (entry.isIntersecting &&
                !isLoadingRef.current &&
                timeSinceLastLoad > COOLDOWN_MS &&
                globalShowcaseCache.length > 0 &&
                globalShowcaseCache.length > lastCacheLengthRef.current) {

                console.log("[Discovery] Triggering scroll load...");
                lastLoadTimeRef.current = now;
                getGlobalShowcaseImages(true, 'discovery_scroll');
            }
        }, { rootMargin: '400px' });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [getGlobalShowcaseImages, globalShowcaseCache.length]);

    const visibleImages = globalShowcaseCache;
    const loading = isGlobalFeedLoading && visibleImages.length === 0; // Initial loading state

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
                            {visibleImages.map((imgItem, index) => {
                                const ratios = ['1/1', '3/4', '1/1', '2/3', '4/3', '1/1', '3/5'];
                                const ratio = imgItem.aspectRatio || ratios[index % ratios.length];

                                return (
                                    <article
                                        key={imgItem.id || index}
                                        className="masonry-item group"
                                        onClick={() => setActiveShowcaseImage(imgItem)}
                                        style={{
                                            animation: `fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(0.1 + ((index * 0.05) % 0.4), 1.0)}s both`
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
                                                <div className="meta-badge">
                                                    {availableModels.find(m => m.id === imgItem.modelId)?.name || 'DreamBee'}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {/* Infinite Scroll Sentinel / Loader */}
                        <div id="feed-sentinel" style={{ margin: '40px 0', textAlign: 'center', opacity: 0.5 }}>
                            {loading && <Loader2 size={32} className="animate-spin text-white mx-auto" />}
                        </div>
                    </section>

                </div>
            </main>

            {activeShowcaseImage && (
                <ShowcaseModal
                    image={activeShowcaseImage}
                    model={availableModels.find(m => m.id === activeShowcaseImage.modelId) || null}
                    onClose={() => setActiveShowcaseImage(null)}
                />
            )}
        </div>
    );
}
