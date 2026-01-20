import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';
import { Loader2, Heart, Bookmark, AlertCircle, Zap, Layers, Search, Package, Lock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { isValidUsername } from '../utils/usernameValidation';

import ShowcaseModal from '../components/ShowcaseModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfile() {
    const { currentUser } = useAuth();
    const { availableModels } = useModel();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', displayPreference: 'name' }); // 'name' or 'username'
    const [savingProfile, setSavingProfile] = useState(false);
    const { userProfile } = useUserInteractions();

    const { likes, bookmarks, mockups, loadUserInteractions } = useUserInteractions();
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [usernameError, setUsernameError] = useState(null);

    // Filter Logic
    const getFilteredItems = () => {
        switch (activeFilter) {
            case 'liked': return likes;
            case 'saved': return bookmarks;
            case 'mockups': return mockups;
            default:
                // Combine relevant valid items for "All" view
                // This logic might need refinement based on exact product requirements usually
                // For now, let's just show mockups + maybe likes that are yours? 
                // Or simplified: Just showing mockups and saved items
                return [...mockups, ...bookmarks].sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                });
        }
    };

    const displayedItems = getFilteredItems();
    const loading = false; // derive from context normally

    // Empty State Config
    const emptyStates = {
        all: { title: "Your Studio is Empty", subtitle: "Start creating to fill your personal gallery." },
        liked: { title: "No Favorites Yet", subtitle: "Tap the heart on images you love to save them here." },
        saved: { title: "No Saved Items", subtitle: "Bookmark generations to access them later." },
        mockups: { title: "No Mockups Created", subtitle: "Head to the Mockup Studio to create your first product mockup." }
    };

    const emptyState = emptyStates[activeFilter] || emptyStates.all;


    const handleImageClick = (item) => {
        setSelectedImage(item);
        // Attempt to find model if possible, or pass item metadata
        // For now pass item as is mostly sufficient for display
        setSelectedModel(availableModels.find(m => m.id === item.modelId) || { name: 'Unknown Model', id: 'unknown' });
    };

    // Load initial profile data
    useEffect(() => {
        if (userProfile) {
            setEditForm({
                username: userProfile.username || '',
                displayPreference: userProfile.displayPreference || 'name'
            });
        }
    }, [userProfile]);

    const handleSaveProfile = async () => {
        if (!currentUser) return;

        // If username is changing (meaning it wasn't set before, or we are allowing changes)
        // Check validation
        if (!userProfile?.username && editForm.username) {
            const validation = isValidUsername(editForm.username);
            if (!validation.valid) {
                setUsernameError(validation.error);
                toast.error(validation.error);
                return;
            }
        }

        setSavingProfile(true);
        setUsernameError(null);

        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const userRef = doc(db, 'users', currentUser.uid);

            const updateData = {
                displayPreference: editForm.displayPreference
            };

            // Only update username if it wasn't set before
            if (!userProfile?.username && editForm.username) {
                updateData.username = editForm.username;
            }

            await setDoc(userRef, updateData, { merge: true });

            toast.success("Profile updated");
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSavingProfile(false);
        }
    };

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                            My Studio
                        </h1>
                        <p className="text-zinc-400 mt-2 text-lg">
                            Manage your personal collection of generations and discoveries.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsEditing(true)}
                        className="bee-btn"
                        style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                    >
                        Edit Profile
                    </button>
                </div>

                {/* Edit Profile Modal */}
                {isEditing && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}>
                        <div style={{
                            background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px',
                            padding: '30px', maxWidth: '400px', width: '100%', position: 'relative'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Edit Profile</h2>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Username</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '12px', color: userProfile?.username ? '#444' : '#666' }}>@</span>
                                    <input
                                        type="text"
                                        value={editForm.username}
                                        onChange={e => {
                                            if (!userProfile?.username) {
                                                const val = e.target.value.replace(/\s+/g, '').toLowerCase();
                                                setEditForm({ ...editForm, username: val });
                                                setUsernameError(null);
                                            }
                                        }}
                                        placeholder="username"
                                        disabled={!!userProfile?.username}
                                        style={{
                                            width: '100%',
                                            background: userProfile?.username ? '#111' : '#0a0a0a',
                                            border: usernameError ? '1px solid #ef4444' : '1px solid #333',
                                            padding: '12px 12px 12px 30px',
                                            borderRadius: '8px',
                                            color: userProfile?.username ? '#666' : 'white',
                                            outline: 'none',
                                            cursor: userProfile?.username ? 'not-allowed' : 'text'
                                        }}
                                    />
                                    {userProfile?.username && (
                                        <Lock size={14} style={{ position: 'absolute', right: '12px', top: '14px', color: '#444' }} />
                                    )}
                                </div>
                                {usernameError && (
                                    <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>{usernameError}</p>
                                )}
                                {userProfile?.username && (
                                    <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '6px' }}>Username cannot be changed once set.</p>
                                )}
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '12px' }}>Display Preference</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setEditForm({ ...editForm, displayPreference: 'name' })}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px',
                                            border: editForm.displayPreference === 'name' ? '1px solid #a855f7' : '1px solid #333',
                                            background: editForm.displayPreference === 'name' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                                            color: editForm.displayPreference === 'name' ? 'white' : '#666',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Use Name
                                        <div style={{ fontSize: '0.7em', marginTop: '4px', opacity: 0.7 }}>{currentUser?.displayName}</div>
                                    </button>
                                    <button
                                        onClick={() => setEditForm({ ...editForm, displayPreference: 'username' })}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px',
                                            border: editForm.displayPreference === 'username' ? '1px solid #a855f7' : '1px solid #333',
                                            background: editForm.displayPreference === 'username' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                                            color: editForm.displayPreference === 'username' ? 'white' : '#666',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Use Username
                                        <div style={{ fontSize: '0.7em', marginTop: '4px', opacity: 0.7 }}>@{editForm.username || '...'}</div>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setUsernameError(null);
                                        // Reset form to current profile
                                        if (userProfile) {
                                            setEditForm({
                                                username: userProfile.username || '',
                                                displayPreference: userProfile.displayPreference || 'name'
                                            });
                                        }
                                    }}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    className="bee-btn"
                                    disabled={savingProfile}
                                    style={{ flex: 1 }}
                                >
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                    <div className="stat-card">
                        <div className="stat-icon bg-purple-500/10 text-purple-400">
                            <Package size={24} />
                        </div>
                        <div>
                            <div className="stat-value">{mockups.length}</div>
                            <div className="stat-label">Mockups</div>
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
                        { id: 'mockups', label: 'Mockups', icon: Package },
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
                                        <img
                                            src={item.thumbnailUrl || item.url}
                                            alt={item.prompt}
                                            loading="lazy"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s'
                                            }}
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
