import React, { useMemo, useState } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconZap, IconChevronLeft, IconChevronRight, IconSparkles, IconMagic } from '../icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const getBriefDescription = (name: string, originalDesc: string) => {
    const n = name.toLowerCase();
    if (n.includes('flux')) return "Our most advanced engine. Capable of incredible detail and following complex instructions perfectly.";
    if (n.includes('xl')) return "A versatile powerhouse. Ideal for creating cinematic, high-resolution masterpieces.";
    if (n.includes('pony')) return "Full of personality and style. Perfect for expressive characters and vibrant, artistic flair.";
    if (n.includes('real')) return "Captured reality. Optimized for lifelike skin, hair, and natural lighting.";
    if (n.includes('anime')) return "The ultimate aesthetic. Hand-crafted for beautiful, stylized character illustrations.";
    
    return originalDesc.length > 80 ? originalDesc.substring(0, 77) + "..." : originalDesc;
};

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
    const navigate = useNavigate();

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
        if (hour < 5) return "Quiet Hours";
        if (hour < 12) return "Golden Morning";
        if (hour < 17) return "Bright Afternoon";
        if (hour < 21) return "Cozy Evening";
        return "Starlit Night";
    }, []);

    return (
        <div className="lite-feed-immersive fade-in">
            {/* Dynamic Mesh Background */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
                <div className="mesh-ball mesh-3"></div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={`bg-${currentModel?.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="immersive-bg-blur"
                    style={{ backgroundImage: `url(${getOptimizedImageUrl(currentModel?.image)})` }}
                />
            </AnimatePresence>

            <div className="content-overlay">
                <header className="feed-header">
                    <span className="welcome-tag">The Latent Garden</span>
                    <h1 className="text-jeweled">Explore <span>Engines</span></h1>
                </header>

                <div className="pagination-container">
                    {filteredModels.length > 0 ? (
                        <div className="pager-wrapper">
                            <button className="nav-arrow prev glass-immersive" onClick={handlePrev}>
                                <IconChevronLeft size={32} />
                            </button>

                            <div className="pager-content">
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={currentModel.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.05, y: -20 }}
                                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                        className={`model-jewel-card glass-immersive ${selectedModel?.id === currentModel.id ? 'selected' : ''}`}
                                    >
                                        <div className="model-jewel-root" onClick={() => {
                                            localStorage.setItem('lite_selected_model', currentModel.id);
                                            if (!currentUser) {
                                                navigate('/auth');
                                                return;
                                            }
                                            setSelectedModel(currentModel);
                                            navigate('/generate');
                                        }}>
                                            <div className="model-visual-side">
                                                <img src={getOptimizedImageUrl(currentModel.image) || ''} alt={currentModel.name} />
                                                <div className="visual-overlays">
                                                    {selectedModel?.id === currentModel.id && (
                                                        <motion.div layoutId="active" className="active-jewel-badge">
                                                            <IconMagic size={14} fill="currentColor" />
                                                            <span>Active</span>
                                                        </motion.div>
                                                    )}
                                                    {currentModel.name.toLowerCase().includes('flux') && <div className="premium-tag">Flagship</div>}
                                                </div>
                                                <div className="image-reflection"></div>
                                            </div>
                                            
                                            <div className="model-info-side">
                                                <div className="info-header">
                                                    <div className="name-stack">
                                                        <span className="type-label">{currentModel.name.toLowerCase().includes('flux') ? 'Superior Quality' : 'Artistic Engine'}</span>
                                                        <h2>{currentModel.name}</h2>
                                                    </div>
                                                    <div className="index-pill">{currentIndex + 1} / {filteredModels.length}</div>
                                                </div>
                                                
                                                <p className="poetic-desc">
                                                    {getBriefDescription(currentModel.name, currentModel.description)}
                                                </p>

                                                <div className="insight-jewel">
                                                    <IconSparkles size={16} />
                                                    <span>Mastery: <strong>{getModelInsight(currentModel.name)}</strong></span>
                                                </div>
                                                
                                                <div className="action-row">
                                                     <button 
                                                        className={`select-btn ${selectedModel?.id === currentModel.id ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            localStorage.setItem('lite_selected_model', currentModel.id);
                                                            if (!currentUser) {
                                                                navigate('/auth');
                                                                return;
                                                            }
                                                            setSelectedModel(currentModel);
                                                            navigate('/generate');
                                                        }}
                                                    >
                                                        {selectedModel?.id === currentModel.id ? 'Current Choice' : 'Select Core'}
                                                    </button>
                                                    <div className="engine-trait">
                                                        <IconZap size={12} />
                                                        <span>{currentModel.name.toLowerCase().includes('flux') ? 'Nuanced Precision' : 'Fluid Creativity'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <button className="nav-arrow next glass-immersive" onClick={handleNext}>
                                <IconChevronRight size={32} />
                            </button>
                        </div>
                    ) : (
                        <div className="empty-garden glass-immersive">
                            <IconMagic size={48} className="breathe" />
                            <p>Cultivating new visions...</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .lite-feed-immersive { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #09090b; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 25s infinite alternate ease-in-out; }
                .mesh-1 { width: 700px; height: 700px; background: rgba(139, 92, 246, 0.2); top: -250px; right: -150px; }
                .mesh-2 { width: 600px; height: 600px; background: rgba(245, 158, 11, 0.15); bottom: -150px; left: -150px; animation-delay: -7s; }
                .mesh-3 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); top: 30%; left: 10%; animation-duration: 30s; }
                
                @keyframes drift { 
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    100% { transform: translate(60px, 60px) scale(1.15) rotate(15deg); }
                }

                .immersive-bg-blur { position: absolute; inset: -100px; background-size: cover; background-position: center; filter: blur(100px) saturate(1.5); opacity: 0.2; pointer-events: none; }
                
                .content-overlay { position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 40px 40px 140px; max-width: 1200px; margin: 0 auto; }
                
                .feed-header { text-align: left; margin-bottom: 30px; width: 100%; }
                .welcome-tag { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: var(--color-accent); opacity: 0.8; }
                .feed-header h1 { font-size: 2.5rem; letter-spacing: -2px; line-height: 1; font-weight: 900; color: white; margin-top: 5px; }
                .feed-header h1 span { color: var(--color-zinc-400); }

                .pagination-container { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden; }
                .pager-wrapper { display: flex; align-items: center; gap: 40px; width: 100%; }

                .nav-arrow { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); border-color: rgba(255,255,255,0.06); }
                .nav-arrow:hover { background: var(--color-accent); border-color: var(--color-accent); transform: scale(1.1); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.4); }

                .pager-content { flex: 1; min-width: 0; perspective: 1500px; }
                
                .model-jewel-card { width: 100%; border-radius: 48px; overflow: hidden; position: relative; transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); border: 1px solid rgba(255,255,255,0.06); }
                .model-jewel-card.selected { border-color: var(--color-accent); box-shadow: 0 30px 60px rgba(139, 92, 246, 0.15); }
                
                .model-jewel-root { display: flex; flex-direction: row; cursor: pointer; min-height: 480px; }
                
                .model-visual-side { flex: 1; position: relative; overflow: hidden; background: #18181b; }
                .model-visual-side img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(0.23, 1, 0.32, 1); }
                .model-jewel-card:hover .model-visual-side img { transform: scale(1.05); }
                
                .visual-overlays { position: absolute; top: 30px; left: 30px; right: 30px; display: flex; justify-content: space-between; pointer-events: none; z-index: 10; }
                .active-jewel-badge { background: var(--color-accent); color: white; padding: 10px 20px; border-radius: 99px; display: flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4); }
                .premium-tag { background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); color: white; padding: 10px 20px; border-radius: 99px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1); }
                .image-reflection { position: absolute; inset: 0; background: linear-gradient(90deg, transparent 60%, rgba(0,0,0,0.2)); pointer-events: none; }
