import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutTemplate, Zap, User, Hexagon, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BottomNav = () => {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.uid === 'prT9j3royVTstWLDDcKMoUOU7aQ2';

    return (
        <nav className="bottom-nav visible-mobile">
            <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <Home size={24} />
                <span className="text-secondary">Home</span>
            </NavLink>

            {isAdmin && (
                <NavLink to="/apps" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutTemplate size={24} />
                    <span className="text-secondary">Apps</span>
                </NavLink>
            )}

            {/* Center Action Button - Studio */}
            {currentUser && (
                <NavLink to="/generate" className="bottom-nav-fab">
                    <div className="fab-inner">
                        <Zap size={28} fill="currentColor" />
                    </div>
                </NavLink>
            )}

            {isAdmin && (
                <NavLink to="/models" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <Hexagon size={24} />
                    <span className="text-secondary">Models</span>
                </NavLink>
            )}

            <NavLink to="/video" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <Video size={24} />
                <span className="text-secondary">Video</span>
            </NavLink>

            <NavLink to={currentUser ? "/profile" : "/auth"} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <User size={24} />
                <span className="text-secondary">{currentUser ? 'Profile' : 'Sign In'}</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
