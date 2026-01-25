import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import './CategoryDirectory.css';

const CategoryDirectory = () => {
    const navigate = useNavigate();

    const categories = [
        { id: 'just-chatting', name: 'Just Chatting', viewers: '254k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/509658-188x250.jpg' },
        { id: 'funny', name: 'Comedy & Satire', viewers: '142k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/516575-188x250.jpg' },
        { id: 'academic', name: 'Education', viewers: '84k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/509670-188x250.jpg' },
        { id: 'creative', name: 'Art & AI Art', viewers: '62k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/26330_IGDB-188x250.jpg' },
        { id: 'music', name: 'Music & ASMR', viewers: '45k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/26936-188x250.jpg' },
        { id: 'gaming', name: 'Gaming (AI)', viewers: '120k', image: 'https://static-cdn.jtvnw.net/ttv-boxart/33214-188x250.jpg' }
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
                {categories.map(cat => (
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
