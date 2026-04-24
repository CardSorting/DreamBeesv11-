import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconHome, IconZap, IconUser } from '../icons';

export default function BottomNav() {
    return (
        <nav className="bottom-nav glass">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <IconHome size={20} />
                <span>Feed</span>
            </NavLink>
            <NavLink to="/generate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <div className="zap-pill">
                    <IconZap size={20} fill="currentColor" />
                </div>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <IconUser size={20} />
                <span>Profile</span>
            </NavLink>

            <style>{`
                .bottom-nav { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); width: 280px; height: 64px; border-radius: 32px; display: flex; align-items: center; justify-content: space-around; padding: 0 10px; z-index: 1000; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                .nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #71717a; text-decoration: none; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; transition: color 0.2s; }
                .nav-item.active { color: white; }
                
                .zap-pill { background: #8b5cf6; color: white; padding: 12px; border-radius: 20px; transform: translateY(-5px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4); transition: transform 0.2s; }
                .nav-item.active .zap-pill { transform: translateY(-8px) scale(1.05); }
            `}</style>
        </nav>
    );
}
