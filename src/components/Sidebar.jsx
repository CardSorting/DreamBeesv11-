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
            title: "EXPLORE",
            items: [

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
                {visibleGroups.map((group) => (
                    <CollapsibleGroup key={group.title} title={group.title}>
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
        </aside>
    );
};

export default React.memo(Sidebar);
