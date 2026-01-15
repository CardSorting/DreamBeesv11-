import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Sparkles, Heart, RefreshCw, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { getOptimizedImageUrl } from '../utils';
import { getDiversifiedRecommendations } from '../utils/relevance';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';
import './ShowcaseDetail.css';

const SHOWCASE_PAGE_SIZE = 10;
const CACHE_TARGET = 100;

const ShowcaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Core Data
    const { globalShowcaseCache, availableModels, getGlobalShowcaseImages, hasMoreGlobal } = useModel();
    const { isLiked, toggleLike } = useUserInteractions();

    // State
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Refs for Scroll & Observation
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const isInitialMount = useRef(true);

    // 1. Initialize Feed (Load initial image + recommendations)
    useEffect(() => {
        const initFeed = async () => {
            if (!isInitialMount.current && images.length > 0) return;
            setLoading(true);

            // Ensure we have some global cache
            if (globalShowcaseCache.length < CACHE_TARGET && hasMoreGlobal) {
                getGlobalShowcaseImages(true, 'showcasedetail_init');
            }

            let startImage = globalShowcaseCache.find(img => img.id === id);

            // If not in cache, fetch directly
            if (!startImage) {
                try {
                    const docRef = doc(db, 'model_showcase_images', id);
                    const snapshot = await getDoc(docRef);
                    if (snapshot.exists()) {
                        startImage = { id: snapshot.id, ...snapshot.data() };
                    }
                } catch (err) {
                    console.error("Error fetching start image:", err);
                }
            }

            if (startImage) {
                // Get varied recommendations
                const recs = getDiversifiedRecommendations(startImage, globalShowcaseCache, SHOWCASE_PAGE_SIZE);
                // Filter out duplicates just in case
                const uniqueRecs = recs.filter(r => r.id !== startImage.id);
                setImages([startImage, ...uniqueRecs]);
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
                        // We use replace to avoid cluttering history stack too much with every scroll
                        navigate(`/discovery/${img.id}`, { replace: true });
                    }

                    // Load more trigger
                    if (index >= images.length - 3 && hasMoreGlobal) {
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


    // 3. Load More Strategy
    const loadMoreImages = useCallback(() => {
        // 1. Identify what we already have
        const currentIds = new Set(images.map(i => i.id));

        // 2. Filter global cache for fresh items, ensuring no ID duplicates in the process
        const uniqueFreshCandidates = new Map();

        globalShowcaseCache.forEach(img => {
            if (!currentIds.has(img.id)) {
                uniqueFreshCandidates.set(img.id, img);
            }
        });

        // 3. Convert to array
        const fresh = Array.from(uniqueFreshCandidates.values());

        if (fresh.length < 5 && hasMoreGlobal) {
            console.log("Fetching more from backend...");
            getGlobalShowcaseImages(true, 'feed_scroll_replenish');
        }

        if (fresh.length > 0) {
            // 4. Shuffle specifically to avoid deterministic "rest of DB" repetition
            // This makes every deep scroll feel unique even with the same cache
            const shuffled = fresh.sort(() => 0.5 - Math.random());

            // 5. Add a chunk
            const nextBatch = shuffled.slice(0, 10);
            setImages(prev => [...prev, ...nextBatch]);
        }
    }, [images, globalShowcaseCache, hasMoreGlobal, getGlobalShowcaseImages]);

    // 4. Aggressive Preloading
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
                title={currentItem ? `${currentItem.prompt?.slice(0, 30)}...` : 'Showcase'}
                description="Infinite AI Art Feed"
                image={currentItem?.url}
            />

            {/* Fixed Nav Header (Transparent overlay) */}
            <header className="feed-nav-header">
                <button onClick={() => navigate('/discovery')} className="nav-back-blur">
                    <ArrowLeft size={20} />
                </button>

                {/* Right side nav items can go here if needed */}
                <div style={{ width: 40 }}></div>
            </header>

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
const FeedItem = React.memo(({ image, index, isActive, isLiked, onToggleLike, modelName, navigate }) => {

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

    return (
        <div className="feed-item" data-index={index}>
            {/* Main Visual */}
            <div className="feed-item-image-wrapper" onClick={handleImageClick}>
                <img
                    src={getOptimizedImageUrl(image.url)}
                    alt={image.prompt}
                    className="feed-image"
                    loading={Math.abs(index - isActive) < 5 ? "eager" : "lazy"} // Aggressively eager load
                    decoding="async"
                />

                {/* Double Tap Heart Animation */}
                {showHeartAnim && (
                    <div className="double-tap-heart animate">
                        <Heart size={80} fill="white" />
                    </div>
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
                    <span className="action-label">{image.likes || 0}</span>
                </div>

                <div className="action-btn-wrapper">
                    <button className="action-btn" onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied!");
                    }}>
                        <Share2 size={24} />
                    </button>
                    <span className="action-label">Share</span>
                </div>

                <div className="action-btn-wrapper">
                    <button className="action-btn" onClick={(e) => {
                        e.stopPropagation();
                        // Info logic or remix could go here
                    }}>
                        <MoreHorizontal size={24} />
                    </button>
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
                        {image.prompt}
                    </p>

                    <div className="tags-row">
                        {image.style && <span className="feed-tag">#{image.style.replace(/\s+/g, '')}</span>}
                        {image.subject && <span className="feed-tag">#{image.subject.replace(/\s+/g, '')}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ShowcaseDetail;
