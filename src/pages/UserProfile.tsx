import React, { useMemo } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconUser, IconLogOut, IconLayers, IconZap } from '../icons';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function UserProfile() {
    const { currentUser, logout, localHistory, addToast } = useLite();

    const handleLogout = async () => {
        try {
            await logout();
            addToast("See you soon, Creator!", "success");
        } catch (err: any) {
            addToast(err.message, "error");
        }
    };

    // Calculate some fun stats for the user
    const stats = useMemo(() => {
        return {
            totalGenerations: localHistory.length,
            daysActive: 1, // Mock
            creationLevel: Math.floor(localHistory.length / 5) + 1
        };
    }, [localHistory]);

    return (
        <div className="lite-profile-immersive fade-in">
            {/* Soft mesh background */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
            </div>

            <div className="content-overlay">
                <header className="profile-header-warm glass-warm">
                    <div className="avatar-section">
                        <div className="avatar-ring-glow">
                            <IconUser size={48} />
                        </div>
                        <div className="user-info">
                            <label className="member-tag">Studio Member</label>
                            <h2>{currentUser?.email?.split('@')[0] || 'Creator'}</h2>
                            <p>{currentUser?.email}</p>
                        </div>
                    </div>
                    
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-value">{stats.totalGenerations}</span>
                            <span className="stat-label">Creations</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{stats.creationLevel}</span>
                            <span className="stat-label">Studio Tier</span>
                        </div>
                        <div className="stat-divider"></div>
                        <button onClick={handleLogout} className="logout-btn-warm">
                            <IconLogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </header>

                <section className="archive-section">
                    <div className="section-header">
                        <div className="title-box">
                            <IconLayers size={18} />
                            <span>Your Latent Archive</span>
                        </div>
                        <p>A collection of your visual journeys.</p>
                    </div>

                    <div className="history-grid-warm">
                        {localHistory.map((item, index) => (
                            <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="history-card-warm glass-warm"
                            >
                                <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt="" loading="lazy" />
                                <div className="card-hover-overlay">
                                    <p>{item.prompt}</p>
                                </div>
                            </motion.div>
                        ))}
                        
                        {localHistory.length === 0 && (
                            <div className="empty-archive glass-warm">
                                <div className="icon-circle">
                                    <IconZap size={32} />
                                </div>
                                <h3>Start your first journey</h3>
                                <p>Your creations will appear here in the archive.</p>
                                <Link to="/generate" className="start-btn">Go to Studio</Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <style>{`
                .lite-profile-immersive { min-height: 100vh; padding: 40px 20px 140px; position: relative; overflow-x: hidden; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.25; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(100px); animation: float 20s infinite alternate ease-in-out; }
                .mesh-1 { width: 600px; height: 600px; background: rgba(139, 92, 246, 0.2); top: -200px; right: -100px; }
                .mesh-2 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); bottom: -100px; left: -100px; animation-delay: -5s; }
                
                @keyframes float { 
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(50px, 50px) scale(1.1); }
                }

                .content-overlay { position: relative; z-index: 10; max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 60px; }
                
                .profile-header-warm { padding: 40px; border-radius: 48px; display: flex; flex-direction: column; gap: 40px; }
                
                .avatar-section { display: flex; align-items: center; gap: 30px; }
                .avatar-ring-glow { width: 100px; height: 100px; border-radius: 50%; background: rgba(139, 92, 246, 0.1); border: 2px solid #8b5cf6; display: flex; align-items: center; justify-content: center; color: #8b5cf6; box-shadow: 0 0 30px rgba(139, 92, 246, 0.3); }
                
                .user-info { display: flex; flex-direction: column; gap: 4px; }
                .member-tag { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #8b5cf6; }
                .user-info h2 { font-size: 2.5rem; letter-spacing: -2px; line-height: 1; }
                .user-info p { color: #52525b; font-weight: 600; font-size: 1rem; }
                
                .stats-row { display: flex; align-items: center; gap: 40px; border-top: 1px solid rgba(255,255,255,0.05); pt: 30px; padding-top: 30px; }
                .stat-item { display: flex; flex-direction: column; gap: 2px; }
                .stat-value { font-size: 1.8rem; font-weight: 900; color: white; line-height: 1; }
                .stat-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #52525b; letter-spacing: 1px; }
                .stat-divider { flex: 1; }
                
                .logout-btn-warm { display: flex; align-items: center; gap: 10px; color: #71717a; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; padding: 12px 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s; }
                .logout-btn-warm:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }

                .archive-section { display: flex; flex-direction: column; gap: 30px; }
                .section-header { display: flex; flex-direction: column; gap: 8px; }
                .title-box { display: flex; align-items: center; gap: 12px; font-weight: 900; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; color: white; }
                .title-box span { color: #8b5cf6; }
                .section-header p { color: #52525b; font-weight: 600; }
                
                .history-grid-warm { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
                .history-card-warm { aspect-ratio: 4/5; border-radius: 32px; overflow: hidden; position: relative; cursor: pointer; transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
                .history-card-warm:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
                .history-card-warm img { width: 100%; height: 100%; object-fit: cover; }
                .card-hover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); opacity: 0; transition: opacity 0.3s; display: flex; align-items: flex-end; padding: 25px; }
                .history-card-warm:hover .card-hover-overlay { opacity: 1; }
                .card-hover-overlay p { font-size: 0.9rem; color: white; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }

                .empty-archive { grid-column: 1 / -1; padding: 100px 40px; text-align: center; border-radius: 48px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .icon-circle { width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; color: #3f3f46; }
                .empty-archive h3 { font-size: 1.8rem; color: white; letter-spacing: -1px; }
                .empty-archive p { color: #52525b; max-width: 300px; margin: 0 auto; }
                .start-btn { background: #8b5cf6; color: white; padding: 16px 32px; border-radius: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; transition: all 0.3s; }
                .start-btn:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); }

                @media (max-width: 768px) {
                    .profile-header-warm { padding: 30px; }
                    .avatar-section { flex-direction: column; text-align: center; }
                    .stats-row { flex-direction: column; gap: 20px; }
                    .stat-divider { display: none; }
                    .history-grid-warm { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
