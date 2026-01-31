import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import { Play, Sparkles } from 'lucide-react';
import './BrowsePage.css';
import { useTwitch } from '../../hooks/useTwitch';
// Ensure we're using the generated avatars
import novaImg from '/assets/personas/nova.png';
import lunaImg from '/assets/personas/luna.png';
import roxieImg from '/assets/personas/roxie.png';

const BrowseHero = ({ featuredPersona }) => {
    const navigate = useNavigate();

    // Explicitly handle "No Featured" case
    if (!featuredPersona) {
        return (
            <div className="browse-hero-skeleton">
                <div className="skeleton-content">Initialize Official Agents...</div>
            </div>
        );
    }

    return (
        <div className="browse-hero-container" onClick={() => navigate(`/channel/${featuredPersona.id}`)}>
            <div className="hero-content-split">
                <div className="hero-video-preview">
                    {/* Force official image if available, else fallback */}
                    <img src={featuredPersona.id === 'persona-nova' ? novaImg : featuredPersona.imageUrl} alt={featuredPersona.name} />
                    <div className="live-badge-hero">LIVE</div>
                    <div className="hero-overlay-play">
                        <Play size={64} fill="white" />
                    </div>
                </div>
                <div className="hero-info-section">
                    <div className="hero-streamer-header">
                        <div className="hero-meta">
                            <h2 className="hero-name">{featuredPersona.name}</h2>
                            <p className="hero-game">{featuredPersona.category}</p>
                            <div className="hero-tags">
                                <span className="tag-twitch-official">OFFICIAL AGENT</span>
                                <span className="tag-twitch">LIVE</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-description">
                        {featuredPersona.bio}
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

    // STRICTLY find our 3 characters from the context list
    // The context should already be filtered, but we double-check here for UI safety
    const nova = personas.find(p => p.id === 'persona-nova');
    const luna = personas.find(p => p.id === 'persona-luna');
    const roxie = personas.find(p => p.id === 'persona-roxie');

    // Display order: Nova is Hero. Luna and Roxie are secondary cards.
    const secondaryPersonas = [luna, roxie].filter(Boolean);

    return (
        <div className="browse-page-twitch">
            <SEO title="Browse - DreamBees Live" />

            <header className="browse-header-main">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles color="#a970ff" />
                    <h1>DreamBees Live</h1>
                </div>
                <p>Interact with our <span style={{ color: '#a970ff', fontWeight: 'bold' }}>Official AI Agents</span>.</p>
            </header>

            {/* Nova is always the Hero if she exists */}
            <BrowseHero featuredPersona={nova} />

            <section className="live-streams-grid">
                <h2>Active Channels</h2>
                <div className="streams-grid">
                    {loading ? (
                        [1, 2].map(n => <div key={n} className="stream-skeleton"></div>)
                    ) : (
                        secondaryPersonas.length > 0 ? secondaryPersonas.map(p => (
                            <div key={p.id} className="stream-card-twitch" onClick={() => navigate(`/channel/${p.id}`)}>
                                <div className="card-thumbnail">
                                    <img src={p.id === 'persona-luna' ? lunaImg : roxieImg} alt={p.name} />
                                    <div className="card-badges">
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <span className="live-badge-card">LIVE</span>
                                        </div>
                                        <span className="viewers-count-card">
                                            {Math.floor((p.hypeScore || 100) / 10)}k viewers
                                        </span>
                                    </div>
                                    <div className="play-overlay">
                                        <Play fill="white" size={48} />
                                    </div>
                                </div>
                                <div className="card-details-twitch">
                                    <div className="card-info-text">
                                        <h3 className="card-title-twitch">{p.streamTitle || `Live with ${p.name}`}</h3>
                                        <p className="card-author-twitch">{p.name}</p>
                                        <p className="card-game-twitch">{p.category}</p>
                                        <div className="card-tags-twitch">
                                            <span className="tag-twitch-hype">Official</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state-browse">
                                <p>Other agents are currently offline.</p>
                            </div>
                        )
                    )}
                </div>
            </section>
        </div>
    );
};

export default BrowsePage;
