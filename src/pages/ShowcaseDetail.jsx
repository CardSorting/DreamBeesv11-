import React, { useEffect, useState, useMemo, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Sparkles, Heart } from 'lucide-react';

import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { getOptimizedImageUrl } from '../utils';
import { calculateRelevance } from '../utils/relevance';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';
import './ShowcaseDetail.css';

const ShowcaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { globalShowcaseCache, availableModels } = useModel();
    const { isLiked, toggleLike } = useUserInteractions();

    // 0. Synchronous Cache Lookup
    const cachedImage = useMemo(() => {
        return globalShowcaseCache.find(img => img.id === id);
    }, [id, globalShowcaseCache]);

    const [image, setImage] = useState(cachedImage || null);
    const [loading, setLoading] = useState(!cachedImage);
    const [relatedImages, setRelatedImages] = useState([]);

    // 0. Instant Scroll to Top on Route Change
    useLayoutEffect(() => {
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true });
        } else {
            window.scrollTo(0, 0);
            document.documentElement.scrollTo(0, 0);
        }
    }, [id]);

    // Backup scroll/Lenis sync
    useEffect(() => {
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true });
        } else {
            window.scrollTo(0, 0);
        }
    }, [id]);


    // 1. Resolve Image (Cache -> Firestore)
    // Sync cached image update
    useEffect(() => {
        if (cachedImage) {
            setImage(cachedImage);
            setLoading(false);
        }
    }, [cachedImage]);

    // 1. Resolve Image (Firestore Fallback)
    useEffect(() => {
        if (cachedImage || (image && image.id === id)) return;

        const resolveImage = async () => {
            setLoading(true);
            try {
                console.log(`[ShowcaseDetail] Fetching ${id} from Firestore...`);
                // Short delay to allow cache to potentially populate if it's racing? 

                const docRef = doc(db, 'model_showcase_images', id);
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setImage({ id: snapshot.id, ...data });
                } else {
                    console.error("Image not found");
                }
            } catch (err) {
                console.error("Error fetching detail:", err);
            } finally {
                setLoading(false);
            }
        };

        resolveImage();
    }, [id, cachedImage]);

    // 2. Calculate Related Content
    useEffect(() => {
        if (image && globalShowcaseCache.length > 0) {
            const relevant = calculateRelevance(image, globalShowcaseCache, 12);
            setRelatedImages(relevant);
        }
    }, [image, globalShowcaseCache]);

    // 3. Derived Data
    const model = useMemo(() => {
        if (!image || !availableModels) return null;
        return availableModels.find(m => m.id === image.modelId);
    }, [image, availableModels]);

    const liked = image ? isLiked(image.id) : false;

    if (loading) {
        return (
            <div className="showcase-detail-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ opacity: 0.5 }}>Loading masterpiece...</div>
            </div>
        );
    }

    if (!image) return null;

    return (
        <div className="showcase-detail-container">
            <SEO
                title={`${image.prompt ? image.prompt.slice(0, 30) + '...' : 'Showcase'} | DreamBees`}
                description={image.prompt || "AI Generated Art on DreamBees"}
                image={image.url}
            />

            {/* Navigation Bar */}
            <div className="detail-nav">
                <button
                    onClick={() => navigate('/discovery')}
                    className="nav-back-btn"
                >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline">Back to Discovery</span>
                </button>

                <div className="nav-actions">
                    <button className="btn-icon" title="Share" onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                    }}>
                        <Share2 size={20} />
                    </button>
                    {/* Like Button */}
                    <button
                        onClick={() => toggleLike(image, model)}
                        className="btn-like flex items-center"
                    >
                        <Heart
                            size={16}
                            fill={liked ? "#ff3040" : "none"}
                            color={liked ? "#ff3040" : "white"}
                        />
                        <span>{liked ? "Liked" : "Like"}</span>
                    </button>
                </div>
            </div>

            <main className="detail-content-wrapper">

                {/* 1. HERO SECTION (Split View) */}
                <div className="hero-split">

                    {/* Left: Image */}
                    <div className="hero-image-column">
                        <div className="hero-image-container">
                            <img
                                src={getOptimizedImageUrl(image.url)}
                                alt={image.prompt}
                                className="hero-image"
                            />

                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="hero-info-panel">
                        <div>
                            <label className="info-label">PROMPT</label>
                            <p className="prompt-text">
                                "{image.prompt || "An AI generated masterpiece."}"
                            </p>
                        </div>

                        <div className="divider" />

                        <div className="metadata-grid">
                            <div>
                                <label className="info-label">MODEL</label>
                                <div className="metadata-value">{model?.name || 'DreamBees AI'}</div>
                            </div>
                            <div>
                                <label className="info-label">DIMENSIONS</label>
                                <div className="metadata-value">{image.width} x {image.height}</div>
                            </div>

                            {image.style?.primary && (
                                <div>
                                    <label className="info-label">STYLE</label>
                                    <div className="pill-style">{image.style.primary}</div>
                                </div>
                            )}

                            {image.colors?.paletteName && (
                                <div>
                                    <label className="info-label">PALETTE</label>
                                    <div className="metadata-value flex items-center gap-2">
                                        <span className="text-sm">{image.colors.paletteName}</span>
                                        <div className="palette-swatches">
                                            {image.colors.dominant?.map((c, i) => (
                                                <div key={i} className="swatch" style={{ background: c }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Call to Action */}
                        <div className="create-card">
                            <h4 className="create-title">
                                <Sparkles size={16} />
                                Create with this Style
                            </h4>
                            <p className="create-desc">
                                Use {model?.name || 'this model'} to generate your own variations.
                            </p>
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    if (image.prompt) params.set('prompt', image.prompt);
                                    if (image.modelId) params.set('model', image.modelId);
                                    navigate(`/generate?${params.toString()}`);
                                }}
                                className="btn-primary-action"
                            >
                                Remix in Studio
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. RELATED CONTENT GRID */}
                {relatedImages.length > 0 && (
                    <section className="related-section">
                        <div className="related-header">
                            <Sparkles className="text-purple-400" size={20} />
                            <h2 className="related-title">Related Discoveries</h2>
                        </div>

                        <div className="related-grid">
                            {relatedImages.map((item, i) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        navigate(`/discovery/${item.id}`);
                                    }}
                                    className="related-item group"
                                >
                                    <img
                                        src={getOptimizedImageUrl(item.thumbnailUrl || item.url)}
                                        loading="lazy"
                                        alt={item.prompt}
                                        className="related-thumb"
                                    />
                                    <div className="related-overlay">
                                        <p className="related-prompt">
                                            {item.prompt}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
};

export default ShowcaseDetail;
