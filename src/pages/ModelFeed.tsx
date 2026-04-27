import React, { useMemo, useState } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl, getModelMetadata } from '../lite-utils';
import { IconZap, IconChevronLeft, IconChevronRight, IconSparkles, IconMagic } from '../icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ModelFeed() {
    const { availableModels, setSelectedModel, selectedModel, currentUser } = useLite();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (e.currentTarget.scrollTop > 50) {
            setScrolled(true);
        } else {
            setScrolled(false);
        }
    };

    const sections = useMemo(() => {
        const base = availableModels.filter(m => 
            !m.name.toLowerCase().includes('test') && 
            !m.name.toLowerCase().includes('draft') &&
            !m.id.includes('hallucinated')
        );

        return {
            flagship: base.filter(m => getModelMetadata(m).isFlagship),
            specialized: base.filter(m => !getModelMetadata(m).isFlagship)
        };
    }, [availableModels]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 5) return "Quiet Hours";
        if (hour < 12) return "Golden Morning";
        if (hour < 17) return "Bright Afternoon";
        if (hour < 21) return "Cozy Evening";
        return "Starlit Night";
    }, []);

    return (
        <div className="lite-feed-immersive fade-in" onScroll={handleScroll}>
            {/* Dynamic Mesh Background */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
                <div className="mesh-ball mesh-3"></div>
            </div>

            <div className="content-overlay">
                <header className="feed-header">
                    <span className="welcome-tag">{greeting}</span>
                    <h1 className="text-jeweled">Choose your <span>Engine</span></h1>
                </header>

                <div className="models-sections">
                    {sections.flagship.length > 0 && (
                        <section className="model-section">
                            <div className="section-title">
                                <IconSparkles size={14} />
                                <h2>Flagship Engines</h2>
                            </div>
                            <div className="models-grid">
                                {sections.flagship.map((model, idx) => (
                                    <ModelCard key={model.id} model={model} idx={idx} selectedModel={selectedModel} setSelectedModel={setSelectedModel} currentUser={currentUser} navigate={navigate} />
                                ))}
                            </div>
                        </section>
                    )}

                    {sections.specialized.length > 0 && (
                        <section className="model-section">
                            <div className="section-title">
                                <IconZap size={14} />
                                <h2>Specialized Tools</h2>
                            </div>
                            <div className="models-grid">
                                {sections.specialized.map((model, idx) => (
                                    <ModelCard key={model.id} model={model} idx={idx} selectedModel={selectedModel} setSelectedModel={setSelectedModel} currentUser={currentUser} navigate={navigate} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {availableModels.length === 0 && (
                    <div className="empty-garden glass-immersive">
                        <IconMagic size={48} className="breathe" />
                        <p>Cultivating new visions...</p>
                    </div>
                )}
            </div>

            {/* Floating Navigation Cue */}
            <AnimatePresence>
                {!scrolled && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="scroll-cue"
                    >
                        <span>Scroll to Explore</span>
                        <motion.div 
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="cue-arrow"
                        >
                            ↓
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .lite-feed-immersive { 
                    position: relative; 
                    width: 100vw; 
                    height: 100vh; 
                    overflow-y: auto; 
                    overflow-x: hidden; 
                    background: #09090b;
                    padding-bottom: 150px;
                    scrollbar-gutter: stable;
                }
                
                .lite-feed-immersive::-webkit-scrollbar { width: 8px; }
                .lite-feed-immersive::-webkit-scrollbar-track { background: transparent; }
                .lite-feed-immersive::-webkit-scrollbar-thumb {
                    background: rgba(139, 92, 246, 0.2);
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                .lite-feed-immersive::-webkit-scrollbar-thumb:hover { background: var(--color-accent); background-clip: content-box; }

                .mesh-gradient-container { position: fixed; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; z-index: 0; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 25s infinite alternate ease-in-out; }
                .mesh-1 { width: 700px; height: 700px; background: rgba(139, 92, 246, 0.2); top: -250px; right: -150px; }
                .mesh-2 { width: 600px; height: 600px; background: rgba(245, 158, 11, 0.15); bottom: -150px; left: -150px; animation-delay: -7s; }
                .mesh-3 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); top: 30%; left: 10%; animation-duration: 30s; }
                
                @keyframes drift { 
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    100% { transform: translate(60px, 60px) scale(1.15) rotate(15deg); }
                }

                .content-overlay { position: relative; z-index: 10; width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
                
                .feed-header { margin-bottom: 60px; }
                .welcome-tag { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: var(--color-accent); opacity: 0.8; }
                .feed-header h1 { font-size: 2.2rem; margin-top: 5px; letter-spacing: -1px; }
                .feed-header h1 span { color: var(--color-zinc-500); }

                .models-sections { display: flex; flex-direction: column; gap: 60px; }
                .model-section { display: flex; flex-direction: column; gap: 20px; }
                
                .section-title { display: flex; align-items: center; gap: 10px; color: var(--color-zinc-500); }
                .section-title h2 { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }

                .models-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

                .model-unified-card { 
                    position: relative;
                    border-radius: 24px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    border: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.01);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .model-unified-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255,255,255,0.03);
                    border-color: rgba(255,255,255,0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                }

                .model-unified-card.active {
                    border-color: var(--color-accent);
                    background: rgba(139, 92, 246, 0.04);
                    box-shadow: 0 0 0 1px var(--color-accent), 0 20px 40px rgba(139, 92, 246, 0.05);
                }

                .card-visual {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16/9;
                    overflow: hidden;
                    background: #18181b;
                }

                .card-visual img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.8s ease;
                }

                .model-unified-card:hover .card-visual img { transform: scale(1.05); }

                .card-badges {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    right: 12px;
                    display: flex;
                    justify-content: space-between;
                    pointer-events: none;
                }

                .badge {
                    padding: 4px 10px;
                    border-radius: 99px;
                    font-size: 0.55rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .active-badge {
                    background: var(--color-accent);
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .flagship-badge { background: rgba(0,0,0,0.4); color: var(--color-soft-gold); }

                .card-content {
                    padding: 18px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .card-header .engine-type {
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: var(--color-accent);
                    margin-bottom: 2px;
                    display: block;
                }

                .card-header h3 { font-size: 1.1rem; color: white; letter-spacing: -0.5px; }
                .card-desc {
                    font-size: 0.75rem;
                    line-height: 1.4;
                    color: var(--color-zinc-500);
                    font-weight: 500;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .card-meta {
                    margin-top: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255,255,255,0.03);
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: var(--color-zinc-400);
                }

                .meta-item.trait { color: var(--color-zinc-600); }

                .card-selection-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, var(--color-accent), transparent);
                    opacity: 0;
                    transition: opacity 0.5s;
                    pointer-events: none;
                    mix-blend-mode: soft-light;
                }

                .model-unified-card.active .card-selection-glow { opacity: 0.1; }

                .scroll-cue {
                    position: fixed;
                    bottom: 120px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                    color: var(--color-accent);
                    z-index: 100;
                    pointer-events: none;
                }
                .scroll-cue span { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; }
                .cue-arrow { font-size: 1.2rem; font-weight: 900; }

                .empty-garden { padding: 60px; text-align: center; border-radius: 40px; display: flex; flex-direction: column; align-items: center; gap: 15px; color: var(--color-zinc-500); }

                @media (max-width: 600px) {
                    .feed-header h1 { font-size: 1.8rem; }
                    .models-grid { grid-template-columns: 1fr; }
                    .lite-feed-immersive { padding-bottom: 120px; }
                }
            `}</style>
        </div>
    );
}

function ModelCard({ model, idx, selectedModel, setSelectedModel, currentUser, navigate }: any) {
    const meta = useMemo(() => getModelMetadata(model), [model]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className={`model-unified-card glass-immersive ${selectedModel?.id === model.id ? 'active' : ''}`}
            onClick={() => {
                localStorage.setItem('lite_selected_model', model.id);
                if (!currentUser) {
                    navigate('/auth');
                    return;
                }
                setSelectedModel(model);
                navigate('/generate');
            }}
        >
            <div className="card-visual">
                <img src={getOptimizedImageUrl(model.image) || ''} alt={model.name} />
                <div className="card-badges">
                    {selectedModel?.id === model.id && (
                        <div className="badge active-badge">
                            <IconMagic size={10} fill="currentColor" />
                            <span>Selected</span>
                        </div>
                    )}
                    {meta.isFlagship && <div className="badge flagship-badge">Flagship</div>}
                </div>
            </div>
            
            <div className="card-content">
                <div className="card-header">
                    <span className="engine-type">{meta.tag}</span>
                    <h3>{model.name}</h3>
                </div>
                
                <p className="card-desc">
                    {meta.shortDesc}
                </p>

                <div className="card-meta">
                    <div className="meta-item">
                        <IconSparkles size={12} />
                        <span>{meta.insight}</span>
                    </div>
                    <div className="meta-item trait">
                        <IconZap size={12} />
                        <span>{meta.isFlagship ? 'Precision' : 'Fluid'}</span>
                    </div>
                </div>
            </div>

            <div className="card-selection-glow"></div>
        </motion.div>
    );
}


