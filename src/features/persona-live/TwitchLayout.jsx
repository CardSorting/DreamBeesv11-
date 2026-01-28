import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Search, User, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TwitchSidebar from './TwitchSidebar';
import './TwitchLayout.css';

const TwitchLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const isChannelView = location.pathname.startsWith('/channel/');

    return (
        <div className={`twitch-platform-shell ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            {/* Top Navigation */}
            {!isChannelView && (
                <nav className="twitch-top-nav">
                    <div className="nav-left">
                        <div className="twitch-logo-glitch" onClick={() => navigate('/browse')}>
                            <Sparkles size={28} color="#a970ff" fill="#a970ff" />
                        </div>
                        <div className="nav-links-twitch">
                            <span
                                className={location.pathname === '/browse' ? 'active' : ''}
                                onClick={() => navigate('/browse')}
                            >
                                Browse
                            </span>
                        </div>
                    </div>

                    <div className="nav-center">
                        <div className="twitch-search-bar">
                            <input type="text" placeholder="Search..." />
                            <button className="search-icon-btn">
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="nav-right">
                        {currentUser ? (
                            <div className="user-avatar-mini" onClick={() => navigate('/profile')}>
                                <User size={20} />
                            </div>
                        ) : (
                            <button className="login-btn-twitch" onClick={() => navigate('/auth')}>
                                <LogIn size={18} />
                                <span>Log In</span>
                            </button>
                        )}
                    </div>
                </nav>
            )}

            <div className={`twitch-main-content ${isChannelView ? 'no-sidebar' : ''}`}>
                {!isChannelView && (
                    <TwitchSidebar
                        isCollapsed={isSidebarCollapsed}
                        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />
                )}

                <main className="twitch-sub-page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TwitchLayout;
