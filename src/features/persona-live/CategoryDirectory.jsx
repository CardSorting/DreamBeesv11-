import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import { useTwitch } from '../../contexts/TwitchContext';
import './CategoryDirectory.css';

const CategoryDirectory = () => {
    const navigate = useNavigate();
    const { categories } = useTwitch();

    // Fallback categories if none awakened yet
    const displayCategories = categories.length > 0 ? categories : [
        { id: 'just-chatting', name: 'Just Chatting', viewers: '0', image: 'https://static-cdn.jtvnw.net/ttv-boxart/509658-188x250.jpg' },
        { id: 'ai-art', name: 'AI Art', viewers: '0', image: 'https://static-cdn.jtvnw.net/ttv-boxart/26330_IGDB-188x250.jpg' }
    ];

    return (
        <div className="directory-page-twitch">
            <SEO title="Categories - PersonaStream" />

            <header className="directory-header">
                <h1>Browse</h1>
            </header>

            <div className="directory-tabs">
                <span className="tab-link active">Categories</span>
                <span className="tab-link" onClick={() => navigate('/browse')}>Live Channels</span>
            </div>

            <div className="category-grid-twitch">
                {displayCategories.map(cat => (
                    <div key={cat.id} className="category-card-twitch" onClick={() => navigate(`/browse`)}>
                        <div className="cat-boxart">
                            <img src={cat.image} alt={cat.name} />
                        </div>
                        <div className="cat-info">
                            <h3 className="cat-name">{cat.name}</h3>
                            <p className="cat-viewers">{cat.viewers} Viewers</p>
                            <div className="cat-tags">
                                <span className="cat-tag">Simulation</span>
                                <span className="cat-tag">IRL</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryDirectory;
