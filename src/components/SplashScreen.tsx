import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconZap } from '../icons';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="splash-screen"
                >
                    <div className="mesh-gradient-container">
                        <div className="mesh-ball mesh-1"></div>
                        <div className="mesh-ball mesh-2"></div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="splash-content"
                    >
                        <div className="splash-logo">
                            <IconZap size={64} fill="#8b5cf6" />
                        </div>
                        <h1>DreamBees<span>LITE</span></h1>
                        <p>Welcome back, Creator.</p>
                        
                        <div className="loading-bar-root">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                                className="loading-bar-fill"
                            />
                        </div>
                    </motion.div>

                    <style>{`
                        .splash-screen { position: fixed; inset: 0; background: #09090b; z-index: 10000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                        
                        .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.4; }
                        .mesh-ball { position: absolute; border-radius: 50%; filter: blur(100px); animation: float 20s infinite alternate ease-in-out; }
                        .mesh-1 { width: 800px; height: 800px; background: rgba(139, 92, 246, 0.3); top: -300px; right: -200px; }
                        .mesh-2 { width: 600px; height: 600px; background: rgba(217, 70, 239, 0.2); bottom: -200px; left: -200px; animation-delay: -5s; }
                        
                        @keyframes float { 
                            0% { transform: translate(0, 0) scale(1); }
                            100% { transform: translate(100px, 100px) scale(1.2); }
                        }

                        .splash-content { text-align: center; z-index: 10; }
                        .splash-logo { margin-bottom: 20px; filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.5)); }
                        .splash-content h1 { font-size: 3rem; font-weight: 900; letter-spacing: -3px; color: white; margin-bottom: 10px; }
                        .splash-content h1 span { color: #8b5cf6; }
                        .splash-content p { color: #a1a1aa; font-weight: 600; font-size: 1.2rem; letter-spacing: 1px; }

                        .loading-bar-root { width: 200px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; margin: 40px auto 0; overflow: hidden; }
                        .loading-bar-fill { height: 100%; background: #8b5cf6; box-shadow: 0 0 10px #8b5cf6; }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
