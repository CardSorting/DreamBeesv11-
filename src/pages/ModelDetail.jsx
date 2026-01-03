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
        ? [...baseImages, ...baseImages, ...baseImages].slice(0, 12)
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

            <div className="split-layout">
                {/* LEFT PANEL: Sticky Info */}
                <div className="info-panel" style={{
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    width: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 6vw',
                    borderRight: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div className="content-wrapper" style={{ maxWidth: '600px' }}>

                        {/* ID Badge */}
                        <div style={{
                            marginBottom: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            opacity: 0.6
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                background: 'var(--color-accent-primary)',
                                borderRadius: '50%',
                                boxShadow: '0 0 10px var(--color-accent-primary)'
                            }} />
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: '0.2em' }}>
                                MODEL // {model.id.toUpperCase()}
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 style={{
                            fontSize: 'clamp(3rem, 5vw, 5rem)',
                            lineHeight: 1,
                            fontWeight: '300',
                            color: 'white',
                            marginBottom: '32px',
                            letterSpacing: '-0.03em',
                            position: 'relative'
                        }}>
                            <div className="text-reveal-mask">
                                <span style={{ animation: 'revealUp 1s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                                    {model.name}
                                </span>
                            </div>
                        </h1>

                        {/* Description */}
                        <p style={{
                            fontSize: '1.125rem',
                            lineHeight: 1.6,
                            color: '#888',
                            fontFamily: 'var(--font-serif)',
                            marginBottom: '60px',
                            animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both'
                        }}>
                            {model.description}
                        </p>

                        {/* CTAs */}
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            marginBottom: '80px',
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
                                    padding: '24px 48px',
                                    borderRadius: '0',
                                    background: isActive ? 'white' : 'white',
                                    color: 'black',
                                    fontSize: '0.9rem',
                                    letterSpacing: '0.1em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    border: 'none',
                                    cursor: 'none',
                                    transformOrigin: 'left',
                                    transition: 'transform 0.3s'
                                }}
                            >
                                {isActive ? 'ACTIVE' : 'ACTIVATE'} <ArrowUpRight size={18} />
                            </button>
                        </div>

                        {/* Technical Spec Grid */}
                        <div className="specs-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: '32px',
                            animation: 'fadeIn 1.5s ease 0.6s both'
                        }}>
                            <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '32px' }}>
                                <div className="spec-label">RESOLUTION</div>
                                <div className="spec-value">1024x1024</div>
                            </div>
                            <div style={{ paddingLeft: '32px' }}>
                                <div className="spec-label">BASE MODEL</div>
                                <div className="spec-value">SDXL 1.0</div>
                            </div>
                            <div style={{ gridColumn: 'span 2', marginTop: '32px' }}>
                                <div className="spec-label">TAGS</div>
                                <div className="spec-tags">
                                    {model.tags.map(t => (
                                        <span key={t} className="spec-tag">{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT PANEL: Scrollable Feed */}
                <div className="feed-panel" style={{
                    width: '50%',
                    marginLeft: '50%', // Push to right
                    padding: '20vh 4vw 20vh 4vw'
                }}>
                    <div className="masonry-grid">
                        {feedImages.map((imgSrc, index) => (
                            <div
                                key={index}
                                className="masonry-item"
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                                style={{
                                    marginBottom: '40px',
                                    breakInside: 'avoid',
                                    animation: `fadeInUp 1s ease ${0.4 + (index * 0.1)}s both`
                                }}
                            >
                                <div className="image-card">
                                    <div className="image-wrapper">
                                        <img
                                            src={imgSrc}
                                            alt={`Sample ${index}`}
                                            className="feed-image"
                                        />
                                    </div>
                                    <div className="image-meta">
                                        <span className="mono-label">SAMPLE_{String(index + 1).padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .split-layout {
                    display: flex;
                    width: 100%;
                    min-height: 100vh;
                }
                
                .text-reveal-mask { overflow: hidden; }
                
                @keyframes revealUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeInUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .hover-underline {
                    position: relative;
                }
                .hover-underline::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 0;
                    width: 0%;
                    height: 1px;
                    background: white;
                    transition: width 0.3s;
                }
                button:hover .hover-underline::after {
                    width: 100%;
                }

                .spec-label {
                    font-family: monospace;
                    font-size: 0.7rem;
                    color: #555;
                    letter-spacing: 0.15em;
                    margin-bottom: 8px;
                }
                .spec-value {
                    font-size: 1rem;
                    color: #e5e5e5;
                }
                .spec-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .spec-tag {
                    font-family: monospace;
                    font-size: 0.75rem;
                    color: #888;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 4px 12px;
                    border-radius: 100px;
                }

                /* Masonry & Cards */
                .masonry-grid {
                    column-count: 2;
                    column-gap: 40px;
                }
                .image-card {
                    position: relative;
                    cursor: none;
                }
                .image-wrapper {
                    overflow: hidden;
                    margin-bottom: 12px;
                }
                .feed-image {
                    width: 100%;
                    display: block;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s;
                    filter: grayscale(0.2);
                }
                .image-card:hover .feed-image {
                    transform: scale(1.05);
                    filter: grayscale(0);
                }
                .image-meta {
                    opacity: 0.4;
                    transition: opacity 0.3s;
                }
                .image-card:hover .image-meta {
                    opacity: 1;
                }
                .mono-label {
                    font-family: monospace;
                    font-size: 0.7rem;
                    letter-spacing: 0.1em;
                }

                /* Mobile Responsiveness */
                @media (max-width: 1024px) {
                    .split-layout { flex-direction: column; }
                    .info-panel {
                        position: relative;
                        width: 100% !important;
                        height: auto !important;
                        padding: 120px 20px 60px 20px !important;
                        border-right: none !important;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                    }
                    .feed-panel {
                        width: 100% !important;
                        margin-left: 0 !important;
                        padding: 40px 20px !important;
                    }
                    .masonry-grid { column-count: 1; }
                    .custom-cursor { display: none; }
                    .cursor-none { cursor: auto; }
                }
            `}</style>
        </div>
    );
}
