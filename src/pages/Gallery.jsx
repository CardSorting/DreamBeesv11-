import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Search, Download, Trash2, X, ExternalLink, Calendar, Info } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Gallery() {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            await deleteDoc(doc(db, "images", id));
            setImages(prev => prev.filter(img => img.id !== id));
        } catch (err) {
            console.error("Error deleting image:", err);
        }
    };

    const handleDownload = (e, url, prompt) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = url;
        link.download = `DreamBee-${prompt.slice(0, 20)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
            <header style={{ marginBottom: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Your Gallery
                    </h1>
                    <Link to="/" className="btn btn-primary" style={{ gap: '8px' }}>
                        <ExternalLink size={18} />
                        Create New
                    </Link>
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
                            onClick={() => navigate(`/gallery/${img.id}`)}
                        >
                            <div className="glass-panel gallery-card">
                                <img
                                    src={img.imageUrl}
                                    alt={img.prompt}
                                    style={{ width: '100%', display: 'block', borderRadius: 'var(--radius-lg)' }}
                                    loading="lazy"
                                />
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
