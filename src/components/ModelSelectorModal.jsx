import React, { useState, useEffect } from 'react';
import { Search, X, Check, Sparkles, ImageOff } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils';
import './ModelSelectorModal.css';

export default function ModelSelectorModal({ isOpen, onClose, selectedModel, onSelectModel, models = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [imageErrors, setImageErrors] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 2;

    // Reset search, errors, and page when modal opens/closes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSearchQuery('');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setImageErrors({});
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentPage(1);
            // Lock body scroll
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            // Stop smooth scroll
            if (window.lenis) window.lenis.stop();
        } else {
            // Unlock body scroll
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            // Resume smooth scroll
            if (window.lenis) window.lenis.start();
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();
        };
    }, [isOpen]);

    // Reset to page 1 when search query changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(1);
    }, [searchQuery]);
   

    if (!isOpen) return null;

    // Filter models safely
    const filteredModels = (models || []).filter(model => model.isActive !== false).filter(model => {
        if (!model) return false;
        const nameMatch = model.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const tagMatch = model.tags?.some(tag => tag?.toLowerCase().includes(searchQuery.toLowerCase()));
        return nameMatch || tagMatch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);
    const currentModels = filteredModels.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleSelect = (model) => {
        onSelectModel(model);
        onClose();
    };

    const handleImageError = (modelId) => {
        setImageErrors(prev => ({ ...prev, [modelId]: true }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div
            className="model-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="model-modal">
                {/* Header */}
                <div className="model-modal-header">
                    <div className="model-modal-title">
                        <Sparkles size={20} className="text-accent" />
                        <h2>Choose Model</h2>
                    </div>
                    <button onClick={onClose} className="model-modal-close">
                        <X size={22} />
                    </button>
                </div>

                {/* Search */}
                <div className="model-modal-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Model Grid */}
                <div className="model-modal-grid">
                    {currentModels.length === 0 ? (
                        <div className="model-modal-empty">
                            <Search size={40} strokeWidth={1} style={{ opacity: 0.5 }} />
                            <span>No models found</span>
                            {models.length === 0 && (
                                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>No models available in the list.</span>
                            )}
                        </div>
                    ) : (
                        currentModels.map(model => {
                            const isSelected = selectedModel?.id === model.id;
                            const primaryTag = model.tags?.[0] || 'General';
                            const hasImageError = imageErrors[model.id];
                            const imageUrl = getOptimizedImageUrl(model.image);

                            return (
                                <div
                                    key={model.id}
                                    className={`model-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelect(model)}
                                >
                                    {/* Large Image */}
                                    <div className="model-card-image">
                                        {imageUrl && !hasImageError ? (
                                            <>
                                                {/* Blurred Background Layer */}
                                                <img
                                                    src={imageUrl}
                                                    alt=""
                                                    className="model-card-bg"
                                                    loading="lazy"
                                                    aria-hidden="true"
                                                />
                                                {/* Main Image Layer */}
                                                <img
                                                    src={imageUrl}
                                                    alt={model.name}
                                                    loading="lazy"
                                                    onError={() => handleImageError(model.id)}
                                                    className="model-card-img"
                                                />
                                            </>
                                        ) : (
                                            <div className="model-card-placeholder">
                                                <ImageOff size={24} style={{ opacity: 0.3 }} />
                                            </div>
                                        )}

                                        {/* Selected badge */}
                                        {isSelected && (
                                            <div className="model-card-check">
                                                <Check size={18} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Panel */}
                                    <div className="model-card-info">
                                        <div className="model-card-tag">{primaryTag}</div>
                                        <h3 className="model-card-name">{model.name}</h3>
                                        <p className="model-card-desc">
                                            {model.description?.slice(0, 80) || 'AI image generation model'}
                                            {model.description?.length > 80 ? '...' : ''}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="model-modal-pagination">
                        <button
                            className="pagination-btn"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="pagination-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
