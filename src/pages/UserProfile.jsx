import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';
import { Heart, Bookmark, AlertCircle, Lock, Edit2, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { isValidUsername } from '../utils/usernameValidation';
import { getOptimizedImageUrl } from '../utils';
import ShowcaseModal from '../components/ShowcaseModal';
import { AnimatePresence, motion } from 'framer-motion';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Loader2 } from 'lucide-react';

export default function UserProfile() {
    const { currentUser } = useAuth();
    const { availableModels } = useModel();
    const {
        likes: ctxLikes,
        bookmarks: ctxBookmarks,
        userProfile
    } = useUserInteractions();

    const likes = useMemo(() => ctxLikes || [], [ctxLikes]);
    const bookmarks = useMemo(() => ctxBookmarks || [], [ctxBookmarks]);

    // Routing
    const { tab } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = tab === 'saved' ? 'saved' : 'liked'; // Default to 'liked'

    // Deep Linking State
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);

    // Profile Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', displayPreference: 'name' });
    const [usernameError, setUsernameError] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);

    // Initialize Edit Form
    useEffect(() => {
        if (userProfile) {
            setEditForm({
                username: userProfile.username || '',
                displayPreference: userProfile.displayPreference || 'name'
            });
        }
    }, [userProfile]);

    // --- Deep Link Handling ---
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

        // Try finding in local lists first
        const allItems = [...likes, ...bookmarks];
        const found = allItems.find(img => img.id === viewId);

        if (found) {
            setSelectedImage(found);
            setSelectedModel(availableModels?.find(m => m.id === found.modelId) || { name: 'Unknown Model', id: 'unknown' });
        } else {
            // Fetch if not found locally
            const fetchImage = async () => {
                try {
                    // Try showcase first
                    let docRef = doc(db, 'model_showcase_images', viewId);
                    let snapshot = await getDoc(docRef);

                    if (!snapshot.exists()) {
                        docRef = doc(db, 'generations', viewId);
                        snapshot = await getDoc(docRef);
                    }
                    if (!snapshot.exists()) {
                        docRef = doc(db, 'memes', viewId);
                        snapshot = await getDoc(docRef);
                    }

                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        setSelectedImage({ id: snapshot.id, ...data });
                        setSelectedModel(availableModels?.find(m => m.id === data.modelId) || { name: 'Unknown Model', id: 'unknown' });
                    }
                } catch (err) {
                    console.error("Error fetching deep-linked image:", err);
                }
            };
            fetchImage();
        }
    }, [searchParams, likes, bookmarks, availableModels, selectedImage]);

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

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        if (!userProfile?.username && editForm.username) {
            const validation = isValidUsername(editForm.username);
            if (!validation.valid) {
                setUsernameError(validation.error);
                return;
            }
        }
        setSavingProfile(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const updateData = { displayPreference: editForm.displayPreference };
            if (!userProfile?.username && editForm.username) {
                updateData.username = editForm.username;
            }
            await setDoc(userRef, updateData, { merge: true });
            toast.success("Profile updated");
            setIsEditing(false);
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setSavingProfile(false);
        }
    };

    const displayedItems = activeTab === 'saved' ? bookmarks : likes;

    // --- Pagination for Large Datasets ---
    const PAGE_SIZE = 15;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Reset visible count when switching tabs or items change
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [activeTab, displayedItems.length]);

    const visibleItems = useMemo(() => {
        return displayedItems.slice(0, visibleCount);
    }, [displayedItems, visibleCount]);

    const sentinelRef = useIntersectionObserver({
        onIntersect: () => {
            if (visibleCount < displayedItems.length) {
                setVisibleCount(prev => prev + PAGE_SIZE);
            }
        },
        enabled: visibleCount < displayedItems.length,
        rootMargin: '0px 0px 800px 0px'
    });

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-md">
                    <AlertCircle className="mx-auto text-zinc-500 mb-4" size={48} />
                    <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
                    <p className="text-zinc-400">Please sign in to view your personal studio.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-black text-white pb-20 pt-24 px-4 md:px-12 max-w-[1600px] mx-auto">
            <SEO title="My Studio" noindex={true} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        My Studio
                    </h1>
                    <p className="text-zinc-500 mt-2 text-lg">
                        Your personal collection.
                    </p>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors text-sm font-medium"
                >
                    <Edit2 size={16} /> Edit Profile
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-1">
                <button
                    onClick={() => navigate('/profile/liked')}
                    className={`pb-3 px-2 text-lg font-medium transition-colors relative ${activeTab === 'liked' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <div className="flex items-center gap-2">
                        <Heart size={20} className={activeTab === 'liked' ? "fill-pink-500 text-pink-500" : ""} />
                        Favorites
                        <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded-full text-zinc-400">{likes.length}</span>
                    </div>
                    {activeTab === 'liked' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                    )}
                </button>
                <button
                    onClick={() => navigate('/profile/saved')}
                    className={`pb-3 px-2 text-lg font-medium transition-colors relative ${activeTab === 'saved' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <div className="flex items-center gap-2">
                        <Bookmark size={20} className={activeTab === 'saved' ? "fill-blue-500 text-blue-500" : ""} />
                        Saved
                        <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded-full text-zinc-400">{bookmarks.length}</span>
                    </div>
                    {activeTab === 'saved' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                    )}
                </button>
            </div>

            {/* Content Grid */}
            {displayedItems.length > 0 ? (
                <section className="profile-gallery">
                    <div className="masonry-grid">
                        <AnimatePresence mode='popLayout'>
                            {visibleItems.map((item, index) => {
                                // Deterministic ratio calculation if not present
                                const ratios = ['1/1', '3/4', '4/5', '2/3', '1/1', '3/5'];
                                const ratio = item.aspectRatio || ratios[index % ratios.length];

                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: (index % PAGE_SIZE) * 0.05 }}
                                        key={item.id}
                                        className="masonry-item group"
                                        onClick={() => openLightbox(item)}
                                    >
                                        <div className="image-card">
                                            <div className="image-wrapper" style={{ aspectRatio: ratio }}>
                                                <img
                                                    src={getOptimizedImageUrl(item.thumbnailUrl || item.imageUrl || item.url)}
                                                    alt={item.prompt}
                                                    loading={index < 10 ? "eager" : "lazy"}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                                    <p className="text-white text-[10px] font-mono line-clamp-2 opacity-90 leading-tight">
                                                        {item.prompt}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Sentinel for Infinite Scroll */}
                    <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center">
                        {visibleCount < displayedItems.length && (
                            <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium animate-pulse">
                                <Loader2 size={16} className="animate-spin" />
                                Loading more creations...
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border-2 border-dashed border-zinc-900 rounded-3xl">
                    {activeTab === 'liked' ? <Heart size={48} className="mb-4 opacity-20" /> : <Bookmark size={48} className="mb-4 opacity-20" />}
                    <h3 className="text-xl font-bold text-zinc-400 mb-2">
                        {activeTab === 'liked' ? "No Favorites Yet" : "No Saved Items"}
                    </h3>
                    <p className="max-w-sm text-center opacity-60">
                        {activeTab === 'liked'
                            ? "Tap the heart on images you love to find them here."
                            : "Bookmark generations to build your personal collection."}
                    </p>
                </div>
            )}

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsEditing(false)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold mb-6">Edit Profile</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-zinc-500">@</span>
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
                                            disabled={!!userProfile?.username}
                                            className={`w-full bg-black border ${usernameError ? 'border-red-500' : 'border-zinc-800'} rounded-lg py-2.5 pl-8 pr-10 text-white outline-none focus:border-purple-500 transition-colors ${userProfile?.username ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            placeholder="username"
                                        />
                                        {userProfile?.username && <Lock className="absolute right-3 top-3 text-zinc-600" size={14} />}
                                    </div>
                                    {usernameError && <p className="text-red-500 text-xs mt-1.5">{usernameError}</p>}
                                    {userProfile?.username && <p className="text-zinc-600 text-xs mt-1.5">Username cannot be changed.</p>}
                                </div>

                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">Display Name Preference</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setEditForm({ ...editForm, displayPreference: 'name' })}
                                            className={`p-3 rounded-lg border text-left transition-all ${editForm.displayPreference === 'name' ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <div className="font-medium text-sm">Use Name</div>
                                            <div className="text-xs opacity-60 mt-1 truncate">{currentUser?.displayName}</div>
                                        </button>
                                        <button
                                            onClick={() => setEditForm({ ...editForm, displayPreference: 'username' })}
                                            className={`p-3 rounded-lg border text-left transition-all ${editForm.displayPreference === 'username' ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <div className="font-medium text-sm">Use Username</div>
                                            <div className="text-xs opacity-60 mt-1 truncate">@{editForm.username || '...'}</div>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    disabled={savingProfile}
                                    className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lightbox */}
            {selectedImage && selectedModel && (
                <ShowcaseModal
                    image={selectedImage}
                    model={selectedModel}
                    onClose={closeLightbox}
                />
            )}
        </div>
    );
}
