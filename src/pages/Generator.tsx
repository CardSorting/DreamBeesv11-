import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconZap, IconLoader, IconImage, IconLayers } from '../icons';
import { motion, AnimatePresence } from 'framer-motion';

export default function Generator() {
    const [prompt, setPrompt] = useState('');
    const { selectedModel, generate, generating, localHistory, currentUser } = useLite();

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

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Morning";
        if (hour < 18) return "Afternoon";
        return "Evening";
    }, []);

    // Particle effect during generation for a "Magical" feel
    const particles = useMemo(() => Array.from({ length: 8 }), []);

    return (
        <div className="lite-generator-immersive fade-in">
            {/* Soft mesh background */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
            </div>

            <header className="gen-header">
                <div className="header-left">
                    <span className="welcome-tag">Good {greeting}, {currentUser?.displayName?.split(' ')[0] || 'Creator'}</span>
                </div>
                <Link to="/" className="model-pill-warm glass-warm clickable">
                    <div className="status-dot-glow"></div>
                    <span>{selectedModel?.name || "Select Engine"}</span>
                </Link>
            </header>

            <main className="gen-main">
                <div className="canvas-wrapper">
                    <motion.div 
                        layout
                        className="result-area-warm glass-warm"
                    >
                        <AnimatePresence mode="wait">
                            {generating ? (
                                <motion.div 
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="loader-overlay"
                                >
                                    <div className="magical-loader">
                                        <div className="pulse-container">
                                            <div className="pulse-ring"></div>
                                            <IconZap size={48} fill="#8b5cf6" />
                                        </div>
                                        {/* Particle swarm */}
                                        {particles.map((_, i) => (
                                            <motion.div 
                                                key={i}
                                                className="latent-particle"
                                                animate={{ 
                                                    scale: [0, 1, 0],
                                                    x: [0, (Math.random() - 0.5) * 200],
                                                    y: [0, (Math.random() - 0.5) * 200],
                                                    opacity: [0, 0.8, 0]
                                                }}
                                                transition={{ 
                                                    duration: 1.5 + Math.random(),
                                                    repeat: Infinity,
                                                    delay: i * 0.2
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p className="dreaming-text">Dreaming with <span>{selectedModel?.name || 'AI'}</span></p>
                                </motion.div>
                            ) : localHistory[0] ? (
                                <motion.img 
                                    key={localHistory[0].id}
                                    initial={{ opacity: 0, scale: 1.02, filter: 'blur(20px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    src={getOptimizedImageUrl(localHistory[0].imageUrl) || ''} 
                                    alt="Generation" 
                                    className="main-image"
                                />
                            ) : (
                                <motion.div 
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="placeholder-warm"
                                >
                                    <div className="icon-box">
                                        <IconImage size={48} />
                                    </div>
                                    <h3>Empty Canvas</h3>
                                    <p>Describe your vision below</p>
                                    <button 
                                        type="button"
                                        className="example-prompt-btn"
                                        onClick={() => setPrompt("A futuristic garden with bioluminescent bees and crystal flowers")}
                                    >
                                        Try: "A futuristic garden..."
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                <form className="input-area-warm glass-warm" onSubmit={handleGenerate}>
                    <textarea 
                        placeholder="What are we dreaming of today?"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                    />
                    <div className="input-footer">
                        <div className="shortcuts">
                            <span>⌘ + ↵ to materialize</span>
                        </div>
                        <button type="submit" disabled={generating || !prompt} className="gen-btn-warm">
                            {generating ? <IconLoader size={20} /> : <IconZap size={18} fill="currentColor" />}
                            <span>{generating ? 'Materializing' : 'Bring to Life'}</span>
                        </button>
                    </div>
                </form>

                <section className="history-preview">
                    <div className="section-title">
                        <IconLayers size={14} />
                        <span>Latent Archive</span>
                    </div>
                    <div className="history-scroll-warm">
                        {localHistory.slice(1, 10).map((item, idx) => (
                            <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="history-card-warm glass-warm"
                            >
                                <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt="" />
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            <style>{`
                .lite-generator-immersive { min-height: 100vh; padding: 40px 20px 140px; max-width: 900px; margin: 0 auto; position: relative; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.2; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(100px); animation: float 20s infinite alternate ease-in-out; }
                .mesh-1 { width: 600px; height: 600px; background: rgba(139, 92, 246, 0.2); top: -200px; right: -100px; }
                .mesh-2 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); bottom: -100px; left: -100px; animation-delay: -5s; }
                
                @keyframes float { 
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(50px, 50px) scale(1.1); }
                }

                .gen-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .welcome-tag { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #71717a; }
                
                .glass-warm { background: rgba(24, 24, 27, 0.4); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 80px rgba(0,0,0,0.5); }
                
                .model-pill-warm { display: flex; align-items: center; gap: 10px; padding: 10px 24px; border-radius: 99px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #8b5cf6; text-decoration: none; border-color: rgba(139, 92, 246, 0.2); }
                .model-pill-warm.clickable:hover { transform: translateY(-2px); border-color: #8b5cf6; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); }
                .status-dot-glow { width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6; box-shadow: 0 0 10px #8b5cf6; animation: pulse 2s infinite; }

                .canvas-wrapper { width: 100%; margin-bottom: 30px; }
                .result-area-warm { width: 100%; aspect-ratio: 4/5; border-radius: 48px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
                .main-image { width: 100%; height: 100%; object-fit: cover; }
                
                .placeholder-warm { text-align: center; color: #52525b; display: flex; flex-direction: column; align-items: center; gap: 15px; }
                .icon-box { width: 100px; height: 100px; border-radius: 32px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: #3f3f46; margin-bottom: 10px; }
                .placeholder-warm h3 { color: #a1a1aa; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.5px; }
                .placeholder-warm p { font-size: 1rem; margin-bottom: 15px; }
                .example-prompt-btn { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 8px 16px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(139, 92, 246, 0.2); transition: all 0.3s; }
                .example-prompt-btn:hover { background: rgba(139, 92, 246, 0.2); transform: translateY(-2px); }

                .loader-overlay { text-align: center; color: #8b5cf6; display: flex; flex-direction: column; align-items: center; gap: 20px; z-index: 10; }
                .magical-loader { position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }
                .latent-particle { position: absolute; width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; filter: blur(2px); box-shadow: 0 0 10px #8b5cf6; }
                .pulse-container { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; z-index: 5; }
                .pulse-ring { position: absolute; inset: 0; border: 2px solid #8b5cf6; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
                .dreaming-text { font-weight: 800; font-size: 1.1rem; color: #a1a1aa; }
                .dreaming-text span { color: #8b5cf6; }

                .input-area-warm { padding: 24px; border-radius: 32px; display: flex; flex-direction: column; gap: 15px; }
                textarea { width: 100%; background: transparent; border: none; color: white; font-size: 1.25rem; padding: 10px; min-height: 100px; resize: none; outline: none; line-height: 1.5; font-weight: 500; }
                textarea::placeholder { color: #3f3f46; }
                
                .input-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
                .shortcuts { font-size: 0.7rem; font-weight: 800; color: #3f3f46; text-transform: uppercase; letter-spacing: 1px; }
                
                .gen-btn-warm { background: #8b5cf6; color: white; border: none; padding: 14px 28px; border-radius: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: all 0.3s; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; }
                .gen-btn-warm:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); }
                .gen-btn-warm:disabled { background: rgba(255,255,255,0.05); color: #3f3f46; cursor: not-allowed; }

                .history-preview { margin-top: 50px; }
                .section-title { display: flex; align-items: center; gap: 10px; color: #52525b; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 25px; }
                .history-scroll-warm { display: flex; gap: 20px; overflow-x: auto; padding: 10px 5px 30px; scrollbar-width: none; }
                .history-scroll-warm::-webkit-scrollbar { display: none; }
                .history-card-warm { width: 120px; height: 120px; border-radius: 24px; overflow: hidden; flex-shrink: 0; cursor: pointer; border-color: rgba(255,255,255,0.05); }
                .history-card-warm img { width: 100%; height: 100%; object-fit: cover; }

                @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .spin { animation: spin 2s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
