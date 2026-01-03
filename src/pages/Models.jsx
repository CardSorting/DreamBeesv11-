import React, { useEffect, useRef, useState } from 'react';
import { useModel } from '../contexts/ModelContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Internal Custom Cursor Component
const CustomCursor = ({ isHovering }) => {
    const cursorRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const moveCursor = (e) => {
            // Standard direct tracking, could add spring physics with a library like react-spring/framer-motion
            // For raw React, let's use a slight requestAnimationFrame lag or direct 
            // Direct is snappier, let's use CSS transition for the "lag" feel
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

export default function Models() {
    const { selectedModel, setSelectedModel, availableModels } = useModel();
    const navigate = useNavigate();
    const [hoveredId, setHoveredId] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Smooth Scroll / Parallax
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    function handleSelect(model) {
        setIsTransitioning(true);
        setSelectedModel(model);
        // Wait for cinematic wipe
        setTimeout(() => navigate('/'), 800);
    }

    return (
        <div
            className="cursor-none"
            style={{
                background: '#0a0a0a',
                minHeight: '100vh',
                paddingTop: '160px',
                paddingBottom: '120px',
                position: 'relative',
                overflow: 'hidden',
                color: '#e5e5e5'
            }}
        >
            <CustomCursor isHovering={!!hoveredId} />

            {/* Cinematic Wipe Overlay */}
            <div className={`cinematic-overlay ${isTransitioning ? 'active' : ''}`} />

            {/* Ambient Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom, #0a0a0a 0%, #111 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div className="container" style={{ maxWidth: '1600px', position: 'relative', zIndex: 1 }}>

                {/* Header with Masked Reveals */}
                <header style={{ marginBottom: '220px', paddingLeft: '4vw' }}>
                    <div style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: '1.2rem',
                        color: '#666',
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px'
                    }} className="text-reveal-mask">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '24px', animationDelay: '0.1s' }}>
                            <span style={{ width: '60px', height: '1px', background: 'currentColor' }}></span>
                            System Ver. 2.0
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(4.5rem, 9vw, 10rem)',
                        fontWeight: '300',
                        lineHeight: '0.85',
                        letterSpacing: '-0.04em',
                        color: 'white',
                        marginLeft: '-6px'
                    }}>
                        <div className="text-reveal-mask">
                            <span style={{ animationDelay: '0.2s' }}>The <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Architecture</span></span>
                        </div>
                        <div className="text-reveal-mask">
                            <span style={{ color: '#333', animationDelay: '0.35s' }}>Collection</span>
                        </div>
                    </h1>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '240px' }}>
                    {availableModels.map((model, index) => {
                        const isEven = index % 2 === 0;
                        const isSelected = selectedModel.id === model.id;
                        const isHovered = hoveredId === model.id;
                        const parallaxOffset = (scrollY * (isEven ? 0.08 : 0.04)) * -1;

                        return (
                            <div
                                key={model.id}
                                onMouseEnter={() => setHoveredId(model.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => handleSelect(model)}
                                className="model-row"
                                style={{
                                    display: 'flex',
                                    justifyContent: isEven ? 'flex-start' : 'flex-end',
                                    padding: isEven ? '0 0 0 6vw' : '0 6vw 0 0',
                                    position: 'relative',
                                    cursor: 'none' // Ensure native pointer is hidden
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    maxWidth: '1200px',
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                                    gap: '80px',
                                    alignItems: 'center',
                                    direction: isEven ? 'ltr' : 'rtl'
                                }}>

                                    {/* Visual Container */}
                                    <div style={{ position: 'relative' }}>
                                        {/* Technical Metadata floating */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '-40px',
                                            left: 0,
                                            fontFamily: 'monospace',
                                            fontSize: '10px',
                                            color: 'var(--color-accent-primary)',
                                            letterSpacing: '0.2em',
                                            opacity: isHovered ? 1 : 0.5,
                                            transition: 'opacity 0.4s'
                                        }}>
                                            ID: {model.id.toUpperCase()} // REF: {index}
                                        </div>

                                        {/* Large Back Number */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '-80px',
                                            left: isEven ? '-60px' : 'auto',
                                            right: isEven ? 'auto' : '-60px',
                                            fontSize: '12rem',
                                            fontFamily: 'var(--font-serif)',
                                            color: '#111',
                                            lineHeight: 1,
                                            zIndex: 0,
                                            pointerEvents: 'none'
                                        }}>
                                            {String(index + 1).padStart(2, '0')}
                                        </div>

                                        <div style={{
                                            aspectRatio: '16/10',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            transform: `translateY(${parallaxOffset}px)`,
                                            transition: 'transform 0.1s linear',
                                            zIndex: 1
                                        }}>
                                            <div className="noise-overlay" />

                                            <img
                                                src={model.image}
                                                alt={model.name}
                                                className="agency-image-filter"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                                                    transition: 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Content Container */}
                                    <div style={{
                                        textAlign: isEven ? 'left' : 'right',
                                        paddingTop: '60px',
                                        direction: 'ltr',
                                        position: 'relative',
                                        zIndex: 2
                                    }}>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.2em',
                                            marginBottom: '24px',
                                            color: isSelected ? 'var(--color-accent-primary)' : '#444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: isEven ? 'flex-start' : 'flex-end',
                                            gap: '12px'
                                        }}>
                                            {model.tags[0] || 'GENERATIVE'}
                                        </div>

                                        <h2 style={{
                                            fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                                            fontWeight: '300',
                                            marginBottom: '32px',
                                            color: '#fff',
                                            lineHeight: 1,
                                            letterSpacing: '-0.02em'
                                        }}>
                                            {model.name}
                                        </h2>

                                        <p style={{
                                            fontSize: '1.25rem',
                                            color: '#888',
                                            lineHeight: '1.5',
                                            maxWidth: '340px',
                                            marginLeft: isEven ? 0 : 'auto',
                                            fontFamily: 'var(--font-serif)',
                                            marginBottom: '40px'
                                        }}>
                                            {model.description}
                                        </p>

                                        {/* Button */}
                                        <button
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                padding: '16px 32px',
                                                color: 'white',
                                                fontSize: '0.9rem',
                                                letterSpacing: '0.1em',
                                                borderRadius: '99px',
                                                cursor: 'none', // handled by custom cursor
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'all 0.3s ease',
                                                backgroundColor: isHovered ? 'white' : 'transparent',
                                                color: isHovered ? 'black' : 'white',
                                                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                                            }}
                                        >
                                            {isSelected ? 'ACTIVE ENGINE' : 'SELECT MODEL'}
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .model-row > div {
                        grid-template-columns: 1fr !important;
                        gap: 40px !important;
                    }
                    .custom-cursor { display: none; }
                    .cursor-none { cursor: auto; }
                    .model-row { padding: 0 20px !important; pointer-events: auto !important; cursor: pointer !important; }
                    button { cursor: pointer !important; }
                }
            `}</style>
        </div>
    );
}
