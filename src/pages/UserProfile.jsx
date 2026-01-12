import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useUserInteractions } from '../contexts/UserInteractionsContext';

export default function UserProfile() {
    const { currentUser } = useAuth();
    const { availableModels } = useModel();
    const { likes, bookmarks } = useUserInteractions(); // Instant access from global cache

    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'liked', 'saved'
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);

    // Data is already loaded by Context, but we can simulate a brief fade-in if desired, 
    // or just show immediately.
    const loading = false; // Context handles loading in background, we can show content instantly.

    // Derived Data
    const getDisplayedItems = () => {
        if (activeFilter === 'liked') return likes;
        if (activeFilter === 'saved') return bookmarks;

        // For 'all', merge and de-dupe (an image could be liked AND saved)
        // Prefer the 'saved' instance or merge props if needed.
        // Actually, let's just show unique images.
        const allMap = new Map();
        [...likes, ...bookmarks].forEach(item => {
            if (!allMap.has(item.id)) {
                allMap.set(item.id, item);
            }
        });
        // Sort by createdAt (newest first)
        return Array.from(allMap.values()).sort((a, b) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
    };

    const displayedItems = getDisplayedItems();

    const handleImageClick = (image) => {
        const model = availableModels.find(m => m.id === image.modelId) || { name: 'Unknown Model', id: 'unknown', image: '' };
        setSelectedModel(model);
        setSelectedImage(image);
    };

    const getEmptyStateMessage = () => {
        switch (activeFilter) {
            case 'liked':
                return { title: 'No Favorites Yet', subtitle: "Double-tap images in the feed to build your collection of favorites." };
            case 'saved':
                return { title: 'No Bookmarks', subtitle: "Save prompts and generations here for quick access later." };
            default:
                return { title: 'Studio Empty', subtitle: "Your personal library is empty. Start generating or exploring!" };
        }
    };

    const emptyState = getEmptyStateMessage();

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <AlertCircle size={48} className="mx-auto text-zinc-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
                    <p className="text-zinc-400">Please sign in to view your personal studio.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <SEO title="My Studio - DreamBees" />

            {/* Header Section */}
            <div className="dashboard-header">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        My Studio
                    </h1>
                    <p className="text-zinc-400 mt-2 text-lg">
                        Manage your personal collection of generations and discoveries.
                    </p>
                </div>

                {/* Stats Cards Row */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon bg-pink-500/10 text-pink-500">
                            <Heart size={24} fill="currentColor" />
                        </div>
                        <div>
                            <div className="stat-value">{likes.length}</div>
                            <div className="stat-label">Favorites</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon bg-blue-500/10 text-blue-400">
                            <Bookmark size={24} fill="currentColor" />
                        </div>
                        <div>
                            <div className="stat-value">{bookmarks.length}</div>
                            <div className="stat-label">Saved</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar / Filters */}
            <div className="toolbar">
                <div className="filter-group">
                    {[
                        { id: 'all', label: 'All Media', icon: Layers },
                        { id: 'liked', label: 'Liked', icon: Heart },
                        { id: 'saved', label: 'Saved', icon: Bookmark },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                            style={{ position: 'relative' }}
                        >
                            {activeFilter === filter.id && (
                                <motion.div
                                    layoutId="activeFilter"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        zIndex: 0
                                    }}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <filter.icon size={16} className={activeFilter === filter.id && filter.id === 'liked' ? 'fill-current' : ''} />
                                {filter.label}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="search-bar hidden-mobile">
                    <Search size={16} className="text-zinc-500" />
                    <input type="text" placeholder="Search prompts..." />
                </div>
            </div>

            {/* Main Grid content */}
            <div className="content-area">
                {loading ? (
                    <div className="studio-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-square rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 skeleton-shimmer" />
                            </div>
                        ))}
                    </div>
                ) : displayedItems.length > 0 ? (
                    <div className="studio-grid">
                        <AnimatePresence mode='popLayout'>
                            {displayedItems.map((item, i) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2, delay: i * 0.05 }}
                                    key={item.id}
                                    className="studio-card group"
                                    onClick={() => handleImageClick(item)}
                                >
                                    <div className="aspect-square relative overflow-hidden rounded-xl bg-zinc-900">
                                        <LazyImage
                                            src={item.thumbnailUrl || item.url}
                                            alt={item.prompt}
                                            aspectRatio="1/1"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />

                                        {/* Overlay Info */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                            <p className="text-white text-xs font-mono line-clamp-2 mb-2 opacity-90">
                                                {item.prompt}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                                                    SDXL 1.0 • {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                </span>
                                                <div className="flex gap-2">
                                                    {likes.find(l => l.id === item.id) && <Heart size={14} className="text-pink-500 fill-pink-500" />}
                                                    {bookmarks.find(b => b.id === item.id) && <Bookmark size={14} className="text-blue-500 fill-blue-500" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="empty-zone">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                            <Layers size={24} className="text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{emptyState.title}</h3>
                        <p className="text-zinc-500 max-w-sm text-center">{emptyState.subtitle}</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedImage && selectedModel && (
                <ShowcaseModal
                    image={selectedImage}
                    model={selectedModel}
                    onClose={() => setSelectedImage(null)}
                />
            )}

            <style>{`
                .dashboard-container {
                    min-height: 100vh;
                    background: #000;
                    color: #fff;
                    padding: 40px 60px;
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                /* Header & Stats */
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 40px;
                    gap: 40px;
                    padding-top: 60px; /* Space for Navbar */
                }

                .stats-grid {
                    display: flex;
                    gap: 16px;
                }

                .stat-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    backdrop-filter: blur(10px);
                    padding: 16px 20px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    min-width: 180px;
                    transition: all 0.2s ease;
                }

                .stat-card:hover {
                    background: rgba(255,255,255,0.05);
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,0.1);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    line-height: 1;
                    margin-bottom: 4px;
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.5);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Toolbar */
                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    padding-bottom: 20px;
                }

                .filter-group {
                    display: flex;
                    gap: 8px;
                    background: rgba(255,255,255,0.03);
                    padding: 4px;
                    border-radius: 12px;
                }

                .filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.6);
                    transition: all 0.2s;
                    cursor: pointer;
                    border: none;
                    background: transparent;
                }

                .filter-btn:hover {
                    color: white;
                    background: rgba(255,255,255,0.05);
                }

                .filter-btn.active {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .search-bar {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 10px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 300px;
                }

                .search-bar input {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: white;
                    font-size: 0.9rem;
                    width: 100%;
                }

                /* Grid */
                .studio-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 24px;
                }

                .studio-card {
                    cursor: pointer;
                }

                .empty-zone {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 400px;
                    color: rgba(255,255,255,0.4);
                    border: 2px dashed rgba(255,255,255,0.05);
                    border-radius: 24px;
                }

                @media (max-width: 1024px) {
                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 24px;
                    }
                    .stats-grid {
                        width: 100%;
                        overflow-x: auto;
                        padding-bottom: 4px;
                    }
                }

                @media (max-width: 768px) {
                    .dashboard-container {
                        padding: 20px;
                        padding-top: 100px; /* More space for fixed Mobile navbar if needed, or similar */
                    }
                    .studio-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }
                    .search-bar {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
