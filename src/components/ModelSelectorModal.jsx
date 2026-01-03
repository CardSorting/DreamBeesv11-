import React, { useState, useEffect } from 'react';
import { Search, Heart, X, Sparkles, Command } from 'lucide-react';

export default function ModelSelectorModal({ isOpen, onClose, selectedModel, onSelectModel, models }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'favorites'
    const [favorites, setFavorites] = useState([]);

    // Load favorites from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('dreamBees_modelFavorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    // Save favorites to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('dreamBees_modelFavorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (e, modelId) => {
        e.stopPropagation();
        setFavorites(prev => {
            if (prev.includes(modelId)) {
                return prev.filter(id => id !== modelId);
            } else {
                return [...prev, modelId];
            }
        });
    };

    if (!isOpen) return null;

    const filteredModels = models.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        if (activeTab === 'favorites') {
            return matchesSearch && favorites.includes(model.id);
        }
        return matchesSearch;
    });

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(32px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '1200px',
                height: '90vh',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
                animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
                borderRadius: '32px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Background Ambient Glow */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-5%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 0
                }} />

                {/* Header Section */}
                <div style={{
                    padding: '40px 48px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="text-reveal-mask">
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '300', color: 'white', letterSpacing: '-0.04em' }}>
                                <span>Select <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Engine</span></span>
                            </h2>
                        </div>
                        <button onClick={onClose} className="btn-ghost" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={20} color="#fff" />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Search Bar */}
                        <div style={{
                            position: 'relative',
                            flex: 1,
                            minWidth: '300px'
                        }}>
                            <Search size={18} color="#666" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search archives..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 56px',
                                    borderRadius: '100px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                                onClick={() => setActiveTab('all')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '100px',
                                    background: activeTab === 'all' ? 'white' : 'transparent',
                                    color: activeTab === 'all' ? 'black' : '#666',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s'
                                }}
                            >
                                All Models
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '100px',
                                    background: activeTab === 'favorites' ? 'white' : 'transparent',
                                    color: activeTab === 'favorites' ? 'black' : '#666',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <Heart size={14} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} /> Favorites
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div style={{
                    flex: 1,
                    padding: '48px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '40px',
                    alignContent: 'start',
                    zIndex: 1
                }} className="no-scrollbar">
                    {filteredModels.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: '#444' }}>
                            <Command size={48} style={{ opacity: 0.1, marginBottom: '24px' }} />
                            <p style={{ letterSpacing: '0.1em', fontSize: '0.8rem', fontWeight: 'bold' }}>NO MATCHES FOUND IN ARCHIVE</p>
                        </div>
                    ) : filteredModels.map((model, index) => {
                        const isSelected = selectedModel.id === model.id;
                        const isFavorite = favorites.includes(model.id);

                        return (
                            <div
                                key={model.id}
                                onClick={() => {
                                    onSelectModel(model);
                                    onClose();
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isSelected ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.05)'}`,
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative'
                                }}
                                className="group hover-card"
                            >
                                {/* Image Preview */}
                                <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: '#000', position: 'relative' }}>
                                    <div className="noise-overlay" />
                                    <img
                                        src={model.image}
                                        alt={model.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                        className="agency-image-filter hover-scale"
                                    />

                                    {/* Favorite Button */}
                                    <button
                                        onClick={(e) => toggleFavorite(e, model.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.4)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: isFavorite ? '#fff' : 'rgba(255,255,255,0.6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                            zIndex: 2
                                        }}
                                        className="hover:scale-110 active:scale-95"
                                    >
                                        <Heart size={16} fill={isFavorite ? '#fff' : 'none'} color={isFavorite ? 'white' : 'currentColor'} />
                                    </button>

                                    {/* Tech Metadata Overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '16px',
                                        left: '16px',
                                        fontFamily: 'monospace',
                                        fontSize: '9px',
                                        color: 'rgba(255,255,255,0.5)',
                                        letterSpacing: '0.1em',
                                        zIndex: 2,
                                        pointerEvents: 'none'
                                    }}>
                                        REF_{String(index + 1).padStart(3, '0')} // ID: {model.id.toUpperCase()}
                                    </div>

                                    {/* Selection Glow */}
                                    {isSelected && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            border: '2px solid var(--color-accent-primary)',
                                            borderRadius: 'inherit',
                                            pointerEvents: 'none',
                                            zIndex: 3
                                        }} />
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '400', color: 'white', letterSpacing: '-0.02em' }}>{model.name}</h3>
                                        {isSelected && (
                                            <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'var(--color-accent-primary)', letterSpacing: '0.2em', fontWeight: 'bold' }}>ACTIVE</span>
                                        )}
                                    </div>

                                    <p style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.6', flex: 1, fontFamily: 'var(--font-serif)' }}>
                                        {model.description}
                                    </p>

                                    {/* Preview Gallery */}
                                    {model.previewImages && model.previewImages.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#444', letterSpacing: '0.1em' }}>EXAMPLES //</div>
                                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                                                {model.previewImages.map((img, i) => (
                                                    <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                                                        <img
                                                            src={img}
                                                            alt={`Preview ${i}`}
                                                            style={{
                                                                width: '100px',
                                                                height: '100px',
                                                                borderRadius: '12px',
                                                                objectFit: 'cover',
                                                                border: '1px solid rgba(255,255,255,0.05)',
                                                                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                                            }}
                                                            className="hover:scale-105"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {model.tags && model.tags.map(tag => (
                                            <span key={tag} style={{
                                                fontSize: '10px',
                                                padding: '4px 12px',
                                                borderRadius: '100px',
                                                background: 'rgba(255,255,255,0.03)',
                                                color: '#666',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
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
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                .hover-scale { transition: transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) !important; }
                .hover-card:hover .hover-scale { transform: scale(1.05); }
                .hover-card:hover { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.04) !important; transform: translateY(-4px); }
                
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                
                .text-reveal-mask { overflow: hidden; }
                .text-reveal-mask span { 
                    display: inline-block;
                    animation: revealUpModal 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                
                @keyframes revealUpModal {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
