import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, ArrowLeft, Loader2, RefreshCw, Link as LinkIcon, Info, Sliders, Layers, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useModel } from '../contexts/ModelContext';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl } from '../utils';

export default function ImageDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const location = useLocation();

    // Optimistically set from state if available
    const [image, setImage] = useState(location.state?.image || null);
    const [loading, setLoading] = useState(!location.state?.image);

    const [showFullPrompt, setShowFullPrompt] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

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
                const api = httpsCallable(functions, 'api');
                const result = await api({ action: 'getImageDetail', imageId: id });

                if (result.data) {
                    setImage(result.data);
                } else {
                    navigate('/gallery');
                }
            } catch (err) {
                console.error("Error fetching image:", err);
                const errorMessage = err.message || "Failed to load image";
                if (errorMessage.includes("not found") || errorMessage.includes("Unauthorized")) {
                    toast.error(errorMessage);
                }
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

    const executeDelete = async (toastId) => {
        toast.dismiss(toastId);
        const loadToast = toast.loading('Deleting...');
        try {
            const api = httpsCallable(functions, 'api');
            await api({ action: 'deleteImage', imageId: id });
            navigate('/gallery');
            toast.success("Deleted permanently");
        } catch (err) {
            console.error("Error deleting image:", err);
            const errorMessage = err.message || "Deletion failed";
            toast.error(errorMessage);
        } finally {
            toast.dismiss(loadToast);
        }
    };

    const handleDelete = () => {
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
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Delete Creation?</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            This will permanently remove this image from your gallery.
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
            id: 'delete-image-toast'
        });
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
            <SEO
                title={`AI Image: ${image.prompt.slice(0, 50)}...`}
                description={`Created with ${modelName}. Prompt: ${image.prompt}`}
                image={getOptimizedImageUrl(image.imageUrl)}
            />

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

                </div>
            </div>

            {/* Main Split Layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Left: Image Canvas (Theater Mode) */}
                {/* Left: Image Canvas (Theater Mode) */}
                <div style={{
                    flex: 1,
                    background: '#050505',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '40px',
                    position: 'relative'
                }}>
                    {image.slides && image.slides.length > 0 ? (
                        /* SLIDESHOW MODE */
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                            {/* Main Slide */}
                            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '80%' }}>
                                <img
                                    src={getOptimizedImageUrl(image.slides[activeSlideIndex || 0].imageUrl)}
                                    alt={`Slide ${(activeSlideIndex || 0) + 1}`}
                                    style={{
                                        maxWidth: '100%', maxHeight: '60vh',
                                        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                        objectFit: 'contain'
                                    }}
                                />

                                {/* Navigation Arrows */}
                                <button
                                    onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                                    disabled={activeSlideIndex === 0}
                                    style={{
                                        position: 'absolute', left: '-50px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                                        width: '40px', height: '40px', color: 'white', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: activeSlideIndex === 0 ? 0.3 : 1
                                    }}
                                >
                                    <ChevronLeft />
                                </button>
                                <button
                                    onClick={() => setActiveSlideIndex(prev => Math.min(image.slides.length - 1, prev + 1))}
                                    disabled={activeSlideIndex === image.slides.length - 1}
                                    style={{
                                        position: 'absolute', right: '-50px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                                        width: '40px', height: '40px', color: 'white', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: activeSlideIndex === image.slides.length - 1 ? 0.3 : 1
                                    }}
                                >
                                    <ChevronRight />
                                </button>
                            </div>

                            {/* Thumbnail Strip */}
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', padding: '10px' }}>
                                {image.slides.map((slide, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveSlideIndex(idx)}
                                        style={{
                                            width: '60px', height: '60px',
                                            borderRadius: '8px', overflow: 'hidden',
                                            border: (activeSlideIndex || 0) === idx ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                                            cursor: 'pointer', opacity: (activeSlideIndex || 0) === idx ? 1 : 0.6
                                        }}
                                    >
                                        <img src={slide.thumbnailUrl || slide.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : image.type === 'video' || image.videoUrl ? (
                        /* VIDEO MODE */
                        <video
                            src={image.videoUrl || image.url} // Check both
                            controls
                            autoPlay
                            loop
                            playsInline
                            poster={getOptimizedImageUrl(image.imageUrl)}
                            style={{
                                maxWidth: '100%', maxHeight: '100%',
                                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                            }}
                        />
                    ) : (
                        /* SINGLE IMAGE MODE */
                        <img
                            src={getOptimizedImageUrl(image.imageUrl)}
                            alt={image.prompt || "Generated Image Detail"}
                            style={{
                                maxWidth: '100%', maxHeight: '100%',
                                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                objectFit: 'contain'
                            }}
                        />
                    )}
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
                                {image.slides ? image.slides[activeSlideIndex]?.prompt : image.prompt}
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
