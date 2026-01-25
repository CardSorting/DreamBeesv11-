import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { Play } from 'lucide-react';
import './BrowsePage.css';
import { useTwitch } from '../contexts/TwitchContext';

const BrowseHero = ({ featuredPersona }) => {
    const navigate = useNavigate();
    if (!featuredPersona) return <div className="browse-hero-skeleton"></div>;

    return (
        <div className="browse-hero-container" onClick={() => navigate(`/channel/${featuredPersona.id}`)}>
            <div className="hero-content-split">
                <div className="hero-video-preview">
                    <img src={featuredPersona.imageUrl} alt="" />
                    <div className="live-badge-hero">LIVE</div>
                </div>
                <div className="hero-info-section">
                    <div className="hero-streamer-header">
                        <img src={featuredPersona.imageUrl} alt="" className="hero-avatar" />
                        <div className="hero-meta">
                            <p className="hero-name">{featuredPersona.name}</p>
                            <p className="hero-game">Just Chatting</p>
                            <div className="hero-tags">
                                <span className="tag-twitch">AI Agent</span>
                                <span className="tag-twitch">English</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-description">
                        Check out {featuredPersona.name}'s latest AI-driven stream. Dive into interactive conversations and help shape the story!
                    </div>
                    <button className="watch-btn-hero">Watch Now</button>
                </div>
            </div>
        </div>
    );
};

const BrowsePage = () => {
    const { personas, loading } = useTwitch();
    const navigate = useNavigate();

    const categories = ['All', 'Funny', 'Relaxed', 'Academic', 'Gamer', 'AI Alpha'];

    return (
        <div className="browse-page-twitch">
            <SEO title="Browse - PersonaStream" />

            <BrowseHero featuredPersona={personas[0]} />

            <header className="browse-header">
                <h1>Browse</h1>
            </header>

            <div className="category-chips">
                {categories.map(cat => (
                    <button key={cat} className={`cat-chip ${cat === 'All' ? 'active' : ''}`}>
                        {cat}
                    </button>
                ))}
            </div>

            <section className="live-streams-grid">
                <h2>Live Channels</h2>
                <div className="streams-grid">
                    {loading ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="stream-skeleton"></div>
                        ))
                    ) : (
                        personas.map(p => (
                            <div key={p.id} className="stream-card-twitch" onClick={() => navigate(`/channel/${p.id}`)}>
                                <div className="card-thumbnail">
                                    <img src={p.imageUrl} alt={p.name} />
                                    <div className="card-badges">
                                        <span className="live-badge-card">LIVE</span>
                                        <span className="viewers-count-card">
                                            {Math.floor(Math.random() * 10) + 1}.2k viewers
                                        </span>
                                    </div>
                                    <div className="play-overlay">
                                        <Play fill="white" size={48} />
                                    </div>
                                </div>
                                <div className="card-details-twitch">
                                    <div className="card-avatar-mini">
                                        <img src={p.imageUrl} alt="" />
                                    </div>
                                    <div className="card-info-text">
                                        <h3 className="card-title-twitch">Chillin with {p.name}</h3>
                                        <p className="card-author-twitch">{p.name}</p>
                                        <p className="card-game-twitch">Just Chatting (AI)</p>
                                        <div className="card-tags-twitch">
                                            <span className="tag-twitch">AI</span>
                                            <span className="tag-twitch">English</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default BrowsePage;
