import React, { useMemo, useEffect, useState } from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl, calculateTier, USER_TIERS } from '../lite-utils';
import { IconUser, IconLogOut, IconLayers, IconZap, IconSparkles, IconMagic, IconActivity, IconDatabase, IconCpu } from '../icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function UserProfile() {
    const { currentUser, logout, localHistory, addToast } = useLite();
    const [health, setHealth] = useState<any>(null);
    const [showHealth, setShowHealth] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredHistory = useMemo(() => {
        if (!searchQuery) return localHistory;
        const q = searchQuery.toLowerCase();
        return localHistory.filter(item => 
            item.prompt.toLowerCase().includes(q) || 
            item.id.toLowerCase().includes(q)
        );
    }, [localHistory, searchQuery]);

    useEffect(() => {
        const checkHealth = async () => {
            if (window.electronAPI?.lite?.health) {
                const h = await window.electronAPI.lite.health();
                setHealth(h);
            }
        };
        checkHealth();
    }, []);

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
        const tier = calculateTier(genCount);
        
        const nextTier = USER_TIERS.find(t => t.minGens > genCount);
        const milestone = nextTier ? nextTier.minGens : (genCount > 100 ? 500 : 100);

        return {
            totalGenerations: genCount,
            tier: tier.level,
            tierColor: tier.color,
            benefits: tier.benefits,
            nextMilestone: milestone
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

                        <div className="spacer"></div>

                        <div className="benefit-stack">
                            {stats.benefits.map((b, i) => (
                                <motion.div 
                                    key={b} 
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (i * 0.1) }}
                                    className="benefit-pill"
                                >
                                    <IconSparkles size={10} />
                                    <span>{b}</span>
                                </motion.div>
                            ))}
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

                        <div className="profile-actions-hardened">
                            <button 
                                onClick={() => setShowHealth(!showHealth)} 
                                className={`health-toggle clickable ${showHealth ? 'active' : ''}`}
                                title="System Diagnostics"
                            >
                                <IconActivity size={18} />
                                <span>Diagnostics</span>
                            </button>
                            <button onClick={handleLogout} className="exit-studio-btn clickable">
                                <IconLogOut size={18} />
                                <span>Exit</span>
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showHealth && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="health-dashboard-expanded"
                            >
                                <div className="diagnostic-grid">
                                    <div className="diag-item">
                                        <div className="diag-header">
                                            <IconDatabase size={14} />
                                            <span>Local Ledger</span>
                                        </div>
                                        <div className="diag-status">
                                            <div className={`status-dot ${health?.dbAvailable ? 'online' : 'offline'}`}></div>
                                            <span>{health?.dbAvailable ? 'Encrypted & Online' : 'Unavailable'}</span>
                                        </div>
                                    </div>
                                    <div className="diag-item">
                                        <div className="diag-header">
                                            <IconActivity size={14} />
                                            <span>Engine Bridge</span>
                                        </div>
                                        <div className="diag-status">
                                            <div className="status-dot online"></div>
                                            <span>Version {health?.appVersion || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="diag-item">
                                        <div className="diag-header">
                                            <IconCpu size={14} />
                                            <span>Platform Integrity</span>
                                        </div>
                                        <div className="diag-status">
                                            <span>{health?.packaged ? 'Hardened Distribution' : 'Development Build'}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                <section className="latent-archive-expanded">
                    <div className="archive-header-row">
                        <div className="title-group">
                            <IconLayers size={20} />
                            <h2>The Latent Archive</h2>
                        </div>
                        <div className="archive-controls">
                            <div className="search-box glass-immersive">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                <input 
                                    type="text" 
                                    placeholder="Filter visions..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="archive-grid-immersive">
                        {filteredHistory.map((item, index) => (
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
                .lite-profile-immersive { min-height: 100vh; padding: 40px 24px 140px; position: relative; overflow-x: hidden; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 25s infinite alternate ease-in-out; }
                .mesh-1 { width: 700px; height: 700px; background: rgba(139, 92, 246, 0.2); top: -250px; right: -150px; }
                .mesh-2 { width: 600px; height: 600px; background: rgba(245, 158, 11, 0.15); bottom: -150px; left: -150px; animation-delay: -7s; }
                .mesh-3 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); top: 30%; left: 10%; animation-duration: 30s; }
                
                @keyframes drift { 
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    100% { transform: translate(60px, 60px) scale(1.15) rotate(15deg); }
                }

                .content-overlay { position: relative; z-index: 10; max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 60px; }
                
                .profile-hero-immersive { padding: 40px; border-radius: 48px; display: flex; flex-direction: column; gap: 40px; }
                
                .profile-main-info { display: flex; align-items: center; gap: 30px; }
                .avatar-orb-container { position: relative; }
                .avatar-orb { width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,0.02); border: 3px solid; display: flex; align-items: center; justify-content: center; color: white; position: relative; z-index: 2; }
                .tier-badge-floating { position: absolute; bottom: 0; right: 0; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 5; border: 3px solid #18181b; }
                
                .user-identity { display: flex; flex-direction: column; gap: 4px; }
                .tier-label { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8; }
                .user-identity h2 { font-size: 2.5rem; letter-spacing: -2px; line-height: 1; font-weight: 900; color: white; }
                .user-email { color: var(--color-zinc-500); font-weight: 600; font-size: 1rem; opacity: 0.6; }
                
                .stats-dashboard { display: flex; align-items: center; gap: 40px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.06); }
                .stat-card { display: flex; flex-direction: column; gap: 2px; }
                .stat-num { font-size: 1.8rem; font-weight: 900; color: white; line-height: 1; letter-spacing: -1px; }
                .stat-desc { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--color-zinc-500); letter-spacing: 1.5px; }
                .spacer { flex: 1; }
                
                .exit-studio-btn { display: flex; align-items: center; gap: 10px; color: #52525b; font-weight: 900; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; padding: 12px 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.4s; }
                .exit-studio-btn:hover { background: rgba(239, 68, 68, 0.08); color: #ef4444; border-color: rgba(239, 68, 68, 0.15); transform: translateY(-2px); }

                .benefit-stack { display: flex; flex-wrap: wrap; gap: 8px; max-width: 300px; justify-content: flex-end; }
                .benefit-pill { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 99px; display: flex; align-items: center; gap: 6px; font-size: 0.6rem; font-weight: 800; color: var(--color-zinc-400); text-transform: uppercase; letter-spacing: 1px; }
                
                .profile-actions-hardened { display: flex; align-items: center; gap: 12px; }
                .health-toggle { display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); color: var(--color-zinc-500); font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; transition: all 0.3s; }
                .health-toggle:hover { background: rgba(255,255,255,0.05); color: white; }
                .health-toggle.active { background: rgba(139, 92, 246, 0.1); border-color: var(--color-accent); color: var(--color-accent); }
                
                .health-dashboard-expanded { margin-top: 30px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.06); overflow: hidden; }
                .diagnostic-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
                .diag-item { display: flex; flex-direction: column; gap: 10px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 20px; border: 1px solid rgba(255,255,255,0.03); }
                .diag-header { display: flex; align-items: center; gap: 8px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; color: var(--color-zinc-500); letter-spacing: 1.5px; }
                .diag-status { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; font-weight: 700; color: white; }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; }
                .status-dot.online { background: #22c55e; box-shadow: 0 0 10px #22c55e66; }
                .status-dot.offline { background: #ef4444; box-shadow: 0 0 10px #ef444466; }

                .latent-archive-expanded { display: flex; flex-direction: column; gap: 30px; }
                .archive-header-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
                .title-group { display: flex; align-items: center; gap: 12px; }
                .title-group h2 { font-weight: 900; font-size: 1.5rem; letter-spacing: -1px; color: white; }
                .title-group svg { color: var(--color-accent); }
                
                .archive-controls { flex: 1; max-width: 400px; }
                .search-box { display: flex; align-items: center; gap: 12px; padding: 10px 18px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); color: var(--color-zinc-500); }
                .search-box input { background: transparent; border: none; outline: none; color: white; font-size: 0.85rem; font-weight: 600; width: 100%; }
                .search-box input::placeholder { color: var(--color-zinc-600); }
                .search-box:focus-within { border-color: var(--color-accent); background: rgba(139, 92, 246, 0.03); }
                
                .archive-grid-immersive { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
                .archive-jewel { aspect-ratio: 4/5; border-radius: 32px; overflow: hidden; position: relative; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); }
                .jewel-image-wrapper { width: 100%; height: 100%; position: relative; }
                .jewel-image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
                .jewel-reflection { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); pointer-events: none; }
                
                .jewel-details-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 25px; opacity: 0; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); transform: translateY(15px); }
                .archive-jewel:hover .jewel-details-overlay { opacity: 1; transform: translateY(0); }
                .sparkle-icon { color: var(--color-soft-gold); margin-bottom: 10px; }
                .jewel-details-overlay p { font-size: 0.9rem; color: white; font-weight: 600; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

                .empty-archive-immersive { grid-column: 1 / -1; padding: 100px 40px; text-align: center; border-radius: 48px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .empty-visual { width: 80px; height: 80px; border-radius: 28px; background: var(--color-accent-soft); display: flex; align-items: center; justify-content: center; color: var(--color-accent); margin-bottom: 10px; }
                .empty-archive-immersive h3 { font-size: 1.8rem; color: white; letter-spacing: -1.5px; }
                .empty-archive-immersive p { color: var(--color-zinc-500); max-width: 360px; font-size: 1rem; line-height: 1.4; }
                .awaken-btn { background: var(--color-accent); color: white; padding: 16px 36px; border-radius: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 12px; margin-top: 10px; transition: all 0.4s; text-decoration: none; font-size: 0.85rem; }
                .awaken-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.3); }

                @media (max-width: 768px) {
                    .profile-hero-immersive { padding: 30px; }
                    .profile-main-info { flex-direction: column; text-align: center; gap: 20px; }
                    .benefit-stack { justify-content: center; }
                    .stats-dashboard { flex-direction: column; gap: 25px; text-align: center; }
                    .profile-actions-hardened { flex-direction: column; width: 100%; }
                    .health-toggle, .exit-studio-btn { width: 100%; justify-content: center; }
                    .spacer { display: none; }
                    .archive-grid-immersive { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
                    .user-identity h2 { font-size: 2rem; }
                }
            `}</style>
        </div>
    );
}
