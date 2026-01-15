import React, { useEffect, useState, useMemo } from 'react';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { Sparkles, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils'; // Added getImageSrcSet
import Sidebar from '../components/Sidebar';
import LazyImage from '../components/LazyImage'; // Replaces FeedPost
import ShowcaseModal from '../components/ShowcaseModal';
import './Discovery.css';

export default function Discovery() {
    const navigate = useNavigate();
    const { getGlobalShowcaseImages, globalShowcaseCache, isGlobalFeedLoading, availableModels } = useModel();
    const [activeShowcaseImage, setActiveShowcaseImage] = useState(null);

    // 1. Initial Load (One-time trigger)
    useEffect(() => {
        // Trigger fetch if empty. Context handles deduplication.
        getGlobalShowcaseImages(false);
    }, [getGlobalShowcaseImages]);

    // 2. Infinite Scroll Observer
    useEffect(() => {
        const sentinel = document.getElementById('feed-sentinel');
        if (!sentinel) return;

        const observer = new IntersectionObserver((entries) => {
            // Only trigger if intersecting and NOT loading
            if (entries[0].isIntersecting && !isGlobalFeedLoading) {
                getGlobalShowcaseImages(true); // Load more
            }
        }, { rootMargin: '400px' });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [isGlobalFeedLoading, getGlobalShowcaseImages]);

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
                                                <LazyImage
                                                    src={getOptimizedImageUrl(imgItem.thumbnailUrl || imgItem.url || imgItem.imageUrl || (typeof imgItem === 'string' ? imgItem : ''))}
                                                    srcSet={getImageSrcSet(imgItem)}
                                                    sizes="(max-width: 500px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                                    alt={`Showcase generation: ${imgItem.prompt ? imgItem.prompt.slice(0, 50) + "..." : "AI Artwork"}`}
                                                    aspectRatio={ratio}
                                                    priority={index < 8}
                                                    delay={((index % 12) * 0.05)}
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
