import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, limit, orderBy, startAfter } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Search, Download, Trash2, X, ExternalLink, Calendar, Info, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Gallery() {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const { currentUser } = useAuth();

    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const LIMIT = 24;

    useEffect(() => {
        // Initial fetch
        async function fetchInitial() {
            if (!currentUser) return;
            try {
                // Determine if we need to search or just list
                if (searchQuery.length > 0) return; // Search is handled client-side for now or needs separate query

                const q = query(
                    collection(db, "images"),
                    where("userId", "==", currentUser.uid),
                    orderBy("createdAt", "desc"),
                    limit(LIMIT)
                );
                const snapshot = await getDocs(q);

                const imgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setImages(imgs);
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === LIMIT);

            } catch (err) {
                console.error("Error fetching images:", err);
            } finally {
                setLoading(false);
            }
        }

        if (searchQuery === '') {
            fetchInitial();
        }
    }, [currentUser, searchQuery]); // Re-run if user or search clears

    const loadMore = async () => {
        if (!currentUser || !lastVisible || loadingMore) return;
        setLoadingMore(true);
        try {
            const q = query(
                collection(db, "images"),
                where("userId", "==", currentUser.uid),
                orderBy("createdAt", "desc"),
                startAfter(lastVisible),
                limit(LIMIT)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const newImgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setImages(prev => [...prev, ...newImgs]);
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === LIMIT);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error loading more:", err);
            toast.error("Could not load more images");
        } finally {
            setLoadingMore(false);
        }
    };

    const filteredImages = useMemo(() => {
        return images.filter(img =>
            img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [images, searchQuery]);

    const handleBatchDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} images? This cannot be undone.`)) return;

        const loadToast = toast.loading('Deleting...');
        try {
            await Promise.all(selectedIds.map(id => deleteDoc(doc(db, "images", id))));
            setImages(prev => prev.filter(img => !selectedIds.includes(img.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
            toast.success("Deleted successfully");
        } catch (err) {
            toast.error("Failed to delete");
        } finally {
            toast.dismiss(loadToast);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="container" style={{ paddingTop: '140px', paddingBottom: '120px' }}>

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

                {/* Sub-header / Search */}
                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
                    <div className="search-wrapper" style={{ flex: 1, maxWidth: '400px', background: 'transparent', border: 'none', padding: 0 }}>
                        <Search className="search-icon" size={18} color="var(--color-text-muted)" style={{ left: 0 }} />
                        <input
                            type="text"
                            placeholder="Filter by prompt..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '32px', background: 'transparent', border: 'none', fontSize: '1rem' }}
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
                            <img
                                src={img.imageUrl}
                                alt={img.prompt}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                            />

                            {/* Hover Overlay - Minimal */}
                            <div className="gallery-overlay" style={{
                                position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                opacity: isSelectionMode ? 0 : 0, transition: 'opacity 0.2s',
                                display: 'flex', alignItems: 'flex-end', padding: '20px'
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
            {!loading && hasMore && searchQuery === '' && (
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
