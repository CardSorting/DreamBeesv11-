import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Download, Trash2, ArrowLeft, Loader2, RefreshCw, Link as LinkIcon, Info, Sliders, Layers, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useModel } from '../contexts/ModelContext';
import toast from 'react-hot-toast';

export default function ImageDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const location = useLocation();

    // Optimistically set from state if available
    const [image, setImage] = useState(location.state?.image || null);
    const [loading, setLoading] = useState(!location.state?.image);

    const [showFullPrompt, setShowFullPrompt] = useState(false);

    const { availableModels } = useModel();
    const modelName = image ? (availableModels.find(m => m.id === image.modelId)?.name || 'SDXL Model') : 'Loading...';

    useEffect(() => {
        // If we already have the image from navigation state, we don't need to fetch
        if (location.state?.image && location.state.image.id === id) {
            setLoading(false);
            return;
        }

        async function fetchImage() {
            setLoading(true);
            try {
                const docRef = doc(db, "images", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
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
        if (currentUser && id) fetchImage();
    }, [id, currentUser, navigate, location.state]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleDelete = async () => {
        if (!window.confirm("Permanently delete this creation?")) return;
        try {
            await deleteDoc(doc(db, "images", id));
            navigate('/gallery');
            toast.success("Deleted");
        } catch (err) {
            toast.error("Deletion failed");
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ height: '100vh', width: '100vw' }}>
            <Loader2 className="animate-spin" size={32} color="var(--color-text-muted)" />
        </div>
    );

    if (!image) return null;

    const isLongPrompt = image.prompt.length > 300;

    return (
        <div style={{ height: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Top Navigation Bar */}
            <div style={{
                height: '60px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', background: 'var(--color-bg)'
            }}>
                <Link to="/gallery" className="flex-center" style={{ gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500', transition: 'color 0.2s' }}>
                    <ArrowLeft size={16} /> Back
                </Link>

                <div className="flex-center" style={{ gap: '12px' }}>
                    <button onClick={() => handleCopy(window.location.href)} className="btn-ghost" title="Copy Link">
                        <LinkIcon size={18} />
                    </button>
                    <button onClick={handleDelete} className="btn-ghost" style={{ color: '#ef4444' }} title="Delete">
                        <Trash2 size={18} />
                    </button>
                    <button onClick={async () => {
                        try {
                            const response = await fetch(image.imageUrl);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `db-${image.id}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                        } catch (e) {
                            console.error("Download failed", e);
                            window.open(image.imageUrl, '_blank');
                        }
                    }} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        <Download size={16} style={{ marginRight: '8px' }} /> Download
                    </button>
                </div>
            </div>

            {/* Main Split Layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Left: Image Canvas (Theater Mode) */}
                <div style={{
                    flex: 1,
                    background: '#050505',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '40px'
                }}>
                    <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        style={{
                            maxWidth: '100%', maxHeight: '100%',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {/* Right: Inspector Panel */}
                <div style={{
                    width: '400px',
                    borderLeft: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    overflowY: 'auto',
                    padding: '32px'
                }}>
                    <div style={{ marginBottom: '40px', position: 'relative' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                            PROMPT
                        </label>

                        <div style={{
                            position: 'relative',
                            maxHeight: showFullPrompt ? 'none' : '200px',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease'
                        }}>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'white', fontWeight: '400', wordBreak: 'break-word' }}>
                                {image.prompt}
                            </p>
                            {!showFullPrompt && isLongPrompt && (
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80px',
                                    background: 'linear-gradient(to bottom, transparent, var(--color-bg))',
                                    pointerEvents: 'none'
                                }} />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                            <button
                                onClick={() => handleCopy(image.prompt)}
                                style={{ fontSize: '0.8rem', color: 'var(--color-accent-primary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: '500' }}
                            >
                                Copy Prompt
                            </button>
                            {isLongPrompt && (
                                <button
                                    onClick={() => setShowFullPrompt(!showFullPrompt)}
                                    style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    {showFullPrompt ? <>Show Less <ChevronUp size={14} /></> : <>Read All <ChevronDown size={14} /></>}
                                </button>
                            )}
                        </div>

                    </div>

                    {image.negative_prompt && (
                        <div style={{ marginBottom: '40px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                                NEGATIVE PROMPT
                            </label>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--color-text-muted)', fontWeight: '400', fontStyle: 'italic' }}>
                                {image.negative_prompt}
                            </p>
                        </div>
                    )}

                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 0 40px 0' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 12px' }}>
                        <div>
                            <label className="meta-label">MODEL</label>
                            <div className="meta-value">{modelName}</div>
                        </div>
                        <div>
                            <label className="meta-label">DIMENSIONS</label>
                            <div className="meta-value">
                                {image.aspectRatio === '1:1' ? '1024 x 1024' :
                                    image.aspectRatio === '16:9' ? '1216 x 832' :
                                        image.aspectRatio === '9:16' ? '832 x 1216' :
                                            image.aspectRatio === '3:2' ? '1216 x 832' :
                                                '1024 x 1024'}
                            </div>
                        </div>
                        <div>
                            <label className="meta-label">STEPS</label>
                            <div className="meta-value">{image.steps || 30}</div>
                        </div>
                        <div>
                            <label className="meta-label">GUIDANCE</label>
                            <div className="meta-value">{image.cfg || 7.0}</div>
                        </div>
                        <div>
                            <label className="meta-label">SEED</label>
                            <div className="meta-value text-mono">{image.seed || 'Random'}</div>
                        </div>
                        <div>
                            <label className="meta-label">ASPECT</label>
                            <div className="meta-value">{image.aspectRatio || '1:1'}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '60px' }}>
                        <Link to={`/?prompt=${encodeURIComponent(image.prompt)}&seed=${image.seed}&steps=${image.steps}&cfg=${image.cfg}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                            <RefreshCw size={16} style={{ marginRight: '8px' }} /> Remix in Studio
                        </Link>
                    </div>

                </div>

            </div>

            <style>{`
                .meta-label {
                    fontSize: 0.7rem;
                    fontWeight: 700;
                    letterSpacing: 0.05em;
                    color: var(--color-text-dim);
                    textTransform: uppercase;
                    display: block;
                    marginBottom: 8px;
                }
                .meta-value {
                    fontSize: 0.95rem;
                    font-weight: 500;
                    color: white;
                }
                .text-mono {
                    font-family: monospace;
                    letter-spacing: -0.02em;
                }
            `}</style>
        </div>
    );
}
