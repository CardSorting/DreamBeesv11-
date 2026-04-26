import React, { useMemo, useState } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconZap, IconChevronLeft, IconChevronRight } from '../icons';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Provides a clean, short description for models based on their identity
 */
const getBriefDescription = (name: string, originalDesc: string) => {
    const n = name.toLowerCase();
    if (n.includes('flux')) return "Our most advanced engine. Capable of incredible detail and following complex instructions perfectly.";
    if (n.includes('xl')) return "A versatile powerhouse. Ideal for creating cinematic, high-resolution masterpieces.";
    if (n.includes('pony')) return "Full of personality and style. Perfect for expressive characters and vibrant, artistic flair.";
    if (n.includes('real')) return "Captured reality. Optimized for lifelike skin, hair, and natural lighting.";
    if (n.includes('anime')) return "The ultimate aesthetic. Hand-crafted for beautiful, stylized character illustrations.";
    if (n.includes('v1.5')) return "Lightweight and fast. A great choice for rapid experimentation and classic styles.";
    
    return originalDesc.length > 80 ? originalDesc.substring(0, 77) + "..." : originalDesc;
};

/**
 * Provides a 'Best For' insight for each model
 */
const getModelInsight = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('flux')) return "Complex Prompts & Realism";
    if (n.includes('xl')) return "Cinematic Landscapes";
    if (n.includes('pony')) return "Expressive Characters";
    if (n.includes('real')) return "Portraits & Products";
    if (n.includes('anime')) return "Digital Illustrations";
    return "Creative Exploration";
};

