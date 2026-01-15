import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Sparkles, Heart, X, Check, Shuffle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { getOptimizedImageUrl } from '../utils';
import { getDiversifiedRecommendations } from '../utils/relevance';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';
import './ShowcaseDetail.css';

const ShowcaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { globalShowcaseCache, availableModels } = useModel();
    const { isLiked, toggleLike } = useUserInteractions();

    const [images, setImages] = useState([]); // Card stack
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [shuffleKey, setShuffleKey] = useState(0); // For triggering shuffle animation
    const [shuffleToast, setShuffleToast] = useState(null); // Toast notification
    const [isShuffling, setIsShuffling] = useState(false); // Animation state
    const longPressTimer = useRef(null);
    const isLongPress = useRef(false);
    const seenCardIds = useRef(new Set()); // Track ALL cards ever shown to ensure fresh shuffles


    // Current active image
    const currentImage = images[currentIndex] || null;

    // Resolve Initial Stack
    useEffect(() => {
        const resolveInitialStack = async () => {
            setLoading(true);
            let initialImage = globalShowcaseCache.find(img => img.id === id);

            if (!initialImage) {
                try {
                    const docRef = doc(db, 'model_showcase_images', id);
                    const snapshot = await getDoc(docRef);
                    if (snapshot.exists()) {
                        initialImage = { id: snapshot.id, ...snapshot.data() };
                    }
                } catch (err) {
                    console.error("Error fetching initial image:", err);
                }
            }

            if (initialImage) {
                const recs = getDiversifiedRecommendations(initialImage, globalShowcaseCache, 15);
                const allCards = [initialImage, ...recs];

                // Track all initially loaded cards as "seen"
                allCards.forEach(card => seenCardIds.current.add(card.id));

                setImages(allCards);
            }
            setLoading(false);
        };

        resolveInitialStack();
    }, [id, globalShowcaseCache]);

    // Handle Swipe
    const handleSwipe = useCallback((direction) => {
        if (!currentImage) return;

        // Visual feedback or interaction logic (e.g., auto-like on right swipe)
        if (direction === 'right') {
            const model = availableModels?.find(m => m.id === currentImage.modelId);
            if (!isLiked(currentImage.id)) {
                toggleLike(currentImage, model);
            }
        }

        // Move to next card
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        // Update URL to current card for deep linking
        if (images[nextIndex]) {
            navigate(`/discovery/${images[nextIndex].id}`, { replace: true });
        }

        // Replenish stack if running low
        if (images.length - nextIndex < 5) {
            const lastImg = images[images.length - 1];
            // Get fresh pool excluding ALL seen cards
            const freshPool = globalShowcaseCache.filter(img => !seenCardIds.current.has(img.id));
            const newRecs = getDiversifiedRecommendations(lastImg, freshPool, 10);

            // Track new cards as seen
            newRecs.forEach(card => seenCardIds.current.add(card.id));

            setImages(prev => [...prev, ...newRecs]);
        }
    }, [currentIndex, images, currentImage, availableModels, isLiked, toggleLike, navigate, globalShowcaseCache]);

    // Helper: Show toast notification
    const showToast = useCallback((message, icon = 'shuffle') => {
        setShuffleToast({ message, icon });
        setTimeout(() => setShuffleToast(null), 2000);
    }, []);

    // Helper: Trigger shuffle animation
    const triggerShuffleAnimation = useCallback(() => {
        setIsShuffling(true);
        setShuffleKey(k => k + 1);
        setTimeout(() => setIsShuffling(false), 500);
    }, []);

    // Helper: Get truly random cards from pool (ignoring relevance)
    const getRandomCards = useCallback((pool, count) => {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }, []);

    // Regular shuffle - REPLACE upcoming cards with NEW semi-relevant cards
    const handleShuffle = useCallback(() => {
        if (!currentImage || globalShowcaseCache.length === 0) {
            showToast('No cards available!', 'info');
            return;
        }

        // Get fresh pool excluding ALL ever-seen cards
        const freshPool = globalShowcaseCache.filter(img => !seenCardIds.current.has(img.id));

        if (freshPool.length < 3) {
            // If running low on fresh cards, just reorder what we have
            setImages(prev => {
                const history = prev.slice(0, currentIndex + 1);
                const upcoming = prev.slice(currentIndex + 1);
                for (let i = upcoming.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
                }
                return [...history, ...upcoming];
            });
            triggerShuffleAnimation();
            showToast('Reordered remaining cards', 'shuffle');
            return;
        }

        // Get NEW semi-relevant cards (70% relevant, 30% random)
        const relevantCount = Math.min(Math.floor(15 * 0.7), freshPool.length);
        const randomCount = Math.min(15 - relevantCount, freshPool.length - relevantCount);

        const relevantCards = getDiversifiedRecommendations(currentImage, freshPool, relevantCount);
        const remainingPool = freshPool.filter(img => !relevantCards.some(r => r.id === img.id));
        const randomCards = getRandomCards(remainingPool, randomCount);

        const newCards = [...relevantCards, ...randomCards].sort(() => Math.random() - 0.5);

        // Track these new cards as seen
        newCards.forEach(card => seenCardIds.current.add(card.id));

        setImages(prev => {
            const history = prev.slice(0, currentIndex + 1);
            return [...history, ...newCards];
        });

        triggerShuffleAnimation();
        showToast(`${newCards.length} fresh cards loaded!`, 'shuffle');
    }, [currentImage, currentIndex, globalShowcaseCache, showToast, triggerShuffleAnimation, getRandomCards]);

    // Super shuffle - Get COMPLETELY RANDOM cards (total wildcard mode)
    const handleSuperShuffle = useCallback(() => {
        if (!currentImage || globalShowcaseCache.length === 0) {
            showToast('No cards available!', 'info');
            return;
        }

        setIsShuffling(true);

        // Get ONLY unseen cards
        const freshPool = globalShowcaseCache.filter(img => !seenCardIds.current.has(img.id));

        if (freshPool.length < 3) {
            showToast('You\'ve seen most cards! Try Discovery.', 'info');
            setTimeout(() => setIsShuffling(false), 500);
            return;
        }

        // PURE random selection - ignore all relevance scoring
        const randomCards = getRandomCards(freshPool, 20);

        // Track these as seen
        randomCards.forEach(card => seenCardIds.current.add(card.id));

        setImages(prev => {
            const history = prev.slice(0, currentIndex + 1);
            return [...history, ...randomCards];
        });

        triggerShuffleAnimation();
        showToast(`🔀 Wild mix! ${randomCards.length} random cards`, 'refresh');

        setTimeout(() => setIsShuffling(false), 500);
    }, [currentImage, currentIndex, globalShowcaseCache, showToast, triggerShuffleAnimation, getRandomCards]);

    // Long press handlers for super shuffle
    const handleShuffleMouseDown = useCallback(() => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            handleSuperShuffle();
        }, 600); // 600ms for long press
    }, [handleSuperShuffle]);

    const handleShuffleMouseUp = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
        if (!isLongPress.current) {
            handleShuffle();
        }
    }, [handleShuffle]);

    const handleShuffleMouseLeave = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    }, []);

    // Determine if shuffle is possible (are there fresh cards in the cache?)
    const freshPoolSize = globalShowcaseCache.filter(img => !seenCardIds.current.has(img.id)).length;
    const canShuffle = freshPoolSize >= 3 || (images.length - currentIndex - 1 > 1);

    const liked = currentImage ? isLiked(currentImage.id) : false;

    if (loading && images.length === 0) {
        return (
            <div className="showcase-detail-container swipe-mode" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="discovery-loader">
                    <Sparkles className="animate-pulse text-purple-500" size={48} />
                    <p>Fetching masterpieces...</p>
                </div>
            </div>
        );
    }

    if (!currentImage) {
        return (
            <div className="showcase-detail-container swipe-mode flex flex-col items-center justify-center p-8 text-center">
                <Sparkles size={48} className="text-purple-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">End of the Hive</h2>
                <p className="text-gray-400 mb-6">You've explored everything in this stream.</p>
                <button onClick={() => navigate('/discovery')} className="btn-primary-action" style={{ maxWidth: '200px' }}>
                    Reset Discovery
                </button>
            </div>
        );
    }

    return (
        <div className="showcase-detail-container swipe-mode">
            <SEO
                title={`${currentImage.prompt ? currentImage.prompt.slice(0, 30) + '...' : 'Showcase'} | DreamBees`}
                description={currentImage.prompt || "AI Generated Art on DreamBees"}
                image={currentImage.url}
            />

            {/* Background Blur */}
            <div className="bg-blur-container">
                <img src={currentImage.url} alt="" className="active-bg-blur" />
            </div>

            {/* Navigation Bar */}
            <div className="detail-nav transparent">
                <button onClick={() => navigate('/discovery')} className="nav-back-btn">
                    <ArrowLeft size={20} />
                </button>

                <div className="nav-actions">
                    <button className="btn-icon" onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied!");
                    }}>
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            <main className="swipe-main">
                <div className={`card-stack-container ${isShuffling ? 'shuffling' : ''}`} key={`stack-${shuffleKey}`}>
                    <AnimatePresence mode="popLayout">
                        {images.slice(currentIndex, currentIndex + 4).reverse().map((img, idx, array) => {
                            const isTop = idx === array.length - 1;
                            const stackPosition = array.length - 1 - idx;
                            return (
                                <SwipeCard
                                    key={img.id}
                                    image={img}
                                    isTop={isTop}
                                    stackPosition={stackPosition}
                                    onSwipe={handleSwipe}
                                    modelName={availableModels?.find(m => m.id === img.modelId)?.name}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Shuffle Toast Notification */}
                <AnimatePresence>
                    {shuffleToast && (
                        <motion.div
                            className="shuffle-toast"
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {shuffleToast.icon === 'shuffle' && <Shuffle size={18} />}
                            {shuffleToast.icon === 'refresh' && <RefreshCw size={18} />}
                            {shuffleToast.icon === 'info' && <Sparkles size={18} />}
                            <span>{shuffleToast.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info & Actions Overlay (Floating at bottom) */}
                <div className="swipe-info-overlay">


                    <div className="swipe-actions">
                        <button className="swipe-btn dislike" onClick={() => handleSwipe('left')}>
                            <X size={32} />
                        </button>

                        <button
                            className={`swipe-btn shuffle ${!canShuffle ? 'disabled' : ''}`}
                            onMouseDown={handleShuffleMouseDown}
                            onMouseUp={handleShuffleMouseUp}
                            onMouseLeave={handleShuffleMouseLeave}
                            onTouchStart={handleShuffleMouseDown}
                            onTouchEnd={handleShuffleMouseUp}
                            style={{
                                backgroundColor: isShuffling ? '#6366f1' : '#2a2a2a',
                                color: '#fff',
                                opacity: canShuffle ? 1 : 0.5,
                                transition: 'all 0.3s ease'
                            }}
                            title="Tap for new cards • Hold for random mix"
                        >
                            <motion.div
                                key={shuffleKey}
                                animate={{
                                    rotate: shuffleKey > 0 ? 360 : 0,
                                    scale: isShuffling ? [1, 1.2, 1] : 1
                                }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <Shuffle size={24} />
                            </motion.div>
                        </button>

                        <button className="swipe-btn like" onClick={() => handleSwipe('right')}>
                            <Check size={32} />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const SwipeCard = ({ image, isTop, stackPosition, onSwipe, modelName }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 300], [-30, 30]);

    // Stamp Animations
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const likeScale = useTransform(x, [50, 150], [0.5, 1.2]);
    const likeRotate = useTransform(x, [50, 150], [15, -15]);

    const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
    const nopeScale = useTransform(x, [-150, -50], [1.2, 0.5]);
    const nopeRotate = useTransform(x, [-150, -50], [15, -15]);

    const handleDragEnd = (_, info) => {
        const threshold = 120;
        if (info.offset.x > threshold) {
            onSwipe('right');
        } else if (info.offset.x < -threshold) {
            onSwipe('left');
        }
    };

    const springConfig = { stiffness: 300, damping: 30, restDelta: 0.001 };

    return (
        <motion.div
            className="swipe-card"
            style={{
                x,
                rotate,
                zIndex: 10 - stackPosition,
                pointerEvents: isTop ? 'auto' : 'none'
            }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{
                scale: 1 - (stackPosition * 0.05),
                y: stackPosition * 10,
                opacity: 1,
            }}
            transition={springConfig}
            exit={{
                x: x.get() < 0 ? -600 : 600,
                rotate: x.get() < 0 ? -45 : 45,
                opacity: 0,
                transition: { duration: 0.4, ease: "easeIn" }
            }}
        >
            <div className="card-visual-wrapper">
                <img
                    src={getOptimizedImageUrl(image.url)}
                    alt=""
                    className="card-image"
                    draggable="false"
                />
                <div className="card-vignette" />
                <div className="card-inner-glow" />
            </div>

            {/* Expressive Stamp Overlays */}
            <motion.div
                className="stamp stamp-like"
                style={{ opacity: likeOpacity, scale: likeScale, rotate: likeRotate }}
            >
                LIKE
            </motion.div>

            <motion.div
                className="stamp stamp-nope"
                style={{ opacity: nopeOpacity, scale: nopeScale, rotate: nopeRotate }}
            >
                NOPE
            </motion.div>
        </motion.div>
    );
};

export default ShowcaseDetail;
