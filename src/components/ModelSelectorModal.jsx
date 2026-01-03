import React, { useState, useEffect } from 'react';
import { Search, Heart, X, ChevronDown, Sparkles } from 'lucide-react';

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
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
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
                maxWidth: '1000px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                animation: 'fadeIn 0.2s ease-out',
                background: 'linear-gradient(180deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.95) 100%)',
                borderRadius: '24px',
                overflow: 'hidden'
            }}>
                {/* Header Section */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', letterSpacing: '-0.02em' }}>Select Model</h2>
                        <button onClick={onClose} className="btn-ghost" style={{ padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
                            <X size={20} color="#ccc" />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {/* Search Bar */}
                        <div style={{
                            position: 'relative',
                            flex: 1,
                        }}>
                            <Search size={18} color="#666" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search models by name or tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 48px',
                                    borderRadius: '12px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={() => setActiveTab('all')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: activeTab === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: activeTab === 'all' ? 'white' : '#888',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                All Models
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    background: activeTab === 'favorites' ? 'var(--color-accent-primary)' : 'transparent',
                                    color: activeTab === 'favorites' ? 'black' : '#888',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Heart size={14} fill={activeTab === 'favorites' ? 'black' : 'none'} /> Favorites
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div style={{
                    flex: 1,
                    padding: '32px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px',
                    alignContent: 'start'
                }}>
                    {filteredModels.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#666' }}>
                            <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>No models found matching your criteria.</p>
                        </div>
                    ) : filteredModels.map(model => (
                        <div
                            key={model.id}
                            onClick={() => {
                                onSelectModel(model);
                                onClose();
                            }}
                            style={{
                                background: selectedModel.id === model.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                border: selectedModel.id === model.id ? '2px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            className="hover-card group"
                        >
                            {/* Image Preview */}
                            <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#000', position: 'relative' }}>
                                <img src={model.image} alt={model.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} className="hover-scale" />

                                {/* Overlay Gradient */}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />

                                {/* Favorite Button */}
                                <button
                                    onClick={(e) => toggleFavorite(e, model.id)}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        padding: '8px',
                                        borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.4)',
                                        backdropFilter: 'blur(4px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: favorites.includes(model.id) ? '#ff4d4d' : 'white',
                                        transition: 'transform 0.2s'
                                    }}
                                    className="hover:scale-110 active:scale-95"
                                >
                                    <Heart size={16} fill={favorites.includes(model.id) ? '#ff4d4d' : 'none'} />
                                </button>
                            </div>

                            {/* Info */}
                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>{model.name}</h3>
                                    {selectedModel.id === model.id && <div className="pill-badge" style={{ background: 'var(--color-accent-primary)', color: 'black', fontWeight: 'bold' }}>ACTIVE</div>}
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '16px', flex: 1 }}>
                                    {model.description}
                                </p>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {model.tags && model.tags.map(tag => (
                                        <span key={tag} style={{
                                            fontSize: '0.7rem',
                                            padding: '4px 10px',
                                            borderRadius: '100px',
                                            background: 'rgba(255,255,255,0.08)',
                                            color: '#ccc',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
                .hover-scale { transition: transform 0.4s ease; }
                .hover-card:hover .hover-scale { transform: scale(1.05); }
                .hover-card:hover { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.06) !important; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                /* Custom Scrollbar for Modal */
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
}
