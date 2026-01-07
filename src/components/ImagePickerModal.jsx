import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getOptimizedImageUrl } from '../utils';

export default function ImagePickerModal({ isOpen, onClose, onSelect }) {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'upload'
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && activeTab === 'gallery' && currentUser) {
            fetchGalleryImages();
        }
    }, [isOpen, activeTab, currentUser]);

    const fetchGalleryImages = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'generation_queue'), // Fetch from generation history
                where('userId', '==', currentUser.uid),
                where('status', '==', 'completed'), // Only completed generations
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(q);
            const fetchedImages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setImages(fetchedImages);
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        // Convert to base64 immediately for this use case
        const reader = new FileReader();
        reader.onloadend = () => {
            onSelect({ type: 'upload', data: reader.result }); // Pass base64
            setUploading(false);
            onClose();
        };
        reader.readAsDataURL(file);
    };

    const handleGallerySelect = (image) => {
        onSelect({ type: 'gallery', data: image.imageUrl }); // Pass URL
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '600px', height: '80vh',
                display: 'flex', flexDirection: 'column',
                borderRadius: '24px', overflow: 'hidden',
                background: '#111', border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>Select Image</h2>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => setActiveTab('gallery')}
                        style={{
                            flex: 1, padding: '16px', background: 'transparent', border: 'none',
                            color: activeTab === 'gallery' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                            fontWeight: '600', cursor: 'pointer',
                            borderBottom: activeTab === 'gallery' ? '2px solid var(--color-accent-primary)' : 'none'
                        }}
                    >
                        Gallery
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        style={{
                            flex: 1, padding: '16px', background: 'transparent', border: 'none',
                            color: activeTab === 'upload' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                            fontWeight: '600', cursor: 'pointer',
                            borderBottom: activeTab === 'upload' ? '2px solid var(--color-accent-primary)' : 'none'
                        }}
                    >
                        Upload
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="custom-scrollbar">

                    {activeTab === 'gallery' && (
                        loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <Loader2 className="animate-spin" size={32} color="var(--color-text-muted)" />
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                                {images.map(img => (
                                    <button
                                        key={img.id}
                                        onClick={() => handleGallerySelect(img)}
                                        style={{
                                            aspectRatio: '1', borderRadius: '12px', overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.1)', padding: 0, cursor: 'pointer',
                                            position: 'relative'
                                        }}
                                        className="hover-card"
                                    >
                                        <img
                                            src={getOptimizedImageUrl(img.imageUrl)}
                                            alt={img.prompt}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </button>
                                ))}
                                {images.length === 0 && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                                        No recent images found.
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {activeTab === 'upload' && (
                        <div style={{
                            height: '100%', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px',
                            padding: '40px', gap: '16px'
                        }}>
                            <Upload size={48} color="var(--color-text-muted)" />
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                                    Upload an Image
                                </div>
                                <div>JPG or PNG supported</div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-primary"
                                style={{ padding: '12px 32px', borderRadius: '12px' }}
                                disabled={uploading}
                            >
                                {uploading ? 'Processing...' : 'Select File'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
