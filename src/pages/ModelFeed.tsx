import React, { useMemo } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconZap } from '../icons';

export default function ModelFeed() {
    const { availableModels, setSelectedModel, selectedModel } = useLite();

    const filteredModels = useMemo(() => {
        // 1. Filter out technical debt/noise
        const base = availableModels.filter(m => 
            !m.name.toLowerCase().includes('test') && 
            !m.name.toLowerCase().includes('draft') &&
            !m.id.includes('hallucinated')
        );

        // 2. Identify the flagship model (Flux Klein)
        const fluxKlein = base.find(m => m.name.toLowerCase().includes('flux klein') || m.id.includes('flux-klein'));
        const others = base.filter(m => m !== fluxKlein);

        // 3. Assemble the elite trio
        const eliteTrio = fluxKlein ? [fluxKlein, ...others].slice(0, 3) : base.slice(0, 3);
        
        return eliteTrio;
    }, [availableModels]);

    return (
        <div className="lite-feed fade-in">
            <header className="feed-header">
                <div className="elite-badge">Elite Trio</div>
                <h1>Discover<span>Models</span></h1>
                <p>The world's most powerful creative engines, distilled.</p>
            </header>

            <div className="models-grid">
                {filteredModels.length > 0 ? (
                    filteredModels.map(model => {
                        const isFlux = model.name.toLowerCase().includes('flux');
                        return (
                            <div 
                                key={model.id} 
                                className={`model-card glass ${selectedModel?.id === model.id ? 'active' : ''} ${isFlux ? 'flagship' : ''}`}
                                onClick={() => {
                                    setSelectedModel(model);
                                    localStorage.setItem('lite_selected_model', model.id);
                                }}
                            >
                                <div className="model-image">
                                    <img src={getOptimizedImageUrl(model.image) || ''} alt={model.name} />
                                    <div className="card-overlays">
                                        {selectedModel?.id === model.id && (
                                            <div className="active-badge glow-pulse">
                                                <IconZap size={14} fill="currentColor" />
                                                <span>Active</span>
                                            </div>
                                        )}
                                        {isFlux && <div className="featured-pill">Flagship</div>}
                                    </div>
                                </div>
                                <div className="model-info">
                                    <div className="model-title-row">
                                        <h3>{model.name}</h3>
                                        {isFlux && <div className="flux-dot"></div>}
                                    </div>
                                    <p>{model.description}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state glass">
                        <p>No models available at this time.</p>
                    </div>
                )}
            </div>

            <style>{`
                .lite-feed { padding: 60px 20px 140px; max-width: 1100px; margin: 0 auto; }
                
                .feed-header { text-align: center; margin-bottom: 60px; display: flex; flex-direction: column; align-items: center; gap: 15px; }
                .elite-badge { background: rgba(139, 92, 246, 0.1); color: #a78bfa; padding: 4px 12px; border-radius: 99px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; border: 1px solid rgba(139, 92, 246, 0.2); }
                .feed-header h1 { font-size: 3rem; letter-spacing: -3px; line-height: 1; }
                .feed-header h1 span { color: #8b5cf6; margin-left: 10px; text-shadow: 0 0 30px rgba(139, 92, 246, 0.3); }
                .feed-header p { color: #71717a; font-size: 1.1rem; max-width: 400px; line-height: 1.4; }

                .models-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
                
                .model-card { border-radius: 32px; overflow: hidden; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; border: 1px solid rgba(255,255,255,0.05); }
                .model-card:hover { transform: translateY(-8px) scale(1.02); border-color: rgba(139, 92, 246, 0.5); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                .model-card.active { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.05); }
                .model-card.active::after { content: ""; position: absolute; inset: 0; border-radius: 32px; box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.2); pointer-events: none; }

                .model-image { width: 100%; aspect-ratio: 4/3; position: relative; overflow: hidden; }
                .model-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1); }
                .model-card:hover .model-image img { transform: scale(1.1); }
                
                .card-overlays { position: absolute; top: 15px; left: 15px; right: 15px; display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; }

                .active-badge { background: #8b5cf6; color: white; padding: 6px 12px; border-radius: 99px; display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.4); }
                .featured-pill { background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); color: white; padding: 6px 12px; border-radius: 99px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.1); }

                .model-info { padding: 25px; }
                .model-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
                .model-info h3 { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; }
                .model-info p { font-size: 0.9rem; color: #a1a1aa; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                
                .flux-dot { width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%; box-shadow: 0 0 10px #8b5cf6; }

                .glow-pulse { animation: glow 2s infinite alternate; }
                @keyframes glow { from { box-shadow: 0 0 10px rgba(139, 92, 246, 0.4); } to { box-shadow: 0 0 25px rgba(139, 92, 246, 0.8); } }

                .empty-state { grid-column: 1 / -1; padding: 100px; text-align: center; border-radius: 40px; color: #71717a; }
            `}</style>
        </div>
    );
}
