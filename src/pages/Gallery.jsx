import React, { useEffect, useState, useMemo } from 'react';
import SEO from '../components/SEO';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Search, Download, Trash2, X, ExternalLink, Calendar, Info, Check, Plus, Film } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl, getLCPAttributes, getImageSrcSet, preloadImage } from '../utils';

export default function Gallery() {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'mockup', 'image', 'video'
    const { currentUser } = useAuth();

    const [lastVisibleId, setLastVisibleId] = useState(null);
    const [lastVisibleType, setLastVisibleType] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const LIMIT = 24;

    useEffect(() => {
        // Initial fetch
        async function fetchInitial() {
            if (!currentUser) return;
            setLoading(true);
            try {
                const api = httpsCallable(functions, 'api');
                const result = await api({
                    action: 'getUserImages',
                    limit: LIMIT,
                    searchQuery: searchQuery || undefined,
                    filter: activeFilter // Pass filter
                });

                const data = result.data;
                const newImages = data.images || [];
                setImages(newImages);
                setLastVisibleId(data.lastVisibleId);
                setLastVisibleType(data.lastVisibleType);
                setHasMore(data.hasMore);

                // Programmatic Preloading for LCP
                newImages.slice(0, 4).forEach(img => {
                    const preloadUrl = getOptimizedImageUrl(img.thumbnailUrl || img.imageUrl);
                    preloadImage(preloadUrl, 'high');
                });

                if (data.warnings) {
                    data.warnings.forEach(w => toast.error(w, { duration: 4000 }));
                }

            } catch (err) {
                console.error("Error fetching images:", err);
                toast.error("Failed to load images");
            } finally {
                setLoading(false);
            }
        }

        fetchInitial();
    }, [currentUser, searchQuery, activeFilter]); // Re-run if filter changes

    const loadMore = async () => {
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
                filter: activeFilter
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

            if (data.warnings) {
                data.warnings.forEach(w => toast.error(w, { duration: 4000 }));
            }
        } catch (err) {
            console.error("Error loading more:", err);
            toast.error("Could not load more images");
        } finally {
            setLoadingMore(false);
        }
    };

    const filteredImages = useMemo(() => {
        // Client-side filtering is now handled by the function, but we keep this for consistency
        if (!searchQuery) return images;
        const queryLower = searchQuery.toLowerCase();
        return images.filter(img =>
            img.prompt?.toLowerCase().includes(queryLower)
        );
    }, [images, searchQuery]);

    const executeDelete = async (toastId) => {
        toast.dismiss(toastId);
        const loadToast = toast.loading('Deleting...');
        try {
            const api = httpsCallable(functions, 'api');
            const result = await api({ action: 'deleteImagesBatch', imageIds: selectedIds });

            if (result.data.success) {
                setImages(prev => prev.filter(img => !selectedIds.includes(img.id)));
                setSelectedIds([]);
                setIsSelectionMode(false);
                toast.success(`Deleted ${result.data.deleted} image(s) successfully`);
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
                            Delete {selectedIds.length} image{selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => executeDelete(t.id)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 8000,
            id: 'delete-toast'
        });
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="container" style={{ paddingTop: '140px', paddingBottom: '120px' }}>
            <SEO
                title="My Gallery - Personal AI Art Collection"
                description="Your private collection of AI-generated masterpieces. Manage, download, and organize your synthesized dreams."
                keywords="AI art gallery, personal collection, generated images, AI artwork showcase"
                noindex={true}
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": "Personal AI Art Gallery",
                    "description": "Private collection of user-generated AI artwork."
                }}
            />

            {/* Header */}
            <header style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: '1', color: 'white', marginBottom: '16px' }}>
                            Gallery
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>
                            Your personal collection of synthesized dreams.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link to="/" className="btn btn-primary" style={{ padding: '0 24px', height: '44px' }}>
                            <Plus size={18} style={{ marginRight: '8px' }} />
                            Create
                        </Link>
                        <button
                            className={`btn ${isSelectionMode ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds([]);
                            }}
                            style={{ height: '44px' }}
                        >
                            {isSelectionMode ? 'Finish' : 'Select'}
                        </button>
                    </div>
                </div>

                {/* Sub-header / Search & Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>

                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {['all', 'mockup', 'image'].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    border: 'none',
                                    textTransform: 'capitalize',
                                    background: activeFilter === f ? 'white' : 'transparent',
                                    color: activeFilter === f ? 'black' : 'var(--color-text-muted)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f === 'all' ? 'All' : f + 's'}
                            </button>
                        ))}
                    </div>

                    <div className="search-wrapper" style={{ flex: 1, height: '44px', background: 'transparent', border: 'none', padding: 0 }}>
                        <Search className="search-icon" size={18} color="var(--color-text-muted)" style={{ left: 0 }} />
                        <input
                            type="text"
                            placeholder="Filter by prompt..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '32px', background: 'transparent', border: 'none', fontSize: '1rem', height: '100%' }}
                        />
                    </div>
                </div>
            </header>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {[...Array(9)].map((_, i) => (
                        <div key={i} style={{
                            aspectRatio: '1',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)',
                            animation: 'pulseSubtle 2s infinite',
                            animationDelay: `${i * 0.1}s`
                        }} />
                    ))}
                </div>
            ) : filteredImages.length === 0 ? (
                <div style={{ padding: '120px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'var(--color-surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '24px',
                        color: 'var(--color-text-dim)'
                    }}>
                        <Search size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '8px' }}>The void is waiting.</h3>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '300px', lineHeight: 1.5 }}>
                        Your gallery is empty. Start generating to fill this space with your imagination.
                    </p>
                    <Link to="/generate" className="btn btn-primary" style={{ marginTop: '32px' }}>
                        Start Creating
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {filteredImages.map((img, i) => (
                        <div
                            key={img.id}
                            className={`fade-in gallery-item-wrapper ${isSelectionMode && selectedIds.includes(img.id) ? 'selected' : ''}`}
                            onClick={() => isSelectionMode ? toggleSelection(img.id) : navigate(`/gallery/${img.id}`, { state: { image: img } })}
                            style={{
                                position: 'relative',
                                aspectRatio: img.aspectRatio ? img.aspectRatio.replace(':', '/') : '1/1',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                background: 'var(--color-surface)',
                                animationDelay: `${i * 0.05}s` // Dynamic stagger
                            }}
                        >
                            {img.type === 'video' ? (
                                <>
                                    <video
                                        src={img.videoUrl || img.imageUrl}
                                        muted
                                        loop
                                        playsInline
                                        onMouseOver={e => e.target.play()}
                                        onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Film size={12} color="white" />
                                        <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: '600' }}>VIDEO</span>
                                    </div>
                                </>
                            ) : (
                                <div className="image-card-inner" style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                    background: img.lqip ? `url(${img.lqip}) center/cover no-repeat` : 'rgba(255,255,255,0.03)',
                                    filter: img.lqip ? 'blur(10px)' : 'none',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        src={getOptimizedImageUrl(img.thumbnailUrl || img.imageUrl)}
                                        srcSet={getImageSrcSet(img)}
                                        sizes="(max-width: 768px) 100vw, 300px"
                                        alt={img.prompt || "User generated artwork"}
                                        {...getLCPAttributes(i, 4)}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                            position: 'relative',
                                            zIndex: 1,
                                            filter: 'none' // Ensure image itself is not blurred
                                        }}
                                        onLoad={(e) => {
                                            // Optional: remove blur on load from parent
                                            e.target.parentElement.style.filter = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Hover Overlay - Minimal */}
                            <div className="gallery-overlay" style={{
                                position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                opacity: isSelectionMode ? 0 : 0, transition: 'opacity 0.2s',
                                display: 'flex', alignItems: 'flex-end', padding: '20px',
                                pointerEvents: 'none'
                            }}>
                                <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500', lineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {img.prompt}
                                </p>
                            </div>

                            {/* Selection Indicator */}
                            {isSelectionMode && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    border: selectedIds.includes(img.id) ? '4px solid var(--color-accent-primary)' : 'none',
                                    background: selectedIds.includes(img.id) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {selectedIds.includes(img.id) && (
                                        <div style={{ padding: '12px', background: 'var(--color-accent-primary)', borderRadius: '50%' }}>
                                            <Check color="white" size={24} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Load More Button */}
            {!loading && hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="btn btn-outline"
                        style={{ minWidth: '160px' }}
                    >
                        {loadingMore ? <Loader2 className="animate-spin" size={18} /> : 'Load More'}
                    </button>
                </div>
            )}

            {/* Batch Actions Float */}
            {isSelectionMode && selectedIds.length > 0 && (
                <div className="fade-in" style={{
                    position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    padding: '12px 24px', borderRadius: '100px',
                    display: 'flex', alignItems: 'center', gap: '24px',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedIds.length} Selected</span>
                    <div style={{ height: '20px', width: '1px', background: 'var(--color-border)' }} />
                    <button onClick={handleBatchDelete} style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    <button onClick={() => setSelectedIds([])} style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                </div>
            )}

            {/* CSS for hover effect injection */}
            <style>{`
                .gallery-item-wrapper:hover img {
                    transform: scale(1.05);
                }
                .gallery-item-wrapper:hover .gallery-overlay {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}
