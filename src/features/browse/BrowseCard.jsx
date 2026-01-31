import React from 'react';
import { useNavigate } from 'react-router-dom';
// Images for offline fallback if needed, matching existing BrowsePage logic
import lunaImg from '/assets/personas/luna.png';
import roxieImg from '/assets/personas/roxie.png';
import defaultAvatar from '/assets/personas/nova.png'; // Fallback to Nova if no avatar

const BrowseCard = ({ persona }) => {
    const navigate = useNavigate();

    // Visual Helpers
    const isLive = true; // For now assuming all in this list are "live" based on existing logic
    const viewerCount = Math.floor((persona.hypeScore || 100) / 10) + 'k';

    // Choose image based on ID or fallback
    let thumbnail = persona.imageUrl;
    // Hardcoded overrides from original logic to ensure images load
    if (persona.id === 'persona-luna') thumbnail = lunaImg;
    if (persona.id === 'persona-roxie') thumbnail = roxieImg;

    return (
        <div className="browse-card" onClick={() => navigate(`/channel/${persona.id}`)}>
            <div className="card-thumbnail-wrapper">
                <img src={thumbnail} alt={persona.name} className="card-thumbnail" />
                <div className="card-badges">
                    {isLive && <span className="live-badge">LIVE</span>}
                    <span className="viewer-count">{viewerCount} Viewers</span>
                </div>
            </div>

            <div className="card-meta">
                <div className="card-avatar">
                    <img src={persona.imageUrl || defaultAvatar} alt={persona.name} />
                </div>
                <div className="card-text">
                    <h3 className="card-title">{persona.streamTitle || `Live with ${persona.name}`}</h3>
                    <p className="card-username">{persona.name}</p>
                    <p className="card-category">{persona.category || 'Just Chatting'}</p>
                    <div className="card-tags">
                        <span className="mini-tag">English</span>
                        <span className="mini-tag">Official</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrowseCard;
