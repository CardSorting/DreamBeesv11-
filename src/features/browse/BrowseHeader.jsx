import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, LogIn, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BrowseHeader = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    return (
        <header className="browse-header">
            <div className="browse-brand" onClick={() => navigate('/')}>
                <Sparkles size={24} />
                <span>DreamBees</span>
            </div>

            <nav className="browse-nav-links">
                <a className="browse-nav-item active">Browse</a>
                <a className="browse-nav-item" onClick={() => navigate('/following')}>Following</a>
            </nav>

            <div className="browse-search">
                <input type="text" placeholder="Search" />
                <button className="browse-search-btn">
                    <Search size={18} color="#efeff1" />
                </button>
            </div>

            <div className="browse-user-controls">
                {currentUser ? (
                    <div className="browse-brand" onClick={() => navigate('/profile')}>
                        <User size={20} />
                    </div>
                ) : (
                    <button className="browse-login-btn" onClick={() => navigate('/auth')}>
                        Log In
                    </button>
                )}
            </div>
        </header>
    );
};

export default BrowseHeader;
