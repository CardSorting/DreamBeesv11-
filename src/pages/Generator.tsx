import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconZap, IconLoader, IconImage, IconLayers, IconSparkles, IconMagic } from '../icons';
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
        if (hour < 5) return "Quiet Hours";
        if (hour < 12) return "Golden Morning";
        if (hour < 17) return "Bright Afternoon";
        if (hour < 21) return "Cozy Evening";
        return "Starlit Night";
    }, []);

    const particles = useMemo(() => Array.from({ length: 12 }), []);

    return (
        <div className="lite-generator-immersive fade-in">
            {/* Dynamic Mesh Background */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
                <div className="mesh-ball mesh-3"></div>
            </div>

            <header className="gen-header">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="header-left"
                >
                    <span className="welcome-tag">{greeting}</span>
                    <h1 className="text-jeweled">{currentUser?.displayName?.split(' ')[0] || 'Visionary'}</h1>
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Link to="/" className="model-switcher-unified glass-immersive clickable">
                        <div className="switcher-icon">
                            <IconMagic size={14} fill="currentColor" />
                        </div>
                        <div className="switcher-info">
                            <span className="label">Active Engine</span>
                            <span className="name">{selectedModel?.name || "Select Engine"}</span>
                        </div>
                    </Link>
                </motion.div>
            </header>

            <main className="gen-main">
                <div className="canvas-wrapper">
                    <motion.div 
                        layout
                        className="result-area-immersive glass-immersive"
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
                                    <div className="latent-swirl-container">
                                        <div className="swirl-ring ring-1"></div>
                                        <div className="swirl-ring ring-2"></div>
                                        <div className="swirl-ring ring-3"></div>
                                        <div className="core-zap">
                                            <IconMagic size={48} fill="var(--color-accent)" />
                                        </div>
                                        {/* Magic particles */}
                                        {particles.map((_, i) => (
                                            <motion.div 
                                                key={i}
                                                className="magic-particle"
                                                animate={{ 
                                                    scale: [0, 1.2, 0],
                                                    rotate: [0, 360],
                                                    x: [0, (Math.random() - 0.5) * 200],
                                                    y: [0, (Math.random() - 0.5) * 200],
                                                    opacity: [0, 1, 0]
                                                }}
                                                transition={{ 
                                                    duration: 2 + Math.random(),
                                                    repeat: Infinity,
                                                    delay: i * 0.1
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p className="dreaming-text">Materializing your <span>vision</span>...</p>
                                </motion.div>
                            ) : localHistory[0] ? (
                                <motion.div 
                                    key={localHistory[0].id}
                                    initial={{ opacity: 0, scale: 1.05, filter: 'blur(30px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    className="image-container"
                                >
                                    <img 
                                        src={getOptimizedImageUrl(localHistory[0].imageUrl) || ''} 
                                        alt="Generation" 
                                        className="main-image-immersive"
                                    />
                                    <div className="image-reflection"></div>
                                    <div className="image-info-overlay">
                                        <p>{localHistory[0].prompt}</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="placeholder"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="dream-seed-placeholder"
                                >
                                    <div className="seed-visual organic-float">
                                        <IconSparkles size={48} className="breathe" />
                                    </div>
                                    <h3>Begin the Dream</h3>
                                    <p>What shall we manifest?</p>
                                    <div className="suggestion-chips">
                                        <button 
                                            type="button"
                                            className="chip"
                                            onClick={() => setPrompt("A crystalline bee harvesting nectar from a neon lotus")}
                                        >
                                            "Crystalline bee..."
                                        </button>
                                        <button 
                                            type="button"
                                            className="chip"
                                            onClick={() => setPrompt("An ethereal garden floating in a velvet nebula")}
                                        >
                                            "Ethereal garden..."
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                <div className="side-controls">
                    <form className="journal-area glass-immersive" onSubmit={handleGenerate}>
                        <textarea 
                            placeholder="Speak your vision..."
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                        />
                        <div className="journal-footer">
                            <div className="hint">
                                <IconMagic size={10} />
                                <span>⌘ + ↵</span>
                            </div>
                            <button type="submit" disabled={generating || !prompt} className="manifest-btn">
                                <AnimatePresence mode="wait">
                                    {generating ? (
                                        <motion.div key="l" exit={{ scale: 0 }} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                            <IconLoader size={16} />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="z" exit={{ scale: 0 }} initial={{ scale: 0 }} animate={{ scale: 1 }} className="btn-icon-stack">
                                            <IconZap size={16} fill="currentColor" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span>{generating ? 'Awakening' : 'Materialize'}</span>
                            </button>
                        </div>
                    </form>

                    <section className="latent-gallery">
                        <div className="gallery-header">
                            <IconLayers size={12} />
                            <span>Archive</span>
                        </div>
                        <div className="gallery-grid">
                            {localHistory.slice(1, 9).map((item, idx) => (
                                <motion.div 
                                    key={item.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, ease: "easeOut" }}
                                    whileHover={{ scale: 1.05, y: -4, zIndex: 10 }}
                                    className="gallery-card glass-immersive"
                                >
                                    <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt="" />
                                    <div className="card-hint">{item.prompt.substring(0, 20)}...</div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <style>{`
                .lite-generator-immersive { min-height: 100vh; padding: 20px 24px 120px; max-width: 1000px; margin: 0 auto; position: relative; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.2; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 25s infinite alternate ease-in-out; }
                .mesh-1 { width: 600px; height: 600px; background: rgba(139, 92, 246, 0.2); top: -200px; right: -100px; }
                .mesh-2 { width: 500px; height: 500px; background: rgba(245, 158, 11, 0.1); bottom: -100px; left: -100px; animation-delay: -7s; }
                .mesh-3 { width: 400px; height: 400px; background: rgba(217, 70, 239, 0.08); top: 30%; left: 10%; }
                
                @keyframes drift { 
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(40px, 40px) scale(1.1); }
                }

                .gen-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .header-left h1 { font-size: 1.5rem; margin-top: 2px; letter-spacing: -1px; }
                .welcome-tag { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: var(--color-accent); opacity: 0.7; }
                
                .model-switcher-unified { display: flex; align-items: center; gap: 10px; padding: 6px 14px; border-radius: 16px; text-decoration: none; border: 1px solid rgba(255,255,255,0.06); transition: all 0.4s; background: rgba(255,255,255,0.02); }
                .model-switcher-unified:hover { border-color: var(--color-accent); background: rgba(139, 92, 246, 0.05); }
                
                .switcher-icon { width: 24px; height: 24px; border-radius: 6px; background: var(--color-accent); color: white; display: flex; align-items: center; justify-content: center; }
                .switcher-info { display: flex; flex-direction: column; }
                .switcher-info .label { font-size: 0.45rem; font-weight: 900; text-transform: uppercase; color: var(--color-zinc-500); }
                .switcher-info .name { font-size: 0.65rem; font-weight: 800; color: white; }

                .gen-main { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px; align-items: start; }
                
                .canvas-wrapper { width: 100%; perspective: 1000px; }
                .result-area-immersive { width: 100%; aspect-ratio: 1/1; border-radius: 32px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); }
                
                .image-container { width: 100%; height: 100%; }
                .main-image-immersive { width: 100%; height: 100%; object-fit: cover; }
                .image-info-overlay { position: absolute; bottom: 15px; left: 15px; right: 15px; padding: 10px; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); opacity: 0; transition: 0.3s; }
                .image-container:hover .image-info-overlay { opacity: 1; }
                .image-info-overlay p { color: white; font-size: 0.75rem; font-weight: 600; line-height: 1.3; }

                .dream-seed-placeholder { text-align: center; color: var(--color-zinc-400); padding: 20px; }
                .seed-visual { width: 60px; height: 60px; border-radius: 20px; background: var(--color-accent-soft); display: flex; align-items: center; justify-content: center; color: var(--color-accent); margin: 0 auto 10px; }
                .dream-seed-placeholder h3 { color: white; font-size: 1.2rem; }
                .dream-seed-placeholder p { font-size: 0.85rem; }
                .suggestion-chips { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; justify-content: center; }
                .chip { background: rgba(255,255,255,0.03); color: #71717a; padding: 4px 10px; border-radius: 10px; font-size: 0.65rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.05); }

                .latent-swirl-container { position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; }
                .swirl-ring { position: absolute; border: 2px solid transparent; border-radius: 50%; animation: spin var(--d) linear infinite; }
                .ring-1 { width: 110px; height: 110px; border-top-color: var(--color-accent); --d: 3s; }
                .ring-2 { width: 85px; height: 85px; border-right-color: var(--color-dream-purple); --d: 2s; }
                .ring-3 { width: 60px; height: 60px; border-bottom-color: var(--color-soft-gold); --d: 4s; }
                
                .dreaming-text { font-weight: 800; font-size: 0.8rem; color: #71717a; margin-top: 10px; }

                .side-controls { display: flex; flex-direction: column; gap: 20px; }
                .journal-area { padding: 16px; border-radius: 24px; display: flex; flex-direction: column; gap: 10px; border: 1px solid rgba(255,255,255,0.05); }
                textarea { width: 100%; background: transparent; border: none; color: white; font-size: 1rem; min-height: 70px; resize: none; outline: none; line-height: 1.4; font-weight: 600; }
                
                .journal-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.04); }
                .hint { display: flex; align-items: center; gap: 4px; font-size: 0.55rem; font-weight: 900; color: #3f3f46; letter-spacing: 1px; }
                
                .manifest-btn { background: var(--color-accent); color: white; border: none; padding: 10px 20px; border-radius: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: 0.4s; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px; }
                .manifest-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); }
                .manifest-btn:disabled { background: rgba(255,255,255,0.03); color: #3f3f46; }

                .gallery-header { display: flex; align-items: center; gap: 6px; color: #3f3f46; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
                .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 10px; }
                .gallery-card { aspect-ratio: 1/1; border-radius: 16px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.04); }
                .gallery-card img { width: 100%; height: 100%; object-fit: cover; }
                .card-hint { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 6px; color: white; font-size: 0.55rem; font-weight: 700; text-align: center; opacity: 0; transition: 0.3s; }
                .gallery-card:hover .card-hint { opacity: 1; }

                @media (max-width: 800px) {
                    .gen-main { grid-template-columns: 1fr; }
                    .lite-generator-immersive { padding: 15px 16px 120px; }
                    .header-left h1 { font-size: 1.3rem; }
                    .result-area-immersive { max-width: 500px; margin: 0 auto; }
                }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
