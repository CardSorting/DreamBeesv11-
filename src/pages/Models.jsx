import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useModel } from '../contexts/ModelContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, LayoutGrid, List, SlidersHorizontal, Sparkles, ChevronDown, Info } from 'lucide-react';

// Internal Custom Cursor Component
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

export default function Models() {
    const { selectedModel, setSelectedModel, availableModels, loading, error } = useModel();
    const navigate = useNavigate();
    const [hoveredId, setHoveredId] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [viewMode, setViewMode] = useState('atmospheric'); // 'atmospheric' | 'efficient'
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    // Smooth Scroll / Parallax
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const categories = useMemo(() => {
        const tags = new Set(['All']);
        availableModels.forEach(m => m.tags.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [availableModels]);

    const filteredModels = useMemo(() => {
        return availableModels.filter(model => {
            const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = activeCategory === 'All' || model.tags.includes(activeCategory);
            return matchesSearch && matchesCategory;
        });
    }, [availableModels, searchQuery, activeCategory]);

    const displayedModels = filteredModels.slice(0, page * ITEMS_PER_PAGE);
    const hasMore = displayedModels.length < filteredModels.length;

    function handleSelect(model) {
        setIsTransitioning(true);
        setSelectedModel(model);
        setTimeout(() => navigate('/generate'), 800);
    }

    if (loading) {
        return (
            <div style={{
                background: '#0a0a0a',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontFamily: 'monospace'
            }}>
                <div className="loading-pulse">SYNCING ARCHIVES...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                background: '#0a0a0a',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff4444',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h2 style={{ fontFamily: 'var(--font-serif)' }}>Archive Connection Failed</h2>
                <p style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{error}</p>
                <button onClick={() => window.location.reload()} style={{
                    background: 'white',
                    color: 'black',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '100px',
                    cursor: 'pointer'
                }}>RETRY CONNECTION</button>
            </div>
        );
    }

    return (
        <div
            className="cursor-none"
            style={{
                background: '#0a0a0a',
                minHeight: '100vh',
                paddingTop: '200px',
                paddingBottom: '120px',
                position: 'relative',
                overflow: 'hidden',
                color: '#e5e5e5'
            }}
        >
            <CustomCursor isHovering={!!hoveredId} />
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
                <header style={{ marginBottom: '100px', paddingLeft: '4vw' }}>
                    <div style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'var(--color-accent-primary)',
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        letterSpacing: '0.3em'
                    }} className="text-reveal-mask">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '24px', animationDelay: '0.1s' }}>
                            <span style={{ width: '40px', height: '1px', background: 'currentColor' }}></span>
                            ARCHIVE // COLLECTION
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(3.5rem, 7vw, 8rem)',
                        fontWeight: '300',
                        lineHeight: '1.2',
                        letterSpacing: '-0.02em',
                        color: 'white',
                    }}>
                        <div className="text-reveal-mask">
                            <span style={{ animationDelay: '0.2s', marginRight: '0.3em' }}>Select</span>
                            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', animationDelay: '0.25s' }}>Engine</span>
                        </div>
                    </h1>
                </header>

                {/* Filters & Toggles */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px',
                    marginBottom: '80px',
                    padding: '0 4vw'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '24px'
                    }}>
                        {/* Search */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '400px'
                        }}>
                            <Search size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="text"
                                placeholder="Search archives..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '100px',
                                    padding: '16px 20px 16px 56px',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>

                        {/* View Toggle */}
                        <div style={{
                            display: 'flex',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '6px',
                            borderRadius: '100px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <button
                                onClick={() => setViewMode('atmospheric')}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '100px',
                                    background: viewMode === 'atmospheric' ? 'white' : 'transparent',
                                    color: viewMode === 'atmospheric' ? 'black' : '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <List size={16} /> Atmospheric
                            </button>
                            <button
                                onClick={() => setViewMode('efficient')}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '100px',
                                    background: viewMode === 'efficient' ? 'white' : 'transparent',
                                    color: viewMode === 'efficient' ? 'black' : '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <LayoutGrid size={16} /> Efficient
                            </button>
                        </div>
                    </div>

                    {/* Category Scroll */}
                    <div className="no-scrollbar" style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '10px'
                    }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setActiveCategory(cat); setPage(1); }}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '100px',
                                    background: activeCategory === cat ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.05)',
                                    color: activeCategory === cat ? 'black' : '#888',
                                    border: '1px solid transparent',
                                    fontSize: '0.8rem',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Models List/Grid */}
                {viewMode === 'atmospheric' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '240px' }}>
                        {displayedModels.map((model, index) => {
                            const isEven = index % 2 === 0;
                            const isSelected = selectedModel?.id === model.id;
                            const isHovered = hoveredId === model.id;
                            const parallaxOffset = (scrollY * (isEven ? 0.08 : 0.04)) * -1;

                            return (
                                <div
                                    key={model.id}
                                    onMouseEnter={() => setHoveredId(model.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => navigate(`/model/${model.id}`)}
                                    className="model-row"
                                    style={{
                                        display: 'flex',
                                        justifyContent: isEven ? 'flex-start' : 'flex-end',
                                        padding: isEven ? '0 0 0 6vw' : '0 6vw 0 0',
                                        position: 'relative'
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
                                        <div style={{ position: 'relative' }}>
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
                                                REF_{String(index).padStart(3, '0')} // ID: {model.id.toUpperCase()}
                                            </div>

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

                                        <div style={{ textAlign: isEven ? 'left' : 'right', direction: 'ltr', position: 'relative', zIndex: 2 }}>
                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '24px', color: isSelected ? 'var(--color-accent-primary)' : '#444' }}>
                                                {model.tags[0] || 'GENERATIVE'}
                                            </div>
                                            <h2 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: '300', marginBottom: '32px', color: '#fff', lineHeight: 1 }}>{model.name}</h2>
                                            <p style={{ fontSize: '1.2rem', color: '#888', lineHeight: '1.6', maxWidth: '400px', marginLeft: isEven ? 0 : 'auto', fontFamily: 'var(--font-serif)', marginBottom: '40px' }}>
                                                {model.description}
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelect(model);
                                                }}
                                                className={`btn-outline ${isHovered ? 'active' : ''}`} style={{
                                                    background: isHovered ? 'white' : 'transparent',
                                                    color: isHovered ? 'black' : 'white',
                                                    borderColor: isHovered ? 'white' : 'rgba(255,255,255,0.2)',
                                                    padding: '16px 32px',
                                                    borderRadius: '100px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    transition: 'all 0.3s',
                                                    cursor: 'pointer'
                                                }}>
                                                {isSelected ? 'ACTIVE ENGINE' : 'SELECT MODEL'}
                                                <ArrowRight size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/model/${model.id}`);
                                                }}
                                                className={`btn-outline ${isHovered ? 'active' : ''}`}
                                                style={{
                                                    background: 'transparent',
                                                    color: '#888',
                                                    borderColor: 'rgba(255,255,255,0.1)',
                                                    padding: '16px',
                                                    borderRadius: '50%',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginLeft: '16px',
                                                    transition: 'all 0.3s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888'; }}
                                            >
                                                <Info size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                        gap: '40px',
                        padding: '0 4vw'
                    }}>
                        {displayedModels.map((model, index) => {
                            const isHovered = hoveredId === model.id;
                            const isSelected = selectedModel?.id === model.id;
                            return (
                                <div
                                    key={model.id}
                                    onMouseEnter={() => setHoveredId(model.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => navigate(`/model/${model.id}`)}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isSelected ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.05)'}`,
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                        transform: isHovered ? 'translateY(-8px)' : 'none',
                                        boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.4)' : 'none'
                                    }}
                                >
                                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                                        <img
                                            src={model.image}
                                            alt={model.name}
                                            className="agency-image-filter"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isHovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.8s' }}
                                        />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '8px' }}>
                                            {model.tags.slice(0, 2).map(t => (
                                                <span key={t} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '100px', color: '#ccc' }}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '12px' }}>{model.name}</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#888', lineHeight: '1.5', marginBottom: '24px', height: '3em', overflow: 'hidden' }}>{model.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: isSelected ? 'var(--color-accent-primary)' : '#444' }}>
                                                {isSelected ? 'CURRENTLY ACTIVE' : `REF_${String(index).padStart(3, '0')}`}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelect(model);
                                                }}
                                                style={{
                                                    background: isSelected ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.05)',
                                                    color: isSelected ? 'black' : 'white',
                                                    border: 'none',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}>
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination / Load More */}
                {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '120px' }}>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="discover-more"
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '24px 60px',
                                color: 'white',
                                borderRadius: '100px',
                                fontSize: '1rem',
                                letterSpacing: '0.2em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                transition: 'all 0.4s'
                            }}
                        >
                            <Sparkles size={20} className="shine" />
                            DISCOVER MORE
                            <ChevronDown size={20} />
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .text-reveal-mask { overflow: hidden; }
                .text-reveal-mask span { 
                    display: inline-block;
                    animation: revealUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                
                @keyframes revealUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .discover-more:hover {
                    background: white;
                    color: black;
                    border-color: white;
                    transform: scale(1.05);
                }

                .shine { animation: pulse 2s infinite; }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.5; }
                }

                @media (max-width: 1024px) {
                    .model-row > div { grid-template-columns: 1fr !important; gap: 40px !important; }
                    .custom-cursor { display: none; }
                    .cursor-none { cursor: auto; }
                    .model-row { padding: 0 20px !important; }
                }
            `}</style>
        </div>
    );
}
