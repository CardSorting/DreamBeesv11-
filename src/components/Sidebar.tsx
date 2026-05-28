import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLite } from '../contexts/LiteContext';
import { IconHome, IconZap, IconUser, IconLogOut, IconSparkles, IconMagic } from '../icons';
import { motion } from 'framer-motion';

export default function Sidebar() {
    const { currentUser, logout, userTier, zaps, isOffline, addToast } = useLite();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            addToast('Logged out. Your local pictures remain safe.', 'success');
            navigate('/auth');
        } catch (err: any) {
            addToast(err.message || 'Logout failed.', 'error');
        }
    };

    const getInitials = () => {
        if (currentUser?.displayName) {
            return currentUser.displayName.slice(0, 2).toUpperCase();
        }
        if (currentUser?.email) {
            return currentUser.email.slice(0, 2).toUpperCase();
        }
        return 'DB';
    };

    const getUserName = () => {
        if (currentUser?.displayName) return currentUser.displayName;
        if (currentUser?.email) return currentUser.email.split('@')[0];
        return 'Guest User';
    };

    const getTierColorClass = (tier: string) => {
        switch (tier) {
            case 'pro': return 'tier-pro';
            case 'architect': return 'tier-architect';
            default: return 'tier-free';
        }
    };

    return (
        <aside className="sidebar glass-immersive">
            {/* Logo Header */}
            <div className="sidebar-header">
                <div className="logo-box">
                    <IconSparkles size={20} className="logo-icon" />
                </div>
                <div className="brand-meta">
                    <span className="brand-title">DreamBees</span>
                    <span className="brand-version">Lite v1.4.11</span>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `side-nav-item ${isActive ? 'active' : ''}`}>
                    <IconHome size={20} />
                    <span className="nav-label">Explore Styles</span>
                    <div className="active-indicator" />
                </NavLink>

                <NavLink to="/generate" className={({ isActive }) => `side-nav-item ${isActive ? 'active' : ''}`}>
                    <IconZap size={20} />
                    <span className="nav-label">Create Canvas</span>
                    <div className="active-indicator" />
                </NavLink>

                <NavLink to="/profile" className={({ isActive }) => `side-nav-item ${isActive ? 'active' : ''}`}>
                    <IconUser size={20} />
                    <span className="nav-label">My Profile</span>
                    <div className="active-indicator" />
                </NavLink>
            </nav>

            {/* Bottom Section */}
            <div className="sidebar-bottom">
                {/* Network sync state */}
                <div className={`network-status ${isOffline ? 'offline' : 'online'}`}>
                    <span className="status-dot animate-pulse" />
                    <span className="status-text">{isOffline ? 'Offline Mode' : 'Online Sync'}</span>
                </div>

                {currentUser ? (
                    <div className="user-profile-panel">
                        <div className="profile-details-row">
                            <div className="user-avatar">{getInitials()}</div>
                            <div className="user-info">
                                <span className="username">{getUserName()}</span>
                                <span className="user-email">{currentUser.email}</span>
                            </div>
                        </div>

                        {/* Subscription & zaps stats */}
                        <div className="stats-badges">
                            <span className={`tier-badge ${getTierColorClass(userTier)}`}>
                                {userTier === 'free' ? 'Dreamer' : userTier === 'pro' ? 'Alchemist' : 'Architect'}
                            </span>
                            <span className="zaps-count">
                                {zaps === 'unlimited' ? '∞' : `${zaps} zaps`}
                            </span>
                        </div>

                        <button type="button" className="btn-logout" onClick={handleLogout} title="Sign Out">
                            <IconLogOut size={16} />
                            <span className="logout-text">Sign Out</span>
                        </button>
                    </div>
                ) : (
                    <div className="auth-prompt-panel">
                        <NavLink to="/auth" className="btn-sidebar-auth">
                            <IconUser size={16} />
                            <span>Sign in</span>
                        </NavLink>
                    </div>
                )}
            </div>

            <style>{`
                .sidebar {
                    width: 250px;
                    height: 100vh;
                    position: fixed;
                    left: 0;
                    top: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    border-right: 1px solid rgba(255, 255, 255, 0.06);
                    background: rgba(12, 12, 14, 0.7);
                    backdrop-filter: blur(40px);
                    z-index: 1000;
                    padding: 24px 16px;
                    transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                }

                .sidebar-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 32px;
                    padding: 0 4px;
                }

                .logo-box {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: rgba(139, 92, 246, 0.15);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    display: grid;
                    place-items: center;
                    flex-shrink: 0;
                }

                .logo-icon {
                    color: var(--color-accent);
                }

                .brand-meta {
                    display: flex;
                    flex-direction: column;
                }

                .brand-title {
                    font-size: 1.1rem;
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: -0.02em;
                }

                .brand-version {
                    font-size: 0.65rem;
                    color: var(--color-zinc-500);
                    font-weight: 700;
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                }

                .side-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 14px;
                    border-radius: 12px;
                    color: var(--color-zinc-400);
                    text-decoration: none;
                    font-size: 0.88rem;
                    font-weight: 700;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .side-nav-item:hover {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.03);
                }

                .side-nav-item.active {
                    color: #fff;
                    background: rgba(139, 92, 246, 0.1);
                    border: 1px solid rgba(139, 92, 246, 0.15);
                }

                .side-nav-item.active svg {
                    color: var(--color-accent);
                }

                .active-indicator {
                    display: none;
                    position: absolute;
                    left: 0;
                    top: 12px;
                    bottom: 12px;
                    width: 3px;
                    background: var(--color-accent);
                    border-radius: 0 4px 4px 0;
                }

                .side-nav-item.active .active-indicator {
                    display: block;
                }

                .sidebar-bottom {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 16px;
                }

                .network-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.72rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 0 4px;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }

                .network-status.online {
                    color: #10b981;
                }

                .network-status.online .status-dot {
                    background: #10b981;
                    box-shadow: 0 0 8px #10b981;
                }

                .network-status.offline {
                    color: #f59e0b;
                }

                .network-status.offline .status-dot {
                    background: #f59e0b;
                    box-shadow: 0 0 8px #f59e0b;
                }

                .user-profile-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: rgba(0, 0, 0, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 14px;
                    padding: 10px;
                }

                .profile-details-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: rgba(139, 92, 246, 0.2);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    display: grid;
                    place-items: center;
                    font-size: 0.75rem;
                    font-weight: 900;
                    color: #fff;
                    flex-shrink: 0;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .username {
                    font-size: 0.8rem;
                    font-weight: 850;
                    color: #fff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .user-email {
                    font-size: 0.65rem;
                    color: var(--color-zinc-500);
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .stats-badges {
                    display: flex;
                    gap: 6px;
                }

                .tier-badge {
                    font-size: 0.62rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 6px;
                    letter-spacing: 0.02em;
                }

                .tier-free {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--color-zinc-400);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .tier-pro {
                    background: rgba(168, 85, 247, 0.12);
                    color: #d8b4fe;
                    border: 1px solid rgba(168, 85, 247, 0.24);
                }

                .tier-architect {
                    background: rgba(245, 158, 11, 0.12);
                    color: #fde68a;
                    border: 1px solid rgba(245, 158, 11, 0.24);
                }

                .zaps-count {
                    font-size: 0.62rem;
                    font-weight: 800;
                    padding: 2px 6px;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    color: var(--color-zinc-300);
                }

                .btn-logout {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 8px;
                    border-radius: 8px;
                    background: rgba(239, 68, 68, 0.05);
                    border: 1px solid rgba(239, 68, 68, 0.15);
                    color: #fca5a5;
                    font-size: 0.72rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-logout:hover {
                    background: rgba(239, 68, 68, 0.12);
                    color: #fee2e2;
                    border-color: rgba(239, 68, 68, 0.3);
                }

                .btn-sidebar-auth {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px;
                    width: 100%;
                    border-radius: 10px;
                    background: var(--color-accent);
                    color: #fff;
                    font-size: 0.8rem;
                    font-weight: 850;
                    text-decoration: none;
                    text-align: center;
                    transition: background 0.2s ease;
                }

                .btn-sidebar-auth:hover {
                    background: #9d76fa;
                }

                /* Responsive Compact Sidebar under 768px */
                @media (max-width: 768px) {
                    .sidebar {
                        width: 76px;
                        padding: 24px 8px;
                        align-items: center;
                    }
                    .brand-meta, .nav-label, .brand-version, .network-status span:last-child, .user-info, .stats-badges, .logout-text {
                        display: none !important;
                    }
                    .sidebar-header {
                        margin-bottom: 24px;
                        justify-content: center;
                        width: 100%;
                    }
                    .sidebar-nav {
                        align-items: center;
                        width: 100%;
                    }
                    .side-nav-item {
                        padding: 12px;
                        justify-content: center;
                        width: 44px;
                        height: 44px;
                    }
                    .network-status {
                        justify-content: center;
                        padding: 0;
                    }
                    .user-profile-panel {
                        padding: 6px;
                        align-items: center;
                        border: none;
                        background: transparent;
                    }
                    .btn-logout {
                        width: 32px;
                        height: 32px;
                        padding: 0;
                        border-radius: 8px;
                    }
                    .btn-sidebar-auth {
                        width: 36px;
                        height: 36px;
                        padding: 0;
                        border-radius: 8px;
                    }
                }
            `}</style>
        </aside>
    );
}
