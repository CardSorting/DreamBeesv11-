import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { ArrowLeft, Check, Sparkles, Zap, Aperture, Hash, Layers, ArrowUpRight, X, Download, Copy, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CustomCursor = ({ isHovering }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const moveCursor = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, []);

    return (
        <div
            className={`custom-cursor ${isHovering ? 'hovering' : ''}`}
            style={{
                left: position.x,
                top: position.y
            }}
        />
    );
};

const ShowcaseModal = ({ image, onClose, model }) => {
    const { rateShowcaseImage } = useModel();
    if (!image) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'var(--color-bg)',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {/* Top Bar */}
            <div style={{
                height: '60px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', background: 'var(--color-bg)'
            }}>
                <button
                    onClick={onClose}
                    className="flex-center"
                    style={{ gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowLeft size={16} /> Back to Gallery
                </button>

                <div className="flex-center" style={{ gap: '12px' }}>
                    <button
                        onClick={async () => {
                            try {
                                const imageUrl = getOptimizedImageUrl(image.url || image);
                                const response = await fetch(imageUrl);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `db-showcase.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                            } catch (e) {
                                console.error("Download failed", e);
                                window.open(image.url || image, '_blank');
                            }
                        }}
                        className="btn-ghost"
                        title="Download"
                    >
                        <Download size={18} />
                    </button>
                    <button onClick={onClose} className="btn-ghost" title="Close" style={{ marginLeft: '12px' }}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Split Layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Image View */}
                <div style={{
                    flex: 1,
                    background: '#050505',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '40px',
                    position: 'relative'
                }}>
                    <img
                        src={getOptimizedImageUrl(image.url || image)}
                        alt="Showcase Detail"
                        style={{
                            maxWidth: '100%', maxHeight: '100%',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {/* Info Panel */}
                <div style={{
                    width: '400px',
                    borderLeft: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    overflowY: 'auto',
                    padding: '32px'
                }}>
                    <div style={{ marginBottom: '40px' }}>
                        <label className="meta-label">PROMPT</label>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'white', fontWeight: '400', fontStyle: 'italic', opacity: 0.8 }}>
                            {image.prompt ? `"${image.prompt}"` : `"This is a curated showcase generation demonstrating the capabilities of ${model?.name || 'this model'}. High-fidelity details and texture handling are key characteristics shown here."`}
                        </p>
                    </div>

                    {/* Ranking UI */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                        <button
                            onClick={() => {
                                const newRating = image.rating === 1 ? 0 : 1;
                                rateShowcaseImage(image.id, newRating, model.id);
                                // Optimistically update local image object if needed, or rely on parent re-render
                            }}
                            className={`btn-ghost ${image.rating === 1 ? 'active-vote' : ''}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                color: image.rating === 1 ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                background: image.rating === 1 ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                padding: '8px 16px', borderRadius: '100px', border: '1px solid transparent',
                                borderColor: image.rating === 1 ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                        >
                            <ThumbsUp size={16} fill={image.rating === 1 ? "currentColor" : "none"} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Helpful</span>
                        </button>

                        <button
                            onClick={() => {
                                const newRating = image.rating === -1 ? 0 : -1;
                                rateShowcaseImage(image.id, newRating, model.id);
                            }}
                            className={`btn-ghost ${image.rating === -1 ? 'active-vote' : ''}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                color: image.rating === -1 ? '#ef4444' : 'var(--color-text-muted)',
                                background: image.rating === -1 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                padding: '8px 16px', borderRadius: '100px', border: '1px solid transparent',
                                borderColor: image.rating === -1 ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                        >
                            <ThumbsDown size={16} fill={image.rating === -1 ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 0 40px 0' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 12px' }}>
                        <div>
                            <label className="meta-label">MODEL</label>
                            <div className="meta-value">{model?.name || 'Unknown'}</div>
                        </div>
                        <div>
                            <label className="meta-label">BASE</label>
                            <div className="meta-value">SDXL 1.0</div>
                        </div>
                        <div>
                            <label className="meta-label">CREATOR</label>
                            <div className="meta-value">{image.creator || 'Unknown'}</div>
                        </div>
                        <div>
                            <label className="meta-label">SOURCE</label>
                            <div className="meta-value">Official Showcase</div>
                        </div>
                        <div>
                            <label className="meta-label">STEPS</label>
                            <div className="meta-value">{image.steps || 30}</div>
                        </div>
                        <div>
                            <label className="meta-label">GUIDANCE</label>
                            <div className="meta-value">{image.cfg || 7.0}</div>
                        </div>
                        <div>
                            <label className="meta-label">DIMENSIONS</label>
                            <div className="meta-value">{image.width && image.height ? `${image.width}x${image.height}` : '1024x1024'}</div>
                        </div>
                        <div>
                            <label className="meta-label">SCHEDULER</label>
                            <div className="meta-value">{image.scheduler || 'DPM++ 2M'}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '60px' }}>
                        <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)]">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Sparkles size={14} className="text-[var(--color-accent-primary)]" />
                                INSPIRED?
                            </h4>
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                Activate this model engine to generate similar high-quality results.
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    const params = new URLSearchParams();
                                    if (image.prompt) params.set('prompt', image.prompt);
                                    if (image.steps) params.set('steps', image.steps);
                                    if (image.cfg) params.set('cfg', image.cfg);
                                    if (image.aspectRatio) params.set('aspectRatio', image.aspectRatio);

                                    navigate(`/generate?${params.toString()}`);
                                }}
                                className="btn btn-outline w-full justify-center text-xs"
                            >
                                START CREATING
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                .meta-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: var(--color-text-dim);
                    text-transform: uppercase;
                    display: block;
                    margin-bottom: 8px;
                }
                .meta-value {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default function ModelDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { availableModels, setSelectedModel, selectedModel } = useModel();
    const [model, setModel] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [showcaseImages, setShowcaseImages] = useState([]);
    const [activeShowcaseImage, setActiveShowcaseImage] = useState(null);

    useEffect(() => {
        if (availableModels.length > 0) {
            const found = availableModels.find(m => m.id === id);
            if (found) {
                setModel(found);
            }
        }
    }, [id, availableModels]);

    // Fetch or Seed Showcase Images
    const { getShowcaseImages } = useModel();

    useEffect(() => {
        if (!model) return;

        const loadShowcase = async () => {
            try {
                // 1. Try to get from Cache / Firestore via Context
                const cachedImages = await getShowcaseImages(model.id);

                let hasValidData = false;
                if (cachedImages && cachedImages.length > 0) {
                    const dbImages = cachedImages.map(doc => ({
                        url: getOptimizedImageUrl(doc.imageUrl || doc.url), // Handle consistency and CDN
                        prompt: doc.prompt,
                        name: doc.name,
                        creator: doc.creator,
                        steps: doc.steps,
                        cfg: doc.cfg,
                        width: doc.width,
                        height: doc.height,
                        scheduler: doc.scheduler,
                        aspectRatio: doc.aspectRatio,
                        rating: doc.rating,
                        id: doc.id
                    }));

                    // Check if we have prompts (rich metadata)
                    const hasPrompts = dbImages.some(img => img.prompt);

                    if (hasPrompts) {
                        // DB is good, use it
                        const displayImages = dbImages.length < 6
                            ? [...dbImages, ...dbImages, ...dbImages].slice(0, 15)
                            : dbImages;
                        setShowcaseImages(displayImages);
                        hasValidData = true;
                    }
                }

                if (!hasValidData) {
                    // DB empty OR stale (no prompts). Try manifest.
                    // SEEDING: Check for local showcase manifest or migrate previewImages
                    console.log('Seeding/Updating showcase images for', model.id);
                    let seeds = [];

                    try {
                        const manifestRes = await fetch(`/showcase/${model.id}/manifest.json`);
                        if (manifestRes.ok) {
                            seeds = await manifestRes.json();
                            console.log('Found local showcase manifest:', seeds);
                        }
                    } catch (e) {
                        console.log('No local manifest found, using previewImages');
                    }

                    // Normalize seeds to objects if they are strings
                    let normalizedSeeds = seeds.map(s => typeof s === 'string' ? { url: s } : s);

                    if (normalizedSeeds.length === 0) {
                        const previews = model.previewImages || [model.image];
                        normalizedSeeds = previews.map(s => ({ url: getOptimizedImageUrl(s) }));
                    }

                    // Optimistically set UI
                    const displaySeeds = normalizedSeeds.length < 6
                        ? [...normalizedSeeds, ...normalizedSeeds, ...normalizedSeeds].slice(0, 15)
                        : normalizedSeeds;
                    setShowcaseImages(displaySeeds);

                    // Only write to DB if we truly had nothing (cachedImages empty) to avoid duplicates if just updating
                    if (!cachedImages || cachedImages.length === 0) {
                        const validSeeds = normalizedSeeds.filter(item => item && item.url && typeof item.url === 'string' && item.url.length > 5);
                        validSeeds.forEach(async (item) => {
                            await addDoc(collection(db, 'model_showcase_images'), {
                                modelId: model.id,
                                imageUrl: getOptimizedImageUrl(item.url),
                                prompt: item.prompt || null,
                                name: item.name || null,
                                creator: item.creator || 'Gemini Pro 3', // Default creator for new seeds
                                steps: item.steps || null,
                                cfg: item.cfg || null,
                                width: item.width || null,
                                height: item.height || null,
                                scheduler: item.scheduler || null,
                                aspectRatio: item.aspectRatio || null,
                                createdAt: serverTimestamp(),
                                isCurated: true
                            });
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching showcase:", error);
                // Fallback
                const previews = model.previewImages || [model.image];
                setShowcaseImages(previews.map(s => ({ url: getOptimizedImageUrl(s) })));
            }
        };

        loadShowcase();
    }, [model]);

    const [sortBy, setSortBy] = useState('TOP_RATED'); // 'TOP_RATED' | 'LATEST'

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!model) {
        return (
            <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                <div className="loading-pulse">LOADING...</div>
            </div>
        );
    }

    const isActive = selectedModel?.id === model.id;
    // Use the fetched showcase images, defaulting to empty array until loaded to prevent flash
    const rawImages = showcaseImages.length > 0 ? showcaseImages : (model.previewImages?.map(s => (typeof s === 'string' ? { url: s } : s)) || []);

    // Strict Filtering: Only show Official (Gemini Pro 3) images
    // Sorting: Based on sortBy state
    const imagesToRender = rawImages
        .filter(img => {
            // Ensure valid image
            if (!img || !img.url || typeof img.url !== 'string' || img.url.length <= 5) return false;
            // Strict Filter: Allow only official content or manually curated
            // Checks for 'Gemini Pro 3' OR if 'isCurated' flag is explicitly true
            return (img.creator === 'Gemini Pro 3' || img.isCurated === true);
        })
        .sort((a, b) => {
            if (sortBy === 'TOP_RATED') {
                return (b.rating || 0) - (a.rating || 0);
            } else {
                // Latest - Fallback to index if no date, assuming newer are appended/fetched last? 
                // Actually Firestore 'createdAt' might be object, handling that safely:
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            }
        });

    return (
        <div className="cursor-none" style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', position: 'relative' }}>
            <CustomCursor isHovering={isHovering} />

            {/* Global Noise Overlay */}
            <div className="noise-overlay" style={{ position: 'fixed', opacity: 0.03, pointerEvents: 'none', zIndex: 100 }} />

            {/* Back Navigation (Fixed) */}
            <div style={{
                position: 'fixed',
                top: '40px',
                left: '40px',
                zIndex: 50,
                mixBlendMode: 'difference'
            }}>
                <button
                    onClick={() => navigate('/models')}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
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
            </div>

            <div className="pinterest-layout">

                {/* HERO SECTION - Centered */}
                <div className="hero-section" style={{
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
                                MODEL // {model.id.toUpperCase()}
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
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
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
                                    cursor: 'none',
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
                </div>


                {/* Sorting Tabs */}
                <div className="tabs-container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '40px',
                    animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both'
                }}>
                    <button
                        onClick={() => setSortBy('TOP_RATED')}
                        className={`tab-btn ${sortBy === 'TOP_RATED' ? 'active' : ''}`}
                    >
                        TOP RATED
                    </button>
                    <button
                        onClick={() => setSortBy('LATEST')}
                        className={`tab-btn ${sortBy === 'LATEST' ? 'active' : ''}`}
                    >
                        LATEST
                    </button>
                </div>

                {/* FULL MASONRY FEED */}
                <div className="pinterest-feed" style={{
                    padding: '0 2vw 120px 2vw',
                    animation: 'fadeIn 1.5s ease 0.4s both'
                }}>
                    <div className="masonry-grid">
                        {imagesToRender.map((imgItem, index) => {
                            // Pseudo-random aspect ratio based on index
                            // 0: Square (1/1), 1: Portrait (2/3), 2: Square, 3: Tall (9/16), 4: Landscape (4/3) 
                            const ratios = ['1/1', '3/4', '1/1', '2/3', '4/3', '1/1', '3/5'];
                            const ratio = ratios[index % ratios.length];

                            return (
                                <div
                                    key={index}
                                    className="masonry-item"
                                    onClick={() => setActiveShowcaseImage(imgItem)}
                                    onMouseEnter={() => setIsHovering(true)}
                                    onMouseLeave={() => setIsHovering(false)}
                                    style={{
                                        animation: `fadeInUp 1s ease ${0.1 + (Math.random() * 0.5)}s both`
                                    }}
                                >
                                    <div className="image-card">
                                        <div className="image-wrapper" style={{ aspectRatio: ratio }}>
                                            <img
                                                src={getOptimizedImageUrl(imgItem.url || imgItem)}
                                                alt={`Sample ${index}`}
                                                className="feed-image"
                                            />
                                        </div>
                                        <div className="image-meta">
                                            <div className="meta-badge">SAMPLE_{String(index + 1).padStart(2, '0')}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Lightbox Modal */}
                {activeShowcaseImage && (
                    <ShowcaseModal
                        image={activeShowcaseImage}
                        model={model}
                        onClose={() => setActiveShowcaseImage(null)}
                    />
                )}

            </div>

            <style>{`
                .text-reveal-mask { overflow: hidden; }
                
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
                    cursor: none;
                    border-radius: 2px; /* Sharp corners */
                    overflow: hidden;
                    background: #111;
                    /* Ensure container respects aspect ratio wrapper */
                }
                .image-wrapper {
                    overflow: hidden;
                    position: relative;
                    width: 100%;
                }
                .feed-image {
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s;
                    filter: grayscale(0.2);
                }
                .image-card:hover .feed-image {
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
            `}</style>
        </div >
    );
}
