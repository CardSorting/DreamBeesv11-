import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, MessageCircle, Info, RefreshCw, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './TwitchLayout.css';

import { useTwitch } from '../contexts/TwitchContext';

const TwitchLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { followedPersonas, suggestedPersonas, loading } = useTwitch();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className={`twitch-platform-shell ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            {/* Top Navigation */}
            <nav className="twitch-top-nav">
                <div className="nav-left">
                    <div className="twitch-logo-glitch" onClick={() => navigate('/browse')}>
                        <Sparkles size={24} color="#a970ff" fill="#a970ff" />
                    </div>
                    <div className="nav-links-twitch">
                        <span
                            className={location.pathname === '/browse' ? 'active' : ''}
                            onClick={() => navigate('/browse')}
                        >
                            Browse
                        </span>
                        <span
                            className={location.pathname === '/directory' ? 'active' : ''}
                            onClick={() => navigate('/directory')}
                        >
                            Categories
                        </span>
                        <span
                            className={location.pathname === '/following' ? 'active' : ''}
                            onClick={() => navigate('/following')}
                        >
                            Following
                        </span>
                    </div>
                </div>
                <div className="nav-center">
                    <div className="twitch-search-bar">
                        <input type="text" placeholder="Search" />
                        <button className="search-icon-btn"><RefreshCw size={16} /></button>
                    </div>
                </div>
                <div className="nav-right">
                    <div className="nav-icons">
                        <MessageCircle size={20} />
                        <Info size={20} />
                    </div>
                    {currentUser ? (
                        <div className="nav-user-profile" onClick={() => navigate('/profile')}>
                            <div className="user-avatar-mini">
                                {currentUser.photoURL ? <img src={currentUser.photoURL} alt="" /> : 'U'}
                            </div>
                        </div>
                    ) : (
                        <button className="login-btn-twitch" onClick={() => navigate('/auth')}>
                            <LogIn size={16} /> Log In
                        </button>
                    )}
                </div>
            </nav>

            <div className="twitch-main-content">
                {/* Persistent Left Sidebar */}
                <div className={`twitch-sidebar-left ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                    <div className="sidebar-collapse-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                        {isSidebarCollapsed ? '➡️' : '⬅️'}
                    </div>

                    {!isSidebarCollapsed && (
                        <div className="sidebar-section">
                            <div className="sidebar-header">STREAMS</div>
                            <div className="nav-group-sidebar">
                                <div className={`nav-item-sidebar ${location.pathname === '/browse' ? 'active' : ''}`} onClick={() => navigate('/browse')}>
                                    <Sparkles size={20} /> <span>Browse</span>
                                </div>
                                <div className={`nav-item-sidebar ${location.pathname === '/directory' ? 'active' : ''}`} onClick={() => navigate('/directory')}>
                                    <MessageCircle size={20} /> <span>Directory</span>
                                </div>
                                <div className={`nav-item-sidebar ${location.pathname === '/following' ? 'active' : ''}`} onClick={() => navigate('/following')}>
                                    <Heart size={20} /> <span>Following</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="sidebar-section">
                        <div className="sidebar-header">{isSidebarCollapsed ? '' : 'FOLLOWED CHANNELS'}</div>
                        <div className="suggested-channels-list">
                            {followedPersonas.map(p => (
                                <div key={p.id} className="suggested-channel-item" onClick={() => navigate(`/channel/${p.id}`)}>
                                    <div className="channel-avatar">
                                        <img src={p.imageUrl} alt="" />
                                        <div className="live-dot-mini"></div>
                                    </div>
                                    {!isSidebarCollapsed && (
                                        <>
                                            <div className="channel-info-mini">
                                                <p className="channel-name-mini">{p.name}</p>
                                                <p className="channel-game-mini">Streaming AI</p>
                                            </div>
                                            <div className="channel-viewers-mini">
                                                <span className="view-dot"></span> {Math.floor(Math.random() * 5) + 1}k
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-header">{isSidebarCollapsed ? '' : 'RECOMMENDED CHANNELS'}</div>
                        <div className="suggested-channels-list">
                            {suggestedPersonas.map(p => (
                                <div key={p.id} className="suggested-channel-item" onClick={() => navigate(`/channel/${p.id}`)}>
                                    <div className="channel-avatar">
                                        <img src={p.imageUrl} alt="" />
                                        <div className="live-dot-mini"></div>
                                    </div>
                                    {!isSidebarCollapsed && (
                                        <>
                                            <div className="channel-info-mini">
                                                <p className="channel-name-mini">{p.name}</p>
                                                <p className="channel-game-mini">AI Chat</p>
                                            </div>
                                            <div className="channel-viewers-mini">
                                                <span className="view-dot"></span> {Math.floor(Math.random() * 50) + 1}k
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sub-page Content Area */}
                <main className="twitch-sub-page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TwitchLayout;
