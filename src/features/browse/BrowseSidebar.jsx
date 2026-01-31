import React from 'react';
import { useNavigate } from 'react-router-dom';

const BrowseSidebar = ({ followedChannels = [], recommendedChannels = [], isCollapsed = false }) => {
    const navigate = useNavigate();

    return (
        <div className={`browse-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Recommended Channels */}
            <div className="sidebar-group">
                <div className="sidebar-section-title">
                    Recommended Channels
                </div>

                {recommendedChannels.map((channel) => (
                    <div
                        key={channel.id}
                        className="sidebar-item"
                        onClick={() => navigate(`/channel/${channel.id}`)}
                    >
                        <div className="sidebar-avatar">
                            <img src={channel.imageUrl} alt={channel.name} />
                        </div>
                        <div className="sidebar-info">
                            <span className="sidebar-name">{channel.name}</span>
                            <span className="sidebar-category">{channel.category}</span>
                        </div>
                        <div className="sidebar-live-dot"></div>
                    </div>
                ))}
            </div>

            {/* Followed Placeholder - logic can be expanded later */}
            {followedChannels.length > 0 && (
                <div className="sidebar-group" style={{ marginTop: '20px' }}>
                    <div className="sidebar-section-title">
                        Followed Channels
                    </div>
                    {followedChannels.map((channel) => (
                        <div
                            key={channel.id}
                            className="sidebar-item"
                            onClick={() => navigate(`/channel/${channel.id}`)}
                        >
                            <div className="sidebar-avatar">
                                <img src={channel.imageUrl} alt={channel.name} />
                            </div>
                            <div className="sidebar-info">
                                <span className="sidebar-name">{channel.name}</span>
                                <span className="sidebar-category">{channel.category}</span>
                            </div>
                            <div className="sidebar-live-dot"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BrowseSidebar;
