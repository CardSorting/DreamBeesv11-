import React, { useState, useEffect } from 'react';
import { Search, Heart, X, Sparkles, Command } from 'lucide-react';
import { useModel } from '../contexts/ModelContext';
import { getOptimizedImageUrl } from '../utils';

export default function ModelSelectorModal({ isOpen, onClose, selectedModel, onSelectModel, models }) {
    const { getShowcaseImages } = useModel();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'favorites'
    const [favorites, setFavorites] = useState([]);

    // The model currently being previewed in the right panel
    const [previewModel, setPreviewModel] = useState(null);

    // Hybrid Strategy: Immediate static previews -> Async detailed showcase
    const [localImages, setLocalImages] = useState([]);



    // Load favorites
    useEffect(() => {
        const stored = localStorage.getItem('dreamBees_modelFavorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) { console.error(e); }
        }
    }, []);

    // Save favorites
    useEffect(() => {
        localStorage.setItem('dreamBees_modelFavorites', JSON.stringify(favorites));
    }, [favorites]);

    // Set initial preview when modal opens
    useEffect(() => {
        if (isOpen && selectedModel) {
            setPreviewModel(selectedModel);
        }
    }, [isOpen, selectedModel]);

    // HYBRID FETCH: Instant Static -> Async Dynamic
    useEffect(() => {
        if (!isOpen || !previewModel) return;

        // 1. Immediate Static Fallback (Instant UI feedback)
        const staticImages = previewModel.previewImages?.map(s => getOptimizedImageUrl(s)) || [];
        setLocalImages(staticImages);

        // 2. Background Fetch for Richest Content
        const loadRichImages = async () => {
            // Only fetch if we want to potentially upgrade to better images
            // or if static images are missing
            const dynamicImages = await getShowcaseImages(previewModel.id);

            if (dynamicImages && dynamicImages.length > 0) {
                // Map and set (Prioritize Showcase if available as it often has better metadata/quality)
                const urls = dynamicImages.map(img => getOptimizedImageUrl(img.imageUrl || img.url));
                setLocalImages(urls);
            }
        };

        loadRichImages();
    }, [previewModel, isOpen]);



    const toggleFavorite = (e, modelId) => {
        e.stopPropagation();
        setFavorites(prev => {
            if (prev.includes(modelId)) return prev.filter(id => id !== modelId);
            return [...prev, modelId];
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

    // Ensure we have a valid preview model even if filtering changes
    const activePreview = previewModel || filteredModels[0] || null;

    const currentImages = localImages;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2vw'
        }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

            <div className="glass-panel" style={{
                width: '100%', maxWidth: '1400px', height: '85vh',
                display: 'flex', overflow: 'hidden', position: 'relative',
                background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)', borderRadius: '24px'
            }}>

                {/* LEFT PANEL: LIST & SEARCH (35%) */}
                <div style={{
                    width: '35%', minWidth: '380px', display: 'flex', flexDirection: 'column',
                    borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)'
                }}>
                    {/* Header / Search */}
                    <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '400', color: 'white' }}>Select Engine</h2>
                            <button onClick={onClose} className="btn-ghost" style={{ padding: '8px' }}><X size={20} /></button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="text"
                                placeholder="Search models..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'white', fontSize: '0.9rem', outline: 'none'
                                }}
                            />
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setActiveTab('all')}
                                style={{
                                    padding: '8px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600',
                                    background: activeTab === 'all' ? 'white' : 'rgba(255,255,255,0.03)',
                                    color: activeTab === 'all' ? 'black' : '#888', transition: 'all 0.2s'
                                }}
                            >
                                All Models
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                style={{
                                    padding: '8px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600',
                                    background: activeTab === 'favorites' ? 'white' : 'rgba(255,255,255,0.03)',
                                    color: activeTab === 'favorites' ? 'black' : '#888', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <Heart size={12} fill={activeTab === 'favorites' ? 'black' : 'none'} /> Favorites
                            </button>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {filteredModels.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
                                <Command size={32} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p style={{ fontSize: '0.8rem' }}>NO MODELS FOUND</p>
                            </div>
                        ) : filteredModels.map(model => {
                            const isActive = activePreview?.id === model.id;
                            const isSel = selectedModel?.id === model.id;
                            const isFav = favorites.includes(model.id);

                            return (
                                <div
                                    key={model.id}
                                    onMouseEnter={() => setPreviewModel(model)}
                                    onClick={() => setPreviewModel(model)}
                                    style={{
                                        padding: '16px', borderRadius: '16px', marginBottom: '8px', cursor: 'pointer',
                                        background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                                        border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                        transition: 'all 0.2s', display: 'flex', gap: '16px', alignItems: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
                                        border: isSel ? '2px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <img src={getOptimizedImageUrl(model.image)} alt={model.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h3 style={{ color: isActive ? 'white' : '#ccc', fontSize: '0.95rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{model.name}</h3>
                                            {isSel && <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-accent-primary)', background: 'rgba(79, 70, 229, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>{model.id.toUpperCase()}</div>
                                    </div>
                                    {isFav && <Heart size={14} fill="white" color="white" style={{ opacity: 0.5 }} />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT PANEL: PREVIEW (65%) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050505', position: 'relative', overflow: 'hidden' }}>
                    {activePreview ? (
                        <>
                            {/* Hero Image Background */}
                            <div key={activePreview.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '70%', zIndex: 0, animation: 'fadeIn 0.5s ease' }}>
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, #050505 100%)', zIndex: 1 }} />
                                <div className="noise-overlay" style={{ opacity: 0.3, zIndex: 1 }} />
                                <div className="noise-overlay" style={{ opacity: 0.3, zIndex: 1 }} />
                                <img
                                    src={getOptimizedImageUrl(activePreview.image)}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'saturate(0.5)' }}
                                />
                            </div>

                            {/* Content Overlay */}
                            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', padding: '48px' }}>
                                <div style={{ flex: 1 }} /> {/* Spacer */}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div className="text-reveal-mask">
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-accent-primary)', fontWeight: 'bold', letterSpacing: '0.2em', marginBottom: '8px', fontFamily: 'monospace' }}>
                                            ENGINE // {activePreview.id.toUpperCase()}
                                        </div>
                                        <h1 style={{ fontSize: '3.5rem', fontWeight: '300', color: 'white', lineHeight: 1 }}>
                                            {activePreview.name}
                                        </h1>
                                    </div>

                                    <p style={{ maxWidth: '600px', fontSize: '1.1rem', color: '#aaa', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
                                        {activePreview.description}
                                    </p>

                                    {/* Action row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
                                        <button
                                            onClick={() => { onSelectModel(activePreview); onClose(); }}
                                            className="btn btn-primary"
                                            style={{ height: '56px', padding: '0 40px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}
                                        >
                                            <Sparkles size={18} />
                                            {selectedModel.id === activePreview.id ? 'Already Selected' : 'Use This Model'}
                                        </button>

                                        <button
                                            onClick={(e) => toggleFavorite(e, activePreview.id)}
                                            style={{
                                                width: '56px', height: '56px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: favorites.includes(activePreview.id) ? '#ef4444' : 'white',
                                                background: 'rgba(255,255,255,0.03)', transition: 'all 0.2s'
                                            }}
                                            className="hover:bg-white/10"
                                        >
                                            <Heart size={24} fill={favorites.includes(activePreview.id) ? 'currentColor' : 'none'} />
                                        </button>
                                    </div>

                                    {/* Preview Gallery (Horizontal) */}
                                    {currentImages.length > 0 && (
                                        <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 'bold' }}>GENERATION SAMPLES</div>
                                            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="no-scrollbar">
                                                {currentImages.map((img, i) => (
                                                    <div key={i} className="group" style={{ position: 'relative', width: '120px', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <img src={getOptimizedImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} className="group-hover:scale-110" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                            <div style={{ textAlign: 'center' }}>
                                <Command size={64} style={{ marginBottom: '24px' }} />
                                <div>SELECT A MODEL TO PREVIEW</div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes revealUpModal {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .text-reveal-mask { overflow: hidden; }
                .text-reveal-mask > * { animation: revealUpModal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
            `}</style>
        </div>
    );
}
