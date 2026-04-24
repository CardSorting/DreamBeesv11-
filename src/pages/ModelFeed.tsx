import React from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconZap } from '../icons';

export default function ModelFeed() {
    const { availableModels, setSelectedModel, selectedModel } = useLite();

    return (
        <div className="lite-feed fade-in">
            <header>
                <h1>Discover<span>Models</span></h1>
                <p>Choose your creative engine</p>
            </header>

            <div className="models-grid">
                {availableModels.map(model => (
                    <div 
                        key={model.id} 
                        className={`model-card glass ${selectedModel?.id === model.id ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedModel(model);
                            localStorage.setItem('lite_selected_model', model.id);
                        }}
                    >
                        <div className="model-image">
                            <img src={getOptimizedImageUrl(model.image) || ''} alt={model.name} />
                            {selectedModel?.id === model.id && (
                                <div className="active-badge">
                                    <IconZap size={14} fill="currentColor" />
                                    <span>Active</span>
                                </div>
                            )}
                        </div>
                        <div className="model-info">
                            <h3>{model.name}</h3>
                            <p>{model.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .lite-feed { padding: 40px 20px; max-width: 1000px; margin: 0 auto; }
                header { text-align: center; margin-bottom: 40px; }
                header h1 { font-size: 2.5rem; letter-spacing: -2px; }
                header h1 span { color: #8b5cf6; margin-left: 8px; }
                header p { color: #71717a; margin-top: 5px; }

                .models-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
                .model-card { border-radius: 24px; overflow: hidden; cursor: pointer; transition: transform 0.3s, border-color 0.3s; }
                .model-card:hover { transform: translateY(-5px); border-color: rgba(139, 92, 246, 0.4); }
                .model-card.active { border-color: #8b5cf6; box-shadow: 0 0 30px rgba(139, 92, 246, 0.2); }

                .model-image { width: 100%; aspect-ratio: 16/9; position: relative; overflow: hidden; }
                .model-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
                .model-card:hover .model-image img { transform: scale(1.05); }

                .active-badge { position: absolute; top: 12px; right: 12px; background: #8b5cf6; color: white; padding: 4px 10px; border-radius: 99px; display: flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }

                .model-info { padding: 20px; }
                .model-info h3 { font-size: 1.2rem; margin-bottom: 5px; }
                .model-info p { font-size: 0.85rem; color: #71717a; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
        </div>
    );
}
