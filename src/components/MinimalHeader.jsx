import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hexagon, Home, Compass, Zap, Film, User, Plus, Image, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const MinimalHeader = () => {
    const location = useLocation();
    const activePath = location.pathname;
    const { currentUser } = useAuth();
    const [zaps, setZaps] = useState(0);

    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setZaps(data.zaps !== undefined ? data.zaps : (data.credits !== undefined ? data.credits : 0));
            }
        });
        return () => unsub();
    }, [currentUser?.uid]);

    const navItems = [
        { path: '/', label: 'Home', icon: Home, hideOnMobile: true },
        { path: '/discovery', label: 'Discovery', icon: Compass },
        { path: '/generate', label: 'Studio', icon: Zap, hideOnMobile: true },
        { path: '/gallery', label: 'Gallery', icon: Image },
        { path: '/profile', label: 'Profile', icon: User, hideOnMobile: true },
    ];

    const isShowcaseDetail = activePath.startsWith('/discovery/') && activePath !== '/discovery';
    const isGenerator = activePath === '/generate';
    // BottomNav logic from App.jsx: !isShowcaseDetail && pathname !== '/generate'
    const isBottomNavVisible = !isShowcaseDetail && !isGenerator;

    return (
        <header className={`minimal-header ${isBottomNavVisible ? 'hide-on-mobile-if-nav' : ''}`}>
            <div className="header-content">
                <Link to="/discovery" className="mobile-back-nav">
                    <ArrowLeft size={20} />
                    <span>Back to Discovery</span>
                </Link>

                <Link to="/" className="header-logo desktop-only">
                    <Hexagon size={24} fill="white" className="logo-icon" />
                    <span className="logo-text">DreamBees</span>
                </Link>

                <nav className="header-nav desktop-only">
                    {navItems.map((item) => {
                        const isActive = activePath === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-link ${isActive ? 'active' : ''} ${item.hideOnMobile ? 'hide-mobile' : ''}`}
                            >
                                <item.icon size={18} className="nav-icon" />
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="header-actions desktop-only">
                    {currentUser && (
                        <Link to="/pricing" className="credit-badge">
                            <Zap size={14} fill="currentColor" className="zap-icon" />
                            <span className="credit-amount">{typeof zaps === 'number' ? zaps.toFixed(0) : '0'}</span>
                            <div className="add-btn">
                                <Plus size={12} />
                            </div>
                        </Link>
                    )}
                </div>
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

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .credit-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 6px 6px 12px;
                    background: rgba(139, 92, 246, 0.1);
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 20px;
                    color: #fff;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    height: 32px;
                }

                .credit-badge:hover {
                    background: rgba(139, 92, 246, 0.2);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
                }

                .zap-icon {
                    color: #a78bfa;
                }

                .credit-amount {
                    font-size: 0.9rem;
                    font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    margin-right: 4px;
                }

                .add-btn {
                    width: 20px;
                    height: 20px;
                    background: #8b5cf6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                /* Mobile Back Nav */
                .mobile-back-nav {
                    display: none;
                }

                /* Mobile Optimization */
                @media (max-width: 768px) {
                    .minimal-header.hide-on-mobile-if-nav {
                        display: none !important;
                    }

                    .minimal-header, .minimal-header * {
                        box-sizing: border-box;
                    }

                    .header-content {
                        padding: 0 16px;
                        height: 52px;
                        justify-content: flex-start; /* Align back button to left */
                    }

                    .desktop-only {
                        display: none !important;
                    }

                    .mobile-back-nav {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        text-decoration: none;
                        color: rgba(255, 255, 255, 0.9);
                        font-weight: 500;
                        font-size: 0.95rem;
                        transition: opacity 0.2s;
                    }
                    
                    .mobile-back-nav:active {
                        opacity: 0.7;
                    }
                }
            `}</style>
        </header>
    );
};

export default MinimalHeader;
