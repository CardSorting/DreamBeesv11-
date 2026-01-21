import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Sparkles, Heart, RefreshCw, MoreHorizontal, Shuffle, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { getOptimizedImageUrl } from '../utils';
import {
    getDiversifiedRecommendations,
    getRecommendationsWithHistory,
    getExplorationRecommendations,
    getBalancedRecommendations
} from '../utils/relevance';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { slugify } from '../utils/urlHelpers';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import './ShowcaseDetail.css';

const SHOWCASE_PAGE_SIZE = 12;
const CACHE_TARGET = 150;
const HISTORY_CAP = 100; // Max history items to track

const ShowcaseDetail = () => {
    const { id: rawId } = useParams();
    // Support robust ID extraction: 
    // 1. Double hyphen separator (new standard) 
    // 2. Single hyphen separator (legacy)
    // 3. Fallback to rawId
    const id = useMemo(() => {
        if (!rawId) return null;
        if (rawId.includes('--')) return rawId.split('--').pop();
        if (rawId.includes('-')) return rawId.split('-').pop();
        return rawId;
    }, [rawId]);
    const navigate = useNavigate();

    // Core Data
    const { globalShowcaseCache, availableModels, getGlobalShowcaseImages, hasMoreGlobal } = useModel();
    const { isLiked, toggleLike, hidePost, isHidden } = useUserInteractions();

    // State
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shuffleToast, setShuffleToast] = useState(null);

    // Filter hidden images from global cache initially but keep local management
    const visibleGlobalCache = useMemo(() => globalShowcaseCache.filter(img => !isHidden(img.id)), [globalShowcaseCache, isHidden]);

    // Track seen images to avoid repetition
    const seenIdsRef = useRef(new Set());

    // Refs for Scroll & Observation
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const isInitialMount = useRef(true);
    const currentImageRef = useRef(null);

    // Keep track of the current source image for recommendations
    const sourceImage = useMemo(() => images[currentIndex], [images, currentIndex]);

    // Helper to show toast notifications
    const showToast = useCallback((message, icon = 'shuffle') => {
        setShuffleToast({ message, icon });
        setTimeout(() => setShuffleToast(null), 2500);
    }, []);

    // 1. Initialize Feed (Load initial image + recommendations)
    useEffect(() => {
        const initFeed = async () => {
            if (!isInitialMount.current && images.length > 0) return;
            setLoading(true);

            // Ensure we have some global cache
            if (visibleGlobalCache.length < CACHE_TARGET && hasMoreGlobal) {
                getGlobalShowcaseImages(true, 'showcasedetail_init');
            }

            let startImage = visibleGlobalCache.find(img => img.id === id || img.id === rawId);

            // If not in cache, fetch directly (Try both extracted id and full rawId)
            if (!startImage) {
                const tryIds = [rawId];
                if (id && id !== rawId) tryIds.push(id);

                for (const targetId of tryIds) {
                    try {
                        // 1. Try official showcase
                        const showcaseRef = doc(db, 'model_showcase_images', targetId);
                        const showcaseSnap = await getDoc(showcaseRef);

                        if (showcaseSnap.exists()) {
                            startImage = { id: showcaseSnap.id, ...showcaseSnap.data() };
                            break;
                        } else {
                            // 2. Try user generations (if public)
                            const generationRef = doc(db, 'generations', targetId);
                            const generationSnap = await getDoc(generationRef);

                            if (generationSnap.exists()) {
                                const data = generationSnap.data();
                                if (data.isPublic) {
                                    startImage = { id: generationSnap.id, ...data };
                                    break;
                                }
                            }
                        }
                    } catch (err) {
                        // Only log non-permission errors (permission errors are expected for private/non-existent images)
                        if (err.code !== 'permission-denied') {
                            console.error(`Error fetching image for ID ${targetId}:`, err);
                        }
                    }
                }
            }

            if (startImage) {
                // Track the start image as seen
                seenIdsRef.current.add(startImage.id);

                // Get highly diversified recommendations using the enhanced algorithm
                const recs = getDiversifiedRecommendations(startImage, visibleGlobalCache, SHOWCASE_PAGE_SIZE);

                // Track all initial recs as seen
                recs.forEach(r => seenIdsRef.current.add(r.id));

                // Filter out duplicates just in case
                const uniqueRecs = recs.filter(r => r.id !== startImage.id);
                setImages([startImage, ...uniqueRecs]);

                // Store reference to current image for recommendations
                currentImageRef.current = startImage;
            }

            setLoading(false);
            isInitialMount.current = false;
        };

        initFeed();
    }, [id, globalShowcaseCache, hasMoreGlobal, getGlobalShowcaseImages]);


    // 2. Intersection Observer for Current Index & URL Update
    useEffect(() => {
        const options = {
            root: containerRef.current,
            threshold: 0.6, // Item is "active" when 60% visible
        };

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.dataset.index);
                    setCurrentIndex(index);

                    // Update URL silently (replace) without full reload
                    const img = images[index];
                    if (img && img.id !== id) {
                        const slug = slugify(img.prompt?.slice(0, 40) || 'artwork');
                        navigate(`/discovery/${slug}--${img.id}`, { replace: true });

                        // Mark as seen
                        seenIdsRef.current.add(img.id);

                        // Update current reference for future recs
                        currentImageRef.current = img;
                    }

                    // Load more trigger - only when near end
                    if (index >= images.length - 4 && hasMoreGlobal) {
                        loadMoreImages();
                    }
                }
            });
        }, options);

        // Subscribing to elements
        const elements = document.querySelectorAll('.feed-item');
        elements.forEach(el => observerRef.current.observe(el));

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [images, id, navigate, hasMoreGlobal]);


    // 3. Load More Strategy - Now with history awareness
    const loadMoreImages = useCallback(() => {
        if (!currentImageRef.current) return;

        // Get seen IDs array (capped to avoid memory issues)
        const seenArray = Array.from(seenIdsRef.current).slice(-HISTORY_CAP);

        // Use history-aware recommendations for truly fresh content
        const freshRecs = getRecommendationsWithHistory(
            currentImageRef.current,
            visibleGlobalCache,
            seenArray,
            SHOWCASE_PAGE_SIZE
        );

        if (freshRecs.length === 0 && hasMoreGlobal) {
            console.log("[Feed] Cache exhausted, fetching more...");
            getGlobalShowcaseImages(true, 'feed_scroll_replenish');
            return;
        }

        if (freshRecs.length > 0) {
            // Track new items as seen
            freshRecs.forEach(r => seenIdsRef.current.add(r.id));

            // Filter to ensure no duplicates in current feed
            const currentIds = new Set(images.map(i => i.id));
            const trulyNew = freshRecs.filter(r => !currentIds.has(r.id));

            if (trulyNew.length > 0) {
                setImages(prev => [...prev, ...trulyNew]);
            } else if (hasMoreGlobal) {
                // All recs are duplicates, need more from backend
                getGlobalShowcaseImages(true, 'feed_unique_fetch');
            }
        }
    }, [images, globalShowcaseCache, hasMoreGlobal, getGlobalShowcaseImages]);


    // 4. Shuffle Action - Complete feed refresh with exploration mode
    const handleShuffle = useCallback(() => {
        if (!currentImageRef.current || globalShowcaseCache.length === 0) return;

        // Get current seen history
        const seenArray = Array.from(seenIdsRef.current);

        // First, try to get fresh exploration recommendations
        const explorationPicks = getExplorationRecommendations(
            visibleGlobalCache,
            SHOWCASE_PAGE_SIZE,
            seenArray
        );

        if (explorationPicks.length < 3) {
            // Not enough fresh content
            showToast("🔄 Loading fresh content...", "refresh");
            if (hasMoreGlobal) {
                getGlobalShowcaseImages(true, 'shuffle_fetch');
            }
            return;
        }

        // Track new items
        explorationPicks.forEach(r => seenIdsRef.current.add(r.id));

        // Keep current image, replace everything after with exploration
        const currentImg = images[currentIndex];
        setImages([currentImg, ...explorationPicks]);
        setCurrentIndex(0);

        // Scroll to top
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }

        showToast(`🎲 ${explorationPicks.length} fresh picks!`, "shuffle");
    }, [currentIndex, images, globalShowcaseCache, hasMoreGlobal, getGlobalShowcaseImages, showToast]);


    // 5. Balanced Mode - More similar but still diverse
    const handleMoreLikeThis = useCallback(() => {
        if (!currentImageRef.current || globalShowcaseCache.length === 0) return;

        const seenArray = Array.from(seenIdsRef.current);
        const unseen = visibleGlobalCache.filter(c => !seenIdsRef.current.has(c.id));

        // Use balanced recommendations with stricter similarity
        const similarPicks = getBalancedRecommendations(
            currentImageRef.current,
            unseen,
            {
                limit: SHOWCASE_PAGE_SIZE,
                maxSameModel: 3,  // Allow more from same model
                maxSamePrimaryStyle: 5,  // Allow more similar styles
                maxSameMood: 4,
            }
        );

        if (similarPicks.length < 3) {
            showToast("🔍 Finding more similar...", "search");
            if (hasMoreGlobal) {
                getGlobalShowcaseImages(true, 'similar_fetch');
            }
            return;
        }

        // Track new items
        similarPicks.forEach(r => seenIdsRef.current.add(r.id));

        // Keep current, add similar after
        const currentImg = images[currentIndex];
        setImages([currentImg, ...similarPicks]);
        setCurrentIndex(0);

        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }

        showToast(`✨ ${similarPicks.length} similar picks!`, "sparkles");
    }, [currentIndex, images, globalShowcaseCache, hasMoreGlobal, getGlobalShowcaseImages, showToast]);


    // 6. Aggressive Preloading
    useEffect(() => {
        if (!images.length) return;

        // Preload next 10 images
        const nextImages = images.slice(currentIndex + 1, currentIndex + 11);
        nextImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = getOptimizedImageUrl(img.url);
            document.head.appendChild(link);

            const i = new Image();
            i.src = getOptimizedImageUrl(img.url);
        });
    }, [currentIndex, images]);


    // 7. Trim history to prevent memory bloat
    useEffect(() => {
        if (seenIdsRef.current.size > HISTORY_CAP * 2) {
            const arr = Array.from(seenIdsRef.current);
            seenIdsRef.current = new Set(arr.slice(-HISTORY_CAP));
        }
    }, [images]);


    // Loading State
    if (loading && images.length === 0) {
        return (
            <div className="showcase-detail-container vertical-feed-mode flex flex-col items-center justify-center">
                <div className="loading-spinner-container">
                    <Sparkles className="animate-pulse text-purple-500" size={32} />
                    <p className="ml-3 text-gray-400">Loading feed...</p>
                </div>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="showcase-detail-container vertical-feed-mode flex flex-col items-center justify-center p-8 text-center">
                <Sparkles size={48} className="text-purple-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">End of the Hive</h2>
                <button onClick={() => navigate('/discovery')} className="btn-primary-action mt-4">
                    Back to Discovery
                </button>
            </div>
        );
    }

    const currentItem = images[currentIndex];

    return (
        <div className="showcase-detail-container vertical-feed-mode">
            <SEO
                title={currentItem ? `${currentItem.prompt?.slice(0, 50)}... | Discovery - DreamBees` : 'Showcase | Discovery - DreamBees'}
                description={currentItem ? `AI-generated artwork: "${currentItem.prompt}". Explore more creative designs on DreamBees.` : "Infinite AI Art Feed - Explore community-generated masterpieces."}
                image={currentItem ? (currentItem.url || currentItem.imageUrl) : undefined}
                canonical={currentItem ? `/discovery/${slugify(currentItem.prompt?.slice(0, 40) || 'artwork')}--${currentItem.id}` : `/discovery/${id}`}
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "VisualArtwork",
                            "name": currentItem ? (currentItem.prompt?.slice(0, 60) || "AI Artwork") : "AI Artwork",
                            "description": currentItem?.prompt || "AI-generated artwork on DreamBees.",
                            "image": currentItem ? (currentItem.url || currentItem.imageUrl) : undefined,
                            "creator": {
                                "@type": "Organization",
                                "name": "DreamBeesAI"
                            },
                            "artworkSurface": "Digital",
                            "artMedium": "AI Generated"
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Discover", "item": "https://dreambeesai.com/discovery" },
                                { "@type": "ListItem", "position": 3, "name": "Artwork", "item": `https://dreambeesai.com/discovery/${currentItem ? slugify(currentItem.prompt?.slice(0, 40) || 'artwork') + '-' + currentItem.id : id}` }
                            ]
                        }
                    ]
                }}
            />

            {/* Fixed Nav Header (Transparent overlay) */}
            <header className="feed-nav-header">
                <button onClick={() => navigate('/discovery')} className="nav-back-blur">
                    <ArrowLeft size={20} />
                </button>

                {/* Shuffle Button */}
                <button
                    onClick={handleShuffle}
                    className="nav-shuffle-btn"
                    title="Shuffle feed for fresh content"
                >
                    <Shuffle size={18} />
                </button>
            </header>

            {/* Toast Notification */}
            <AnimatePresence>
                {shuffleToast && (
                    <motion.div
                        className="shuffle-toast"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                    >
                        {shuffleToast.icon === 'shuffle' && <Shuffle size={18} />}
                        {shuffleToast.icon === 'refresh' && <RefreshCw size={18} className="animate-spin" />}
                        {shuffleToast.icon === 'sparkles' && <Sparkles size={18} />}
                        <span>{shuffleToast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scroll Container */}
            <div
                className="vertical-feed-scroll-container"
                ref={containerRef}
            >
                {images.map((img, idx) => (
                    <FeedItem
                        key={`${img.id}-${idx}`}
                        image={img}
                        index={idx}
                        isActive={idx === currentIndex}
                        isLiked={isLiked(img.id)}
                        onToggleLike={() => {
                            const model = availableModels?.find(m => m.id === img.modelId);
                            toggleLike(img, model);
                        }}
                        onHide={() => {
                            hidePost(img);
                            // Remove from local list to animate out/snap to next
                            setImages(prev => prev.filter(i => i.id !== img.id));
                        }}
                        onMoreLikeThis={handleMoreLikeThis}
                        modelName={availableModels?.find(m => m.id === img.modelId)?.name}
                        navigate={navigate}
                    />
                ))}

                {/* Loader at bottom */}
                <div className="feed-end-message">
                    {hasMoreGlobal ? (
                        <div className="loading-spinner-container">
                            <RefreshCw className="animate-spin text-purple-500" size={24} />
                        </div>
                    ) : (
                        <div className="p-8 text-center opacity-50">
                            <p>You've seen it all!</p>
                            <button onClick={() => navigate('/discovery')} className="mt-4 underline">Reset</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// Sub-component for individual feed pages
const FeedItem = React.memo(({ image, index, isActive, isLiked, onToggleLike, onHide, onMoreLikeThis, modelName, navigate }) => {
    // Generate deterministic slug for this specific item
    const currentSlug = slugify(image.prompt?.slice(0, 40) || 'artwork');
    const deterministicUrl = `${window.location.origin}/discovery/${currentSlug}-${image.id}`;

    // Double tap logic
    const lastTap = useRef(0);
    const [showHeartAnim, setShowHeartAnim] = useState(false);

    const handleImageClick = (e) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            // Double tap detected
            if (!isLiked) onToggleLike();
            setShowHeartAnim(true);
            setTimeout(() => setShowHeartAnim(false), 1000);
        }
        lastTap.current = now;
    };

    // Extract display tags from the V2 metadata schema
    const displayTags = useMemo(() => {
        const tags = [];

        // Style primary
        if (image.style?.primary) {
            tags.push({ label: image.style.primary, type: 'style' });
        }

        // Vibe mood
        if (image.vibe?.mood) {
            tags.push({ label: image.vibe.mood, type: 'mood' });
        }

        // Subject category
        if (image.subject?.category) {
            tags.push({ label: image.subject.category, type: 'subject' });
        }

        // Style sub-genre
        if (image.style?.subGenre) {
            tags.push({ label: image.style.subGenre, type: 'genre' });
        }

        // Limit to 4 tags max
        return tags.slice(0, 4);
    }, [image]);

    return (
        <div className="feed-item" data-index={index}>
            {/* Main Visual */}
            <div className="feed-item-image-wrapper" onClick={handleImageClick}>
                <img
                    src={getOptimizedImageUrl(image.url)}
                    alt={image.prompt}
                    className="feed-image"
                    loading={Math.abs(index - isActive) < 5 ? "eager" : "lazy"}
                    decoding="async"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        // Optional: You could also set e.target.src to a placeholder
                    }}
                />

                {/* Double Tap Heart Animation */}
                {showHeartAnim && (
                    <motion.div
                        className="double-tap-heart"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <Heart size={80} fill="white" />
                    </motion.div>
                )}

                {/* Overlays */}
                <div className="feed-top-gradient" />
                <div className="feed-overlay-gradient" />
            </div>

            {/* Right Action Sidebar */}
            <div className="feed-actions-sidebar">
                <div className="action-btn-wrapper">
                    <button className={`action-btn ${isLiked ? 'active' : ''}`} onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike();
                    }}>
                        <Heart size={26} className={isLiked ? 'fill-current' : ''} />
                    </button>
                    <span className="action-label">{image.likesCount || image.likes || 0}</span>
                </div>

                <div className="action-btn-wrapper">
                    <button className="action-btn" onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(deterministicUrl);
                        toast.success("Link copied!");
                    }}>
                        <Share2 size={24} />
                    </button>
                    <span className="action-label">Share</span>
                </div>

                <div className="action-btn-wrapper">
                    <button className="action-btn" onClick={(e) => {
                        e.stopPropagation();
                        onMoreLikeThis?.();
                    }} title="More like this">
                        <Sparkles size={24} />
                    </button>
                    <span className="action-label">Similar</span>
                </div>

                <div className="action-btn-wrapper">
                    <button className="action-btn" onClick={(e) => {
                        e.stopPropagation();
                        onHide?.();
                    }} title="Hide this post">
                        <Flag size={24} />
                    </button>
                    <span className="action-label">Hide</span>
                </div>
            </div>

            {/* Bottom Info Area */}
            <div className="feed-info-area">
                <div className="feed-info-content">
                    {modelName && (
                        <div className="model-pill" onClick={() => navigate(`/model/${image.modelId}`)}>
                            @{modelName}
                        </div>
                    )}

                    <p className="prompt-text">
                        {image.prompt || image.subject?.details || 'AI Generated Art'}
                    </p>

                    {/* Enhanced Tags Display */}
                    <div className="tags-row">
                        {displayTags.map((tag, i) => (
                            <span
                                key={`${tag.label}-${i}`}
                                className={`feed-tag feed-tag-${tag.type}`}
                            >
                                #{tag.label.replace(/\s+/g, '')}
                            </span>
                        ))}

                        {/* Color palette indicator */}
                        {image.colors?.dominant && (
                            <div className="palette-dots">
                                {(image.colors?.dominant || []).slice(0, 3).map((color, i) => (
                                    <span
                                        key={i}
                                        className="palette-dot"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ShowcaseDetail;
