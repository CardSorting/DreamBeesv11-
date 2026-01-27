import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResultModal({
    isOpen,
    onClose,
    generatedImage,
    generationMode,
    prompt,
    downloadUrl
}) {
    const imageRef = useRef(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isDownloadSuccess, setIsDownloadSuccess] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Reset states when opening new result
    useEffect(() => {
        if (isOpen) {
            setIsImageLoaded(false);
            setIsDownloadSuccess(false);
        }
    }, [isOpen, generatedImage]);

    // Keyboard shortcut: Escape to close
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

        const downloadFilename = generationMode === 'video' ? 'dreambees-video.mp4' : 'dreambees-creation.png';

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
                    scale: 2,
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
                window.open(downloadUrl, '_blank');
            }
            setIsDownloadSuccess(true);
            toast.success("Saved!");
            setTimeout(() => setIsDownloadSuccess(false), 2000);
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Download failed, opening in new tab...");
            window.open(downloadUrl, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    {/* Subtle vignette effect */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                        pointerEvents: 'none'
                    }} />

                    {/* Loading spinner before image loads */}
                    {!isImageLoaded && generationMode !== 'video' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Loader2 size={40} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
                        </motion.div>
                    )}

                    {/* Main Image/Video with cinematic reveal */}
                    <motion.div
                        initial={{ scale: 1.02, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            padding: '40px',
                            cursor: 'default'
                        }}
                    >
                        {generationMode === 'video' ? (
                            <video
                                src={generatedImage}
                                controls
                                autoPlay
                                loop
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        ) : (
                            <motion.img
                                ref={imageRef}
                                src={generatedImage}
                                crossOrigin="anonymous"
                                alt={prompt || "AI Generated Artwork"}
                                onLoad={() => setIsImageLoaded(true)}
                                initial={{ opacity: 0, filter: 'blur(10px)' }}
                                animate={{
                                    opacity: isImageLoaded ? 1 : 0,
                                    filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)'
                                }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        )}
                    </motion.div>

                    {/* Minimal download button - bottom center */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                        disabled={isDownloading}
                        style={{
                            position: 'absolute',
                            bottom: '32px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: isDownloadSuccess ? 'rgba(34, 197, 94, 0.9)' : 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '50px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: isDownloading ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            zIndex: 10
                        }}
                        onMouseOver={(e) => {
                            if (!isDownloading && !isDownloadSuccess) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isDownloadSuccess) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            }
                        }}
                    >
                        {isDownloading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : isDownloadSuccess ? (
                            <Check size={18} />
                        ) : (
                            <Download size={18} />
                        )}
                        {isDownloading ? 'Saving...' : isDownloadSuccess ? 'Saved!' : 'Download'}
                    </motion.button>

                    {/* Click anywhere hint - fades after 2s */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: '24px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            pointerEvents: 'none'
                        }}
                    >
                        <motion.span
                            animate={{ opacity: [0.4, 0] }}
                            transition={{ delay: 2, duration: 1 }}
                        >
                            Click anywhere to close
                        </motion.span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
