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
                    <Link to="/" className="model-jewel glass-immersive clickable">
                        <div className="status-orb-glow"></div>
                        <span>{selectedModel?.name || "Select Engine"}</span>
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
                                                    x: [0, (Math.random() - 0.5) * 250],
                                                    y: [0, (Math.random() - 0.5) * 250],
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
                                        <IconSparkles size={56} className="breathe" />
                                    </div>
                                    <h3>Begin the Dream</h3>
                                    <p>What shall we manifest today?</p>
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

                <form className="journal-area glass-immersive" onSubmit={handleGenerate}>
                    <textarea 
                        placeholder="Speak your vision into existence..."
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
                            <IconMagic size={12} />
                            <span>⌘ + ↵ to Materialize</span>
                        </div>
                        <button type="submit" disabled={generating || !prompt} className="manifest-btn">
                            <AnimatePresence mode="wait">
                                {generating ? (
                                    <motion.div key="l" exit={{ scale: 0 }} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <IconLoader size={20} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="z" exit={{ scale: 0 }} initial={{ scale: 0 }} animate={{ scale: 1 }} className="btn-icon-stack">
                                        <IconZap size={18} fill="currentColor" />
                                        <IconSparkles size={14} className="sparkle-overlay" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <span>{generating ? 'Awakening' : 'Materialize'}</span>
                        </button>
                    </div>
                </form>

                <section className="latent-gallery">
                    <div className="gallery-header">
                        <IconLayers size={14} />
                        <span>Latent Archive</span>
                    </div>
                    <div className="gallery-grid">
                        {localHistory.slice(1, 10).map((item, idx) => (
                            <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, ease: "easeOut" }}
                                whileHover={{ scale: 1.08, y: -8, zIndex: 10 }}
                                className="gallery-card glass-immersive"
                            >
                                <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt="" />
                                <div className="card-hint">{item.prompt.substring(0, 30)}...</div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            <style>{`
                .lite-generator-immersive { min-height: 100vh; padding: 40px 24px 140px; max-width: 900px; margin: 0 auto; position: relative; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 25s infinite alternate ease-in-out; }
                .mesh-1 { width: 700px; height: 700px; background: rgba(139, 92, 246, 0.25); top: -250px; right: -150px; }
                .mesh-2 { width: 600px; height: 600px; background: rgba(245, 158, 11, 0.15); bottom: -150px; left: -150px; animation-delay: -7s; }
                .mesh-3 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); top: 30%; left: 10%; animation-duration: 30s; }
                
                @keyframes drift { 
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    100% { transform: translate(60px, 60px) scale(1.15) rotate(15deg); }
                }

                .gen-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
                .header-left h1 { font-size: 2rem; margin-top: 4px; letter-spacing: -1.5px; }
                .welcome-tag { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: var(--color-accent); opacity: 0.8; }
                
                .model-jewel { display: flex; align-items: center; gap: 10px; padding: 10px 24px; border-radius: 99px; font-weight: 900; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: white; text-decoration: none; border: 1px solid rgba(255,255,255,0.08); transition: all 0.4s; }
                .model-jewel:hover { border-color: var(--color-accent); transform: translateY(-3px); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.2); }
                .status-orb-glow { width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); box-shadow: 0 0 10px var(--color-accent); animation: pulse 2s infinite; }

                .canvas-wrapper { width: 100%; margin-bottom: 30px; perspective: 1000px; }
                .result-area-immersive { width: 100%; aspect-ratio: 1/1; border-radius: 48px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05); }
                
                .image-container { width: 100%; height: 100%; position: relative; }
                .main-image-immersive { width: 100%; height: 100%; object-fit: cover; }
                .image-reflection { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.3)); pointer-events: none; }
                .image-info-overlay { position: absolute; bottom: 25px; left: 25px; right: 25px; padding: 16px; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); transform: translateY(100%); opacity: 0; transition: all 0.4s; }
                .image-container:hover .image-info-overlay { transform: translateY(0); opacity: 1; }
                .image-info-overlay p { color: white; font-size: 0.85rem; font-weight: 600; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

                .dream-seed-placeholder { text-align: center; color: var(--color-zinc-400); display: flex; flex-direction: column; align-items: center; gap: 15px; }
                .seed-visual { width: 90px; height: 90px; border-radius: 32px; background: var(--color-accent-soft); display: flex; align-items: center; justify-content: center; color: var(--color-accent); margin-bottom: 5px; box-shadow: 0 15px 30px rgba(139, 92, 246, 0.1); }
                .dream-seed-placeholder h3 { color: white; font-size: 1.5rem; letter-spacing: -1px; }
                .suggestion-chips { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; justify-content: center; }
                .chip { background: rgba(255,255,255,0.03); color: #71717a; padding: 8px 18px; border-radius: 14px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s; }
                .chip:hover { background: var(--color-accent-soft); color: var(--color-accent); border-color: var(--color-accent); transform: translateY(-2px); }

                .latent-swirl-container { position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }
                .swirl-ring { position: absolute; border: 2px solid transparent; border-radius: 50%; animation: spin var(--d) linear infinite; }
                .ring-1 { width: 160px; height: 160px; border-top-color: var(--color-accent); --d: 3s; opacity: 0.6; }
                .ring-2 { width: 120px; height: 120px; border-right-color: var(--color-dream-purple); --d: 2s; opacity: 0.4; }
                .ring-3 { width: 80px; height: 80px; border-bottom-color: var(--color-soft-gold); --d: 4s; opacity: 0.2; }
                .core-zap { z-index: 5; filter: drop-shadow(0 0 15px var(--color-accent)); }
                .magic-particle { position: absolute; width: 3px; height: 3px; background: white; border-radius: 50%; box-shadow: 0 0 8px var(--color-accent); }
                
                .dreaming-text { font-weight: 800; font-size: 1rem; color: #71717a; margin-top: 20px; }
                .dreaming-text span { color: var(--color-accent); }

                .journal-area { padding: 24px; border-radius: 32px; display: flex; flex-direction: column; gap: 15px; margin-bottom: 50px; border: 1px solid rgba(255,255,255,0.05); }
                textarea { width: 100%; background: transparent; border: none; color: white; font-size: 1.15rem; padding: 5px; min-height: 100px; resize: none; outline: none; line-height: 1.5; font-weight: 600; }
                textarea::placeholder { color: #3f3f46; opacity: 0.4; }
                
                .journal-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.04); }
                .hint { display: flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 900; color: #3f3f46; text-transform: uppercase; letter-spacing: 2px; }
                
                .manifest-btn { background: var(--color-accent); color: white; border: none; padding: 14px 32px; border-radius: 20px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 2px; position: relative; overflow: hidden; }
                .manifest-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.3); }
                .manifest-btn:active:not(:disabled) { transform: translateY(-1px); }
                .manifest-btn:disabled { background: rgba(255,255,255,0.03); color: #3f3f46; cursor: not-allowed; }
                
                .btn-icon-stack { position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
                .sparkle-overlay { position: absolute; top: -5px; right: -5px; color: var(--color-soft-gold); }

                .latent-gallery { margin-top: 10px; }
                .gallery-header { display: flex; align-items: center; gap: 10px; color: #3f3f46; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 25px; }
                .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; }
                .gallery-card { aspect-ratio: 1/1; border-radius: 24px; overflow: hidden; position: relative; cursor: pointer; border: 1px solid rgba(255,255,255,0.04); }
                .gallery-card img { width: 100%; height: 100%; object-fit: cover; }
                .card-hint { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 10px; color: white; font-size: 0.65rem; font-weight: 700; text-align: center; opacity: 0; transition: all 0.3s; }
                .gallery-card:hover .card-hint { opacity: 1; }

                @media (max-width: 600px) {
                    .lite-generator-immersive { padding: 30px 16px 120px; }
                    .gen-header { flex-direction: column; align-items: flex-start; gap: 20px; }
                    .header-left h1 { font-size: 1.8rem; }
                }

                @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.9); } }
            `}</style>
        </div>
    );
}
