import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { ArrowLeft, Check, Sparkles, Zap, Aperture, Hash, Layers } from 'lucide-react';

const CustomCursor = ({ isHovering }) => {
    const cursorRef = useRef(null);
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
            } else {
                // navigate('/models'); // Optional: redirect if not found
            }
        }
    }, [id, availableModels, navigate]);

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
    const previewImages = model.previewImages || Array(6).fill(model.image); // Fallback

    return (
        <div className="cursor-none" style={{ background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', position: 'relative' }}>
            <CustomCursor isHovering={isHovering} />

            {/* Ambient Background - reusing from Models.jsx for consistency */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom, #050505 0%, #0a0a0a 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: '120px' }}>

                {/* Navigation */}
                <div style={{
                    position: 'fixed',
                    top: '100px',
                    left: '4vw',
                    zIndex: 50,
                    opacity: scrollY > 50 ? 0 : 1,
                    transition: 'opacity 0.3s',
                    pointerEvents: scrollY > 50 ? 'none' : 'auto'
                }}>
                    <button
                        onClick={() => navigate('/models')}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '0.8rem',
                            letterSpacing: '0.1em',
                            cursor: 'none'
                        }}
                    >
                        <ArrowLeft size={16} /> BACK TO ARCHIVE
                    </button>
                </div>

                {/* Hero Section */}
                <div style={{
                    paddingTop: '180px',
                    marginBottom: '120px',
                    paddingLeft: '4vw',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
                    gap: '60px'
                }}>
                    <div className="hero-content">
                        <div className="text-reveal-mask" style={{ marginBottom: '24px' }}>
                            <span style={{
                                animation: 'revealUp 1s cubic-bezier(0.16, 1, 0.3, 1) both',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '16px',
                                fontFamily: 'monospace',
                                color: 'var(--color-accent-primary)',
                                fontSize: '0.8rem',
                                letterSpacing: '0.2em'
                            }}>
                                <span style={{ width: '20px', height: '1px', background: 'currentColor' }}></span>
                                {model.id.toUpperCase()}
                            </span>
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(3.5rem, 6vw, 7rem)',
                            lineHeight: 0.9,
                            fontWeight: '300',
                            color: 'white',
                            marginBottom: '40px',
                            marginLeft: '-4px'
                        }}>
                            <div className="text-reveal-mask">
                                <span style={{ animation: 'revealUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
                                    {model.name}
                                </span>
                            </div>
                        </h1>

                        <p style={{
                            fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
                            lineHeight: 1.6,
                            color: '#888',
                            maxWidth: '600px',
                            fontFamily: 'var(--font-serif)',
                            marginBottom: '60px',
                            animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both'
                        }}>
                            {model.description}
                        </p>

                        <div
                            style={{ animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                        >
                            <button
                                onClick={() => {
                                    setSelectedModel(model);
                                    setTimeout(() => navigate('/generate'), 500);
                                }}
                                className={`btn-primary ${isActive ? 'active-engine' : ''}`}
                                disabled={isActive}
                                style={{
                                    background: isActive ? 'var(--color-accent-primary)' : 'white',
                                    color: 'black',
                                    border: 'none',
                                    padding: '18px 40px',
                                    borderRadius: '100px',
                                    fontSize: '0.9rem',
                                    letterSpacing: '0.1em',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: isActive ? 'default' : 'none',
                                    opacity: isActive ? 0.8 : 1,
                                    transform: isHovering && !isActive ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                {isActive ? <Check size={18} /> : <Zap size={18} fill="currentColor" />}
                                {isActive ? 'ENGINE ACTIVE' : 'ACTIVATE ENGINE'}
                            </button>
                        </div>
                    </div>

                    {/* Metadata Side Panel */}
                    <div style={{
                        paddingTop: '30px',
                        animation: 'fadeIn 1.5s ease 0.5s both'
                    }}>
                        <div className="metadata-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '40px 20px',
                            borderLeft: '1px solid rgba(255,255,255,0.1)',
                            paddingLeft: '40px'
                        }}>
                            <div className="meta-item">
                                <div className="meta-label"><Layers size={14} /> TYPE</div>
                                <div className="meta-value">Diffusion v2</div>
                            </div>
                            <div className="meta-item">
                                <div className="meta-label"><Aperture size={14} /> RESOLUTION</div>
                                <div className="meta-value">1024x1024 Native</div>
                            </div>
                            <div className="meta-item" style={{ gridColumn: 'span 2' }}>
                                <div className="meta-label"><Hash size={14} /> KEYWORDS</div>
                                <div className="meta-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                    {model.tags.map(tag => (
                                        <span key={tag} style={{
                                            fontSize: '0.75rem',
                                            color: '#999',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '6px 14px',
                                            borderRadius: '100px'
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Masonry Feed */}
                <div className="feed-section" style={{ padding: '0 4vw' }}>
                    <div style={{
                        marginBottom: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        opacity: 0.6
                    }}>
                        <div style={{ width: '40px', height: '1px', background: 'white' }}></div>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: '0.2em' }}>GENERATED SAMPLES</span>
                    </div>

                    <div className="masonry-grid">
                        {previewImages.map((imgSrc, index) => (
                            <div
                                key={index}
                                className="masonry-item"
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                                style={{
                                    marginBottom: '30px',
                                    breakInside: 'avoid',
                                    cursor: 'none',
                                    animation: `fadeInUp 1s ease ${0.2 + (index * 0.1)}s both`
                                }}
                            >
                                <div style={{
                                    position: 'relative',
                                    borderRadius: '4px', // Tighter radius for agency feel
                                    overflow: 'hidden',
                                    background: '#111'
                                }}>
                                    <img
                                        src={imgSrc}
                                        alt={`Sample ${index}`}
                                        style={{
                                            width: '100%',
                                            display: 'block',
                                            transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                                            filter: 'grayscale(0.2) contrast(1.1)'
                                        }}
                                        className="feed-image"
                                    />
                                    <div className="hover-overlay" style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                                        opacity: 0,
                                        transition: 'opacity 0.3s',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        padding: '24px'
                                    }}>
                                        <div style={{ transform: 'translateY(10px)', transition: 'transform 0.3s' }} className="overlay-content">
                                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'white', letterSpacing: '0.2em' }}>SAMPLE_0{index + 1}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <style>{`
                .text-reveal-mask { 
                    overflow: hidden; 
                }
                
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

                .meta-label {
                    font-family: monospace;
                    font-size: 0.7rem;
                    color: #555;
                    letter-spacing: 0.15em;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .meta-value {
                    font-size: 1rem;
                    color: #ccc;
                    font-weight: 300;
                }

                .masonry-grid {
                    column-count: 3;
                    column-gap: 30px;
                }

                .feed-image:hover {
                    transform: scale(1.03) !important;
                    filter: grayscale(0) contrast(1) !important;
                }

                .masonry-item:hover .hover-overlay {
                    opacity: 1 !important;
                }
                
                .masonry-item:hover .overlay-content {
                    transform: translateY(0) !important;
                }

                @media (max-width: 1200px) {
                    .masonry-grid { column-count: 2; }
                }

                @media (max-width: 768px) {
                    .hero-content h1 { font-size: 3.5rem !important; }
                    .masonry-grid { column-count: 1; }
                    .custom-cursor { display: none; }
                    .cursor-none { cursor: auto; }
                    .metadata-grid { border-left: none !important; padding-left: 0 !important; margin-top: 40px; }
                    div[style*="minmax(0, 1.2fr)"] { grid-template-columns: 1fr !important; gap: 0 !important; }
                }
            `}</style>
        </div>
    );
}
