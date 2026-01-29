import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, Check, X, RefreshCw, Copy, Sparkles, Sliders, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import './ResultModal.css';

export default function ResultModal({
    isOpen,
    onClose,
    generatedImage,
    generationMode,
    prompt,
    metadata = {},
    onReuseSettings
}) {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isDownloadSuccess, setIsDownloadSuccess] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPromptExpanded, setIsPromptExpanded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsImageLoaded(false);
            setIsDownloadSuccess(false);
            setIsPromptExpanded(false);
        }
    }, [isOpen, generatedImage, prompt]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleDownload = async () => {
        if (isDownloading || isDownloadSuccess) return;
        setIsDownloading(true);
        const filename = generationMode === 'video' ? 'dreambees-video.mp4' : 'dreambees-creation.png';

        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setIsDownloadSuccess(true);
            toast.success("Saved!");
            setTimeout(() => setIsDownloadSuccess(false), 2000);
        } catch (error) {
            console.error("Download failed", error);
            window.open(generatedImage, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="rm-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="rm-content"
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="rm-close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>

                        <div className="rm-image-area">
                            {!isImageLoaded && generationMode !== 'video' && (
                                <Loader2 className="animate-spin" size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
                            )}
                            {generationMode === 'video' ? (
                                <video
                                    src={generatedImage}
                                    controls autoPlay loop
                                    className="rm-main-img"
                                />
                            ) : (
                                <img
                                    src={generatedImage}
                                    alt={prompt}
                                    onLoad={() => setIsImageLoaded(true)}
                                    className="rm-main-img"
                                    style={{ opacity: isImageLoaded ? 1 : 0 }}
                                />
                            )}
                        </div>

                        <div className="rm-sidebar">
                            <h2>Creation Inspector</h2>

                            <div className="rm-section">
                                <label>Prompt</label>
                                <div className="rm-prompt-wrapper">
                                    <div className={`rm-prompt ${isPromptExpanded ? 'expanded' : ''}`}>
                                        {prompt}
                                    </div>
                                    {!isPromptExpanded && prompt.length > 60 && <div className="rm-prompt-fade" />}
                                </div>
                                {prompt.length > 60 && (
                                    <button
                                        className="rm-prompt-toggle"
                                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                                    >
                                        {isPromptExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                )}
                            </div>

                            {metadata && (
                                <div className="rm-section">
                                    <label>Technical Details</label>
                                    <div className="rm-tech-grid">
                                        <div className="rm-tech-item">
                                            <span>Model</span>
                                            <p>{metadata.model || 'Standard'}</p>
                                        </div>
                                        <div className="rm-tech-item">
                                            <span>Seed</span>
                                            <p>{metadata.seed || 'Auto'}</p>
                                        </div>
                                        <div className="rm-tech-item">
                                            <span>CFG Scale</span>
                                            <p>{metadata.cfg || '7.5'}</p>
                                        </div>
                                        <div className="rm-tech-item">
                                            <span>Steps</span>
                                            <p>{metadata.steps || '20'}</p>
                                        </div>
                                        <div className="rm-tech-item">
                                            <span>Aspect Ratio</span>
                                            <p>{metadata.aspectRatio || '1:1'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rm-actions">
                                <button className="rm-btn rm-btn-primary" onClick={() => { onReuseSettings?.(); toast.success("Settings applied!"); }}>
                                    <RefreshCw size={18} />
                                    Reuse Settings
                                </button>
                                <button className="rm-btn rm-btn-secondary" onClick={handleDownload}>
                                    {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                    {isDownloading ? 'Saving...' : 'Download High-Res'}
                                </button>
                                <button
                                    className="rm-btn rm-btn-secondary"
                                    onClick={() => {
                                        navigator.clipboard.writeText(prompt);
                                        toast.success("Prompt copied!");
                                    }}
                                >
                                    <Copy size={18} />
                                    Copy Prompt
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
