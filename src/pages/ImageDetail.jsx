import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Download, Trash2, Calendar, Info, ArrowLeft, Loader2, Share2 } from 'lucide-react';

export default function ImageDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchImage() {
            try {
                const docRef = doc(db, "images", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Basic security check: only the owner can view
                    if (data.userId !== currentUser.uid) {
                        navigate('/gallery');
                        return;
                    }
                    setImage({ id: docSnap.id, ...data });
                } else {
                    navigate('/gallery');
                }
            } catch (err) {
                console.error("Error fetching image:", err);
                navigate('/gallery');
            } finally {
                setLoading(false);
            }
        }
        if (currentUser && id) {
            fetchImage();
        }
    }, [id, currentUser, navigate]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        try {
            await deleteDoc(doc(db, "images", id));
            navigate('/gallery');
        } catch (err) {
            console.error("Error deleting image:", err);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = image.imageUrl;
        link.download = `DreamBee-${image.prompt.slice(0, 20)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
            </div>
        );
    }

    if (!image) return null;

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
            <Link to="/gallery" className="btn btn-outline" style={{ marginBottom: '40px', gap: '8px' }}>
                <ArrowLeft size={18} /> Back to Gallery
            </Link>

            <div className="glass-panel fade-in" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                <div className="modal-grid">
                    <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
                        <img
                            src={image.imageUrl}
                            alt={image.prompt}
                            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }}
                        />
                    </div>

                    <div className="modal-info-panel">
                        <div style={{ marginBottom: '40px' }}>
                            <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={16} /> Prompt
                            </h4>
                            <p style={{ fontSize: '1.25rem', lineHeight: '1.6', color: '#fff', fontWeight: '500' }}>{image.prompt}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                            <div>
                                <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={16} /> Created
                                </h4>
                                <p style={{ fontSize: '1rem' }}>
                                    {image.createdAt?.seconds ? new Date(image.createdAt.seconds * 1000).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Recently'}
                                </p>
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Model
                                </h4>
                                <p style={{ fontSize: '1rem' }}>SDXL Turbo</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', gap: '10px', height: '56px', fontSize: '1.1rem' }}
                                onClick={handleDownload}
                            >
                                <Download size={22} /> Download HD
                            </button>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    className="btn btn-outline"
                                    style={{ flex: 1, gap: '8px' }}
                                    onClick={() => {
                                        navigator.clipboard.writeText(image.prompt);
                                        alert("Prompt copied to clipboard!");
                                    }}
                                >
                                    <Share2 size={18} /> Copy Prompt
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ width: '56px', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                    onClick={handleDelete}
                                >
                                    <Trash2 size={20} color="#ef4444" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
