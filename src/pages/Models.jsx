import React, { useState, useMemo } from 'react';
import SEO from '../components/SEO';
import { useModel } from '../contexts/ModelContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Sparkles, Check } from 'lucide-react';

export default function Models() {
    const { selectedModel, setSelectedModel, availableModels, loading, error } = useModel();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

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

    function handleSelect(model) {
        setSelectedModel(model);
        navigate('/generate');
    }

    if (loading) {
        return (
            <div style={{
                background: 'var(--color-bg)',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)'
            }}>
                <div className="flex-center" style={{ gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--color-accent-primary)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                    LOADING ARCHIVED MODELS...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '16px' }}>Unable to access archives</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                    RETRY CONNECTION
                </button>
            </div>
        );
    }

    return (
        <div style={{
            background: 'var(--color-bg)',
            minHeight: '100vh',
            paddingTop: '140px',
            paddingBottom: '120px',
        }}>
            <SEO
                title="AI Models"
                description="Explore our curated collection of high-performance Stable Diffusion models including SDXL and Flux Pro."
                keywords="stable diffusion models, SDXL, Flux Pro, AI art models"
            />
            <div className="container">

                {/* Header */}
                <header style={{ marginBottom: '80px', maxWidth: '800px' }}>
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--color-accent-primary)',
                        marginBottom: '24px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase'
                    }}>
                        Model Archives
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                        fontWeight: '300',
                        lineHeight: '1.1',
                        letterSpacing: '-0.03em',
                        color: 'var(--color-white)',
                        marginBottom: '24px'
                    }}>
                        Select your <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>creation engine</span>.
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', maxWidth: '600px' }}>
                        Browse our curated collection of fine-tuned Stable Diffusion models. Each engine is specialized for specific artistic styles and generation capabilities.
                    </p>
                </header>

                {/* Controls */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px',
                    marginBottom: '64px',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '24px'
                    }}>
                        {/* Search */}
                        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search models..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'var(--color-bg-subtle)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '100px',
                                    padding: '14px 20px 14px 48px',
                                    color: 'var(--color-white)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-border-hover)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </div>

                        {/* Category List */}
                        <div className="no-scrollbar" style={{
                            display: 'flex',
                            gap: '8px',
                            overflowX: 'auto',
                            paddingBottom: '4px',
                            maxWidth: '100%'
                        }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '100px',
                                        background: activeCategory === cat ? 'var(--color-white)' : 'transparent',
                                        color: activeCategory === cat ? 'var(--color-black)' : 'var(--color-text-muted)',
                                        border: activeCategory === cat ? '1px solid var(--color-white)' : '1px solid var(--color-border)',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
                    gap: '32px',
                }}>
                    {filteredModels.map((model) => {
                        const isSelected = selectedModel?.id === model.id;

                        return (
                            <div
                                key={model.id}
                                className="group"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px'
                                }}
                            >
                                {/* Card Image */}
                                <div
                                    onClick={() => navigate(`/model/${model.id}`)}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '3/2',
                                        borderRadius: 'var(--radius-lg)',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: '1px solid var(--color-border)',
                                        transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
                                    }}
                                    className="model-card-image"
                                >
                                    <img
                                        src={model.image}
                                        alt={model.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
                                        }}
                                        className="model-img"
                                    />

                                    {/* Overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                                        opacity: 0,
                                        transition: 'opacity 0.3s'
                                    }} className="model-overlay" />

                                    {/* Active Badge */}
                                    {isSelected && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            background: 'var(--color-accent-primary)',
                                            color: 'white',
                                            padding: '6px 12px',
                                            borderRadius: '100px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            letterSpacing: '0.05em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                        }}>
                                            <Check size={12} strokeWidth={3} />
                                            ACTIVE
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '500',
                                            color: 'var(--color-white)',
                                            fontFamily: 'var(--font-display)'
                                        }}>
                                            {model.name}
                                        </h3>
                                        <button
                                            onClick={() => handleSelect(model)}
                                            style={{
                                                background: isSelected ? 'var(--color-bg-subtle)' : 'var(--color-white)',
                                                color: isSelected ? 'var(--color-text-muted)' : 'var(--color-black)',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '100px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                cursor: isSelected ? 'default' : 'pointer',
                                                transition: 'transform 0.2s',
                                                opacity: isSelected ? 0.5 : 1
                                            }}
                                            onMouseEnter={(e) => !isSelected && (e.currentTarget.style.transform = 'scale(1.05)')}
                                            onMouseLeave={(e) => !isSelected && (e.currentTarget.style.transform = 'scale(1)')}
                                        >
                                            {isSelected ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                    <p style={{
                                        color: 'var(--color-text-muted)',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5',
                                        marginBottom: '16px',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {model.description}
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {model.tags.slice(0, 3).map(tag => (
                                            <span key={tag} style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-text-dim)',
                                                background: 'var(--color-bg-subtle)',
                                                border: '1px solid var(--color-border)',
                                                padding: '4px 10px',
                                                borderRadius: '4px'
                                            }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredModels.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
                        <Sparkles size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No models found matching your criteria.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            style={{
                                marginTop: '16px',
                                color: 'var(--color-accent-primary)',
                                textDecoration: 'underline',
                                cursor: 'pointer'
                            }}
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .model-card-image:hover {
                    border-color: var(--color-border-hover);
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-4px);
                }
                .model-card-image:hover .model-img {
                    transform: scale(1.05);
                }
                .model-card-image:hover .model-overlay {
                    opacity: 1;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
