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

    // Mock capabilities for "Elite" feel
    const capabilities = useMemo(() => {
        if (!currentModel) return null;
        const name = currentModel.name.toLowerCase();
        if (name.includes('flux')) return { speed: 9.8, quality: 9.9, artistic: 9.5 };
        if (name.includes('xl')) return { speed: 9.2, quality: 9.6, artistic: 9.8 };
        return { speed: 9.5, quality: 9.4, artistic: 9.2 };
    }, [currentModel]);

    return (
        <div className="lite-feed-immersive">
            {/* Dynamic Background */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={`bg-${currentModel?.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="immersive-bg"
                    style={{ backgroundImage: `url(${getOptimizedImageUrl(currentModel?.image)})` }}
                />
            </AnimatePresence>

            <div className="content-overlay">
                <header className="feed-header">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="elite-badge"
                    >
                        The Elite Trio
                    </motion.div>
                    <h1>Creative<span>Intelligence</span></h1>
                </header>

                <div className="pagination-container">
                    {filteredModels.length > 0 ? (
                        <div className="pager-wrapper">
                            <button className="nav-arrow prev glass" onClick={handlePrev}>
                                <IconChevronLeft size={32} />
                            </button>

                            <div className="pager-content">
                                <AnimatePresence mode="wait" custom={currentIndex}>
                                    <motion.div 
                                        key={currentModel.id}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.1, y: -20 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        onDragEnd={(_, info) => {
                                            if (info.offset.x > 100) handlePrev();
                                            else if (info.offset.x < -100) handleNext();
                                        }}
                                        className={`model-card-immersive glass ${selectedModel?.id === currentModel.id ? 'active' : ''}`}
                                    >
                                        <div className="model-visual-root" onClick={() => {
                                            setSelectedModel(currentModel);
                                            localStorage.setItem('lite_selected_model', currentModel.id);
                                        }}>
                                            <div className="model-image-container">
                                                <img src={getOptimizedImageUrl(currentModel.image) || ''} alt={currentModel.name} />
                                                <div className="card-overlays">
                                                    {selectedModel?.id === currentModel.id && (
                                                        <div className="active-badge glow-pulse">
                                                            <IconZap size={14} fill="currentColor" />
                                                            <span>Selected</span>
                                                        </div>
                                                    )}
                                                    {currentModel.name.toLowerCase().includes('flux') && <div className="featured-pill">Flagship</div>}
                                                </div>
                                            </div>
                                            
                                            <div className="model-details">
                                                <div className="title-row">
                                                    <h2>{currentModel.name}</h2>
                                                    <div className="step-indicator">{currentIndex + 1} / {filteredModels.length}</div>
                                                </div>
                                                <p className="description">{currentModel.description}</p>
                                                
                                                <div className="specs-grid">
                                                    <div className="spec-item">
                                                        <label>Velocity</label>
                                                        <div className="bar-root"><motion.div initial={{width:0}} animate={{width:`${(capabilities?.speed || 0)*10}%`}} className="bar-fill" /></div>
                                                    </div>
                                                    <div className="spec-item">
                                                        <label>Fidelity</label>
                                                        <div className="bar-root"><motion.div initial={{width:0}} animate={{width:`${(capabilities?.quality || 0)*10}%`}} className="bar-fill" /></div>
                                                    </div>
                                                    <div className="spec-item">
                                                        <label>Latent Depth</label>
                                                        <div className="bar-root"><motion.div initial={{width:0}} animate={{width:`${(capabilities?.artistic || 0)*10}%`}} className="bar-fill" /></div>
                                                    </div>
                                                </div>
                                            </div>
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
                            <p>Scanning for creative cores...</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .lite-feed-immersive { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #000; }
                .immersive-bg { position: absolute; inset: -50px; background-size: cover; background-position: center; filter: blur(60px) saturate(1.5); opacity: 0.3; pointer-events: none; }
                
                .content-overlay { position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 40px 20px 100px; }
                
                .feed-header { text-align: center; margin-bottom: 30px; }
                .elite-badge { color: #8b5cf6; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 10px; }
                .feed-header h1 { font-size: 3.5rem; letter-spacing: -4px; line-height: 1; }
                .feed-header h1 span { color: #8b5cf6; margin-left: 10px; }

                .pagination-container { flex: 1; display: flex; align-items: center; justify-content: center; }
                .pager-wrapper { display: flex; align-items: center; gap: 60px; width: 100%; max-width: 1200px; }

                .nav-arrow { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); border: 1px solid rgba(255,255,255,0.1); }
                .nav-arrow:hover { background: #8b5cf6; border-color: #8b5cf6; transform: scale(1.15); box-shadow: 0 0 40px rgba(139, 92, 246, 0.4); }

                .pager-content { flex: 1; min-width: 0; perspective: 1000px; }
                
                .model-card-immersive { width: 100%; border-radius: 48px; overflow: hidden; background: rgba(15, 15, 18, 0.7) !important; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 50px 100px rgba(0,0,0,0.8); }
                .model-card-immersive.active { border-color: #8b5cf6; }
                
                .model-visual-root { display: flex; flex-direction: row; cursor: pointer; }
                
                .model-image-container { flex: 1; aspect-ratio: 1; position: relative; overflow: hidden; border-right: 1px solid rgba(255,255,255,0.05); }
                .model-image-container img { width: 100%; height: 100%; object-fit: cover; }
                
                .card-overlays { position: absolute; top: 30px; left: 30px; right: 30px; display: flex; justify-content: space-between; pointer-events: none; }
                .active-badge { background: #8b5cf6; color: white; padding: 10px 20px; border-radius: 99px; display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; }
                .featured-pill { background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); color: white; padding: 10px 20px; border-radius: 99px; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1); }

                .model-details { flex: 1.2; padding: 60px; display: flex; flex-direction: column; justify-content: center; }
                .title-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
                .model-details h2 { font-size: 3rem; font-weight: 900; letter-spacing: -2px; line-height: 1; }
                .step-indicator { color: #52525b; font-weight: 900; font-size: 1.2rem; }
                
                .description { font-size: 1.2rem; color: #a1a1aa; line-height: 1.6; margin-bottom: 40px; }
                
                .specs-grid { display: flex; flex-direction: column; gap: 20px; }
                .spec-item { display: flex; flex-direction: column; gap: 8px; }
                .spec-item label { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #52525b; }
                .bar-root { width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
                .bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #d946ef); border-radius: 2px; }

                .glow-pulse { animation: glow 2s infinite alternate; }
                @keyframes glow { from { box-shadow: 0 0 10px rgba(139, 92, 246, 0.4); } to { box-shadow: 0 0 30px rgba(139, 92, 246, 0.8); } }

                @media (max-width: 1100px) {
                    .model-visual-root { flex-direction: column; }
                    .model-image-container { aspect-ratio: 16/9; }
                    .model-details { padding: 40px; }
                    .model-details h2 { font-size: 2rem; }
                }

                @media (max-width: 768px) {
                    .pager-wrapper { gap: 20px; }
                    .nav-arrow { display: none; }
                    .feed-header h1 { font-size: 2.5rem; }
                }
            `}</style>
        </div>
    );
}
