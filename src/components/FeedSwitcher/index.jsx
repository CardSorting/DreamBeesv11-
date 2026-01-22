import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutGrid, Palette, Smile } from 'lucide-react';
import './FeedSwitcher.css';

const FEEDS = [
    { id: 'hive', label: 'Hive', path: '/', icon: Sparkles },
    { id: 'discovery', label: 'Discovery', path: '/discovery', icon: LayoutGrid },
    { id: 'mockups', label: 'Mockups', path: '/mockups', icon: Palette },
    { id: 'memes', label: 'Memes', path: '/memes', icon: Smile },
];

export default function FeedSwitcher() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/' || location.pathname.startsWith('/filter/');
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="feed-switcher-container">
            <div className="feed-switcher-pills">
                {FEEDS.map((feed) => {
                    const ActiveIcon = feed.icon;
                    const active = isActive(feed.path);
                    return (
                        <button
                            key={feed.id}
                            className={`feed-pill ${active ? 'active' : ''}`}
                            onClick={() => navigate(feed.path)}
                        >
                            <ActiveIcon size={18} className="pill-icon" />
                            <span className="pill-label">{feed.label}</span>
                            {active && <div className="pill-active-indicator" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
