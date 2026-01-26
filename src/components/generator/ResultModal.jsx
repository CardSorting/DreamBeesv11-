import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, Share2, Star, Zap, Copy, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { trackSocialIntent, trackSentiment } from '../../utils/analytics';

export default function ResultModal({
    isOpen,
    onClose,
    generatedImage,
    generationMode,
    prompt,
    onRate,
    downloadUrl
}) {
    const imageRef = useRef(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isDownloadSuccess, setIsDownloadSuccess] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reset states when opening new result
    useEffect(() => {
        if (isOpen) {
            setIsImageLoaded(false);
            setIsDownloadSuccess(false);
        }
    }, [isOpen, generatedImage]);

    const handleDownload = async () => {
        if (isDownloading || isDownloadSuccess) return;
        setIsDownloading(true);

        const downloadFilename = generationMode === 'video' ? 'dreambees-video.mp4' : 'dreambees-creation.png';

        // Small delay to allow UI to update
        await new Promise(r => setTimeout(r, 100));

        try {
            if (generationMode === 'video') {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = downloadFilename;
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else if (imageRef.current) {
                const canvas = await html2canvas(imageRef.current, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    scale: 2, // Better quality
                    logging: false
                });
                const data = canvas.toDataURL('image/png', 1.0);
                const link = document.createElement('a');
                link.href = data;
                link.download = downloadFilename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Fallback
                window.open(downloadUrl, '_blank');
            }
            setIsDownloadSuccess(true);
            trackSocialIntent('download', generationMode);
            toast.success("Download started!");
            setTimeout(() => setIsDownloadSuccess(false), 2000);
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Download failed, opening in new tab...");
            window.open(downloadUrl, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(prompt);
        trackSocialIntent('copy_prompt', generationMode);
        setCopied(true);
        toast.success("Prompt copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="modal-backdrop"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="modal-content"
                    >
                        {/* CSS */}
                        <style>{`
                            .modal-backdrop {
                                position: fixed; inset: 0; z-index: 9999;
                                background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
                                display: flex; align-items: center; justify-content: center;
                                padding: 16px; cursor: default;
                            }
                            .modal-content {
                                background: #1a1a1a; border-radius: 24px;
                                width: 100%; max-width: 1000px;
                                max-height: 92vh; overflow: hidden;
                                display: flex; flex-direction: column;
                                border: 1px solid rgba(255,255,255,0.1);
                                box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.8);
                            }
                            .modal-body {
                                display: flex; flex-direction: row;
                                flex: 1; overflow: hidden; min-height: 0;
                            }
                            .media-section {
                                flex: 1; background: #000;
                                display: flex; align-items: center; justify-content: center;
                                padding: 20px; overflow: hidden; position: relative;
                            }
                            .media-section img, .media-section video {
                                max-width: 100%; max-height: 100%;
                                object-fit: contain; border-radius: 12px;
                                box-shadow: 0 0 40px rgba(0,0,0,0.5);
                            }
                            .sidebar-section {
                                width: 350px; background: #1f1f1f;
                                display: flex; flex-direction: column;
                                padding: 24px; gap: 24px; overflow-y: auto;
                                border-left: 1px solid rgba(255,255,255,0.05);
                            }
                            .prompt-box {
                                background: rgba(0,0,0,0.3); border-radius: 12px;
                                padding: 16px; border: 1px solid rgba(255,255,255,0.05);
                                position: relative;
                            }
                            .action-btn {
                                width: 100%; padding: 14px; border-radius: 12px;
                                font-weight: 600; cursor: pointer; display: flex;
                                align-items: center; justify-content: center; gap: 10px;
                                transition: all 0.2s; border: none; font-size: 0.95rem;
                            }
                            .btn-primary {
                                background: var(--color-accent-primary, #8b5cf6); color: white;
                            }
                            .btn-primary:not(:disabled):not(.success):hover {
                                filter: brightness(1.1); transform: translateY(-1px);
                            }
                            .btn-primary.success {
                                background: #22c55e;
                                cursor: default;
                            }
                            .btn-primary:disabled { opacity: 0.7; cursor: wait; }
                            .btn-secondary {
                                background: rgba(255,255,255,0.05); color: white;
                            }
                            .btn-secondary:hover {
                                background: rgba(255,255,255,0.1);
                            }
                            
                            @media (max-width: 850px) {
                                .modal-body { flex-direction: column; overflow-y: auto; }
                                .media-section { min-height: 300px; padding: 10px; flex: none; }
                                .sidebar-section { width: 100%; border-left: none; border-top: 1px solid rgba(255,255,255,0.05); flex: 1; }
                                .modal-content { max-height: 100vh; border-radius: 0; }
                                .modal-backdrop { padding: 0; }
                            }
                        `}</style>

                        {/* Header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f1f1f' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '6px', borderRadius: '10px' }}>
                                    <Zap size={18} color="#8b5cf6" />
                                </div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white', letterSpacing: '-0.01em' }}>Generation Result</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="btn-secondary"
                                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Media */}
                            <div className="media-section">
                                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                                {!isImageLoaded && generationMode !== 'video' && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Loader2 size={40} className="animate-spin" color="#8b5cf6" />
                                    </div>
                                )}
                                {generationMode === 'video' ? (
                                    <video src={generatedImage} controls autoPlay loop />
                                ) : (
                                    <motion.img
                                        ref={imageRef}
                                        src={generatedImage}
                                        crossOrigin="anonymous"
                                        alt="AI Generated Artwork"
                                        onLoad={() => setIsImageLoaded(true)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: isImageLoaded ? 1 : 0 }}
                                        transition={{ duration: 0.5 }}
                                    />
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="sidebar-section">
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                        <h3 style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Prompt</h3>
                                        <button onClick={handleCopyPrompt} style={{ background: 'transparent', border: 'none', color: copied ? '#4ade80' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="prompt-box">
                                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#e0e0e0', margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
                                            {prompt}
                                        </p>
                                    </div>

                                    <div style={{ marginTop: '24px' }}>
                                        <h3 style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '12px' }}>Rate Result</h3>
                                        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => {
                                                        onRate && onRate(star);
                                                        const promptLength = prompt?.length || 0;
                                                        const promptBucket = promptLength <= 50 ? 'short' : (promptLength <= 150 ? 'medium' : 'long');

                                                        trackSentiment(star, {
                                                            model_id: generatedImage?.modelId || 'unknown',
                                                            generation_mode: generationMode,
                                                            prompt_length_bucket: promptBucket
                                                        });
                                                        toast.success("Thanks for rating!");
                                                    }}
                                                    className="btn-secondary"
                                                    style={{ padding: '8px', borderRadius: '8px', background: 'transparent' }}
                                                >
                                                    <Star size={20} className="star-icon" fill="transparent" stroke="#666" style={{ transition: 'all 0.2s' }}
                                                        onMouseOver={(e) => { e.currentTarget.style.stroke = '#fbbf24'; e.currentTarget.style.fill = '#fbbf24'; }}
                                                        onMouseOut={(e) => { e.currentTarget.style.stroke = '#666'; e.currentTarget.style.fill = 'transparent'; }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading || isDownloadSuccess}
                                        className={`action-btn btn-primary ${isDownloadSuccess ? 'success' : ''}`}
                                        style={{ position: 'relative', overflow: 'hidden' }}
                                    >
                                        {isDownloading && (
                                            <motion.div
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                style={{
                                                    position: 'absolute',
                                                    left: 0, bottom: 0,
                                                    height: '3px',
                                                    background: 'rgba(255,255,255,0.5)',
                                                }}
                                            />
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 2 }}>
                                            {isDownloading ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : isDownloadSuccess ? (
                                                <Check size={20} />
                                            ) : (
                                                <Download size={20} />
                                            )}

                                            {isDownloading ? 'Preparing...' : isDownloadSuccess ? 'Saved to Device' : 'Download High Quality'}
                                        </div>
                                    </button>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <button className="action-btn btn-secondary" onClick={() => trackSocialIntent('share_open', generationMode)}>
                                            <Share2 size={18} /> Share
                                        </button>
                                        <button className="action-btn btn-secondary" onClick={() => window.open(downloadUrl, '_blank')}>
                                            <ExternalLink size={18} /> Open Link
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
