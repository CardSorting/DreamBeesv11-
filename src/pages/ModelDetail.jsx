import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import SEO from '../components/SEO';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { ArrowLeft, Check, Sparkles, Zap, Aperture, Hash, Layers, ArrowUpRight, X, Copy, RefreshCw, ThumbsUp, ThumbsDown, Loader2, LayoutGrid, Square, Film, Heart, Share2, Bookmark, MoreHorizontal, BadgeCheck, Activity, Info, Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';
import ShowcaseModal from '../components/ShowcaseModal';
import { useAuth } from '../contexts/AuthContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';

import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl, getImageSrcSet, preloadImage } from '../utils';
// import { db } from '../firebase'; // Unused in this component

export default function ModelDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isUnder18, userRole } = useAuth();
    const { isSafeMode, isRevealed, markRevealed, updateNSFWStatus } = useUserInteractions();
    const [activeShowcaseImage, setActiveShowcaseImage] = useState(null);
    const imagesPerPage = 12;

    // 1. Determine Initial Showcase from Cache Synchronously to avoid "Initializing" flash
    const { availableModels, selectedModel, setSelectedModel, showcaseCache, getShowcaseImages, isModelShowcaseLoading, hasShowcaseEnded } = useModel();
    const [showcaseImages, setShowcaseImages] = useState(() => {
        return (id && showcaseCache[id]) ? showcaseCache[id] : [];
    });
    const isFetchingRef = useRef(false);

    const [showAgeGate, setShowAgeGate] = useState(false);
    const [hasConfirmedAge, setHasConfirmedAge] = useState(false);

    // Derive model from availableModels instead of using useState + useEffect
    const model = useMemo(() => {
        if (availableModels?.length > 0) {
            return availableModels.find(m => m.id === id) || null;
        }
        return null;
    }, [id, availableModels]);

    const isModelNSFW = useMemo(() => {
        return model?.tags?.some(t => t?.toLowerCase() === 'nsfw' || t?.toLowerCase() === '18+');
    }, [model]);

    useEffect(() => {
        if (isModelNSFW && !hasConfirmedAge) {
            setShowAgeGate(true);
        }
    }, [isModelNSFW, hasConfirmedAge]);

    // Ensure displayPage is sufficient for deep-linked items (not strictly necessary but helpful if we were scrolling)
    const [displayPage, setDisplayPage] = useState(2);


    const isActive = selectedModel?.id === model?.id;

    // Fetch or Seed Showcase Images
    useEffect(() => {
        if (!model) return;

        const loadShowcase = async () => {
            try {
                const images = await getShowcaseImages(model.id);
                if (images && images.length > 0) {
                    setShowcaseImages(images);

                    // Preload for LCP
                    images.slice(0, 6).forEach(img => {
                        const preloadUrl = getOptimizedImageUrl(img.thumbnailUrl || img.url || img.imageUrl);
                        preloadImage(preloadUrl, 'high');
                    });
                } else {
                    // Final fallback to model preview images
                    const previews = model.previewImages || [model.image];
                    setShowcaseImages(previews.map((s, idx) => ({
                        id: `fallback_${idx}`,
                        url: getOptimizedImageUrl(s)
                    })));
                }
            } catch (error) {
                console.error("Error fetching showcase:", error);
            }
        };

        loadShowcase();
    }, [model, getShowcaseImages]);


    const [searchParams, setSearchParams] = useSearchParams();
    const sortParam = searchParams.get('sort');
    const [sortBy, setSortBy] = useState(sortParam || 'TOP_RATED'); // 'TOP_RATED' | 'LATEST'

    useEffect(() => {
        if (sortParam && ['TOP_RATED', 'LATEST'].includes(sortParam)) {

            setSortBy(prev => (prev !== sortParam ? sortParam : prev));
        }
    }, [sortParam]);

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('sort', newSort);
            return newParams;
        });
    };

    // Deep Linking for Modal
    const lastViewIdRef = useRef(null);
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId === lastViewIdRef.current) return;
        lastViewIdRef.current = viewId;

        if (viewId) {
            // Try to find in loaded images first
            const found = showcaseImages.find(img => img.id === viewId) ||
                (model?.previewImages?.find(img => img.id === viewId || getOptimizedImageUrl(img) === viewId)); // Fallback logic

            if (found) {
                setActiveShowcaseImage(typeof found === 'string' ? { url: getOptimizedImageUrl(found), id: viewId } : found);
            } else if (viewId?.startsWith('http')) {
                // Direct URL fallback if ID not found but it looks like a URL (legacy)
                setActiveShowcaseImage({ url: viewId, id: viewId });
            }
        } else {
            setActiveShowcaseImage(null);
        }
    }, [searchParams, showcaseImages, model]);

    const openShowcase = (img) => {
        setActiveShowcaseImage(img);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (img.id) newParams.set('view', img.id);
            return newParams;
        });
    };

    const closeShowcase = () => {
        setActiveShowcaseImage(null);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('view');
            return newParams;
        });
    };

    // Use the fetched showcase images, defaulting to previewImages or model.image
    const rawImages = useMemo(() => {
        if (!model) return [];
        if (showcaseImages.length > 0) return showcaseImages;

        const previews = model.previewImages?.length > 0
            ? model.previewImages
            : (model.image ? [model.image] : []);

        return previews.map(s => (typeof s === 'string' ? { url: s, isCurated: true } : { ...s, isCurated: true }));
    }, [model, showcaseImages]);

    // List of images to render (filtered, de-duplicated and sorted)
    const imagesToRender = useMemo(() => {
        const seenUrls = new Set();
        return rawImages
            .filter(img => {
                if (!img || !img.url || typeof img.url !== 'string' || img.url.length <= 5) return false;
                if (seenUrls.has(img.url)) return false;
                seenUrls.add(img.url);
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'TOP_RATED') {
                    // Stable sort with secondary tie-breaker
                    const ratingDiff = (b.rating || 0) - (a.rating || 0);
                    if (ratingDiff !== 0) return ratingDiff;
                    // Tie-breaker: creation time or ID
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    if (timeB !== timeA) return timeB - timeA;
                    return String(b.id).localeCompare(String(a.id));
                } else {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    if (timeB !== timeA) return timeB - timeA;
                    return String(b.id).localeCompare(String(a.id));
                }
            });
    }, [rawImages, sortBy]);

    // Paginated list
    const visibleImages = useMemo(() => {
        return imagesToRender.slice(0, displayPage * imagesPerPage);
    }, [imagesToRender, displayPage]);

    // Handle Load More from Backend
    const handleLoadMore = useCallback(async () => {
        if (!model || isModelShowcaseLoading || hasShowcaseEnded(model.id)) return;
        if (isFetchingRef.current) return;

        try {
            isFetchingRef.current = true;
            console.warn(`[ModelDetail] Sentinel triggered: Loading more images for ${model.id}`);
            const updatedImages = await getShowcaseImages(model.id, true);
            if (updatedImages && updatedImages.length > showcaseImages.length) {
                setShowcaseImages(updatedImages);
            }
        } catch (error) {
            console.error("Error loading more images:", error);
        } finally {
            isFetchingRef.current = false;
        }
    }, [model, isModelShowcaseLoading, hasShowcaseEnded, getShowcaseImages, showcaseImages.length]);

    // Robust Infinite Scroll Observer
    const sentinelRef = useIntersectionObserver({
        onIntersect: () => {
            // 1. Reveal more local images if we have them but aren't showing them
            if (visibleImages.length < imagesToRender.length) {
                setDisplayPage(prev => prev + 1);
            }

            // 2. Fetch more from backend if we are running low on local images
            // We trigger if we are showing everything OR nearly everything we have
            if (visibleImages.length >= imagesToRender.length - 8) {
                handleLoadMore();
            }
        },
        enabled: !!model && (!hasShowcaseEnded(model?.id) || visibleImages.length < imagesToRender.length),
        rootMargin: '0px 0px 800px 0px' // Trigger well before hitting the bottom
    });

    if (!model) {
        return (
            <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                <div className="loading-pulse">LOADING...</div>
            </div>
        );
    }

    return (
        <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', position: 'relative' }}>
            <SEO
                title={activeShowcaseImage ? `${activeShowcaseImage.prompt?.slice(0, 50)}...` : `${model.name} (${sortBy === 'TOP_RATED' ? 'Top Rated' : 'Latest'}) - AI Model`}
                description={activeShowcaseImage ? activeShowcaseImage.prompt : model.description}
                image={activeShowcaseImage ? (activeShowcaseImage.url || activeShowcaseImage.imageUrl) : model.image}
                canonical={activeShowcaseImage ? `/gallery/${activeShowcaseImage.id}` : undefined}
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "SoftwareApplication",
                            "name": model.name,
                            "description": model.description,
                            "applicationCategory": "MultimediaApplication",
                            "operatingSystem": "Any",
                            "image": model.image,
                            "softwareVersion": "2.4.1",
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": "4.9",
                                "ratingCount": "150",
                                "bestRating": "5",
                                "worstRating": "1"
                            },
                            "offers": {
                                "@type": "Offer",
                                "price": "0.00",
                                "priceCurrency": "USD"
                            }
                        },
                        // Dynamic VideoObject if viewing a video item
                        ...(activeShowcaseImage?.type === 'video' ? [{
                            "@type": "VideoObject",
                            "name": activeShowcaseImage.prompt || model.name,
                            "description": activeShowcaseImage.prompt || model.description,
                            "thumbnailUrl": [activeShowcaseImage.thumbnailUrl || activeShowcaseImage.url],
                            "uploadDate": activeShowcaseImage.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                            "contentUrl": activeShowcaseImage.url,
                            "embedUrl": `https://dreambeesai.com/model/${model.id}?view=${activeShowcaseImage.id}`
                        }] : []),
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Models", "item": "https://dreambeesai.com/models" },
                                { "@type": "ListItem", "position": 2, "name": model.name, "item": `https://dreambeesai.com/model/${model.id}` }
                            ]
                        }
                    ]
                }}
            />

            {/* Global Noise Overlay */}
            <div className="noise-overlay" style={{ position: 'fixed', opacity: 0.03, pointerEvents: 'none', zIndex: 100 }} />

            {/* Back Navigation (Fixed) */}
            <nav style={{
                position: 'fixed',
                top: '40px',
                left: '40px',
                zIndex: 50,
                mixBlendMode: 'difference'
            }} aria-label="Back navigation">
                <button
                    onClick={() => navigate('/models')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.75rem',
                        letterSpacing: '0.2em',
                        cursor: 'none',
                        textTransform: 'uppercase'
                    }}
                >
                    <ArrowLeft size={16} /> <span className="hover-underline">Index</span>
                </button>
            </nav>

            <div className="pinterest-layout">

                {/* HERO SECTION - Centered */}
                <header className="hero-section" style={{
                    minHeight: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '120px 20px 60px 20px',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{ maxWidth: '800px' }}>

                        {/* ID Badge */}
                        <div style={{
                            marginBottom: '32px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '16px',
                            opacity: 0.6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '8px 16px',
                            borderRadius: '100px'
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                background: 'var(--color-accent-primary)',
                                borderRadius: '50%',
                                boxShadow: '0 0 10px var(--color-accent-primary)'
                            }} />
                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.2em' }}>
                                MODEL // {model?.id?.toUpperCase()}
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 style={{
                            fontSize: 'clamp(3rem, 6vw, 6rem)',
                            lineHeight: 1,
                            fontWeight: '300',
                            color: 'white',
                            marginBottom: '32px',
                            letterSpacing: '-0.03em'
                        }}>
                            <div className="text-reveal-mask">
                                <span style={{ animation: 'revealUp 1s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                                    {model.name}
                                </span>
                            </div>
                        </h1>

                        {/* Description */}
                        <p style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            lineHeight: 1.6,
                            color: '#aaa',
                            fontFamily: 'var(--font-serif)',
                            marginBottom: '40px',
                            maxWidth: '600px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both'
                        }}>
                            {model.description}
                        </p>

                        {/* CTAs */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '24px',
                            marginBottom: '60px',
                            animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both'
                        }}>
                            <button
                                onClick={() => {
                                    setSelectedModel(model);
                                    setTimeout(() => navigate('/generate'), 500);
                                }}
                                disabled={isActive}
                                className={`btn-primary ${isActive ? 'active-engine' : ''}`}
                                style={{
                                    padding: '20px 40px',
                                    borderRadius: '100px',
                                    background: isActive ? 'white' : 'white',
                                    color: 'black',
                                    fontSize: '0.9rem',
                                    letterSpacing: '0.1em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s'
                                }}
                            >
                                {isActive ? 'ACTIVE' : 'ACTIVATE'} <ArrowUpRight size={18} />
                            </button>

                            {/* Technical Specs Row */}
                            <div className="tech-row" style={{ display: 'flex', gap: '24px' }}>
                                <div className="tech-item">
                                    <span className="tech-label">RES</span> 1024
                                </div>
                                <div className="tech-item">
                                    <span className="tech-label">BASE</span> SDXL
                                </div>
                            </div>
                        </div>

                    </div>
                </header>


                {/* STICKY CONTROL CENTER */}
                <div style={{
                    position: 'relative',
                    marginBottom: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    animation: 'fadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) both'
                }}>
                    {/* View Feed Button */}
                    <button
                        onClick={() => navigate(`/model/${id}/feed`)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            background: 'white',
                            color: 'black',
                            padding: '12px 32px',
                            borderRadius: '100px',
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            letterSpacing: '0.1em',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            textTransform: 'uppercase'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 15px 40px rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                        }}
                    >
                        <Film size={16} /> ENTER IMMERSIVE FEED
                    </button>

                    {/* Sorting Filters */}
                    <nav className="filter-nav" style={{
                        display: 'flex',
                        gap: '24px'
                    }}>
                        <button
                            onClick={() => handleSortChange('TOP_RATED')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: sortBy === 'TOP_RATED' ? 'white' : 'var(--color-text-dim)',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                letterSpacing: '0.2em',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                position: 'relative'
                            }}
                        >
                            TOP RATED
                            {sortBy === 'TOP_RATED' && (
                                <motion.div layoutId="sortUnderline" style={{ height: '1px', background: 'var(--color-accent-primary)', position: 'absolute', bottom: '-8px', left: 0, right: 0 }} />
                            )}
                        </button>
                        <button
                            onClick={() => handleSortChange('LATEST')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: sortBy === 'LATEST' ? 'white' : 'var(--color-text-dim)',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                letterSpacing: '0.2em',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                position: 'relative'
                            }}
                        >
                            LATEST
                            {sortBy === 'LATEST' && (
                                <motion.div layoutId="sortUnderline" style={{ height: '1px', background: 'var(--color-accent-primary)', position: 'absolute', bottom: '-8px', left: 0, right: 0 }} />
                            )}
                        </button>
                    </nav>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '32px',
                    padding: '0 20px',
                    animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both'
                }}>
                    <motion.div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '10px 24px',
                            borderRadius: '100px',
                            boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
                            maxWidth: '1000px'
                        }}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)',
                            flexShrink: 0
                        }}>
                            <ShieldAlert size={16} className="text-amber-400" />
                        </div>
                        <p style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.6)',
                            margin: 0,
                            fontWeight: '500',
                            letterSpacing: '0.01em',
                            lineHeight: '1.5'
                        }}>
                            <span style={{ color: 'white', fontWeight: '800', marginRight: '8px', textTransform: 'uppercase', fontSize: '0.7rem' }}>Content Advisory:</span>
                            This environment features experimental, user-managed AI content. DreamBees provides tools for expression; viewer discretion and adherence to our Community Safety Standards is required.
                        </p>
                    </motion.div>
                </div>

                <section className="gallery-section" aria-label="Showcase Gallery" style={{
                    padding: '0 2vw 40px 2vw',
                    animation: 'fadeIn 1.5s ease 0.4s both',
                    minHeight: '40vh'
                }}>
                    {visibleImages.length > 0 ? (
                        <div className="masonry-grid">
                            {visibleImages.map((imgItem, index) => {
                                const ratios = ['1/1', '3/4', '1/1', '2/3', '4/3', '1/1', '3/5'];
                                const ratio = imgItem.aspectRatio || ratios[index % ratios.length];

                                return (
                                    <ShowcaseCard
                                        key={imgItem.id || index}
                                        imgItem={imgItem}
                                        index={index}
                                        ratio={ratio}
                                        isUnder18={isUnder18}
                                        isAdmin={userRole === 'admin'}
                                        isSafeMode={isSafeMode}
                                        isPersistentlyRevealed={isRevealed(imgItem.id)}
                                        onReveal={() => markRevealed(imgItem.id)}
                                        updateNSFWStatus={updateNSFWStatus}
                                        onClick={() => openShowcase(imgItem)}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="masonry-grid" style={{ opacity: 0.5 }}>
                            {Array.from({ length: 12 }).map((_, idx) => {
                                const ratios = ['1/1', '3/4', '4/5', '2/3', '1/1', '3/5'];
                                return (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <div key={`skeleton-${idx}`} className="masonry-item" style={{ marginBottom: '4px' }}>
                                        <div className="image-card" style={{
                                            aspectRatio: ratios[idx % ratios.length],
                                            background: 'rgba(255,255,255,0.03)',
                                            border: 'none'
                                        }}>
                                            <div className="shimmer-loading" style={{ position: 'absolute', inset: 0 }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Sentinel for Infinite Scroll Trigger */}
                <div ref={sentinelRef} style={{ height: '20px', width: '100%' }} aria-hidden="true" />

                {/* Loading Indicator for Infinite Scroll */}
                {(visibleImages.length < imagesToRender.length || (!hasShowcaseEnded(model.id) && showcaseImages.length > 0)) && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '40px 0 120px 0',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.8rem',
                        letterSpacing: '0.2em'
                    }}>
                        <div className="flex-center" style={{ gap: '12px' }}>
                            <Loader2 size={16} className="animate-spin" /> POPULATING MORE...
                        </div>
                    </div>
                )}

                {/* Lightbox Modal */}
                {activeShowcaseImage && (
                    <ShowcaseModal
                        image={activeShowcaseImage}
                        model={model}
                        onClose={closeShowcase}
                    />
                )}

            </div>

            <style>{`
                .text-reveal-mask { overflow: hidden; }
                
                .shimmer-loading {
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.05),
                        transparent
                    );
                    background-size: 200% 100%;
                    animation: skeleton-shimmer 2s infinite linear;
                }

                @keyframes skeleton-shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                @keyframes revealUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeInUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .hover-underline { position: relative; }
                .hover-underline::after {
                    content: ''; position: absolute; bottom: -4px; left: 0; width: 0%; height: 1px; background: white; transition: width 0.3s;
                }
                button:hover .hover-underline::after { width: 100%; }

                .tech-item {
                    font-family: monospace;
                    font-size: 0.8rem;
                    color: #666;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 8px 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .tech-label { color: #444; }

                /* Masonry & Cards */
                .masonry-grid {
                    column-count: 6; /* dense wall */
                    column-gap: 4px; /* Ultra tight */
                }
                .masonry-item {
                    margin-bottom: 4px; /* Ultra tight */
                    break-inside: avoid;
                }
                .image-card {
                    position: relative;
                    cursor: pointer;
                    border-radius: var(--radius-lg); /* Match model tiles */
                    overflow: hidden;
                    border: 1px solid var(--color-border);
                    background: #111;
                    transition: border-color 0.3s, transform 0.3s;
                }
                .image-card:hover { border-color: var(--color-border-hover); }
                .image-wrapper {
                    overflow: hidden;
                    position: relative;
                    width: 100%;
                    display: block;
                }
                .image-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s;
                    filter: grayscale(0.2);
                }
                .image-card:hover .image-wrapper img {
                    transform: scale(1.1);
                    filter: grayscale(0);
                }
                .image-meta {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 8px;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
                    opacity: 0;
                    transition: opacity 0.3s;
                    display: flex;
                    align-items: flex-end;
                }
                .image-card:hover .image-meta {
                    opacity: 1;
                }
                .meta-badge {
                    font-family: monospace;
                    font-size: 0.6rem;
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(4px);
                    padding: 2px 4px;
                    border-radius: 2px;
                    color: white;
                }

                /* Mobile Responsiveness */
                @media (max-width: 1600px) { .masonry-grid { column-count: 5; } }
                @media (max-width: 1200px) { .masonry-grid { column-count: 4; } }
                @media (max-width: 800px) { .masonry-grid { column-count: 3; } }
                @media (max-width: 500px) { 
                    .masonry-grid { column-count: 2; column-gap: 2px; } 
                    .masonry-item { margin-bottom: 2px; }
                    .hero-section { min-height: auto; padding-top: 140px; }
                    .custom-cursor { display: none; }
                    .cursor-none { cursor: auto; }
                }

                .tab-btn {
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--color-text-dim);
                    padding: 8px 16px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 100px;
                }
                .tab-btn:hover {
                    color: white;
                    background: rgba(255,255,255,0.05);
                }
                .tab-btn.active {
                    color: black;
                    background: white;
                    border-color: white;
                }

                /* Global Mobile Styles */
                @media (max-width: 600px) {
                    .instagram-feed {
                        gap: 10px !important;
                        padding-top: 20px;
                    }
                    .feed-post {
                        border-radius: 0 !important;
                        border-left: none !important;
                        border-right: none !important;
                        background: transparent !important;
                    }
                    .segmented-control {
                        width: 90vw !important;
                    }
                }
                .feed-image-container:hover img {
                    transform: scale(1.05);
                }
                .feed-image-container:hover .expand-hint-btn {
                    opacity: 1 !important;
                }
                .hide-scroll::-webkit-scrollbar {
                    display: none;
                }
                .hide-scroll {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <AnimatePresence>
                {showAgeGate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(20px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                maxWidth: '400px',
                                width: '100%',
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: '24px',
                                padding: '40px',
                                textAlign: 'center',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ef4444',
                                margin: '0 auto 24px auto'
                            }}>
                                <Info size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: 'white' }}>
                                Content Advisory
                            </h2>
                            <p style={{ color: '#888', marginBottom: '32px', lineHeight: '1.6' }}>
                                This model is used to generate 18+ content. By proceeding, you confirm you are of legal age and wish to view this content.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02, background: '#fff' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setHasConfirmedAge(true);
                                        setShowAgeGate(false);
                                    }}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: '#eee',
                                        border: 'none',
                                        color: 'black',
                                        fontWeight: '800',
                                        cursor: 'pointer'
                                    }}
                                >
                                    I am 18 or older
                                </motion.button>
                                <button
                                    onClick={() => navigate('/')}
                                    style={{
                                        padding: '16px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#666',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Go Back
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

// Sub-component to handle individual image loading state
const ShowcaseCard = React.memo(function ShowcaseCard({ imgItem, index, ratio, onClick, isUnder18, isAdmin, isSafeMode, isPersistentlyRevealed, onReveal, updateNSFWStatus }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLocalRevealed, setIsLocalRevealed] = useState(false);

    const isRevealed = isPersistentlyRevealed || isLocalRevealed;
    const isNSFW = imgItem.isNSFW || imgItem.nsfw || imgItem.tags?.some(t => t?.toLowerCase() === 'nsfw' || t?.toLowerCase() === '18+');

    // Logic: Blur if NSFW AND (User is Under 18 OR Safe Mode is ON) AND Not revealed yet
    const shouldBlur = isNSFW && (isUnder18 || isSafeMode) && !isRevealed;

    const blurFilter = shouldBlur ? 'blur(30px)' : 'none';

    const handleReveal = (e) => {
        e.stopPropagation();
        setIsLocalRevealed(true);
        if (onReveal) onReveal();
    };
    return (
        <article
            className="masonry-item group"
            onClick={onClick}
            style={{
                animation: `fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + ((index * 0.08) % 0.4)}s both`
            }}
        >
            <div className="image-card">
                <div className="image-wrapper" style={{
                    aspectRatio: ratio,
                    background: imgItem.lqip ? `url(${imgItem.lqip}) center/cover no-repeat` : 'rgba(255,255,255,0.02)',
                    // Only blur if LQIP exists AND image hasn't loaded yet
                    filter: (imgItem.lqip && !isLoaded) ? 'blur(10px)' : 'none',
                    transition: 'filter 0.5s ease',
                    overflow: 'hidden'
                }}>
                    <img
                        src={getOptimizedImageUrl(imgItem.url || imgItem.imageUrl || imgItem.thumbnailUrl || (typeof imgItem === 'string' ? imgItem : ''))}
                        srcSet={getImageSrcSet(imgItem)}
                        sizes="(max-width: 500px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        alt={`Showcase generation: ${imgItem.prompt ? imgItem.prompt.slice(0, 50) + "..." : "AI Artwork"}`}
                        loading={index < 8 ? "eager" : "lazy"}
                        onLoad={() => setIsLoaded(true)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            // Add extra blur and fade
                            filter: blurFilter,
                            opacity: isLoaded ? 1 : 0,
                            transition: 'opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s'
                        }}
                    />

                    {/* Admin Moderation Toolbar */}
                    {isAdmin && (
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            zIndex: 40,
                            display: 'flex',
                            gap: '4px'
                        }}>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateNSFWStatus({ ...imgItem, _collection: 'model_showcase_images' }, !isNSFW);
                                }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: isNSFW ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                                title={isNSFW ? "Status: NSFW" : "Status: Safe"}
                            >
                                {isNSFW ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                            </motion.button>
                        </div>
                    )}

                    {/* Restricted Content Cover */}
                    <AnimatePresence>
                        {shouldBlur && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleReveal}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 10,
                                    background: 'rgba(5, 5, 5, 0.4)',
                                    backdropFilter: 'blur(40px) saturate(1.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px',
                                    cursor: 'pointer'
                                }}
                            >
                                {/* Frosted highlight */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%)',
                                    pointerEvents: 'none'
                                }} />

                                <div style={{ position: 'relative', zIndex: 11, textAlign: 'center' }}>
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '50%',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 16px auto',
                                            color: '#ef4444',
                                            boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
                                        }}
                                    >
                                        <Info size={32} />
                                    </motion.div>

                                    <h3 style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.1em', color: 'white', marginBottom: '8px' }}>
                                        RESTRICTED CONTENT
                                    </h3>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '24px', fontWeight: '600' }}>
                                        18+ MATURE AUDIENCES ONLY
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.05, background: '#ef4444', color: 'white' }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                padding: '12px 24px',
                                                borderRadius: '30px',
                                                color: '#ef4444',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                letterSpacing: '0.1em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                                            }}
                                        >
                                            <Eye size={14} /> REVEAL 18+
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Subtle scanning line */}
                                <motion.div
                                    animate={{ top: ['0%', '100%'] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        height: '1px',
                                        background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.5), transparent)',
                                        opacity: 0.3,
                                        pointerEvents: 'none'
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s'
                    }} className="group-hover:opacity-100" />
                </div>
                <div className="image-meta">
                    <div className="meta-badge">SAMPLE_{String(index + 1).padStart(2, '0')}</div>
                </div>
            </div>
        </article>
    );
});
