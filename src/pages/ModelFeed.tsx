import React, { useMemo, useState } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconZap, IconChevronLeft, IconChevronRight } from '../icons';
import { AnimatePresence, motion } from 'framer-motion';

export default function ModelFeed() {
    const { availableModels, setSelectedModel, selectedModel } = useLite();
    const [currentIndex, setCurrentIndex] = useState(0);

    const filteredModels = useMemo(() => {
        const base = availableModels.filter(m => 
            !m.name.toLowerCase().includes('test') && 
            !m.name.toLowerCase().includes('draft') &&
            !m.id.includes('hallucinated')
        );

        const fluxKlein = base.find(m => m.name.toLowerCase().includes('flux klein') || m.id.includes('flux-klein'));
        const others = base.filter(m => m !== fluxKlein);

        return fluxKlein ? [fluxKlein, ...others].slice(0, 3) : base.slice(0, 3);
    }, [availableModels]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % filteredModels.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + filteredModels.length) % filteredModels.length);
    };

    const currentModel = filteredModels[currentIndex];

    return (
        <div className="lite-feed fade-in">
            <header className="feed-header">
                <div className="elite-badge">Elite Trio</div>
                <h1>Discover<span>Models</span></h1>
                <p>The world's most powerful creative engines, distilled.</p>
            </header>

            <div className="pagination-container">
                {filteredModels.length > 0 ? (
                    <div className="pager-wrapper">
                        <button className="nav-arrow prev glass" onClick={handlePrev}>
                            <IconChevronLeft size={32} />
                        </button>

                        <div className="pager-content">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={currentModel.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className={`model-card large glass ${selectedModel?.id === currentModel.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedModel(currentModel);
                                        localStorage.setItem('lite_selected_model', currentModel.id);
                                    }}
                                >
                                    <div className="model-image">
                                        <img src={getOptimizedImageUrl(currentModel.image) || ''} alt={currentModel.name} />
                                        <div className="card-overlays">
                                            {selectedModel?.id === currentModel.id && (
                                                <div className="active-badge glow-pulse">
                                                    <IconZap size={14} fill="currentColor" />
                                                    <span>Active</span>
                                                </div>
                                            )}
                                            {currentModel.name.toLowerCase().includes('flux') && <div className="featured-pill">Flagship</div>}
                                        </div>
                                    </div>
                                    <div className="model-info">
                                        <div className="model-title-row">
                                            <h3>{currentModel.name}</h3>
                                            <div className="pager-indicator">{currentIndex + 1} / {filteredModels.length}</div>
                                        </div>
                                        <p>{currentModel.description}</p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <button className="nav-arrow next glass" onClick={handleNext}>
                            <IconChevronRight size={32} />
                        </button>
                    </div>
                ) : (
                    <div className="empty-state glass">
                        <p>No models available at this time.</p>
                    </div>
                )}
            </div>

            <style>{`
                .lite-feed { padding: 60px 20px 140px; max-width: 1100px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
                
                .feed-header { text-align: center; margin-bottom: 40px; display: flex; flex-direction: column; align-items: center; gap: 15px; }
                .elite-badge { background: rgba(139, 92, 246, 0.1); color: #a78bfa; padding: 4px 12px; border-radius: 99px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; border: 1px solid rgba(139, 92, 246, 0.2); }
                .feed-header h1 { font-size: 3rem; letter-spacing: -3px; line-height: 1; }
                .feed-header h1 span { color: #8b5cf6; margin-left: 10px; text-shadow: 0 0 30px rgba(139, 92, 246, 0.3); }
                .feed-header p { color: #71717a; font-size: 1.1rem; max-width: 400px; line-height: 1.4; }

                .pagination-container { flex: 1; display: flex; align-items: center; justify-content: center; }
                .pager-wrapper { display: flex; align-items: center; gap: 40px; width: 100%; max-width: 900px; }
                
                .nav-arrow { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.3s; z-index: 10; border-color: rgba(255,255,255,0.05); }
                .nav-arrow:hover { background: rgba(139, 92, 246, 0.2); border-color: #8b5cf6; transform: scale(1.1); }
                .nav-arrow:active { transform: scale(0.9); }

                .pager-content { flex: 1; min-width: 0; }
                
                .model-card.large { width: 100%; border-radius: 40px; overflow: hidden; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; border: 1px solid rgba(255,255,255,0.05); }
                .model-card.large:hover { transform: scale(1.01); border-color: rgba(139, 92, 246, 0.5); box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
                .model-card.active { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.05); }

                .model-image { width: 100%; aspect-ratio: 16/9; position: relative; overflow: hidden; }
                .model-image img { width: 100%; height: 100%; object-fit: cover; }
                
                .card-overlays { position: absolute; top: 20px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; }

                .active-badge { background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 99px; display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4); }
                .featured-pill { background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); color: white; padding: 8px 16px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1); }

                .model-info { padding: 40px; }
                .model-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
                .model-info h3 { font-size: 2rem; font-weight: 800; letter-spacing: -1px; }
                .pager-indicator { font-size: 0.9rem; font-weight: 800; color: #71717a; font-variant-numeric: tabular-nums; }
                .model-info p { font-size: 1.1rem; color: #a1a1aa; line-height: 1.6; }

                .glow-pulse { animation: glow 2s infinite alternate; }
                @keyframes glow { from { box-shadow: 0 0 10px rgba(139, 92, 246, 0.4); } to { box-shadow: 0 0 30px rgba(139, 92, 246, 0.9); } }

                .empty-state { width: 100%; padding: 100px; text-align: center; border-radius: 40px; color: #71717a; }

                @media (max-width: 768px) {
                    .pager-wrapper { flex-direction: column; gap: 20px; }
                    .nav-arrow { width: 48px; height: 48px; }
                    .model-info { padding: 25px; }
                    .model-info h3 { font-size: 1.5rem; }
                }
            `}</style>
        </div>
    );
}
