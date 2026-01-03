import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Search, Download, Trash2, X, ExternalLink, Calendar, Info, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Gallery() {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        async function fetchImages() {
            if (!currentUser) return;
            try {
                const q = query(
                    collection(db, "images"),
                    where("userId", "==", currentUser.uid)
                );
                const snapshot = await getDocs(q);
                const imgs = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setImages(imgs);
            } catch (err) {
                console.error("Error fetching images:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchImages();
    }, [currentUser]);

    const filteredImages = useMemo(() => {
        return images.filter(img =>
            img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [images, searchQuery]);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                    <AlertTriangle size={20} color="#ef4444" />
                    <span style={{ fontWeight: '600' }}>Delete this image?</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await deleteDoc(doc(db, "images", id));
                                setImages(prev => prev.filter(img => img.id !== id));
                                toast.success("Image deleted");
                            } catch (err) {
                                console.error("Error deleting image:", err);
                                toast.error("Failed to delete image");
                            }
                        }}
                        style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            flex: 1
                        }}
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            flex: 1
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 6000 });
    };

    const handleBatchDelete = async () => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                    <AlertTriangle size={20} color="#ef4444" />
                    <span style={{ fontWeight: '600' }}>Delete {selectedIds.length} images?</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const loadToast = toast.loading(`Deleting ${selectedIds.length} images...`);
                                await Promise.all(selectedIds.map(id => deleteDoc(doc(db, "images", id))));
                                setImages(prev => prev.filter(img => !selectedIds.includes(img.id)));
                                setSelectedIds([]);
                                setIsSelectionMode(false);
                                toast.dismiss(loadToast);
                                toast.success("Images deleted successfully");
                            } catch (err) {
                                console.error("Error batch deleting:", err);
                                toast.error("Failed to delete some images");
                            }
                        }}
                        style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            flex: 1
                        }}
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            flex: 1
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 8000 });
    };

    const handleDownload = (e, url, prompt) => {
        if (e) e.stopPropagation();
        const link = document.createElement('a');
        link.href = url;
        link.download = `DreamBee-${prompt.slice(0, 20)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBatchDownload = () => {
        selectedIds.forEach(id => {
            const img = images.find(i => i.id === id);
            if (img) handleDownload(null, img.imageUrl, img.prompt);
        });
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '120px' }}>
            <header style={{ marginBottom: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: '800', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Your Gallery
                    </h1>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            className={`btn ${isSelectionMode ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds([]);
                            }}
                        >
                            {isSelectionMode ? 'Cancel' : 'Select'}
                        </button>
                        <Link to="/" className="btn btn-primary" style={{ gap: '8px' }}>
                            <ExternalLink size={18} />
                            Create New
                        </Link>
                    </div>
                </div>

                <div className="search-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search by prompt..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            {loading ? (
                <div className="masonry-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="masonry-item">
                            <div className="glass-panel" style={{ padding: '12px' }}>
                                <div className="skeleton" style={{ aspectRatio: '1', width: '100%', borderRadius: '12px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredImages.length === 0 ? (
                <div className="glass-panel fade-in" style={{ padding: '80px 20px', textAlign: 'center' }}>
                    <div style={{ background: 'var(--color-surface)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Search size={32} color="var(--color-text-muted)" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>No matches found</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
                        {searchQuery ? `We couldn't find any images matching "${searchQuery}"` : "You haven't generated any images yet."}
                    </p>
                    <Link to="/" className="btn btn-primary">Start Generating</Link>
                </div>
            ) : (
                <div className="masonry-grid fade-in">
                    {filteredImages.map(img => (
                        <div
                            key={img.id}
                            className="masonry-item"
                            onClick={() => isSelectionMode ? toggleSelection(img.id) : navigate(`/gallery/${img.id}`)}
                        >
                            <div className={`glass-panel gallery-card ${isSelectionMode ? 'selecting' : ''} ${selectedIds.includes(img.id) ? 'selected' : ''}`}>
                                {isSelectionMode && (
                                    <div className={`selection-dot ${selectedIds.includes(img.id) ? 'selected' : ''}`}>
                                        {selectedIds.includes(img.id) && <Check size={14} color="white" />}
                                    </div>
                                )}
                                <img
                                    src={img.imageUrl}
                                    alt={img.prompt}
                                    style={{ width: '100%', display: 'block', borderRadius: 'var(--radius-lg)' }}
                                    loading="lazy"
                                />
                                {!isSelectionMode && (
                                    <div className="overlay">
                                        <p style={{
                                            fontSize: '0.85rem',
                                            marginBottom: '16px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: '1.4'
                                        }}>{img.prompt}</p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '8px', flex: 1, fontSize: '0.8rem', gap: '6px' }}
                                                onClick={(e) => handleDownload(e, img.imageUrl, img.prompt)}
                                            >
                                                <Download size={14} /> Download
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '8px', width: '40px', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                                onClick={(e) => handleDelete(e, img.id)}
                                            >
                                                <Trash2 size={14} color="#ef4444" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isSelectionMode && selectedIds.length > 0 && (
                <div className="glass-panel batch-bar fade-in">
                    <span style={{ fontWeight: '600' }}>{selectedIds.length} items selected</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-outline" style={{ gap: '8px' }} onClick={handleBatchDownload}>
                            <Download size={18} /> Download
                        </button>
                        <button className="btn btn-outline" style={{ gap: '8px', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} onClick={handleBatchDelete}>
                            <Trash2 size={18} /> Delete Selected
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
