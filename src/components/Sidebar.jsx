import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Home, User, LayoutTemplate, Zap, Film, LayoutGrid, Settings, Hexagon,
    ChevronDown, ChevronRight, Compass,
    Package, Images, Smile, Sparkles, Shield, Trophy // Imported for Mockup and Meme features
} from 'lucide-react';

const CollapsibleGroup = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="nav-group">
            <button
                className="sidebar-group-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="group-title-text">{title}</span>
                {isOpen ? <ChevronDown size={14} className="group-chevron" /> : <ChevronRight size={14} className="group-chevron" />}
            </button>
            <div className={`group-content ${isOpen ? 'open' : ''}`}>
                {children}
            </div>
        </div>
    );
};

const Sidebar = ({ activeId }) => {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.uid === 'prT9j3royVTstWLDDcKMoUOU7aQ2';

    // Primary Top Level
    const homeLink = { path: '/', label: 'Home', icon: Home };


    const navGroups = [
        {
            title: "CREATE",
            items: [

                { path: '/generate', label: 'Studio', icon: Zap },
                { path: '/models', label: 'Models', icon: LayoutGrid },
                { path: '/mockup-studio', label: 'Bee Crate', icon: Package },
            ]
        },
        {
            title: "DISCOVER",
            items: [
                { path: '/discovery', label: 'Discovery', icon: Compass },
                { path: '/generations', label: 'Feed', icon: Sparkles },
                { path: '/mockups', label: 'Mockups', icon: Images },
                { path: '/memes', label: 'Memes', icon: Smile },
            ]
        },
        {
            title: "SYSTEM",
            items: [
                { path: '/safety', label: 'Safety Center', icon: Shield },
                { path: '/pricing', label: 'Get Credits', icon: Hexagon },
            ]
        }
    ];

    const visibleGroups = navGroups.map(group => {
        const visibleItems = group.items.filter(item => {
            if (isAdmin) return true;
            // Public items for everyone
            if (item.path === '/discovery') return true;
            if (item.path === '/mockups') return true;
            if (item.path === '/memes') return true;
            if (item.path === '/models') return true;
            if (item.path === '/generations') return true;
            if (item.path === '/generate') return true;


            // Logged in users
            if (currentUser) {
                if (item.path === '/generate') return true;
                if (item.path === '/mockup-studio') return true;
                if (item.path === '/mockup-studio') return true;
                if (item.path === '/pricing') return true;
                if (item.path === '/safety') return true;
            }

            return false;
        });
        return { ...group, items: visibleItems };
    }).filter(group => group.items.length > 0);

    return (
        <aside className="feed-sidebar-left">
            <Link to="/" className="sidebar-logo">
                <Hexagon size={24} fill="white" />
                <span className="logo-text">DreamBees</span>
            </Link>

            <nav className="sidebar-nav">
                {/* Primary Anchor */}
                <div className="nav-group primary-group">
                    <Link
                        to={homeLink.path}
                        className={`sidebar-link primary-link ${activeId === homeLink.path ? 'active' : ''}`}
                    >
                        <homeLink.icon size={20} />
                        <span className="link-label">{homeLink.label}</span>
                    </Link>

                </div>

                {/* Groups */}
                {visibleGroups.map((group, idx) => (
                    <CollapsibleGroup key={idx} title={group.title}>
                        {group.items.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`sidebar-link ${activeId === link.path ? 'active' : ''}`}
                            >
                                <link.icon size={20} />
                                <span className="link-label">{link.label}</span>
                            </Link>
                        ))}
                    </CollapsibleGroup>
                ))}
            </nav>
            <style>{`
                .feed-sidebar-left {
                    /* Ensure scrollability */
                    overflow-y: auto;
                    max-height: 100vh;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.1) transparent;
                    width: 240px; /* Fixed width for sidebar */
                    border-right: 1px solid rgba(255,255,255,0.1);
                    flex-shrink: 0;
                    padding-bottom: 20px;
                }
                .feed-sidebar-left::-webkit-scrollbar {
                    width: 4px;
                }
                .feed-sidebar-left::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                }

                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 24px 24px;
                    text-decoration: none;
                    margin-bottom: 20px;
                }
                .logo-text {
                    font-size: 1.2rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .sidebar-group-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 16px 24px 8px 24px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: rgba(255,255,255,0.4);
                    transition: color 0.2s;
                }
                .sidebar-group-header:hover {
                    color: rgba(255,255,255,0.7);
                }
                .group-title-text {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                .group-chevron {
                    opacity: 0.5;
                }

                .group-content {
                    overflow: hidden;
                    max-height: 0;
                    transition: max-height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                    opacity: 0;
                }
                .group-content.open {
                    max-height: 500px;
                    opacity: 1;
                    transition: max-height 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
                }

                .sidebar-link {
                    padding: 10px 24px;
                    border-left: 3px solid transparent;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    font-size: 0.95rem;
                }
                .sidebar-link:hover {
                    background: rgba(255,255,255,0.03);
                    color: #fff;
                }
                .sidebar-link.active {
                    background: rgba(139, 92, 246, 0.15); /* Brand tint */
                    border-left-color: #8b5cf6;
                    color: #fff;
                }
                .sidebar-link.active .lucide {
                    color: #8b5cf6;
                }
                
                /* Primary Link (Home) Special Styling */
                .primary-group {
                    margin-bottom: 8px;
                }
                .primary-link {
                    font-weight: 600;
                }
                .hype-badge-sidebar {
                    background: #a970ff;
                    color: white;
                    font-size: 0.6rem;
                    font-weight: 800;
                    padding: 1px 4px;
                    border-radius: 2px;
                    margin-left: 6px;
                }

                .hype-pulse {
                    box-shadow: 0 0 0 0 rgba(169, 112, 255, 0.7);
                    animation: pulse-hype 1.5s infinite;
                }

                @keyframes pulse-hype {
                    0% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(169, 112, 255, 0.7);
                    }
                    70% {
                        transform: scale(1);
                        box-shadow: 0 0 0 6px rgba(169, 112, 255, 0);
                    }
                    100% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(169, 112, 255, 0);
                    }
                }
            `}</style>
        </aside>
    );
};

export default React.memo(Sidebar);
