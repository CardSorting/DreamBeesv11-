import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, MessageCircle, Heart, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { useTwitch } from '../contexts/TwitchContext';
import { formatTwitchCount } from '../utils/twitchHelpers';

const TwitchSidebar = ({ isCollapsed, onToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { followedPersonas, suggestedPersonas } = useTwitch();

    return (
        <div className={`twitch-sidebar-left ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-collapse-toggle" onClick={onToggle}>
                {isCollapsed ? '➡️' : '⬅️'}
            </div>

            {!isCollapsed && (
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
                <div className="sidebar-header">{isCollapsed ? '' : 'FOLLOWED CHANNELS'}</div>
                <div className="suggested-channels-list">
                    {followedPersonas.map(p => (
                        <div key={p.id} className="suggested-channel-item" onClick={() => navigate(`/channel/${p.id}`)}>
                            <div className="channel-avatar">
                                <img src={p.imageUrl} alt="" />
                                <div className="live-dot-mini"></div>
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="channel-info-mini">
                                        <p className="channel-name-mini">{p.name}</p>
                                        <p className="channel-game-mini">{p.category || 'AI Streaming'}</p>
                                    </div>
                                    <div className="channel-viewers-mini">
                                        <span className="view-dot"></span> {formatTwitchCount((p.hypeScore || 0) + 1000)}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-header">{isCollapsed ? '' : 'TRENDING CHANNELS'}</div>
                <div className="suggested-channels-list">
                    {suggestedPersonas.map(p => (
                        <div key={p.id} className="suggested-channel-item" onClick={() => navigate(`/channel/${p.id}`)}>
                            <div className="channel-avatar">
                                <img src={p.imageUrl} alt="" />
                                {p.hypeLevel >= 3 && <div className="live-status-dot hype-pulse-mini"></div>}
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="channel-info-mini">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <p className="channel-name-mini">{p.name}</p>
                                            {p.hypeLevel >= 4 && <Zap size={10} fill="#a970ff" color="#a970ff" />}
                                        </div>
                                        <p className="channel-game-mini">{p.category || 'Just Chatting'}</p>
                                    </div>
                                    <div className="channel-viewers-mini">
                                        <span className="view-dot"></span> {formatTwitchCount((p.hypeScore || 0) + 1000)}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TwitchSidebar;
