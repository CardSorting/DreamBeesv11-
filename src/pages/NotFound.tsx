import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { IconHome, IconZap } from '../icons';

export default function NotFound() {
    return (
        <div className="lite-notfound-immersive">
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="notfound-card glass-warm"
            >
                <div className="icon-box-glow">
                    <IconZap size={48} fill="#8b5cf6" />
                </div>
                <h1>Lost in the<span>Latent Space?</span></h1>
                <p>This coordinate doesn't exist yet, but your next masterpiece does.</p>
                
                <Link to="/" className="primary-btn-warm">
                    <IconHome size={20} />
                    <span>Return to Studio</span>
                </Link>
            </motion.div>

            <style>{`
                .lite-notfound-immersive { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #09090b; position: relative; overflow: hidden; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(100px); animation: float 20s infinite alternate ease-in-out; }
                .mesh-1 { width: 600px; height: 600px; background: rgba(139, 92, 246, 0.2); top: -200px; right: -100px; }
                .mesh-2 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); bottom: -100px; left: -100px; animation-delay: -5s; }
                
                @keyframes float { 
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(50px, 50px) scale(1.1); }
                }

                .notfound-card { padding: 80px 40px; border-radius: 48px; text-align: center; max-width: 500px; width: 90%; display: flex; flex-direction: column; align-items: center; gap: 20px; z-index: 10; }
                .icon-box-glow { width: 100px; height: 100px; border-radius: 32px; background: rgba(139, 92, 246, 0.1); display: flex; align-items: center; justify-content: center; color: #8b5cf6; margin-bottom: 10px; box-shadow: 0 0 30px rgba(139, 92, 246, 0.2); }
                
                .notfound-card h1 { font-size: 2.5rem; letter-spacing: -2px; line-height: 1; }
                .notfound-card h1 span { color: #8b5cf6; display: block; }
                .notfound-card p { color: #52525b; font-weight: 600; font-size: 1.1rem; max-width: 300px; margin: 0 auto 20px; }
                
                .primary-btn-warm { background: #8b5cf6; color: white; padding: 16px 32px; border-radius: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 12px; transition: all 0.3s; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); }
                .primary-btn-warm:hover { transform: translateY(-3px) scale(1.05); }
            `}</style>
        </div>
    );
}