export default function ModelFeed() {
    const { availableModels, setSelectedModel, selectedModel, currentUser } = useLite();
    const [currentIndex, setCurrentIndex] = useState(0);

    const filteredModels = useMemo(() => {
        const base = availableModels.filter(m => 
            !m.name.toLowerCase().includes('test') && 
            !m.name.toLowerCase().includes('draft') &&
            !m.id.includes('hallucinated')
        );

        const fluxKlein = base.find(m => m.name.toLowerCase().includes('flux klein') || m.id.includes('flux-klein'));
        const others = base.filter(m => m !== fluxKlein);

        return fluxKlein ? [fluxKlein, ...others] : base;
    }, [availableModels]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % filteredModels.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + filteredModels.length) % filteredModels.length);
    };

    const currentModel = filteredModels[currentIndex];
    
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }, []);

    return (
        <div className="lite-feed-immersive">
            {/* Soft Mesh Background */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
                <div className="mesh-ball mesh-3"></div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={`bg-${currentModel?.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="immersive-bg"
                    style={{ backgroundImage: `url(${getOptimizedImageUrl(currentModel?.image)})` }}
                />
            </AnimatePresence>

            <div className="content-overlay">
                <header className="feed-header">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="welcome-row"
                    >
                        <span>{greeting}, {currentUser?.displayName?.split(' ')[0] || 'Creator'}</span>
                    </motion.div>
                    <h1>What will you<span>dream up?</span></h1>
                </header>

                <div className="pagination-container">
                    {filteredModels.length > 0 ? (
                        <div className="pager-wrapper">
                            <button className="nav-arrow prev glass-warm" onClick={handlePrev}>
                                <IconChevronLeft size={32} />
                            </button>

                            <div className="pager-content">
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={currentModel.id}
                                        initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                        className={`model-card-soft glass-warm ${selectedModel?.id === currentModel.id ? 'active' : ''}`}
                                    >
                                        <div className="model-visual-root" onClick={() => {
                                            setSelectedModel(currentModel);
                                            localStorage.setItem('lite_selected_model', currentModel.id);
                                        }}>
                                            <div className="model-image-container">
                                                <img src={getOptimizedImageUrl(currentModel.image) || ''} alt={currentModel.name} />
                                                <div className="card-overlays">
                                                    {selectedModel?.id === currentModel.id && (
                                                        <div className="active-badge glow-soft">
                                                            <IconZap size={14} fill="currentColor" />
                                                            <span>Selected</span>
                                                        </div>
                                                    )}
                                                    {currentModel.name.toLowerCase().includes('flux') && <div className="flagship-pill">Flagship Engine</div>}
                                                </div>
                                            </div>
                                            
                                            <div className="model-details">
                                                <div className="title-row">
                                                    <div className="name-box">
                                                        <label className="type-tag">{currentModel.name.toLowerCase().includes('flux') ? 'Ultra Quality' : 'High Performance'}</label>
                                                        <h2>{currentModel.name}</h2>
                                                    </div>
                                                    <div className="step-indicator">{currentIndex + 1} / {filteredModels.length}</div>
                                                </div>
                                                
                                                <p className="description">
                                                    {getBriefDescription(currentModel.name, currentModel.description)}
                                                </p>

                                                <div className="insight-pill">
                                                    <IconZap size={14} />
                                                    <span>Best for: <strong>{getModelInsight(currentModel.name)}</strong></span>
                                                </div>
                                                
                                                <div className="action-footer">
                                                    <div className={`primary-btn ${selectedModel?.id === currentModel.id ? 'active' : ''}`}>
                                                        {selectedModel?.id === currentModel.id ? 'Ready to Generate' : 'Select Engine'}
                                                    </div>
                                                    <div className="model-tip">
                                                        <span>Pro Tip: Best for {currentModel.name.toLowerCase().includes('flux') ? 'complex scenes' : 'fast results'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <button className="nav-arrow next glass-warm" onClick={handleNext}>
                                <IconChevronRight size={32} />
                            </button>
                        </div>
                    ) : (
                        <div className="empty-state glass-warm">
                            <p>Polishing the creative cores...</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .lite-feed-immersive { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #09090b; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.4; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(100px); animation: float 20s infinite alternate ease-in-out; }
                .mesh-1 { width: 600px; height: 600px; background: rgba(139, 92, 246, 0.2); top: -200px; right: -100px; }
                .mesh-2 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); bottom: -100px; left: -100px; animation-delay: -5s; }
                .mesh-3 { width: 400px; height: 400px; background: rgba(59, 130, 246, 0.1); top: 50%; left: 30%; animation-delay: -10s; }
                
                @keyframes float { 
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(100px, 100px) scale(1.2); }
                }

                .immersive-bg { position: absolute; inset: -100px; background-size: cover; background-position: center; filter: blur(80px) saturate(1.2); opacity: 0.15; pointer-events: none; }
                
                .content-overlay { position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 40px 40px 120px; }
                
                .feed-header { text-align: left; margin-bottom: 20px; max-width: 1200px; margin: 0 auto 40px; width: 100%; }
                .welcome-row { color: #8b5cf6; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; opacity: 0.8; }
                .feed-header h1 { font-size: 4rem; letter-spacing: -3px; line-height: 0.9; font-weight: 900; color: white; }
                .feed-header h1 span { display: block; color: #a1a1aa; }

                .pagination-container { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
                .pager-wrapper { display: flex; align-items: center; gap: 40px; width: 100%; max-width: 1200px; }

                .nav-arrow { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.3s; border: 1px solid rgba(255,255,255,0.05); }
                .nav-arrow:hover { background: #8b5cf6; border-color: #8b5cf6; transform: scale(1.1); box-shadow: 0 0 30px rgba(139, 92, 246, 0.3); }

                .pager-content { flex: 1; min-width: 0; }
                
                .glass-warm { background: rgba(24, 24, 27, 0.4); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 80px rgba(0,0,0,0.5); }
                
                .model-card-soft { width: 100%; border-radius: 48px; overflow: hidden; position: relative; transition: border-color 0.4s; }
                .model-card-soft.active { border-color: #8b5cf6; }
                
                .model-visual-root { display: flex; flex-direction: row; cursor: pointer; }
                
                .model-image-container { flex: 0.9; aspect-ratio: 1; position: relative; overflow: hidden; }
                .model-image-container img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(0.23, 1, 0.32, 1); }
                .model-card-soft:hover .model-image-container img { transform: scale(1.05); }
                
                .card-overlays { position: absolute; top: 30px; left: 30px; right: 30px; display: flex; justify-content: space-between; pointer-events: none; }
                .active-badge { background: #8b5cf6; color: white; padding: 10px 20px; border-radius: 99px; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.5); }
                .flagship-pill { background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); color: white; padding: 10px 20px; border-radius: 99px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1); }

                .model-details { flex: 1.1; padding: 60px; display: flex; flex-direction: column; justify-content: center; }
                .type-tag { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #8b5cf6; margin-bottom: 8px; display: block; }
                .model-details h2 { font-size: 3.5rem; font-weight: 900; letter-spacing: -2px; line-height: 1; margin-bottom: 20px; }
                .step-indicator { color: #3f3f46; font-weight: 900; font-size: 1.5rem; }
                
                .description { font-size: 1.25rem; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px; }

                .insight-pill { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 10px 20px; border-radius: 16px; width: fit-content; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; margin-bottom: 40px; border: 1px solid rgba(139, 92, 246, 0.1); }
                .insight-pill strong { color: white; }
                
                .action-footer { display: flex; align-items: center; gap: 20px; }
                .primary-btn { padding: 16px 32px; border-radius: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; font-weight: 800; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; transition: all 0.3s; }
                .primary-btn.active { background: #8b5cf6; border-color: #8b5cf6; transform: scale(1.05); box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4); }
                
                .model-tip { display: flex; align-items: center; gap: 8px; color: #52525b; font-size: 0.8rem; font-weight: 700; }

                .glow-soft { animation: glow 3s infinite alternate; }
                @keyframes glow { from { box-shadow: 0 0 10px rgba(139, 92, 246, 0.3); } to { box-shadow: 0 0 25px rgba(139, 92, 246, 0.6); } }

                @media (max-width: 1100px) {
                    .model-visual-root { flex-direction: column; }
                    .model-image-container { aspect-ratio: 16/9; }
                    .model-details { padding: 40px; }
                    .model-details h2 { font-size: 2.5rem; }
                    .feed-header h1 { font-size: 3rem; }
                }

                @media (max-width: 768px) {
                    .content-overlay { padding: 20px; }
                    .nav-arrow { display: none; }
                    .feed-header h1 { font-size: 2rem; }
                }
            `}</style>
        </div>
    );
}
