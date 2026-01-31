import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Undo2, ArrowRightLeft, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl } from '../../utils';
import ComparisonSlider from './ComparisonSlider';

const ResultPanel = ({
    referenceImage,
    generatedImage,
    isComparing,
    setIsComparing,
    onReset,
    onIterate,
    prompt,
    isMobile
}) => {
    const resultRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const beforeUrl = getOptimizedImageUrl(referenceImage.imageUrl || referenceImage.url || referenceImage);
    const afterUrl = getOptimizedImageUrl(generatedImage);

    const handleDownload = async () => {
        if (!resultRef.current || !generatedImage || isDownloading) return;

        setIsDownloading(true);
        const toastId = toast.loading('Preparing download...');

        try {
            const canvas = await html2canvas(resultRef.current, {
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: null,
                scale: 2
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `dreambees-edit-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Download ready!', { id: toastId });
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Download failed. Opening image...', { id: toastId });
            window.open(generatedImage, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px', height: '100%' }}>
            {/* Header with View Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                    <label style={{
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        fontWeight: '700',
                        color: 'var(--color-text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Result
                    </label>
                    <div style={{
                        fontSize: isMobile ? '0.65rem' : '0.7rem',
                        color: 'rgba(255, 255, 255, 0.45)',
                        fontWeight: '500'
                    }}>
                        Preview your final edit or compare to the original.
                    </div>
                </div>
                <button
                    onClick={() => setIsComparing(!isComparing)}
                    style={{
                        padding: isMobile ? '4px 10px' : '6px 12px',
                        background: isComparing ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isComparing ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '8px',
                        color: isComparing ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        touchAction: 'manipulation'
                    }}
                    onMouseEnter={e => {
                        if (!isComparing) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (!isComparing) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                        }
                    }}
                    title={isComparing ? 'Switch to full view' : 'Enable comparison slider'}
                >
                    <ArrowRightLeft size={isMobile ? 12 : 14} />
                    {isComparing ? 'Comparing' : 'Compare'}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    flex: 1,
                    position: 'relative',
                    aspectRatio: '1/1',
                    borderRadius: isMobile ? '16px' : '24px',
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.15)'
                }}
                ref={resultRef}
            >
                {isComparing ? (
                    <ComparisonSlider before={beforeUrl} after={afterUrl} isMobile={isMobile} />
                ) : (
                    <img
                        src={afterUrl}
                        alt="Generated result"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        crossOrigin="anonymous"
                    />
                )}

                {/* Download Button */}
                <div style={{ position: 'absolute', top: isMobile ? '12px' : '16px', right: isMobile ? '12px' : '16px', zIndex: 30 }}>
                    <button
                        onClick={handleDownload}
                        style={{
                            padding: isMobile ? '8px 10px' : '10px 12px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: isMobile ? '10px' : '12px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            touchAction: 'manipulation',
                            fontSize: isMobile ? '0.65rem' : '0.7rem',
                            fontWeight: '600',
                            textDecoration: 'none',
                            cursor: isDownloading ? 'not-allowed' : 'pointer',
                            opacity: isDownloading ? 0.6 : 1
                        }}
                        onMouseEnter={e => {
                            if (!isDownloading) {
                                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.8)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                            }
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        }}
                        title="Download result image"
                        type="button"
                    >
                        <Download size={isMobile ? 14 : 16} />
                        {!isMobile && (isDownloading ? 'Preparing...' : 'Download')}
                    </button>
                </div>

                {/* Prompt Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: isMobile ? '16px 16px 20px' : '24px 24px 32px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}>
                    <p style={{
                        color: 'white',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        fontWeight: '500',
                        margin: 0,
                        lineHeight: '1.4',
                        opacity: 0.95
                    }}>
                        <span style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: isMobile ? '0.65rem' : '0.75rem',
                            display: 'block',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            fontWeight: '700',
                            letterSpacing: '0.05em'
                        }}>
                            Edit Applied
                        </span>
                        "{prompt.length > (isMobile ? 60 : 100) ? prompt.slice(0, isMobile ? 57 : 97) + '...' : prompt}"
                    </p>
                </div>
            </motion.div>

            {/* Action Buttons */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '8px' : '12px'
            }}>
                {/* Use as Reference Button */}
                <button
                    onClick={onIterate}
                    style={{
                        height: isMobile ? '44px' : '54px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        borderRadius: isMobile ? '12px' : '16px',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        letterSpacing: '0.02em',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 10px 20px -5px rgba(168, 85, 247, 0.4)',
                        position: 'relative',
                        overflow: 'hidden',
                        touchAction: 'manipulation',
                        minHeight: isMobile ? '44px' : '54px'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(168, 85, 247, 0.5)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(168, 85, 247, 0.4)';
                    }}
                    onTouchStart={e => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onTouchEnd={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.filter = 'brightness(1)';
                    }}
                    title="Use this result as the new reference image"
                >
                    <Check size={isMobile ? 16 : 18} />
                    {isMobile ? 'Keep' : 'Keep & Continue'}
                </button>

                {/* Start New Edit Button */}
                <button
                    onClick={onReset}
                    style={{
                        height: isMobile ? '44px' : '54px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: isMobile ? '12px' : '16px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: '700',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        letterSpacing: '0.02em',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        touchAction: 'manipulation',
                        minHeight: isMobile ? '44px' : '54px'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onTouchStart={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = 'white';
                    }}
                    onTouchEnd={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                    }}
                    title="Go back to edit the original reference image"
                >
                    <Undo2 size={isMobile ? 16 : 18} />
                    {isMobile ? 'Original' : 'Edit Original'}
                </button>
            </div>

            {/* Helper Text */}
            <div style={{
                textAlign: 'center',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: '500',
                lineHeight: '1.5'
            }}>
                <span style={{ color: '#a855f7' }}>Keep & Continue</span> uses this result as your new reference.
                <br />
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Edit Original</span> goes back to the starting image.
            </div>
        </div>
    );
};

export default ResultPanel;