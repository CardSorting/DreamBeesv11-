import React, { useState, useEffect } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconZap, IconLoader, IconImage, IconLayers } from '../icons';

export default function Generator() {
    const [prompt, setPrompt] = useState('');
    const { selectedModel, generate, generating, localHistory } = useLite();

    const handleGenerate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt || generating) return;
        await generate(prompt);
        setPrompt('');
    };

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate();
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [prompt, generating]);

    return (
        <div className="lite-generator fade-in">
            <header className="gen-header">
                <div className="model-pill glass">
                    <div className="status-dot animate-pulse"></div>
                    {selectedModel?.name || "Select Model"}
                </div>
            </header>

            <main className="gen-main">
                <div className="result-area glass">
                    {generating ? (
                        <div className="loader-overlay">
                            <IconLoader size={48} />
                            <p>Dreaming...</p>
                        </div>
                    ) : localHistory[0] ? (
                        <img 
                            src={getOptimizedImageUrl(localHistory[0].imageUrl) || ''} 
                            alt="Last Generation" 
                            className="main-image"
                        />
                    ) : (
                        <div className="placeholder">
                            <IconImage size={64} />
                            <p>Enter a prompt to start</p>
                        </div>
                    )}
                </div>

                <form className="input-area glass" onSubmit={handleGenerate}>
                    <textarea 
                        placeholder="Describe your vision..."
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                    />
                    <button type="submit" disabled={generating || !prompt} className="gen-btn">
                        {generating ? <IconLoader size={20} /> : <IconZap size={20} />}
                        <span>{generating ? 'Dreaming' : 'Generate'}</span>
                    </button>
                </form>

                <section className="history-preview">
                    <div className="section-title">
                        <IconLayers size={16} />
                        <span>Recent Creations</span>
                    </div>
                    <div className="history-grid custom-scrollbar">
                        {localHistory.slice(1, 6).map(item => (
                            <div key={item.id} className="history-item glass">
                                <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt="" />
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <style>{`
                .lite-generator { padding: 40px 20px; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 30px; }
                .gen-header { display: flex; justify-content: center; }
                .model-pill { display: flex; align-items: center; gap: 10px; padding: 8px 20px; border-radius: 99px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: #8b5cf6; }
                .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #8b5cf6; }

                .result-area { width: 100%; aspect-ratio: 1; border-radius: 32px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; background: #09090b; }
                .main-image { width: 100%; height: 100%; object-fit: cover; animation: reveal 0.8s ease-out; }
                .placeholder { text-align: center; color: #3f3f46; display: flex; flex-direction: column; align-items: center; gap: 15px; }
                .placeholder p { font-size: 0.9rem; font-weight: 500; }
                .loader-overlay { text-align: center; color: #8b5cf6; display: flex; flex-direction: column; align-items: center; gap: 15px; }

                .input-area { padding: 12px; border-radius: 24px; display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
                textarea { width: 100%; background: transparent; border: none; color: white; font-size: 1.1rem; padding: 15px; min-height: 80px; resize: none; outline: none; }
                .gen-btn { background: #8b5cf6; color: white; border: none; padding: 15px; border-radius: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: transform 0.2s; }
                .gen-btn:disabled { background: #27272a; color: #52525b; cursor: not-allowed; }
                .gen-btn:active { transform: scale(0.98); }

                .history-preview { margin-top: 20px; }
                .section-title { display: flex; align-items: center; gap: 8px; color: #71717a; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
                .history-grid { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px; }
                .history-item { width: 80px; height: 80px; border-radius: 16px; overflow: hidden; flex-shrink: 0; }
                .history-item img { width: 100%; height: 100%; object-fit: cover; }

                @keyframes reveal { from { filter: blur(20px); opacity: 0; transform: scale(1.05); } to { filter: blur(0); opacity: 1; transform: scale(1); } }
                @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
}
