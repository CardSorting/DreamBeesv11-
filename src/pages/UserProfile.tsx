/**
 * [LAYER: INFRASTRUCTURE]
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLite } from '../contexts/LiteContext';
import PictureThumb from '../components/PictureThumb';
import { IconImage, IconLogOut, IconMagic, IconUser, IconZap } from '../icons';

function getDisplayName(email?: string | null, name?: string | null) {
    if (name) return name.split(' ')[0];
    if (email) return email.split('@')[0];
    return 'Friend';
}

export default function UserProfile() {
    const { currentUser, logout, displayHistory, addToast, zaps } = useLite();

    const handleLogout = async () => {
        try {
            await logout();
            addToast('You signed out. Your pictures stay on this device.', 'success');
        } catch (err: any) {
            addToast(err.message, 'error');
        }
    };

    const pictures = useMemo(() => [...displayHistory], [displayHistory]);
    const displayName = getDisplayName(currentUser?.email, currentUser?.displayName);
    const creditsLabel = zaps === 'unlimited' ? 'Unlimited' : String(zaps);

    return (
        <div className="profile-simple fade-in">
            <header className="simple-header">
                <div className="simple-title">
                    <h1>Hi, {displayName}!</h1>
                    <p>Your pictures live here on this device.</p>
                </div>
            </header>

            <section className="simple-card account-card" aria-label="Your account">
                <div className="account-row">
                    <div className="avatar">
                        <IconUser size={28} />
                    </div>
                    <div>
                        <strong>{currentUser?.displayName || displayName}</strong>
                        <span>{currentUser?.email}</span>
                    </div>
                </div>

                <div className="simple-stats">
                    <div className="stat-box">
                        <span className="stat-label">Pictures</span>
                        <strong>{pictures.length}</strong>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">Credits left</span>
                        <strong>{creditsLabel}</strong>
                    </div>
                </div>

                <div className="action-row">
                    <Link to="/generate" className="big-button primary">
                        <IconZap size={18} /> Make a picture
                    </Link>
                    <Link to="/" className="big-button">
                        <IconMagic size={18} /> Pick a style
                    </Link>
                    <button type="button" className="big-button danger" onClick={handleLogout}>
                        <IconLogOut size={18} /> Sign out
                    </button>
                </div>
            </section>

            <section className="simple-card" aria-label="Your pictures">
                <div className="pictures-header">
                    <strong>Your pictures</strong>
                    <span>{pictures.length} saved</span>
                </div>

                {pictures.length === 0 ? (
                    <div className="empty-pictures">
                        <IconImage size={28} />
                        <p>No pictures yet.</p>
                        <Link to="/generate" className="big-button primary inline">
                            <IconZap size={18} /> Make your first picture
                        </Link>
                    </div>
                ) : (
                    <div className="pictures-grid">
                        {pictures.map((item) => (
                            <PictureThumb
                                key={item.originalRequestId || item.firestoreImageId || item.id}
                                item={item}
                            />
                        ))}
                    </div>
                )}
            </section>

            <style>{`
                .profile-simple { min-height: 100vh; width: min(860px, calc(100% - 28px)); margin: 0 auto; padding: 22px 0 120px; }
                .simple-header { margin-bottom: 14px; }
                .simple-title h1 { font-size: clamp(1.8rem, 5vw, 3rem); letter-spacing: -0.06em; margin: 0 0 8px; }
                .simple-title p { margin: 0; color: var(--color-zinc-400); font-weight: 700; }

                .simple-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; background: rgba(255,255,255,0.03); padding: 14px; margin-bottom: 12px; }
                .account-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
                .avatar { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; color: white; background: rgba(139, 92, 246, 0.18); border: 1px solid rgba(139, 92, 246, 0.25); }
                .account-row strong { display: block; font-size: 1.05rem; }
                .account-row span { display: block; color: var(--color-zinc-400); font-size: 0.85rem; font-weight: 700; margin-top: 2px; }

                .simple-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
                .stat-box { padding: 12px; border-radius: 14px; background: rgba(0,0,0,0.12); border: 1px solid rgba(255,255,255,0.06); }
                .stat-label { display: block; color: var(--color-zinc-500); font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
                .stat-box strong { font-size: 1.4rem; }

                .action-row { display: grid; gap: 8px; }
                .big-button { width: 100%; min-height: 50px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.03); color: white; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 950; font-size: 0.95rem; text-decoration: none; cursor: pointer; }
                .big-button:hover { border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.10); }
                .big-button.primary { border: none; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.18); }
                .big-button.primary:hover { transform: translateY(-1px); }
                .big-button.danger:hover { border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.10); color: #fecaca; }
                .big-button.inline { width: auto; margin-top: 10px; }

                .pictures-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
                .pictures-header span { color: var(--color-zinc-400); font-weight: 800; font-size: 0.85rem; }

                .empty-pictures { text-align: center; padding: 28px 14px; border: 1px dashed rgba(255,255,255,0.12); border-radius: 16px; color: var(--color-zinc-400); }
                .empty-pictures p { margin: 8px 0 0; font-weight: 800; }

                .pictures-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
                .picture-card { text-decoration: none; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.12); color: white; }
                .picture-card:hover { border-color: rgba(139, 92, 246, 0.45); }
                .picture-card img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; }
                .picture-card span { display: block; padding: 8px 10px; font-size: 0.78rem; font-weight: 750; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
        </div>
    );
}
