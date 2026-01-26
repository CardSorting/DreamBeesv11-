import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import { Play } from 'lucide-react';
import './BrowsePage.css';
import { useTwitch } from '../../contexts/TwitchContext';

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
    const { personas, categories, loading } = useTwitch();
    const navigate = useNavigate();

    return (
        <div className="browse-page-twitch">
            <SEO title="Browse - PersonaStream" />

            <BrowseHero featuredPersona={personas[0]} />

            {/* Suggested Categories Carousel */}
            <section className="suggested-categories-section">
                <h2>Suggested Categories</h2>
                <div className="categories-carousel">
                    {categories.length > 0 ? categories.map(cat => (
                        <div key={cat.id} className="category-carousel-card" onClick={() => navigate('/directory')}>
                            <div className="cat-card-image">
                                <img src={cat.image} alt={cat.name} />
                            </div>
                            <div className="cat-card-info">
                                <h3>{cat.name}</h3>
                                <p>{cat.viewers} viewers</p>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-categories">No active categories yet. Start a conversation to awaken one!</div>
                    )}
                </div>
            </section>

            <header className="browse-header">
                <h1>Live Channels</h1>
            </header>

            <section className="live-streams-grid">
                <div className="streams-grid">
                    {loading ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="stream-skeleton"></div>
                        ))
                    ) : (
                        personas.sort((a, b) => (b.hypeScore || 0) - (a.hypeScore || 0)).map(p => (
                            <div key={p.id} className="stream-card-twitch" onClick={() => navigate(`/channel/${p.id}`)}>
                                <div className="card-thumbnail">
                                    <img src={p.imageUrl} alt={p.name} />
                                    <div className="card-badges">
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <span className="live-badge-card">LIVE</span>
                                            {p.hypeLevel >= 3 && (
                                                <span className="hype-badge-card">HYPE</span>
                                            )}
                                        </div>
                                        <span className="viewers-count-card">
                                            {(p.hypeScore || 0) + 1}k viewers
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
                                        <h3 className="card-title-twitch">{p.streamTitle || `Chillin with ${p.name}`}</h3>
                                        <p className="card-author-twitch">{p.name}</p>
                                        <p className="card-game-twitch">{p.category || 'Just Chatting'}</p>
                                        <div className="card-tags-twitch">
                                            <span className="tag-twitch">AI</span>
                                            <span className="tag-twitch">English</span>
                                            {p.hypeLevel >= 4 && <span className="tag-twitch-hype">Trending</span>}
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
