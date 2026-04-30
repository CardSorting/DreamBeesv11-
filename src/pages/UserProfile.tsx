/**
 * [LAYER: INFRASTRUCTURE]
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLite } from '../contexts/LiteContext';
import { calculateTier, getOptimizedImageUrl, USER_TIERS } from '../lite-utils';
import { IconActivity, IconCpu, IconDatabase, IconImage, IconLayers, IconLogOut, IconMagic, IconSparkles, IconUser, IconZap } from '../icons';

type HistoryFilter = 'all' | 'recent' | 'withModel';

interface LocalGeneration {
    id: string;
    prompt: string;
    imageUrl: string;
    modelId?: string;
    createdAt?: number;
}

const historyFilters: Array<{ id: HistoryFilter; label: string; helper: string }> = [
    { id: 'all', label: 'All images', helper: 'Everything saved locally' },
    { id: 'recent', label: 'Recent', helper: 'Newest creations first' },
    { id: 'withModel', label: 'With style info', helper: 'Images that include a style ID' }
];

function formatDate(value?: number) {
    if (!value) return 'Saved locally';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function getDisplayName(email?: string | null, name?: string | null) {
    if (name) return name.split(' ')[0];
    if (email) return email.split('@')[0];
    return 'Creator';
}

export default function UserProfile() {
    const { currentUser, logout, localHistory, addToast } = useLite();
    const navigate = useNavigate();
    const [health, setHealth] = useState<any>(null);
    const [showHealth, setShowHealth] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<HistoryFilter>('all');

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
            addToast('Signed out. Your local history stays on this device.', 'success');
        } catch (err: any) {
            addToast(err.message, 'error');
        }
    };

    const stats = useMemo(() => {
        const totalImages = localHistory.length;
        const tier = calculateTier(totalImages);
        const nextTier = USER_TIERS.find(t => t.minGens > totalImages);
        const nextMilestone = nextTier ? nextTier.minGens : (totalImages > 100 ? 500 : 100);
        const progress = Math.min(100, Math.round((totalImages / nextMilestone) * 100));

        return {
            totalImages,
            tier,
            nextTier,
            nextMilestone,
            progress,
            withModelCount: localHistory.filter((item: LocalGeneration) => Boolean(item.modelId)).length
        };
    }, [localHistory]);

    const filteredHistory = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        let results = [...localHistory] as LocalGeneration[];

        if (activeFilter === 'withModel') {
            results = results.filter(item => Boolean(item.modelId));
        }

        if (activeFilter === 'recent') {
            results = results.slice(0, 12);
        }

        if (!query) return results;

        return results.filter(item =>
            item.prompt?.toLowerCase().includes(query) ||
            item.id?.toLowerCase().includes(query) ||
            item.modelId?.toLowerCase().includes(query)
        );
    }, [activeFilter, localHistory, searchQuery]);

    const displayName = getDisplayName(currentUser?.email, currentUser?.displayName);
    const hasSearchOrFilter = Boolean(searchQuery.trim()) || activeFilter !== 'all';

    return (
        <div className="profile-page fade-in">
            <div className="profile-mesh" aria-hidden="true">
                <div className="mesh-orb orb-one" />
                <div className="mesh-orb orb-two" />
                <div className="mesh-orb orb-three" />
            </div>

            <header className="profile-topbar" aria-label="Profile and history header">
                <div>
                    <nav className="breadcrumbs" aria-label="Breadcrumb">
                        <span>Studio</span>
                        <span>/</span>
                        <span>Profile & history</span>
                    </nav>
                    <h1>Profile & history</h1>
                    <p>Manage your account, review your local image library, and jump back into creating.</p>
                </div>

                <div className="topbar-actions" aria-label="Quick navigation">
                    <Link to="/generate" className="secondary-action primary-action"><IconZap size={16} /> Create image</Link>
                    <Link to="/" className="secondary-action"><IconLayers size={16} /> Choose style</Link>
                    <button type="button" className="secondary-action danger-action" onClick={handleLogout}><IconLogOut size={16} /> Sign out</button>
                </div>
            </header>

            <section className="account-overview glass-immersive" aria-label="Account overview">
                <div className="identity-card">
                    <div className="avatar-ring" style={{ borderColor: stats.tier.color }}>
                        <IconUser size={40} />
                    </div>
                    <div>
                        <span className="section-kicker" style={{ color: stats.tier.color }}>Creator level</span>
                        <h2>{displayName}</h2>
                        <p>{currentUser?.email || 'Signed in creator'}</p>
                    </div>
                </div>

                <div className="level-card">
                    <div className="level-header">
                        <span>{stats.tier.level}</span>
                        <strong>{stats.progress}%</strong>
                    </div>
                    <div className="progress-track" aria-label={`Progress to next milestone: ${stats.progress}%`}>
                        <div style={{ width: `${stats.progress}%`, background: stats.tier.color }} />
                    </div>
                    <p>{stats.nextTier ? `${stats.nextMilestone - stats.totalImages} images until ${stats.nextTier.level}.` : 'You have reached the current top milestone.'}</p>
                </div>

                <div className="benefit-panel">
                    {stats.tier.benefits.map(benefit => (
                        <span key={benefit}><IconSparkles size={12} /> {benefit}</span>
                    ))}
                </div>
            </section>

            <section className="stats-grid" aria-label="Profile stats">
                <StatCard icon={<IconImage size={20} />} label="Images created" value={stats.totalImages} helper="Saved in local history" />
                <StatCard icon={<IconMagic size={20} />} label="Current level" value={stats.tier.level} helper="Based on images created" />
                <StatCard icon={<IconLayers size={20} />} label="With style info" value={stats.withModelCount} helper="Images linked to a model/style" />
                <StatCard icon={<IconDatabase size={20} />} label="Local history" value={health?.dbAvailable ? 'Available' : 'Checking'} helper="Stored on this device" />
            </section>

            <section className="history-workspace glass-immersive" aria-labelledby="history-heading">
                <div className="history-toolbar">
                    <div>
                        <span className="section-kicker"><IconLayers size={14} /> Library</span>
                        <h2 id="history-heading">Your image history</h2>
                        <p>Showing {filteredHistory.length} of {localHistory.length} images</p>
                    </div>

                    <div className="toolbar-actions">
                        <label className="search-box" htmlFor="history-search">
                            <IconImage size={16} />
                            <input
                                id="history-search"
                                type="search"
                                placeholder="Search prompts, IDs, or styles"
                                value={searchQuery}
                                onChange={event => setSearchQuery(event.target.value)}
                            />
                        </label>
                        <button
                            type="button"
                            className={`status-toggle ${showHealth ? 'active' : ''}`}
                            onClick={() => setShowHealth(value => !value)}
                            aria-expanded={showHealth}
                        >
                            <IconActivity size={16} /> System status
                        </button>
                    </div>
                </div>

                <div className="filter-tabs" role="tablist" aria-label="Filter image history">
                    {historyFilters.map(filter => (
                        <button
                            type="button"
                            key={filter.id}
                            role="tab"
                            aria-selected={activeFilter === filter.id}
                            className={activeFilter === filter.id ? 'active' : ''}
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            <strong>{filter.label}</strong>
                            <span>{filter.helper}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence initial={false}>
                    {showHealth && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="system-status-panel"
                        >
                            <StatusItem icon={<IconDatabase size={16} />} label="Local history database" value={health?.dbAvailable ? 'Available' : 'Unavailable'} good={Boolean(health?.dbAvailable)} />
                            <StatusItem icon={<IconActivity size={16} />} label="Desktop app version" value={health?.appVersion || 'Unknown'} good />
                            <StatusItem icon={<IconCpu size={16} />} label="Build type" value={health?.packaged ? 'Packaged app' : 'Development build'} good={Boolean(health?.packaged)} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {localHistory.length === 0 ? (
                    <EmptyHistory />
                ) : filteredHistory.length === 0 ? (
                    <NoResults onClear={() => { setSearchQuery(''); setActiveFilter('all'); }} />
                ) : (
                    <div className="history-grid">
                        {filteredHistory.map((item, index) => <HistoryCardLink key={item.id} item={item} index={index} />)}
                    </div>
                )}

                {hasSearchOrFilter && filteredHistory.length > 0 && (
                    <button type="button" className="clear-filters" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
                        Clear search and filters
                    </button>
                )}
            </section>

            <style>{`
                .profile-page { min-height: 100vh; width: min(1440px, calc(100% - 32px)); margin: 0 auto; padding: 24px 0 132px; position: relative; }
                .profile-mesh { position: fixed; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.34; z-index: -1; }
                .mesh-orb { position: absolute; border-radius: 999px; filter: blur(110px); animation: profileDrift 24s ease-in-out infinite alternate; }
                .orb-one { width: 560px; height: 560px; top: -190px; right: -120px; background: rgba(139, 92, 246, 0.28); }
                .orb-two { width: 460px; height: 460px; bottom: 0; left: -160px; background: rgba(245, 158, 11, 0.14); animation-delay: -6s; }
                .orb-three { width: 380px; height: 380px; top: 34%; left: 40%; background: rgba(168, 85, 247, 0.12); animation-delay: -12s; }

                .profile-topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 18px; }
                .breadcrumbs { display: flex; align-items: center; gap: 8px; color: var(--color-zinc-500); font-size: 0.78rem; font-weight: 800; margin-bottom: 12px; }
                .profile-topbar h1 { font-size: clamp(2rem, 5vw, 4.35rem); letter-spacing: -0.07em; margin-bottom: 10px; }
                .profile-topbar p { max-width: 680px; color: var(--color-zinc-400); font-weight: 650; }
                .topbar-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
                .secondary-action { min-height: 42px; padding: 0 14px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; color: white; text-decoration: none; background: rgba(255,255,255,0.035); font-size: 0.82rem; font-weight: 900; cursor: pointer; }
                .primary-action { background: rgba(139, 92, 246, 0.18); border-color: rgba(139, 92, 246, 0.4); }
                .danger-action:hover { color: #fca5a5; border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.1); }

                .account-overview { display: grid; grid-template-columns: 1.15fr 1fr 0.85fr; gap: 18px; align-items: center; border-radius: 30px; padding: 22px; margin-bottom: 16px; }
                .identity-card { display: flex; align-items: center; gap: 16px; }
                .avatar-ring { width: 82px; height: 82px; border-radius: 26px; display: grid; place-items: center; border: 3px solid var(--color-accent); color: white; background: rgba(255,255,255,0.035); }
                .section-kicker { display: inline-flex; align-items: center; gap: 7px; color: var(--color-accent); font-size: 0.72rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
                .identity-card h2, .history-toolbar h2 { font-size: 1.65rem; margin: 7px 0; letter-spacing: -0.04em; }
                .identity-card p, .level-card p, .history-toolbar p, .empty-history p, .no-results p { color: var(--color-zinc-400); font-weight: 650; }
                .level-card { padding: 16px; border-radius: 22px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
                .level-header { display: flex; justify-content: space-between; gap: 14px; color: white; font-weight: 950; margin-bottom: 12px; }
                .progress-track { height: 10px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; margin-bottom: 10px; }
                .progress-track div { height: 100%; border-radius: inherit; }
                .benefit-panel { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
                .benefit-panel span { display: inline-flex; align-items: center; gap: 6px; color: var(--color-zinc-400); font-size: 0.72rem; font-weight: 900; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.035); padding: 8px 10px; }

                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
                .stat-card { border-radius: 24px; padding: 18px; display: flex; gap: 13px; align-items: flex-start; }
                .stat-icon { width: 42px; height: 42px; border-radius: 15px; display: grid; place-items: center; color: var(--color-accent); background: rgba(139, 92, 246, 0.12); flex-shrink: 0; }
                .stat-card span { display: block; color: var(--color-zinc-500); font-size: 0.7rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; }
                .stat-card strong { display: block; color: white; font-size: 1.15rem; margin: 3px 0; }
                .stat-card p { color: var(--color-zinc-400); font-size: 0.78rem; font-weight: 650; }

                .history-workspace { border-radius: 30px; padding: 20px; }
                .history-toolbar { display: grid; grid-template-columns: 1fr minmax(360px, 520px); gap: 18px; align-items: end; margin-bottom: 16px; }
                .toolbar-actions { display: flex; gap: 10px; align-items: center; }
                .search-box { min-height: 48px; flex: 1; display: flex; align-items: center; gap: 10px; border-radius: 16px; padding: 0 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); color: var(--color-zinc-400); }
                .search-box:focus-within { border-color: rgba(139, 92, 246, 0.72); box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.13); }
                .search-box input { width: 100%; border: 0; outline: 0; background: transparent; color: white; font-size: 0.92rem; font-weight: 700; }
                .status-toggle { min-height: 48px; border-radius: 16px; padding: 0 14px; border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.035); color: white; display: inline-flex; align-items: center; gap: 8px; font-weight: 900; cursor: pointer; white-space: nowrap; }
                .status-toggle.active { border-color: rgba(139, 92, 246, 0.55); background: rgba(139, 92, 246, 0.16); }

                .filter-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
                .filter-tabs button { text-align: left; min-height: 68px; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 12px; background: rgba(255,255,255,0.025); color: var(--color-zinc-400); cursor: pointer; }
                .filter-tabs button.active { color: white; border-color: rgba(139, 92, 246, 0.55); background: rgba(139, 92, 246, 0.14); }
                .filter-tabs strong, .filter-tabs span { display: block; }
                .filter-tabs strong { font-size: 0.84rem; margin-bottom: 4px; }
                .filter-tabs span { font-size: 0.7rem; line-height: 1.25; font-weight: 700; }

                .system-status-panel { overflow: hidden; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
                .status-item { display: flex; gap: 12px; padding: 14px; border-radius: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
                .status-item svg { color: var(--color-accent); flex-shrink: 0; margin-top: 2px; }
                .status-item span { color: var(--color-zinc-500); font-size: 0.68rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; }
                .status-item strong { display: flex; align-items: center; gap: 8px; color: white; margin-top: 4px; }
                .status-dot { width: 8px; height: 8px; border-radius: 999px; background: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.55); }
                .status-dot.good { background: #22c55e; box-shadow: 0 0 10px rgba(34, 197, 94, 0.55); }

                .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
                .history-card { border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); }
                .history-card:hover { transform: translateY(-4px); border-color: rgba(139, 92, 246, 0.4); }
                .history-image-container { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: #18181b; }
                .history-image-container img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.75s ease; }
                .history-card:hover .history-image-container img { transform: scale(1.04); }
                .history-date { position: absolute; top: 12px; left: 12px; padding: 6px 9px; border-radius: 999px; background: rgba(0,0,0,0.56); color: white; border: 1px solid rgba(255,255,255,0.13); backdrop-filter: blur(12px); font-size: 0.68rem; font-weight: 900; }
                .history-details { padding: 14px; }
                .history-details span { color: var(--color-zinc-500); font-size: 0.68rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; }
                .history-details p { color: white; font-size: 0.9rem; line-height: 1.35; font-weight: 750; margin: 6px 0 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .history-meta { display: flex; flex-wrap: wrap; gap: 8px; }
                .history-meta strong { color: var(--color-zinc-400); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 999px; padding: 6px 8px; font-size: 0.68rem; }

                .empty-history, .no-results { min-height: 320px; display: grid; place-items: center; text-align: center; border: 1px dashed rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; background: rgba(255,255,255,0.02); }
                .empty-icon { width: 82px; height: 82px; margin: 0 auto 14px; display: grid; place-items: center; border-radius: 28px; color: var(--color-accent); background: rgba(139, 92, 246, 0.13); }
                .empty-history h3, .no-results h3 { font-size: 1.35rem; margin-bottom: 8px; }
                .empty-actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
                .empty-actions a, .no-results button, .clear-filters { min-height: 42px; padding: 0 14px; border: none; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; color: white; text-decoration: none; font-weight: 950; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); cursor: pointer; }
                .empty-actions a.secondary-empty, .clear-filters { background: rgba(255,255,255,0.07); }
                .clear-filters { margin-top: 16px; }

                @keyframes profileDrift { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(38px, 28px, 0) scale(1.08); } }

                @media (max-width: 1100px) {
                    .profile-topbar { flex-direction: column; }
                    .topbar-actions { justify-content: flex-start; }
                    .account-overview { grid-template-columns: 1fr; }
                    .benefit-panel { justify-content: flex-start; }
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .history-toolbar { grid-template-columns: 1fr; }
                    .system-status-panel { grid-template-columns: 1fr; }
                }

                @media (max-width: 680px) {
                    .profile-page { width: min(100% - 24px, 1440px); padding-top: 16px; }
                    .topbar-actions, .toolbar-actions { width: 100%; display: grid; grid-template-columns: 1fr; }
                    .secondary-action, .status-toggle { justify-content: center; }
                    .identity-card { align-items: flex-start; }
                    .stats-grid, .filter-tabs, .history-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}

function StatCard({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: React.ReactNode; helper: string }) {
    return (
        <article className="stat-card glass-immersive">
            <div className="stat-icon">{icon}</div>
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{helper}</p>
            </div>
        </article>
    );
}

function StatusItem({ icon, label, value, good }: { icon: React.ReactNode; label: string; value: string; good: boolean }) {
    return (
        <div className="status-item">
            {icon}
            <div>
                <span>{label}</span>
                <strong><i className={`status-dot ${good ? 'good' : ''}`} /> {value}</strong>
            </div>
        </div>
    );
}

function HistoryCardLink({ item, index }: { item: LocalGeneration; index: number }) {
    return (
        <Link to={`/generation/${item.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <HistoryCard item={item} index={index} />
        </Link>
    );
}

function HistoryCard({ item, index }: { item: LocalGeneration; index: number }) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
            className="history-card glass-immersive"
        >
            <div className="history-image-container">
                <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt={item.prompt || 'Generated image'} loading="lazy" />
                <span className="history-date">{formatDate(item.createdAt)}</span>
            </div>
            <div className="history-details">
                <span>Prompt</span>
                <p>{item.prompt || 'Untitled generated image'}</p>
                <div className="history-meta">
                    {item.modelId && <strong>Style: {item.modelId}</strong>}
                    <strong>ID: {item.id}</strong>
                </div>
            </div>
        </motion.article>
    );
}

function EmptyHistory() {
    return (
        <div className="empty-history">
            <div>
                <div className="empty-icon"><IconZap size={38} /></div>
                <h3>No images yet</h3>
                <p>Create your first image and it will appear here automatically.</p>
                <div className="empty-actions">
                    <Link to="/generate"><IconZap size={16} /> Create image</Link>
                    <Link to="/" className="secondary-empty"><IconLayers size={16} /> Choose style</Link>
                </div>
            </div>
        </div>
    );
}

function NoResults({ onClear }: { onClear: () => void }) {
    return (
        <div className="no-results">
            <div>
                <div className="empty-icon"><IconImage size={38} /></div>
                <h3>No matching images</h3>
                <p>Try a different prompt word, image ID, style ID, or clear your filters.</p>
                <button type="button" onClick={onClear}>Clear search and filters</button>
            </div>
        </div>
    );
}