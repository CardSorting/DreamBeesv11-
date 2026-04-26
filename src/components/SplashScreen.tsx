import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconZap, IconSparkles } from '../icons';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="splash-screen"
                >
                    <div className="mesh-gradient-container">
                        <div className="mesh-ball mesh-1"></div>
                        <div className="mesh-ball mesh-2"></div>
                        <div className="mesh-ball mesh-3"></div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                        className="splash-content"
                    >
                        <div className="splash-logo-container">
                            <motion.div 
                                animate={{ 
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.05, 0.95, 1]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="splash-logo"
                            >
                                <IconZap size={80} fill="var(--color-accent)" />
                                <motion.div 
                                    className="logo-sparkle"
                                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <IconSparkles size={32} />
                                </motion.div>
                            </motion.div>
                        </div>
                        
                        <motion.h1
                            initial={{ letterSpacing: '10px', opacity: 0 }}
                            animate={{ letterSpacing: '-4px', opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        >
                            DreamBees<span>LITE</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                        >
                            Awakening your latent vision...
                        </motion.p>
                        
                        <div className="loading-track">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                                className="loading-fill"
                            />
                        </div>
                    </motion.div>

                    <style>{`
                        .splash-screen { position: fixed; inset: 0; background: #09090b; z-index: 10000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                        
                        .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.5; }
                        .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: float 25s infinite alternate ease-in-out; }
                        .mesh-1 { width: 900px; height: 900px; background: rgba(139, 92, 246, 0.4); top: -300px; right: -200px; }
                        .mesh-2 { width: 700px; height: 700px; background: rgba(217, 70, 239, 0.25); bottom: -200px; left: -200px; animation-delay: -5s; }
                        .mesh-3 { width: 500px; height: 500px; background: rgba(245, 158, 11, 0.15); top: 20%; left: 30%; animation-duration: 30s; }
                        
                        @keyframes float { 
                            0% { transform: translate(0, 0) scale(1); }
                            100% { transform: translate(120px, 120px) scale(1.3); }
                        }

                        .splash-content { text-align: center; z-index: 10; }
                        .splash-logo-container { position: relative; width: 120px; height: 120px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; }
                        .splash-logo { position: relative; filter: drop-shadow(0 0 40px rgba(139, 92, 246, 0.6)); }
                        .logo-sparkle { position: absolute; top: -10px; right: -10px; color: var(--color-soft-gold); filter: drop-shadow(0 0 10px var(--color-soft-gold)); }
                        
                        .splash-content h1 { font-size: 4rem; font-weight: 900; color: white; margin-bottom: 15px; }
                        .splash-content h1 span { color: var(--color-accent); text-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
                        .splash-content p { color: #a1a1aa; font-weight: 700; font-size: 1.1rem; letter-spacing: 2px; text-transform: uppercase; opacity: 0.6; }

                        .loading-track { width: 240px; height: 3px; background: rgba(255,255,255,0.03); border-radius: 10px; margin: 50px auto 0; overflow: hidden; position: relative; }
                        .loading-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-dream-purple)); box-shadow: 0 0 15px var(--color-accent); }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
