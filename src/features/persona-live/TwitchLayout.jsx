import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, MessageCircle, Info, RefreshCw, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './TwitchLayout.css';

import { useTwitch } from '../../contexts/TwitchContext';

import TwitchSidebar from './TwitchSidebar';

const TwitchLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className={`twitch-platform-shell ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            {/* ... Top Nav stays same ... */}
            <nav className="twitch-top-nav">
                {/* ... (keep existing nav content) ... */}
            </nav>

            <div className="twitch-main-content">
                <TwitchSidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                <main className="twitch-sub-page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default TwitchLayout;
