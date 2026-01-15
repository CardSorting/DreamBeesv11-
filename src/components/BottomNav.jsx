import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutTemplate, Zap, User, Hexagon, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BottomNav = () => {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.uid === 'prT9j3royVTstWLDDcKMoUOU7aQ2';
    const [isVisible, setIsVisible] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show if scrolling up or at very top
            if (currentScrollY < lastScrollY || currentScrollY < 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                // Hide if scrolling down and not at top
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <nav className={`bottom-nav visible-mobile ${isVisible ? 'nav-visible' : 'nav-hidden'}`}>
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
            {isAdmin && (
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
