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

            <div className="content-overlay">
                <header className="feed-header">
                    <span className="welcome-tag">{greeting}</span>
                    <h1 className="text-jeweled">Choose your <span>Engine</span></h1>
                </header>

                <div className="models-grid-container">
                    {filteredModels.length > 0 ? (
                        <div className="models-grid">
                            {filteredModels.map((model, idx) => (
                                <motion.div 
                                    key={model.id}
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
                                            {model.name.toLowerCase().includes('flux') && <div className="badge flagship-badge">Flagship</div>}
                                        </div>
                                    </div>
                                    
                                    <div className="card-content">
                                        <div className="card-header">
                                            <span className="engine-type">{model.name.toLowerCase().includes('flux') ? 'Superior' : 'Creative'}</span>
                                            <h3>{model.name}</h3>
                                        </div>
                                        
                                        <p className="card-desc">
                                            {getBriefDescription(model.name, model.description)}
                                        </p>

                                        <div className="card-meta">
                                            <div className="meta-item">
                                                <IconSparkles size={12} />
                                                <span>{getModelInsight(model.name)}</span>
                                            </div>
                                            <div className="meta-item trait">
                                                <IconZap size={12} />
                                                <span>{model.name.toLowerCase().includes('flux') ? 'Precision' : 'Fluid'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-selection-glow"></div>
                                </motion.div>
                            ))}
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
                .lite-feed-immersive { position: relative; width: 100vw; min-height: 100vh; overflow-x: hidden; background: #09090b; padding-bottom: 150px; }
                
                .mesh-gradient-container { position: fixed; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; z-index: 0; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 25s infinite alternate ease-in-out; }
                .mesh-1 { width: 700px; height: 700px; background: rgba(139, 92, 246, 0.2); top: -250px; right: -150px; }
                .mesh-2 { width: 600px; height: 600px; background: rgba(245, 158, 11, 0.15); bottom: -150px; left: -150px; animation-delay: -7s; }
                .mesh-3 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); top: 30%; left: 10%; animation-duration: 30s; }
                
                @keyframes drift { 
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    100% { transform: translate(60px, 60px) scale(1.15) rotate(15deg); }
                }

                .content-overlay { position: relative; z-index: 10; width: 100%; max-width: 1200px; margin: 0 auto; padding: 60px 24px; }
                
                .feed-header { margin-bottom: 50px; }
                .welcome-tag { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: var(--color-accent); opacity: 0.8; }
                .feed-header h1 { font-size: 2.8rem; margin-top: 8px; }
                .feed-header h1 span { color: var(--color-zinc-500); }

                .models-grid-container { width: 100%; }
                .models-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

                .model-unified-card { 
                    position: relative;
                    border-radius: 32px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
                    border: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.02);
                    display: flex;
                    flex-direction: column;
                }

                .model-unified-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.12);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
                }

                .model-unified-card.active {
                    border-color: var(--color-accent);
                    background: rgba(139, 92, 246, 0.05);
                    box-shadow: 0 0 0 1px var(--color-accent), 0 30px 60px rgba(139, 92, 246, 0.1);
                }

                .card-visual {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16/10;
                    overflow: hidden;
                    background: #18181b;
                }

                .card-visual img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 1s ease;
                }

                .model-unified-card:hover .card-visual img {
                    transform: scale(1.08);
                }

                .card-badges {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    right: 16px;
                    display: flex;
                    justify-content: space-between;
                    pointer-events: none;
                }

                .badge {
                    padding: 6px 12px;
                    border-radius: 99px;
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .active-badge {
                    background: var(--color-accent);
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border-color: rgba(255,255,255,0.2);
                }

                .flagship-badge {
                    background: rgba(0,0,0,0.5);
                    color: var(--color-soft-gold);
                }

                .card-content {
                    padding: 24px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .card-header .engine-type {
                    font-size: 0.65rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: var(--color-accent);
                    margin-bottom: 4px;
                    display: block;
                }

                .card-header h3 {
                    font-size: 1.5rem;
                    color: white;
                }

                .card-desc {
                    font-size: 0.85rem;
                    line-height: 1.5;
                    color: var(--color-zinc-400);
                    font-weight: 500;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .card-meta {
                    margin-top: auto;
                    display: flex;
                    gap: 16px;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: var(--color-zinc-300);
                }

                .meta-item.trait {
                    color: var(--color-zinc-500);
                }

                .card-selection-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, var(--color-accent), transparent);
                    opacity: 0;
                    transition: opacity 0.5s;
                    pointer-events: none;
                    mix-blend-mode: soft-light;
                }

                .model-unified-card.active .card-selection-glow {
                    opacity: 0.1;
                }

                .empty-garden { padding: 80px; text-align: center; border-radius: 48px; display: flex; flex-direction: column; align-items: center; gap: 20px; color: var(--color-zinc-400); }

                @media (max-width: 600px) {
                    .feed-header h1 { font-size: 2.2rem; }
                    .models-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}

