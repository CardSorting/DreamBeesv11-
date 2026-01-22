import React, { useMemo } from 'react';
import { // eslint-disable-next-line no-unused-vars
    motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, Share2, Star, Zap } from 'lucide-react';

export default function ResultModal({
    isOpen,
    onClose,
    generatedImage,
    generationMode,
    prompt,
    onRate,
    downloadUrl
}) {
    const downloadFilename = useMemo(() => {
        // Removed impure Date.now()
        return `dream-bees-gen.${generationMode === 'video' ? 'mp4' : 'png'}`;
    }, [generationMode]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
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
                        padding: '24px'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        style={{
                            background: 'var(--color-bg-primary)',
                            borderRadius: '24px',
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid var(--color-border-primary)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'var(--color-bg-tertiary)', padding: '8px', borderRadius: '12px' }}>
                                    <Zap size={20} color="var(--color-accent-primary)" />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Generation Complete</h2>
                            </div>
                            <button onClick={onClose} style={{ background: 'var(--color-bg-tertiary)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2px', background: 'var(--color-border-primary)', overflow: 'hidden' }}>
                            {/* Media Area */}
                            <div style={{ background: 'var(--color-bg-secondary)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                                {generationMode === 'video' ? (
                                    <video src={generatedImage} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} />
                                ) : (
                                    <img src={generatedImage} alt="Generated" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} />
                                )}
                            </div>

                            {/* Sidebar Area */}
                            <div style={{ background: 'var(--color-bg-primary)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prompt</h3>
                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-primary)' }}>{prompt}</p>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate this result</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => onRate && onRate(star)}
                                                style={{ background: 'var(--color-bg-tertiary)', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                            >
                                                <Star size={18} fill="transparent" stroke="var(--color-text-secondary)" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <a href={downloadUrl} download={downloadFilename} style={{ textDecoration: 'none' }}>
                                        <button style={{ width: '100%', background: 'var(--color-accent-primary)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Download size={18} />
                                            Download
                                        </button>
                                    </a>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={{ flex: 1, background: 'var(--color-bg-tertiary)', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Share2 size={16} />
                                            Share
                                        </button>
                                        <button style={{ padding: '12px', background: 'var(--color-bg-tertiary)', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
