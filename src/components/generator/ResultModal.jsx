import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Film, Image as ImageIcon, Maximize2, ThumbsUp, ThumbsDown, X, Download, Share2 } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils';
import { Link } from 'react-router-dom';

export default function ResultModal({
    isOpen,
    onClose,
    generatedImage,
    generationMode,
    prompt,
    onRate,
    downloadUrl
}) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 10
                }}>
                    <a
                        href={downloadUrl || generatedImage}
                        download={`dream-bees-${Date.now()}.${generationMode === 'video' ? 'mp4' : 'png'}`}
                        className="btn-icon"
                        style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)', color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            backdropFilter: 'blur(4px)'
                        }}
                        title="Download"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download size={20} />
                    </a>
                    <button
                        onClick={onClose}
                        className="btn-icon"
                        style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)', color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            backdropFilter: 'blur(4px)'
                        }}
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '400px', minHeight: '400px', background: `url(${getOptimizedImageUrl(generatedImage)}) center/cover blur(20px)` }}>
                    <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', position: 'absolute' }} />
                    {generatedImage ? (
                        /\.(mp4|webm|mov|mkv)($|\?)/i.test(generatedImage) ? (
                            <video
                                src={generatedImage}
                                controls
                                autoPlay
                                loop
                                style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', position: 'relative', zIndex: 1 }}
                            />
                        ) : (
                            <img
                                src={getOptimizedImageUrl(generatedImage)}
                                alt={`Generated artwork for prompt: ${prompt}`}
                                style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', position: 'relative', zIndex: 1 }}
                            />
                        )
                    ) : (
                        <div style={{ padding: '40px' }}><Loader2 className="animate-spin" size={32} /></div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div style={{
                    padding: '16px 24px',
                    background: 'rgba(20,20,20,0.95)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prompt || "Generated Artwork"}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {generationMode === 'video' ? 'Video Generation' : 'Image Generation'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button onClick={() => onRate(1)} className="btn-icon-hover" style={{ padding: '8px', borderRadius: '6px', color: 'white', cursor: 'pointer', background: 'transparent', border: 'none' }} title="I like this">
                                <ThumbsUp size={18} />
                            </button>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                            <button onClick={() => onRate(-1)} className="btn-icon-hover" style={{ padding: '8px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', background: 'transparent', border: 'none' }} title="I dislike this">
                                <ThumbsDown size={18} />
                            </button>
                        </div>
                        <Link to="/gallery" className="btn btn-outline" style={{ padding: '0 20px', height: '40px', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>Gallery</Link>
                    </div>
                </div>

            </motion.div>
        </motion.div>
    );
}
