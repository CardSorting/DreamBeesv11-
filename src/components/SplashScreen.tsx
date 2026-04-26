import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconZap, IconSparkles } from '../icons';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(false), 3200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(30px)' }}
                    transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                    className="splash-screen"
                >
                    <div className="mesh-gradient-container">
                        <div className="mesh-ball mesh-1"></div>
                        <div className="mesh-ball mesh-2"></div>
                        <div className="mesh-ball mesh-3"></div>
                        <div className="mesh-ball mesh-4"></div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
                        className="splash-content"
                    >
                        <div className="splash-logo-container">
                            <motion.div 
                                animate={{ 
                                    rotate: [0, 8, -8, 0],
                                    scale: [1, 1.08, 0.96, 1]
                                }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="splash-logo"
                            >
                                <IconZap size={96} fill="var(--color-accent)" />
                                <motion.div 
                                    className="logo-sparkle"
                                    animate={{ opacity: [0, 1, 0], scale: [0.4, 1.4, 0.4] }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                >
                                    <IconSparkles size={40} />
                                </motion.div>
                            </motion.div>
                        </div>
                        
                        <motion.h1
                            className="text-jeweled"
                            initial={{ letterSpacing: '12px', opacity: 0 }}
                            animate={{ letterSpacing: '-6px', opacity: 1 }}
                            transition={{ duration: 1.8, ease: "easeOut" }}
                            style={{ fontSize: '4.5rem' }}
                        >
                            DreamBees<span>LITE</span>
                        </motion.h1>
                        
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <p className="splash-sub">Harmonizing the creative latent...</p>
                        </motion.div>
                        
                        <div className="loading-track">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2.8, ease: "easeInOut" }}
                                className="loading-fill"
                            />
                        </div>
                    </motion.div>

                    <style>{`
                        .splash-screen { position: fixed; inset: 0; background: #060608; z-index: 10000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                        
                        .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.6; }
                        .mesh-ball { position: absolute; border-radius: 50%; filter: blur(140px); animation: splash-float 30s infinite alternate ease-in-out; }
                        .mesh-1 { width: 1200px; height: 1200px; background: rgba(139, 92, 246, 0.45); top: -400px; right: -300px; }
                        .mesh-2 { width: 900px; height: 900px; background: rgba(217, 70, 239, 0.3); bottom: -300px; left: -300px; animation-delay: -7s; }
                        .mesh-3 { width: 600px; height: 600px; background: rgba(245, 158, 11, 0.2); top: 10%; left: 20%; animation-duration: 35s; }
                        .mesh-4 { width: 800px; height: 800px; background: rgba(168, 85, 247, 0.15); bottom: 10%; right: 10%; animation-delay: -12s; }
                        
                        @keyframes splash-float { 
                            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                            100% { transform: translate(150px, 150px) scale(1.4) rotate(20deg); }
                        }

                        .splash-content { text-align: center; z-index: 10; position: relative; }
                        .splash-logo-container { position: relative; width: 140px; height: 140px; margin: 0 auto 40px; display: flex; align-items: center; justify-content: center; }
                        .splash-logo { position: relative; filter: drop-shadow(0 0 50px rgba(139, 92, 246, 0.7)); }
                        .logo-sparkle { position: absolute; top: -15px; right: -15px; color: var(--color-soft-gold); filter: drop-shadow(0 0 15px var(--color-soft-gold)); }
                        
                        .splash-content h1 span { color: var(--color-white); opacity: 0.5; font-size: 0.4em; vertical-align: middle; margin-left: 10px; letter-spacing: 4px; }
                        .splash-sub { color: #a1a1aa; font-weight: 800; font-size: 0.8rem; letter-spacing: 4px; text-transform: uppercase; opacity: 0.5; margin-top: 20px; }

                        .loading-track { width: 300px; height: 2px; background: rgba(255,255,255,0.04); border-radius: 10px; margin: 60px auto 0; overflow: hidden; position: relative; }
                        .loading-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-dream-purple), var(--color-accent)); background-size: 200% 100%; animation: shimmer 2s infinite linear; box-shadow: 0 0 20px var(--color-accent); }
                        
                        @keyframes shimmer {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
