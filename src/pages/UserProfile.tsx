import React, { useMemo } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconUser, IconLogOut, IconLayers, IconZap, IconSparkles, IconMagic } from '../icons';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function UserProfile() {
    const { currentUser, logout, localHistory, addToast } = useLite();

    const handleLogout = async () => {
        try {
            await logout();
            addToast("Your visions are safe with us. See you soon.", "success");
        } catch (err: any) {
            addToast(err.message, "error");
        }
    };

    const stats = useMemo(() => {
        const genCount = localHistory.length;
        let tier = "Novice Dreamer";
        let tierColor = "#a1a1aa";
        
        if (genCount > 50) { tier = "Master Visionary"; tierColor = "#fbbf24"; }
        else if (genCount > 20) { tier = "Elite Artisan"; tierColor = "#a855f7"; }
        else if (genCount > 5) { tier = "Creative Adept"; tierColor = "#8b5cf6"; }

        return {
            totalGenerations: genCount,
            tier,
            tierColor,
            nextMilestone: genCount > 50 ? 100 : (genCount > 20 ? 50 : (genCount > 5 ? 20 : 5))
        };
    }, [localHistory]);

    return (
        <div className="lite-profile-immersive fade-in">
            {/* Dynamic Mesh Background */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
                <div className="mesh-ball mesh-3"></div>
            </div>

            <div className="content-overlay">
                <header className="profile-hero-immersive glass-immersive">
                    <div className="profile-main-info">
                        <div className="avatar-orb-container">
                            <motion.div 
                                animate={{ boxShadow: [`0 0 20px ${stats.tierColor}44`, `0 0 50px ${stats.tierColor}88`, `0 0 20px ${stats.tierColor}44`] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="avatar-orb"
                                style={{ borderColor: stats.tierColor }}
                            >
                                <IconUser size={48} />
                            </motion.div>
                            <div className="tier-badge-floating" style={{ background: stats.tierColor }}>
                                <IconMagic size={12} fill="white" />
                            </div>
                        </div>
                        
                        <div className="user-identity">
                            <motion.span 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="tier-label"
                                style={{ color: stats.tierColor }}
                            >
                                {stats.tier}
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                {currentUser?.email?.split('@')[0] || 'Creator'}
                            </motion.h2>
                            <p className="user-email">{currentUser?.email}</p>
                        </div>
                    </div>
                    
                    <div className="stats-dashboard">
                        <div className="stat-card">
                            <span className="stat-num">{stats.totalGenerations}</span>
                            <span className="stat-desc">Manifestations</span>
                        </div>
                        <div className="stat-card">
                            <div className="progress-ring-box">
                                <span className="stat-num">{Math.round((stats.totalGenerations / stats.nextMilestone) * 100)}%</span>
                            </div>
                            <span className="stat-desc">Tier Progress</span>
                        </div>
                        <div className="spacer"></div>
                        <button onClick={handleLogout} className="exit-studio-btn">
                            <IconLogOut size={18} />
                            <span>Exit Studio</span>
                        </button>
                    </div>
                </header>

                <section className="latent-archive-expanded">
                    <div className="archive-header-row">
                        <div className="title-group">
                            <IconLayers size={20} />
                            <h2>The Latent Archive</h2>
                        </div>
                        <p>Every dream you've materialized, preserved in time.</p>
                    </div>

                    <div className="archive-grid-immersive">
                        {localHistory.map((item, index) => (
                            <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, ease: "easeOut" }}
                                whileHover={{ scale: 1.05, y: -10, zIndex: 10 }}
                                className="archive-jewel glass-immersive"
                            >
                                <div className="jewel-image-wrapper">
                                    <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt="" loading="lazy" />
                                    <div className="jewel-reflection"></div>
                                </div>
                                <div className="jewel-details-overlay">
                                    <IconSparkles size={14} className="sparkle-icon" />
                                    <p>{item.prompt}</p>
                                </div>
                            </motion.div>
                        ))}
                        
                        {localHistory.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="empty-archive-immersive glass-immersive"
                            >
                                <div className="empty-visual organic-float">
                                    <IconZap size={40} />
                                </div>
                                <h3>The archive is silent</h3>
                                <p>Begin your first journey to populate these latent halls.</p>
                                <Link to="/generate" className="awaken-btn">
                                    <span>Start Dreaming</span>
                                    <IconMagic size={18} />
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </section>
            </div>

            <style>{`
                .lite-profile-immersive { min-height: 100vh; padding: 60px 24px 160px; position: relative; overflow-x: hidden; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 25s infinite alternate ease-in-out; }
                .mesh-1 { width: 700px; height: 700px; background: rgba(139, 92, 246, 0.2); top: -250px; right: -150px; }
                .mesh-2 { width: 600px; height: 600px; background: rgba(245, 158, 11, 0.15); bottom: -150px; left: -150px; animation-delay: -7s; }
                .mesh-3 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); top: 30%; left: 10%; animation-duration: 30s; }
                
                @keyframes drift { 
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    100% { transform: translate(60px, 60px) scale(1.15) rotate(15deg); }
                }

                .content-overlay { position: relative; z-index: 10; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 80px; }
                
                .profile-hero-immersive { padding: 60px; border-radius: 64px; display: flex; flex-direction: column; gap: 60px; }
                
                .profile-main-info { display: flex; align-items: center; gap: 40px; }
                .avatar-orb-container { position: relative; }
                .avatar-orb { width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.02); border: 3px solid; display: flex; align-items: center; justify-content: center; color: white; position: relative; z-index: 2; }
                .tier-badge-floating { position: absolute; bottom: 5px; right: 5px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 5; border: 3px solid #18181b; }
                
                .user-identity { display: flex; flex-direction: column; gap: 8px; }
                .tier-label { font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; opacity: 0.8; }
                .user-identity h2 { font-size: 3.5rem; letter-spacing: -3px; line-height: 0.9; font-weight: 900; color: white; }
                .user-email { color: var(--color-zinc-400); font-weight: 600; font-size: 1.1rem; opacity: 0.6; }
                
                .stats-dashboard { display: flex; align-items: center; gap: 50px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.06); }
                .stat-card { display: flex; flex-direction: column; gap: 4px; }
                .stat-num { font-size: 2.5rem; font-weight: 900; color: white; line-height: 1; letter-spacing: -1px; }
                .stat-desc { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--color-zinc-400); letter-spacing: 2px; }
                .progress-ring-box { display: flex; align-items: center; justify-content: center; }
                .spacer { flex: 1; }
                
                .exit-studio-btn { display: flex; align-items: center; gap: 12px; color: #71717a; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; padding: 16px 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.4s; }
                .exit-studio-btn:hover { background: rgba(239, 68, 68, 0.08); color: #ef4444; border-color: rgba(239, 68, 68, 0.15); transform: translateY(-2px); }

                .latent-archive-expanded { display: flex; flex-direction: column; gap: 40px; }
                .archive-header-row { display: flex; flex-direction: column; gap: 10px; }
                .title-group { display: flex; align-items: center; gap: 15px; }
                .title-group h2 { font-weight: 900; font-size: 1.8rem; letter-spacing: -1px; color: white; }
                .title-group svg { color: var(--color-accent); }
                .archive-header-row p { color: var(--color-zinc-400); font-weight: 600; font-size: 1.1rem; }
                
                .archive-grid-immersive { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; }
                .archive-jewel { aspect-ratio: 4/5; border-radius: 48px; overflow: hidden; position: relative; cursor: pointer; }
                .jewel-image-wrapper { width: 100%; height: 100%; position: relative; }
                .jewel-image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
                .jewel-reflection { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); pointer-events: none; }
                
                .jewel-details-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 35px; opacity: 0; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); transform: translateY(20px); }
                .archive-jewel:hover .jewel-details-overlay { opacity: 1; transform: translateY(0); }
                .sparkle-icon { color: var(--color-soft-gold); margin-bottom: 12px; }
                .jewel-details-overlay p { font-size: 1rem; color: white; font-weight: 600; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

                .empty-archive-immersive { grid-column: 1 / -1; padding: 120px 40px; text-align: center; border-radius: 64px; display: flex; flex-direction: column; align-items: center; gap: 25px; }
                .empty-visual { width: 100px; height: 100px; border-radius: 32px; background: var(--color-accent-soft); display: flex; align-items: center; justify-content: center; color: var(--color-accent); margin-bottom: 15px; }
                .empty-archive-immersive h3 { font-size: 2.2rem; color: white; letter-spacing: -2px; }
                .empty-archive-immersive p { color: var(--color-zinc-400); max-width: 400px; font-size: 1.1rem; line-height: 1.5; }
                .awaken-btn { background: var(--color-accent); color: white; padding: 18px 40px; border-radius: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 15px; margin-top: 15px; transition: all 0.4s; text-decoration: none; }
                .awaken-btn:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 40px rgba(139, 92, 246, 0.4); }

                @media (max-width: 768px) {
                    .profile-hero-immersive { padding: 40px 30px; }
                    .profile-main-info { flex-direction: column; text-align: center; }
                    .stats-dashboard { flex-direction: column; gap: 30px; text-align: center; }
                    .spacer { display: none; }
                    .archive-grid-immersive { grid-template-columns: 1fr; }
                    .user-identity h2 { font-size: 2.5rem; }
                }
            `}</style>
        </div>
    );
}
