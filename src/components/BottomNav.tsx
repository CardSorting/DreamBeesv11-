import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconHome, IconZap, IconUser, IconSparkles } from '../icons';
import { motion } from 'framer-motion';

export default function BottomNav() {
    return (
        <nav className="bottom-nav-immersive glass-immersive">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <IconHome size={20} />
                <span>Explore</span>
            </NavLink>
            
            <NavLink to="/generate" className={({ isActive }) => `nav-link-center ${isActive ? 'active' : ''}`}>
                <div className="zap-jewel">
                    <IconZap size={24} fill="currentColor" />
                    <motion.div 
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="zap-sparkle"
                    >
                        <IconSparkles size={12} />
                    </motion.div>
                </div>
            </NavLink>
            
            <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <IconUser size={20} />
                <span>Studio</span>
            </NavLink>

            <style>{`
                .bottom-nav-immersive { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); width: 340px; height: 84px; border-radius: 42px; display: flex; align-items: center; justify-content: space-around; padding: 0 10px; z-index: 1000; box-shadow: 0 40px 100px rgba(0,0,0,0.8); }
                
                .nav-link { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #52525b; text-decoration: none; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); flex: 1; }
                .nav-link.active { color: white; }
                .nav-link:hover { color: #a1a1aa; transform: translateY(-2px); }
                
                .nav-link-center { position: relative; flex: 1; display: flex; justify-content: center; }
                .zap-jewel { background: var(--color-accent); color: white; padding: 18px; border-radius: 28px; transform: translateY(-15px); box-shadow: 0 20px 40px rgba(139, 92, 246, 0.4); transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); position: relative; }
                .nav-link-center.active .zap-jewel { transform: translateY(-25px) scale(1.15); box-shadow: 0 30px 60px rgba(139, 92, 246, 0.6); background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); }
                
                .zap-sparkle { position: absolute; top: 8px; right: 8px; color: var(--color-soft-gold); pointer-events: none; }
                
                @media (max-width: 480px) {
                    .bottom-nav-immersive { width: 90%; bottom: 20px; }
                }
            `}</style>
        </nav>
    );
}
