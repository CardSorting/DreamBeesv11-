import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Gallery() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Your Gallery</h1>
                </div>
                <Link to="/" className="btn btn-primary">Create New</Link>
            </header>

            {loading ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '12px' }}>
                            <div className="skeleton" style={{ aspectRatio: '1', width: '100%', marginBottom: '12px', borderRadius: '8px' }}></div>
                            <div className="skeleton" style={{ height: '16px', width: '70%', borderRadius: '4px' }}></div>
                        </div>
                    ))}
                </div>
            ) : images.length === 0 ? (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', marginBottom: '20px' }}>No images yet.</p>
                    <Link to="/" className="btn btn-primary">Start Generating</Link>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {images.map(img => (
                        <div key={img.id} className="glass-panel" style={{ padding: '12px', transition: 'transform 0.2s' }}>
                            <div style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: '8px', marginBottom: '12px' }}>
                                <img
                                    src={img.imageUrl}
                                    alt={img.prompt}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <p style={{
                                color: 'var(--color-text-muted)',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>{img.prompt}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
