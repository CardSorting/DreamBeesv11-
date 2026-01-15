import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Sparkles, Heart, X, Check } from 'lucide-react';
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
                setImages([initialImage, ...recs]);
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
            const newRecs = getDiversifiedRecommendations(lastImg, globalShowcaseCache, 10);
            // Filter out existing to prevent duplicates
            const filteredRecs = newRecs.filter(r => !images.some(existing => existing.id === r.id));
            setImages(prev => [...prev, ...filteredRecs]);
        }
    }, [currentIndex, images, currentImage, availableModels, isLiked, toggleLike, navigate, globalShowcaseCache]);

    const model = useMemo(() => {
        if (!currentImage || !availableModels) return null;
        return availableModels.find(m => m.id === currentImage.modelId);
    }, [currentImage, availableModels]);

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
                <div className="card-stack-container">
                    <AnimatePresence mode="popLayout">
                        {images.slice(currentIndex, currentIndex + 3).reverse().map((img, idx) => {
                            const isTop = idx === images.slice(currentIndex, currentIndex + 3).length - 1;
                            return (
                                <SwipeCard
                                    key={img.id}
                                    image={img}
                                    isTop={isTop}
                                    onSwipe={handleSwipe}
                                    modelName={availableModels?.find(m => m.id === img.modelId)?.name}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Info & Actions Overlay (Floating at bottom) */}
                <div className="swipe-info-overlay">
                    <div className="info-content">
                        <div className="info-header">
                            <span className="info-model">{model?.name || 'DreamBees AI'}</span>
                            {currentImage.style?.primary && <span className="info-tag">{currentImage.style.primary}</span>}
                        </div>
                        <p className="info-prompt">"{currentImage.prompt}"</p>
                    </div>

                    <div className="swipe-actions">
                        <button className="swipe-btn dislike" onClick={() => handleSwipe('left')}>
                            <X size={32} />
                        </button>
                        <button className="swipe-btn like" onClick={() => handleSwipe('right')}>
                            <Check size={32} />
                        </button>
                        <button
                            className="swipe-btn remix"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (currentImage.prompt) params.set('prompt', currentImage.prompt);
                                if (currentImage.modelId) params.set('model', currentImage.modelId);
                                navigate(`/generate?${params.toString()}`);
                            }}
                        >
                            <Sparkles size={24} />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const SwipeCard = ({ image, isTop, onSwipe, modelName }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

    // Icon overlays
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const dislikeOpacity = useTransform(x, [-150, -50], [1, 0]);

    const handleDragEnd = (_, info) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    return (
        <motion.div
            className="swipe-card"
            style={{
                x,
                rotate,
                opacity: isTop ? opacity : 1,
                zIndex: isTop ? 10 : 0,
                pointerEvents: isTop ? 'auto' : 'none'
            }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: isTop ? 1 : 0.95, opacity: 1, y: 0 }}
            exit={{ x: x.get() < 0 ? -500 : 500, opacity: 0, transition: { duration: 0.3 } }}
        >
            <img src={getOptimizedImageUrl(image.url)} alt="" className="card-image" />

            {/* Gesture Feedback Overlays */}
            <motion.div className="card-status like" style={{ opacity: likeOpacity }}>
                <Heart fill="#ff3040" color="#ff3040" size={60} />
            </motion.div>
            <motion.div className="card-status dislike" style={{ opacity: dislikeOpacity }}>
                <X color="#fff" size={60} />
            </motion.div>
        </motion.div>
    );
};

export default ShowcaseDetail;
