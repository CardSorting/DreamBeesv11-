import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Sparkles, Zap, Layers } from 'lucide-react';
import SEO from '../../components/SEO';
import './AvatarForge.css';

export default function AvatarForgeLayout() {
    const location = useLocation();

    const tabs = [
        { id: 'forge', label: 'Forge', icon: Sparkles, path: '/avatar/forge' },
        { id: 'mint', label: 'Mint', icon: Zap, path: '/avatar/mint' },
        { id: 'floor', label: 'Floor', icon: Layers, path: '/avatar/floor' }
    ];

    return (
        <div className="avatar-forge-page container">
            <SEO
                title="Avatar Forge - Community PFP Pool"
                description="Forge, Mint, and Trade unique AI-generated avatars. Join the community PFP pool."
            />

            {/* Shared Atmospheric Background */}
            <div className="forge-atmosphere">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
            </div>

            {/* Main Content Area */}
            <main className="forge-main-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="forge-page-transition"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Floating Dock Navigation */}
            <div className="forge-dock-container">
                <nav className="forge-dock">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.id}
                            to={tab.path}
                            className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="dock-icon-wrapper">
                                <tab.icon size={22} strokeWidth={2} />
                                {location.pathname === tab.path && (
                                    <motion.div
                                        layoutId="dock-glow"
                                        className="dock-glow"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </div>
                            <span className="dock-label">{tab.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
}
