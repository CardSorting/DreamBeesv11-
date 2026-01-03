import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Download, Trash2, Calendar, Info, ArrowLeft, Loader2, Share2, RefreshCw, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { AVAILABLE_MODELS } from '../contexts/ModelContext';
import toast from 'react-hot-toast';

export default function ImageDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFullPrompt, setShowFullPrompt] = useState(false);
    const PROMPT_LIMIT = 200;

    const modelName = image ? (AVAILABLE_MODELS.find(m => m.id === image.modelId)?.name || 'SDXL Model') : 'Loading...';

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
                                navigate('/gallery');
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

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = image.imageUrl;
        link.download = `DreamBee-${image.prompt.slice(0, 20)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    const handleRemix = () => {
        const params = new URLSearchParams();
        params.set('prompt', image.prompt);
        if (image.aspectRatio) params.set('aspectRatio', image.aspectRatio);
        if (image.steps) params.set('steps', image.steps);
        if (image.cfg) params.set('cfg', image.cfg);
        if (image.negative_prompt) params.set('negPrompt', image.negative_prompt);
        if (image.modelId) params.set('modelId', image.modelId);
        navigate(`/?${params.toString()}`);
    };

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
            </div>
        );
    }

    if (!image) return null;

    const isPromptLong = image.prompt.length > PROMPT_LIMIT;

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
            <Link to="/gallery" className="btn btn-outline" style={{ marginBottom: '32px', gap: '8px' }}>
                <ArrowLeft size={18} /> Back to Gallery
            </Link>

            <div className="glass-panel fade-in" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="modal-grid">
                    <div style={{
                        background: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '40vh',
                        position: 'relative',
                        padding: '20px'
                    }}>
                        <img
                            src={image.imageUrl}
                            alt={image.prompt}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '85vh',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                    </div>

                    <div className="modal-info-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Prompt Section */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                                <Info size={16} />
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prompt Description</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <p style={{
                                    fontSize: '1.1rem',
                                    lineHeight: '1.6',
                                    color: '#fff',
                                    fontWeight: '400',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {isPromptLong && !showFullPrompt
                                        ? `${image.prompt.slice(0, PROMPT_LIMIT)}...`
                                        : image.prompt}
                                </p>
                                {isPromptLong && (
                                    <button
                                        onClick={() => setShowFullPrompt(!showFullPrompt)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-primary)',
                                            fontWeight: '600',
                                            fontSize: '0.9rem',
                                            marginTop: '8px',
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        {showFullPrompt ? 'Show Less' : 'Read Full Prompt'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '20px',
                            marginBottom: '32px',
                            padding: '24px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Aspect Ratio</span>
                                <span style={{ fontSize: '1rem', fontWeight: '600', color: 'white' }}>{image.aspectRatio || '1:1'}</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Steps</span>
                                <span style={{ fontSize: '1rem', fontWeight: '600', color: 'white' }}>{image.steps || 30}</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>CFG Scale</span>
                                <span style={{ fontSize: '1rem', fontWeight: '600', color: 'white' }}>{image.cfg || 5.0}</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Model</span>
                                <span style={{ fontSize: '1rem', fontWeight: '600', color: 'white' }}>{modelName}</span>
                            </div>
                        </div>

                        {image.negative_prompt && (
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-text-muted)' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Negative Prompt</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: '1.4' }}>{image.negative_prompt}</p>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: '1 1 140px', gap: '10px', height: '52px' }}
                                    onClick={handleDownload}
                                >
                                    <Download size={20} /> Download
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ flex: '1 1 140px', gap: '10px', height: '52px', border: '1px solid var(--color-primary)' }}
                                    onClick={handleRemix}
                                >
                                    <RefreshCw size={20} /> Remix
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    className="btn btn-outline"
                                    style={{ flex: 1, gap: '8px', fontSize: '0.85rem' }}
                                    onClick={() => {
                                        const meta = `Prompt: ${image.prompt}\nNegative Prompt: ${image.negative_prompt || 'None'}\nSteps: ${image.steps || 30}\nCFG: ${image.cfg || 5.0}\nRatio: ${image.aspectRatio || '1:1'}`;
                                        navigator.clipboard.writeText(meta);
                                        toast.success("Full generation info copied!");
                                    }}
                                >
                                    <RefreshCw size={16} /> Copy Info
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ flex: 1, gap: '8px', fontSize: '0.85rem' }}
                                    onClick={handleCopyLink}
                                >
                                    <LinkIcon size={16} /> Copy Link
                                </button>
                                <button
                                    className="btn btn-outline"
                                    style={{ width: '52px', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                    onClick={handleDelete}
                                >
                                    <Trash2 size={18} color="#ef4444" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
