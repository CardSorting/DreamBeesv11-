import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hexagon, Home, Compass, Zap, Film, User } from 'lucide-react';

const MinimalHeader = () => {
    const location = useLocation();
    const activePath = location.pathname;

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/discovery', label: 'Discovery', icon: Compass },
        { path: '/generate', label: 'Studio', icon: Zap },
        { path: '/videos', label: 'Videos', icon: Film },
        { path: '/profile', label: 'Profile', icon: User },
    ];

    return (
        <header className="minimal-header">
            <div className="header-content">
                <Link to="/" className="header-logo">
                    <Hexagon size={24} fill="white" className="logo-icon" />
                    <span className="logo-text">DreamBees</span>
                </Link>

                <nav className="header-nav">
                    {navItems.map((item) => {
                        const isActive = activePath === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={18} className="nav-icon" />
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <style>{`
                .minimal-header {
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    width: 100%;
                }

                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 24px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                }

                .logo-text {
                    font-size: 1.1rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.02em;
                }

                .header-nav {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    color: rgba(255, 255, 255, 0.6);
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 500;
                    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
                }

                .nav-link:hover {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.05);
                }

                .nav-link.active {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.1);
                }

                .nav-icon {
                    opacity: 0.8;
                }

                .nav-link.active .nav-icon {
                    opacity: 1;
                    color: #a5b4fc;
                }

                /* Mobile Optimization */
                @media (max-width: 768px) {
                    .nav-label {
                        display: none;
                    }
                    
                    .nav-link {
                        padding: 10px;
                        border-radius: 50%;
                    }
                    
                    .header-content {
                        padding: 0 16px;
                    }
                }
            `}</style>
        </header>
    );
};

export default MinimalHeader;
