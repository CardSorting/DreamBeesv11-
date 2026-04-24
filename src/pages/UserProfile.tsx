import React from 'react';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconUser, IconLogOut, IconLayers } from '../icons';

export default function UserProfile() {
    const { currentUser, logout, localHistory, addToast } = useLite();

    const handleLogout = async () => {
        try {
            await logout();
            addToast("Logged out", "success");
        } catch (err: any) {
            addToast(err.message, "error");
        }
    };

    return (
        <div className="lite-profile fade-in">
            <header className="profile-header glass">
                <div className="avatar-ring">
                    <IconUser size={40} />
                </div>
                <h2>{currentUser?.email?.split('@')[0] || 'User'}</h2>
                <p>{currentUser?.email}</p>
                <button onClick={handleLogout} className="logout-btn">
                    <IconLogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </header>

            <section className="profile-history">
                <div className="section-title">
                    <IconLayers size={18} />
                    <span>Your Local Archive</span>
                </div>
                <div className="history-grid">
                    {localHistory.map(item => (
                        <div key={item.id} className="history-item glass">
                            <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt="" loading="lazy" />
                            <div className="item-overlay">
                                <p>{item.prompt}</p>
                            </div>
                        </div>
                    ))}
                    {localHistory.length === 0 && (
                        <div className="empty-state glass">
                            <p>No local history found</p>
                        </div>
                    )}
                </div>
            </section>

            <style>{`
                .lite-profile { padding: 40px 20px; max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }
                
                .profile-header { padding: 40px; border-radius: 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 15px; }
                .avatar-ring { width: 80px; height: 80px; border-radius: 50%; background: #18181b; border: 2px solid #8b5cf6; display: flex; align-items: center; justify-content: center; color: #8b5cf6; margin-bottom: 10px; }
                .profile-header h2 { font-size: 1.8rem; letter-spacing: -1px; }
                .profile-header p { color: #71717a; font-size: 0.9rem; }
                
                .logout-btn { margin-top: 10px; display: flex; align-items: center; gap: 8px; color: #ef4444; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; padding: 10px 20px; border-radius: 12px; transition: background 0.2s; }
                .logout-btn:hover { background: rgba(239, 68, 68, 0.1); }

                .section-title { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: #8b5cf6; margin-bottom: 20px; }
                
                .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
                .history-item { aspect-ratio: 1; border-radius: 20px; overflow: hidden; position: relative; }
                .history-item img { width: 100%; height: 100%; object-fit: cover; }
                .item-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); opacity: 0; transition: opacity 0.3s; display: flex; align-items: flex-end; padding: 15px; }
                .history-item:hover .item-overlay { opacity: 1; }
                .item-overlay p { font-size: 0.75rem; color: white; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

                .empty-state { grid-column: 1 / -1; padding: 60px; text-align: center; color: #3f3f46; font-weight: 600; }
            `}</style>
        </div>
    );
}