-
                .model-info-side { flex: 1.2; padding: 50px; display: flex; flex-direction: column; justify-content: center; background: rgba(255,255,255,0.01); }
                .type-label { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: var(--color-accent); margin-bottom: 8px; display: block; opacity: 0.8; }
                .model-info-side h2 { font-size: 2.8rem; font-weight: 900; letter-spacing: -2px; line-height: 1; margin-bottom: 20px; color: white; }
                .index-pill { font-size: 1rem; font-weight: 900; color: var(--color-zinc-500); margin-top: 5px; }
                
                .poetic-desc { font-size: 1.1rem; color: var(--color-zinc-400); line-height: 1.5; margin-bottom: 30px; font-weight: 500; }

                .insight-jewel { background: var(--color-accent-soft); color: var(--color-accent); padding: 12px 24px; border-radius: 16px; width: fit-content; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; margin-bottom: 40px; border: 1px solid rgba(139, 92, 246, 0.1); }
                .insight-jewel strong { color: white; }
                
                .action-row { display: flex; align-items: center; gap: 24px; }
                .select-btn { padding: 16px 32px; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: white; font-weight: 900; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 2px; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
                .select-btn.active { background: var(--color-accent); border-color: var(--color-accent); transform: translateY(-3px); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.3); }
                .select-btn:hover:not(.active) { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
                
                .engine-trait { display: flex; align-items: center; gap: 8px; color: #52525b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

                .empty-garden { padding: 80px; text-align: center; border-radius: 48px; display: flex; flex-direction: column; align-items: center; gap: 20px; color: var(--color-zinc-400); }

                @media (max-width: 1100px) {
                    .pager-wrapper { gap: 20px; }
                    .model-jewel-root { min-height: 400px; }
                    .model-info-side { padding: 40px; }
                    .model-info-side h2 { font-size: 2.2rem; }
                }

                @media (max-width: 900px) {
                    .model-jewel-root { flex-direction: column; min-height: auto; }
                    .model-visual-side { aspect-ratio: 16/10; }
                    .model-info-side { padding: 40px; }
                }

                @media (max-width: 600px) {
                    .content-overlay { padding: 20px 16px; }
                    .nav-arrow { display: none; }
                    .feed-header h1 { font-size: 2rem; }
                    .model-info-side h2 { font-size: 1.8rem; }
                    .poetic-desc { font-size: 1rem; }
                    .action-row { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </div>
    );
}
