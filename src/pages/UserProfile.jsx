import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';
import { Loader2, Heart, Bookmark, AlertCircle, Zap, Layers, Search, Package, Lock, Image as ImageIcon, Sparkles, Trash2, Check, ExternalLink, Download, Plus, Film, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { isValidUsername } from '../utils/usernameValidation';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { getOptimizedImageUrl, getLCPAttributes, getImageSrcSet, preloadImage } from '../utils';
import { trackQualitySignal, trackSearchQuality } from '../utils/analytics';

import ShowcaseModal from '../components/ShowcaseModal';
import { AnimatePresence, motion } from 'framer-motion';
import './UserProfile.css';

export default function UserProfile() {
    const { currentUser } = useAuth();
    const { availableModels: contextModels } = useModel();
    const availableModels = React.useMemo(() => contextModels || [], [contextModels]);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', displayPreference: 'name' }); // 'name' or 'username'
    const [savingProfile, setSavingProfile] = useState(false);
    const { userProfile } = useUserInteractions();

    const {
        likes: ctxLikes,
        bookmarks: ctxBookmarks,
        mockups: ctxMockups,
        memes: ctxMemes,
        appCreations: ctxAppCreations,
        mainstreamGenerations: ctxMainstream
    } = useUserInteractions();

    // Defensive Fallbacks
    const likes = React.useMemo(() => ctxLikes || [], [ctxLikes]);
    const bookmarks = React.useMemo(() => ctxBookmarks || [], [ctxBookmarks]);
    const mockups = React.useMemo(() => ctxMockups || [], [ctxMockups]);
    const memes = React.useMemo(() => ctxMemes || [], [ctxMemes]);
    const appCreations = React.useMemo(() => ctxAppCreations || [], [ctxAppCreations]);
    const productions = React.useMemo(() => ctxMainstream || [], [ctxMainstream]);


    // Routing Params
    const { tab } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Sync state with URL param
    const [activeFilter, setActiveFilter] = useState(tab || 'all');

    useEffect(() => {
        if (tab) {
            setActiveFilter(tab);
        } else {
            setActiveFilter('all');
        }
    }, [tab]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [usernameError, setUsernameError] = useState(null);

    // --- Legacy Gallery State Integration ---
    const [images, setImages] = useState([]);
    const [isGalleryLoading, setIsGalleryLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Pagination
    const [lastVisibleId, setLastVisibleId] = useState(null);
    const [lastVisibleType, setLastVisibleType] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const LIMIT = 24;
    // ----------------------------------------

    // Deep Linking for Lightbox Modal
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (!viewId) {
            if (selectedImage) {
                setSelectedImage(null);
                setSelectedModel(null);
            }
            return;
        }

        if (selectedImage && selectedImage.id === viewId) return;

        // 1. Try to find in currently loaded lists
        const allItems = [...mockups, ...bookmarks, ...likes, ...memes, ...appCreations, ...productions];
        const found = allItems.find(img => img.id === viewId);

        if (found) {
            setSelectedImage(found);
            setSelectedModel(availableModels?.find(m => m.id === found.modelId) || { name: 'Unknown Model', id: 'unknown' });
        } else {
            // 2. Fetch directly from Firestore (Crucial for deep link sharing)
            const fetchImage = async () => {
                try {
                    // Start with official showcase
                    let docRef = doc(db, 'model_showcase_images', viewId);
                    let snapshot = await getDoc(docRef);

                    if (!snapshot.exists()) {
                        // Falling back to user generations
                        docRef = doc(db, 'generations', viewId);
                        snapshot = await getDoc(docRef);
                    }

                    if (!snapshot.exists()) {
                        // Falling back to memes collection
                        docRef = doc(db, 'memes', viewId);
                        snapshot = await getDoc(docRef);
                    }

                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        setSelectedImage({ id: snapshot.id, ...data });
                        setSelectedModel(availableModels?.find(m => m.id === data.modelId) || { name: 'Unknown Model', id: 'unknown' });
                    }
                } catch (err) {
                    console.error("Error fetching studio deep-linked image:", err);
                }
            };
            fetchImage();
        }
    }, [searchParams, mockups, bookmarks, likes, memes, selectedImage, availableModels]);

    const openLightbox = (item) => {
        setSelectedImage(item);
        setSelectedModel(availableModels?.find(m => m.id === item.modelId) || { name: 'Unknown Model', id: 'unknown' });
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', item.id);
            return newParams;
        });
    };

    const closeLightbox = () => {
        setSelectedImage(null);
        setSelectedModel(null);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('view');
            return newParams;
        });
    };

    // --- Gallery Data Fetching Logic (Replaces Context for All/Productions) ---
    useEffect(() => {
        // Only fetch if tab implies we need paginated images
        // "all" or "productions" -> use API
        // "liked", "saved", "apps", "mockups" -> use Context (for now)
        if (activeFilter === 'all' || activeFilter === 'productions') {
            fetchGalleryImages();
        }
    }, [activeFilter, currentUser, searchQuery]);

    async function fetchGalleryImages() {
        if (!currentUser) return;
        setIsGalleryLoading(true);
        // Reset pagination
        setImages([]);
        setHasMore(true);
        setLastVisibleId(null);

        try {
            const api = httpsCallable(functions, 'api');
            const result = await api({
                action: 'getUserImages',
                limit: LIMIT,
                searchQuery: searchQuery || undefined,
                filter: activeFilter === 'productions' ? 'image' : 'all' // 'image' mostly maps to productions in backend logic often
            });

            const data = result.data;
            const newImages = data.images || [];
            setImages(newImages);
            setLastVisibleId(data.lastVisibleId);
            setLastVisibleType(data.lastVisibleType);
            setHasMore(data.hasMore);

            // Preload LCP
            newImages.slice(0, 4).forEach(img => {
                const preloadUrl = getOptimizedImageUrl(img.thumbnailUrl || img.imageUrl);
                preloadImage(preloadUrl, 'high');
            });

            if (data.warnings) {
                data.warnings.forEach(w => toast.error(w));
            }

            if (searchQuery) {
                trackSearchQuality(searchQuery, newImages.length);
            }

        } catch (err) {
            console.error("Error fetching gallery images:", err);
            toast.error("Failed to load your gallery");
        } finally {
            setIsGalleryLoading(false);
        }
    }

    const loadMoreImages = async () => {
        if (!currentUser || !lastVisibleId || loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const api = httpsCallable(functions, 'api');
            const result = await api({
                action: 'getUserImages',
                limit: LIMIT,
                startAfterId: lastVisibleId,
                startAfterCollection: lastVisibleType,
                searchQuery: searchQuery || undefined,
                filter: activeFilter === 'productions' ? 'image' : 'all'
            });

            const data = result.data;
            if (data.images && data.images.length > 0) {
                setImages(prev => [...prev, ...data.images]);
                setLastVisibleId(data.lastVisibleId);
                setLastVisibleType(data.lastVisibleType);
                setHasMore(data.hasMore);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error loading more:", err);
            toast.error("Could not load more");
        } finally {
            setLoadingMore(false);
        }
    };
    // -----------------------------------------------------------------------

    // Filter Logic
    const getFilteredItems = () => {
        switch (activeFilter) {
            case 'liked': return likes;
            case 'saved': return bookmarks;
            case 'mockups': return mockups;
            case 'memes': return memes;
            // case 'productions': return productions; // Removed, using API images
            case 'apps': return appCreations;
            case 'all':
            case 'productions':
                return images; // Use the API loaded images
            default:
                return images;
        }
    };

    const displayedItems = getFilteredItems();
    const loading = false; // derive from context normally

    // Empty State Config
    const emptyStates = {
        all: { title: "Your Studio is Empty", subtitle: "Start creating to fill your personal gallery." },
        liked: { title: "No Favorites Yet", subtitle: "Tap the heart on images you love to save them here." },
        saved: { title: "No Saved Items", subtitle: "Bookmark generations to access them later." },
        mockups: { title: "No Mockups Created", subtitle: "Head to the Mockup Studio to create your first product mockup." },
        memes: { title: "No Memes Created", subtitle: "Head to the Meme Formatter to create your first meme." },
        productions: { title: "No Productions Yet", subtitle: "Mainstream generations from the studio will appear here." },
        apps: { title: "No App Creations", subtitle: "Creations from mini-apps like Dress Up or MeowAcc will appear here." }
    };

    const emptyState = emptyStates[activeFilter] || emptyStates.all;



    const executeDelete = async (toastId) => {
        toast.dismiss(toastId);
        const loadToast = toast.loading('Deleting...');
        try {
            const api = httpsCallable(functions, 'api');
            const result = await api({ action: 'deleteImagesBatch', imageIds: selectedIds });

            if (result.data.success) {
                setImages(prev => prev.filter(img => !selectedIds.includes(img.id)));
                trackQualitySignal('batch_delete', { count: selectedIds.length, filter: activeFilter });
                setSelectedIds([]);
                setIsSelectionMode(false);
                toast.success(`Deleted ${result.data.deleted} image(s)`);
            }
        } catch (err) {
            console.error("Error deleting images:", err);
            const errorMessage = err.message || "Failed to delete images";
            toast.error(errorMessage);
        } finally {
            toast.dismiss(loadToast);
        }
    };

    const handleBatchDelete = () => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}`} style={{
                maxWidth: '350px',
                width: '100%',
                background: '#18181b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        padding: '10px',
                        borderRadius: '50%',
                        color: '#ef4444'
                    }}>
                        <Trash2 size={20} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Confirm Deletion</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Delete {selectedIds.length} image{selectedIds.length > 1 ? 's' : ''}?
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            flex: 1, padding: '10px', background: 'transparent',
                            border: '1px solid var(--color-border)', borderRadius: '8px',
                            color: '#fff', cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => executeDelete(t.id)}
                        style={{
                            flex: 1, padding: '10px', background: '#ef4444',
                            border: 'none', borderRadius: '8px', color: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>
        ), { duration: 8000, id: 'delete-toast' });
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleImageClick = (item) => {
        if (isSelectionMode) {
            toggleSelection(item.id);
        } else {
            openLightbox(item);
        }
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
            // const { doc, setDoc } = await import('firebase/firestore'); // Removed dynamic import
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
            <SEO
                title={selectedImage ? `${selectedImage.prompt?.slice(0, 50)}...` : "My Studio - DreamBees"}
                description={selectedImage ? selectedImage.prompt : "Manage your personal collection of AI generations and discoveries."}
                image={selectedImage ? (selectedImage.thumbnailUrl || selectedImage.url) : undefined}
                canonical={selectedImage?.isPublic ? `/discovery/${selectedImage.id}` : undefined}
                noindex={true}
            />

            {/* Header Section */}
            <div className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                            My Studio
                        </h1>
                        <p className="text-zinc-400 mt-2 text-lg">
                            Manage your personal collection of generations and discoveries.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            if (isSelectionMode) {
                                // Finish selection
                                setIsSelectionMode(false);
                                setSelectedIds([]);
                            } else {
                                // Start selecting
                                setIsSelectionMode(true);
                            }
                        }}
                        className={`bee-btn ${isSelectionMode ? 'bg-zinc-800 border-zinc-700' : ''}`}
                        style={{ padding: '10px 20px', fontSize: '0.9rem', marginRight: '10px' }}
                    >
                        {isSelectionMode ? 'Cancel Selection' : 'Select'}
                    </button>
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
                    <div className="modal-overlay">
                        <div className="modal-content">
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

                    <div className="stat-card">
                        <div className="stat-icon bg-orange-500/10 text-orange-400">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <div className="stat-value">{productions.length}</div>
                            <div className="stat-label">Productions</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon bg-indigo-500/10 text-indigo-400">
                            <Layers size={24} />
                        </div>
                        <div>
                            <div className="stat-value">{appCreations.length}</div>
                            <div className="stat-label">App Creations</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar / Filters */}
            <div className="toolbar">
                <div className="filter-group">
                    {[
                        { id: 'all', label: 'All Media', icon: Layers },
                        { id: 'productions', label: 'Productions', icon: Sparkles },
                        { id: 'apps', label: 'App Creations', icon: Package },
                        { id: 'liked', label: 'Liked', icon: Heart },
                        { id: 'saved', label: 'Saved', icon: Bookmark },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => {
                                if (filter.id === 'all') navigate('/profile');
                                else navigate(`/profile/${filter.id}`);
                            }}
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
                {/* Search Bar - only pertinent for API backed views mostly */}
                {(activeFilter === 'all' || activeFilter === 'productions') && (
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="search-wrapper" style={{ position: 'relative', width: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 10px 10px 36px',
                                    background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: 'white'
                                }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {(loading || isGalleryLoading) ? (
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
                                    className={`studio-card group ${isSelectionMode && selectedIds.includes(item.id) ? 'ring-2 ring-indigo-500' : ''}`}
                                    onClick={() => handleImageClick(item)}
                                >
                                    <div className="aspect-square relative overflow-hidden rounded-xl bg-zinc-900">
                                        {/* Video Support */}
                                        {item.type === 'video' ? (
                                            <video
                                                src={item.videoUrl || item.imageUrl}
                                                muted loop playsInline
                                                onMouseOver={e => e.target.play()}
                                                onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={getOptimizedImageUrl(item.thumbnailUrl || item.imageUrl || item.url)}
                                                alt={item.prompt}
                                                loading="lazy"
                                                {...((activeFilter === 'all' || activeFilter === 'productions') ? getLCPAttributes(i, 4) : {})} // Apply LCP if relevant
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        )}

                                        {/* Overlay Info */}
                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 ${isSelectionMode ? 'pointer-events-none' : ''}`}>
                                            <p className="text-white text-xs font-mono line-clamp-2 mb-2 opacity-90">
                                                {item.prompt}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                                                </span>
                                                <div className="flex gap-2">
                                                    {likes.some(l => l.id === item.id) && <Heart size={14} className="text-pink-500 fill-pink-500" />}
                                                    {bookmarks.some(b => b.id === item.id) && <Bookmark size={14} className="text-blue-500 fill-blue-500" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selection Checkbox Overlay */}
                                        {isSelectionMode && (
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: selectedIds.includes(item.id) ? 'rgba(79, 70, 229, 0.3)' : 'rgba(0,0,0,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {selectedIds.includes(item.id) && (
                                                    <div className="bg-indigo-600 p-2 rounded-full">
                                                        <Check size={20} color="white" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                {/* Load More Button - Only for API views */}
                {(activeFilter === 'all' || activeFilter === 'productions') && !isGalleryLoading && hasMore && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={loadMoreImages}
                            disabled={loadingMore}
                            className="bee-btn btn-outline"
                            style={{ minWidth: '150px' }}
                        >
                            {loadingMore ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Load More'}
                        </button>
                    </div>
                )}
            </div>

            {/* Batch Actions Float */}
            {isSelectionMode && selectedIds.length > 0 && (
                <div className="fixed bottom-32 md:bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl z-50">
                    <span className="font-semibold text-sm">{selectedIds.length} Selected</span>
                    <div className="w-px h-5 bg-zinc-700" />
                    <button onClick={handleBatchDelete} className="text-red-500 font-semibold text-sm hover:text-red-400">Delete</button>
                    <button onClick={() => setSelectedIds([])} className="text-zinc-400 text-sm hover:text-white">Clear</button>
                </div>
            )}

            {/* Modal */}
            {selectedImage && selectedModel && (
                <ShowcaseModal
                    image={selectedImage}
                    model={selectedModel}
                    onClose={closeLightbox}
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

                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                @media (max-width: 1024px) {
                    .header-content {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .stats-grid {
                        width: 100%;
                        overflow-x: auto;
                        padding-bottom: 4px;
                    }
                }

                @media (max-width: 768px) {
                    .dashboard-container {
                        padding: 16px;
                        padding-top: 80px; 
                        padding-bottom: 120px;
                    }
                    .dashboard-header {
                        margin-bottom: 24px;
                        padding-top: 20px;
                    }
                    .stats-grid {
                        overflow-x: auto;
                        scroll-snap-type: x mandatory;
                        padding-bottom: 12px;
                        gap: 12px;
                        width: calc(100% + 32px); /* Break out of container padding */
                        margin-left: -16px;
                        padding-left: 16px;
                        padding-right: 16px;
                    }
                    .stat-card {
                        min-width: 140px; /* Smaller cards */
                        scroll-snap-align: start;
                        padding: 12px 16px;
                    }
                    .stat-value {
                        font-size: 1.25rem;
                    }
                    .toolbar {
                        flex-direction: column;
                        gap: 16px;
                        align-items: stretch;
                    }
                    .filter-group {
                        width: 100%;
                        overflow-x: auto;
                        padding-bottom: 8px; /* Space for scrollbar */
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none; /* Hide scrollbar for cleaner look */
                    }
                    .filter-group::-webkit-scrollbar {
                        display: none;
                    }
                    .search-bar {
                        display: flex; /* Show on mobile */
                        width: 100%;
                    }
                    .studio-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px; /* Tighter gap for mobile */
                    }
                    .modal-content {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        max-width: 100%;
                        border-radius: 20px 20px 0 0;
                        border-bottom: none;
                        padding-bottom: 40px; /* Safe area */
                        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
