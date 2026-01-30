import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Bookmark,
    Edit2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Lock,
    ExternalLink,
    ArrowRight,
    Sparkles,
    RefreshCw,
    Download,
    PanelRightClose,
    PanelRightOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import SEO from '../components/SEO';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useModel } from '../contexts/ModelContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import './UserProfile.css';

const PAGE_SIZE = 20;

export default function UserProfile() {
    const { currentUser } = useAuth();
    const { likes, bookmarks, userProfile } = useUserInteractions();
    const navigate = useNavigate();
    const location = useLocation();

    const [isEditing, setIsEditing] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [usernameError, setUsernameError] = useState(null);
    const [editForm, setEditForm] = useState({
        username: '',
        displayPreference: 'username'
    });

    // Determine active tab from URL path
    const activeTab = location.pathname.includes('/saved') ? 'saved' : 'liked';
    const displayedItems = activeTab === 'liked' ? likes : bookmarks;

    // Pagination/Lazy Load state
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const visibleItems = displayedItems.slice(0, visibleCount);
    const isPagingRef = useRef(false);

    // Setup intersection observer for "Load More"
    const { ref: loadMoreRef, entry } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '200px',
    });

    useEffect(() => {
        if (!entry?.isIntersecting) {
            isPagingRef.current = false;
            return;
        }

        if (isPagingRef.current) return;
        if (visibleCount >= displayedItems.length) return;

        isPagingRef.current = true;
        setVisibleCount(prev => prev + PAGE_SIZE);
    }, [entry?.isIntersecting, displayedItems.length, visibleCount]);

    useEffect(() => {
        if (userProfile) {
            setEditForm({
                username: userProfile.username || '',
                displayPreference: userProfile.displayPreference || 'username'
            });
        }
    }, [userProfile]);

    const handleSaveProfile = async () => {
        if (!editForm.username) {
            setUsernameError('Username is required');
            return;
        }

        if (editForm.username.length < 3) {
            setUsernameError('Username must be at least 3 characters');
            return;
        }

        setSavingProfile(true);
        try {
            // Check if username is taken (if it changed)
            if (editForm.username !== userProfile?.username) {
                const usernameDoc = await getDoc(doc(db, 'usernames', editForm.username));
                if (usernameDoc.exists()) {
                    setUsernameError('Username is already taken');
                    setSavingProfile(false);
                    return;
                }
            }

            // Update profile
            await setDoc(doc(db, 'profiles', currentUser.uid), {
                ...editForm,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // Update username mapping
            if (editForm.username !== userProfile?.username) {
                await setDoc(doc(db, 'usernames', editForm.username), {
                    uid: currentUser.uid
                });
            }

            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const { availableModels } = useModel();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedImage, setSelectedImage] = useState(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const imageAreaRef = useRef(null);

    // Reset zoom when image changes
    useEffect(() => {
        setIsZoomed(false);
    }, [selectedImage]);

    // Filter focus logic: Handle deep linking ?view=ID
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId) {
            // Find in current items or fetch if needed
            const found = displayedItems.find(img => img.id === viewId || img.id.replace('show_', '') === viewId);
            if (found) {
                setSelectedImage(found);
            }
        } else {
            setSelectedImage(null);
        }
    }, [searchParams, displayedItems]);

    const openLightbox = useCallback((item) => {
        const id = item.id.replace('show_', '');
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('view', id);
            return next;
        });
    }, [setSearchParams]);

    const closeLightbox = useCallback(() => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.delete('view');
            return next;
        });
    }, [setSearchParams]);

    const handleNavigate = useCallback((direction) => {
        if (!selectedImage || displayedItems.length === 0) return;

        const currentIndex = displayedItems.findIndex(item => item.id === selectedImage.id);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex + direction;

        // Wrap around
        if (nextIndex >= displayedItems.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = displayedItems.length - 1;

        const nextItem = displayedItems[nextIndex];
        openLightbox(nextItem);
    }, [selectedImage, displayedItems, openLightbox]);

    // Keyboard navigation
    useEffect(() => {
        if (!selectedImage) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') handleNavigate(1);
            if (e.key === 'ArrowLeft') handleNavigate(-1);
            if (e.key === 'Escape') closeLightbox();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, handleNavigate, closeLightbox]); // Re-bind when selection or list changes

    const getOptimizedImageUrl = (url) => {
        if (!url) return '';
        if (url.includes('firebasestorage.googleapis.com')) return url;
        // Logic for Cloudflare image re-optimization if needed
        return url;
    };

    if (!currentUser) {
        return (
            <div className="up-page-restricted">
                <div className="up-modal text-center">
                    <AlertCircle className="mx-auto" size={48} style={{ color: 'var(--studio-text-muted)', marginBottom: '24px' }} />
                    <h2 style={{ marginBottom: '8px' }}>Access Restricted</h2>
                    <p style={{ color: 'var(--studio-text-muted)' }}>Please sign in to view your personal studio.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="up-page">
            <SEO title="My Studio" noindex={true} />

            {/* Header Section */}
            <header className="up-header">
                <div className="up-header-left">
                    <div className="up-profile-visual">
                        <Sparkles size={24} className="text-purple-500" />
                    </div>
                    <div className="up-title-block">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {userProfile?.username ? `${userProfile.username}'s Studio` : 'My Studio'}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            {activeTab === 'liked' ? 'Your favorite masterpieces' : 'Securely preserved generations'}
                        </motion.p>
                    </div>
                </div>

                <div className="up-header-right">
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setIsEditing(true)}
                        className="up-btn-edit"
                    >
                        <Edit2 size={16} />
                        <span>Customize Studio</span>
                    </motion.button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="up-nav">
                <button
                    onClick={() => navigate('/profile/liked')}
                    className={`up-tab ${activeTab === 'liked' ? 'active' : ''}`}
                >
                    <div className="flex items-center">
                        <Heart size={18} style={{ marginRight: '8px' }} className={activeTab === 'liked' ? "fill-pink-500 text-pink-500" : ""} />
                        Favorites
                        <span className="up-tab-count">{likes.length}</span>
                    </div>
                </button>
                <button
                    onClick={() => navigate('/profile/saved')}
                    className={`up-tab ${activeTab === 'saved' ? 'active' : ''}`}
                >
                    <div className="flex items-center">
                        <Bookmark size={18} style={{ marginRight: '8px' }} className={activeTab === 'saved' ? "fill-blue-500 text-blue-500" : ""} />
                        Saved
                        <span className="up-tab-count">{bookmarks.length}</span>
                    </div>
                </button>
            </nav>

            {/* Gallery Content */}
            <section className="up-gallery">
                {displayedItems.length > 0 ? (
                    <>
                        <div className="up-grid">
                            <AnimatePresence mode='popLayout'>
                                {visibleItems.map((item, index) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: (index % PAGE_SIZE) * 0.04 }}
                                        key={item.id}
                                        className="up-card"
                                        onClick={() => openLightbox(item)}
                                    >
                                        <div className="up-img-wrapper">
                                            <img
                                                src={getOptimizedImageUrl(item.thumbnailUrl || item.imageUrl || item.url)}
                                                alt={item.prompt}
                                                loading={index < 8 ? "eager" : "lazy"}
                                            />
                                            <div className="up-card-overlay">
                                                <p className="up-card-prompt">{item.prompt}</p>
                                                <div className="up-badge">
                                                    {availableModels.find(m => m.id === item.modelId)?.name || 'Studio Creation'}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Sentinel */}
                        {visibleCount < displayedItems.length && (
                            <div ref={loadMoreRef} className="flex justify-center py-12">
                                <div className="text-muted animate-pulse">Loading more...</div>
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="up-empty"
                    >
                        <div className="up-empty-icon">
                            {activeTab === 'liked' ? <Heart size={64} /> : <Bookmark size={64} />}
                        </div>
                        <h3>Your collection is empty</h3>
                        <p>
                            {activeTab === 'liked'
                                ? "Favorite images in the explore feed to see them appear here."
                                : "Bookmark generations you'd like to revisit later."}
                        </p>
                    </motion.div>
                )}
            </section>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="up-modal-backdrop">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="up-modal"
                        >
                            <button onClick={() => setIsEditing(false)} className="up-modal-close">
                                <X size={24} />
                            </button>

                            <h2>Edit Profile</h2>

                            <div className="up-form">
                                <div className="up-form-group">
                                    <label className="up-label">Username</label>
                                    <div className="up-input-container">
                                        <span className="up-input-prefix">@</span>
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
                                            className="up-input"
                                            placeholder="username"
                                            style={{ paddingLeft: '40px', opacity: userProfile?.username ? 0.6 : 1 }}
                                        />
                                        {userProfile?.username && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />}
                                    </div>
                                    {usernameError && <p className="up-error">{usernameError}</p>}
                                    {userProfile?.username && <p className="up-error" style={{ color: 'var(--studio-text-dim)' }}>Username cannot be changed.</p>}
                                </div>

                                <div className="up-form-group">
                                    <label className="up-label">Display Name Preference</label>
                                    <div className="up-choice-grid">
                                        <button
                                            onClick={() => setEditForm({ ...editForm, displayPreference: 'name' })}
                                            className={`up-choice-btn ${editForm.displayPreference === 'name' ? 'active' : ''}`}
                                        >
                                            <div className="up-choice-name">Use Name</div>
                                            <div className="up-choice-sub">{currentUser?.displayName}</div>
                                        </button>
                                        <button
                                            onClick={() => setEditForm({ ...editForm, displayPreference: 'username' })}
                                            className={`up-choice-btn ${editForm.displayPreference === 'username' ? 'active' : ''}`}
                                        >
                                            <div className="up-choice-name">Use Username</div>
                                            <div className="up-choice-sub">@{editForm.username || '...'}</div>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    disabled={savingProfile}
                                    className="up-btn-primary"
                                >
                                    {savingProfile ? 'Saving Changes...' : 'Save Profile'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        className="up-lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                    >
                        <motion.div
                            className="up-lightbox-content"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="up-close-btn" onClick={closeLightbox}>
                                <X size={24} />
                            </button>

                            <button
                                className={`up-sidebar-toggle-btn ${!showSidebar ? 'collapsed' : ''}`}
                                onClick={() => setShowSidebar(!showSidebar)}
                                title={showSidebar ? "Hide Metadata" : "Show Metadata"}
                            >
                                {showSidebar ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
                            </button>

                            <div
                                className="up-lightbox-image-area"
                                ref={imageAreaRef}
                                onClick={() => setIsZoomed(!isZoomed)}
                                style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                            >
                                {/* Navigation Buttons */}
                                <button
                                    className="up-nav-btn up-nav-prev"
                                    onClick={(e) => { e.stopPropagation(); handleNavigate(-1); }}
                                    title="Previous Image (Left Arrow)"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    className="up-nav-btn up-nav-next"
                                    onClick={(e) => { e.stopPropagation(); handleNavigate(1); }}
                                    title="Next Image (Right Arrow)"
                                >
                                    <ChevronRight size={32} />
                                </button>

                                <img
                                    src={getOptimizedImageUrl(selectedImage.imageUrl || selectedImage.url)}
                                    alt={selectedImage.prompt}
                                    className={`up-lightbox-img ${isZoomed ? 'zoomed' : ''}`}
                                />
                            </div>

                            <div className={`up-lightbox-sidebar ${!showSidebar ? 'hidden' : ''}`}>
                                <div className="up-sidebar-header">
                                    <div className="up-model-badge">
                                        <Sparkles size={14} />
                                        <span>{availableModels.find(m => m.id === selectedImage.modelId)?.name || 'Studio Model'}</span>
                                    </div>
                                </div>

                                <label>Prompt</label>
                                <p>{selectedImage.prompt}</p>

                                <div className="up-sidebar-section">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        {selectedImage.steps && (
                                            <div>
                                                <label>Steps</label>
                                                <div style={{ color: '#fff', fontSize: '0.95rem', fontFamily: 'monospace' }}>{selectedImage.steps}</div>
                                            </div>
                                        )}
                                        {selectedImage.guidanceScale && (
                                            <div>
                                                <label>Guidance</label>
                                                <div style={{ color: '#fff', fontSize: '0.95rem', fontFamily: 'monospace' }}>{selectedImage.guidanceScale}</div>
                                            </div>
                                        )}
                                        {selectedImage.seed && (
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label>Seed</label>
                                                <div style={{ color: '#fff', fontSize: '0.95rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedImage.seed}</div>
                                            </div>
                                        )}
                                        {selectedImage.scheduler && (
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label>Sampler</label>
                                                <div style={{ color: '#fff', fontSize: '0.95rem' }}>{selectedImage.scheduler}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="up-sidebar-actions">
                                    <button
                                        className="up-action-btn up-btn-primary"
                                        onClick={() => {
                                            const params = new URLSearchParams();
                                            params.set('prompt', selectedImage.prompt);
                                            if (selectedImage.modelId) params.set('model', selectedImage.modelId);
                                            if (selectedImage.seed) params.set('seed', selectedImage.seed);
                                            if (selectedImage.steps) params.set('steps', selectedImage.steps);
                                            if (selectedImage.guidanceScale) params.set('guidance', selectedImage.guidanceScale);
                                            if (selectedImage.scheduler) params.set('scheduler', selectedImage.scheduler);
                                            navigate(`/generate?${params.toString()}`);
                                        }}
                                    >
                                        <RefreshCw size={18} />
                                        Remix with Settings
                                    </button>
                                    <button
                                        className="up-action-btn"
                                        onClick={async () => {
                                            if (!imageAreaRef.current) return;
                                            const toastId = toast.loading('Capturing studio image...');
                                            try {
                                                const canvas = await html2canvas(imageAreaRef.current, {
                                                    useCORS: true,
                                                    backgroundColor: '#1a1a1a',
                                                    scale: 2,
                                                });

                                                const link = document.createElement('a');
                                                link.download = `dreambees-studio-${selectedImage.id}.png`;
                                                link.href = canvas.toDataURL('image/png');
                                                link.click();
                                                toast.success("Studio capture downloaded", { id: toastId });
                                            } catch (err) {
                                                console.error("Capture failed", err);
                                                toast.error("Failed to capture image", { id: toastId });
                                            }
                                        }}
                                    >
                                        <Download size={18} />
                                        Download Capture
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// No extra export needed as it is at the top
