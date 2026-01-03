import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { ArrowLeft, Check, Sparkles, Zap, Aperture, Hash, Layers, ArrowUpRight } from 'lucide-react';

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

export default function ModelDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { availableModels, setSelectedModel, selectedModel } = useModel();
    const [model, setModel] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        if (availableModels.length > 0) {
            const found = availableModels.find(m => m.id === id);
            if (found) {
                setModel(found);
            }
        }
    }, [id, availableModels]);

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
    // Ensure we have enough images for a feed
    const baseImages = model.previewImages || [model.image];
    // Create a larger set for the feed impression if needed
    const feedImages = baseImages.length < 6
        ? [...baseImages, ...baseImages, ...baseImages].slice(0, 15)
        : baseImages;

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

                {/* FULL MASONRY FEED */}
                <div className="pinterest-feed" style={{
                    padding: '0 2vw 120px 2vw',
                    animation: 'fadeIn 1.5s ease 0.4s both'
                }}>
                    <div className="masonry-grid">
                        {feedImages.map((imgSrc, index) => {
                            // Pseudo-random aspect ratio based on index
                            // 0: Square (1/1), 1: Portrait (2/3), 2: Square, 3: Tall (9/16), 4: Landscape (4/3) 
                            const ratios = ['1/1', '3/4', '1/1', '2/3', '4/3', '1/1', '3/5'];
                            const ratio = ratios[index % ratios.length];

                            return (
                                <div
                                    key={index}
                                    className="masonry-item"
                                    onMouseEnter={() => setIsHovering(true)}
                                    onMouseLeave={() => setIsHovering(false)}
                                    style={{
                                        animation: `fadeInUp 1s ease ${0.1 + (Math.random() * 0.5)}s both`
                                    }}
                                >
                                    <div className="image-card">
                                        <div className="image-wrapper" style={{ aspectRatio: ratio }}>
                                            <img
                                                src={imgSrc}
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
            `}</style>
        </div>
    );
}
