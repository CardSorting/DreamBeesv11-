import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconHome, IconZap, IconUser, IconSparkles } from '../icons';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNav() {
    return (
        <nav className="bottom-nav-immersive glass-immersive">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-box">
                    <IconHome size={22} />
                    <motion.div className="active-dot" layoutId="nav-dot" />
                </div>
                <span>Explore</span>
            </NavLink>

            <NavLink to="/generate" className={({ isActive }) => `nav-item-center ${isActive ? 'active' : ''}`}>
                <motion.div 
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="zap-jewel-v2"
                >
                    <IconZap size={28} fill="currentColor" />
                    <div className="zap-glow"></div>
                    <motion.div 
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.3, 0.8] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="zap-sparkle"
                    >
                        <IconSparkles size={14} />
                    </motion.div>
                </motion.div>
            </NavLink>
            
            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="nav-icon-box">
                    <IconUser size={22} />
                    <motion.div className="active-dot" layoutId="nav-dot-2" />
                </div>
                <span>Studio</span>
            </NavLink>

            <style>{`
                .bottom-nav-immersive { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); width: 440px; height: 90px; border-radius: 45px; display: flex; align-items: center; justify-content: space-around; padding: 0 15px; z-index: 1000; box-shadow: 0 50px 100px rgba(0,0,0,0.8); }
                
                .nav-item { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--color-zinc-500); text-decoration: none; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; transition: all 0.4s; flex: 1; position: relative; }
                .nav-item.active { color: white; }
                .nav-item:hover:not(.active) { color: var(--color-zinc-400); transform: translateY(-2px); }
                
                .nav-icon-box { position: relative; display: flex; align-items: center; justify-content: center; }
                .active-dot { position: absolute; bottom: -12px; width: 4px; height: 4px; border-radius: 50%; background: var(--color-accent); box-shadow: 0 0 10px var(--color-accent); }

                .nav-item-center { position: relative; flex: 1.2; display: flex; justify-content: center; align-items: center; text-decoration: none; }
                .zap-jewel-v2 { background: var(--color-accent); color: white; width: 64px; height: 64px; border-radius: 24px; display: flex; align-items: center; justify-content: center; transform: translateY(-15px); box-shadow: 0 20px 40px rgba(139, 92, 246, 0.4); transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); position: relative; border: 1px solid rgba(255,255,255,0.2); }
                
                .nav-item-center.active .zap-jewel-v2 { transform: translateY(-30px) scale(1.1); background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); box-shadow: 0 30px 60px rgba(139, 92, 246, 0.6); }
                .zap-glow { position: absolute; inset: -10px; background: var(--color-accent); filter: blur(30px); opacity: 0; transition: opacity 0.4s; z-index: -1; }
                .nav-item-center.active .zap-glow { opacity: 0.4; }

                .zap-sparkle { position: absolute; top: -8px; right: -8px; color: var(--color-soft-gold); pointer-events: none; }
                
                @media (max-width: 480px) {
                    .bottom-nav-immersive { width: 90%; bottom: 20px; height: 80px; }
                    .zap-jewel-v2 { width: 54px; height: 54px; }
                }
            `}</style>
        </nav>
    );
}
