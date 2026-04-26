import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconHome, IconZap, IconUser } from '../icons';

export default function BottomNav() {
    return (
        <nav className="bottom-nav-warm glass-warm">
            <NavLink to="/" className={({ isActive }) => `nav-item-warm ${isActive ? 'active' : ''}`}>
                <IconHome size={22} />
                <span>Explore</span>
            </NavLink>
            <NavLink to="/generate" className={({ isActive }) => `nav-item-warm ${isActive ? 'active' : ''}`}>
                <div className="zap-pill-warm">
                    <IconZap size={22} fill="currentColor" />
                </div>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-item-warm ${isActive ? 'active' : ''}`}>
                <IconUser size={22} />
                <span>Studio</span>
            </NavLink>

            <style>{`
                .glass-warm { background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 80px rgba(0,0,0,0.6); }

                .bottom-nav-warm { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); width: 320px; height: 80px; border-radius: 40px; display: flex; align-items: center; justify-content: space-around; padding: 0 20px; z-index: 1000; }
                
                .nav-item-warm { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #52525b; text-decoration: none; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
                .nav-item-warm.active { color: white; }
                .nav-item-warm:hover { color: #a1a1aa; transform: translateY(-2px); }
                
                .zap-pill-warm { background: #8b5cf6; color: white; padding: 16px; border-radius: 24px; transform: translateY(-10px); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.4); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
                .nav-item-warm.active .zap-pill-warm { transform: translateY(-15px) scale(1.1); box-shadow: 0 20px 40px rgba(139, 92, 246, 0.6); }
                
                @media (max-width: 480px) {
                    .bottom-nav-warm { width: 90%; bottom: 20px; }
                }
            `}</style>
        </nav>
    );
}
