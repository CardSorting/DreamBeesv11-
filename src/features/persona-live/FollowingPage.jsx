import React from 'react';
import { useNavigate } from 'react-router-dom';

import SEO from '../../components/SEO';
import { Play } from 'lucide-react';
import './BrowsePage.css'; // Reusing styles

import { useTwitch } from '../../hooks/useTwitch';

const FollowingPage = () => {
    const { followedPersonas: personas, loading } = useTwitch();
    const navigate = useNavigate();

    return (
        <div className="browse-page-twitch">
            <SEO title="Following - PersonaStream" />

            <header className="browse-header">
                <h1>Following</h1>
            </header>

            <div className="following-tabs" style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #26262c' }}>
                <button className="tab-btn active" style={{ background: 'none', border: 'none', color: '#a970ff', fontWeight: 700, padding: '10px 0', borderBottom: '2px solid #a970ff' }}>Overview</button>
                <button className="tab-btn" style={{ background: 'none', border: 'none', color: '#adadb8', padding: '10px 0' }}>Live</button>
                <button className="tab-btn" style={{ background: 'none', border: 'none', color: '#adadb8', padding: '10px 0' }}>Categories</button>
            </div>

            <section className="live-streams-grid">
                <h2>Live Channels</h2>
                <div className="streams-grid">
                    {loading ? (
                        [1, 2, 3, 4].map(n => <div key={`following-sk-${n}`} className="stream-skeleton"></div>)
                    ) : (
                        personas.map(p => (
                            <div key={p.id} className="stream-card-twitch" onClick={() => navigate(`/channel/${p.id}`)}>
                                <div className="card-thumbnail">
                                    <img src={p.imageUrl} alt={p.name} />
                                    <div className="card-badges">
                                        <span className="live-badge-card">LIVE</span>
                                    </div>
                                    <div className="play-overlay">
                                        <Play fill="white" size={48} />
                                    </div>
                                </div>
                                <div className="card-details-twitch">
                                    <h3 className="card-title-twitch">{p.name}</h3>
                                    <p className="card-game-twitch">Just Chatting</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default FollowingPage;
