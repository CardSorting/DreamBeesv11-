import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils';
import FakeProgressBar from './FakeProgressBar';

const PHASES = [
    'Scanning Reference...',
    'Applying Changes...',
    'Enhancing Details...',
    'Refining Output...',
    'Finishing Up...'
];

// Helper for dynamic text with scramble effect
const LoadingStatus = ({ isMobile, targetText }) => {
    const [text, setText] = useState(targetText || 'Scanning Reference...');

    // Scramble effect
    useEffect(() => {
        let iterations = 0;
        const currentTarget = targetText || 'Scanning Reference...';
        const randomChars = '!<>-_\\/[]{}—=+*^?#________';

        const interval = setInterval(() => {
            setText(currentTarget
                .split('')
                .map((letter, index) => {
                    if (index < iterations) {
                        return currentTarget[index];
                    }
                    return randomChars[Math.floor(Math.random() * randomChars.length)];
                })
                .join('')
            );

            if (iterations >= currentTarget.length) {
                clearInterval(interval);
            }

            iterations += 1 / 2; // Speed of decoding
        }, 30);

        return () => clearInterval(interval);
    }, [targetText]);

    return (
        <div style={{ textAlign: 'center' }}>
            <p style={{
                color: 'white',
                fontWeight: '700',
                fontSize: isMobile ? '0.85rem' : '1rem',
                margin: 0,
                letterSpacing: '0.05em',
                fontFamily: 'monospace', // Monospace for glitch effect alignment
                minHeight: '1.5em' // Prevent layout shift
            }}>
                {text}
            </p>
        </div>
    );
};

const ReferencePanel = ({
    referenceImage,
    generatedImage,
    isGenerating,
    isMobile,
    isCompact,
    statusText,
    loadingProgress
}) => {
    const rawImageUrl = referenceImage?.imageUrl || referenceImage?.url || referenceImage;
    const imageUrl = rawImageUrl ? getOptimizedImageUrl(rawImageUrl) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <label style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: 'var(--color-text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <ImageIcon size={isMobile ? 12 : 14} />
                    Reference
                </label>
                {isGenerating && (
                    <span style={{
                        fontSize: isMobile ? '0.65rem' : '0.7rem',
                        color: '#a855f7',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: isMobile ? '4px' : '6px',
                            height: isMobile ? '4px' : '6px',
                            background: '#a855f7',
                            borderRadius: '50%',
                            animation: 'pulse-dot 1.5s ease-in-out infinite'
                        }} />
                        {!isMobile && 'Processing'}
                    </span>
                )}
            </div>

            <div style={{
                position: 'relative',
                aspectRatio: '1/1',
                borderRadius: isMobile ? (isCompact ? '14px' : '16px') : '20px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                maxWidth: isMobile ? (isCompact ? '190px' : '240px') : 'none',
                margin: isMobile ? '0 auto' : '0',
                width: isMobile ? '100%' : 'auto'
            }}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={imageUrl}
                        src={imageUrl}
                        alt="Reference"
                        initial={{ opacity: 0, filter: 'blur(10px) grayscale(100%)' }}
                        animate={{
                            opacity: isGenerating ? 0.4 : 1,
                            filter: isGenerating ? 'grayscale(30%) blur(1px)' : 'blur(0px) grayscale(0%)'
                        }}
                        exit={{ opacity: 0, filter: 'blur(10px) grayscale(100%)' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </AnimatePresence>

                {/* Loading Overlay */}
                {isGenerating && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        background: 'rgba(9, 9, 11, 0.6)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: isMobile ? '16px' : '24px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: isMobile ? '12px' : '20px'
                        }}>
                            {/* Animated Spinner with Holographic Glow */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: isMobile ? '-12px' : '-16px',
                                    borderRadius: '50%',
                                    background: 'conic-gradient(from 0deg, transparent, #a855f7, transparent, #6366f1, transparent)',
                                    animation: 'spin-slow 2s linear infinite'
                                }} />
                                <div style={{
                                    background: 'rgba(9, 9, 11, 0.9)',
                                    borderRadius: '50%',
                                    padding: isMobile ? '12px' : '16px',
                                    position: 'relative',
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.2), inset 0 0 10px rgba(168, 85, 247, 0.1)'
                                }}>
                                    <Loader2 size={isMobile ? 24 : 32} color="#a855f7" style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                            </div>

                            {/* Progress Text with Scramble effect */}
                            <LoadingStatus isMobile={isMobile} targetText={statusText} />

                            {!isMobile && (
                                <p style={{
                                    fontSize: '0.8rem',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    marginTop: '-12px',
                                    fontWeight: '500'
                                }}>
                                    AI is processing your vision
                                </p>
                            )}

                            {/* Scanning Line Animation */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                height: '2px',
                                background: '#a855f7',
                                boxShadow: '0 0 15px 2px #a855f7',
                                top: '0%',
                                animation: 'scan-line 2s linear infinite'
                            }} />

                            {/* Progress Steps - Hidden on mobile */}
                            {!isMobile && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '8px'
                                }}>
                                    {['Analyzing', 'Generating', 'Finishing'].map((step, i) => (
                                        <div key={step} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: i === 1 ? '#a855f7' : 'rgba(255, 255, 255, 0.3)',
                                                fontWeight: i === 1 ? '600' : '500',
                                                transition: 'all 0.3s'
                                            }}>
                                                {step}
                                            </span>
                                            {i < 2 && (
                                                <div style={{
                                                    width: '16px',
                                                    height: '1px',
                                                    background: 'rgba(255, 255, 255, 0.1)'
                                                }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Result Badge (when result exists and not generating) */}
                {generatedImage && !isGenerating && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            color: 'white',
                            fontSize: isMobile ? '0.65rem' : '0.75rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            background: 'rgba(9, 9, 11, 0.6)',
                            padding: isMobile ? '8px 14px' : '10px 20px',
                            borderRadius: '14px',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}>
                            {isMobile ? 'Reference' : 'Reference Selected'}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes scan-line {
                    0% { top: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes pulse-text {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>

            <FakeProgressBar isGenerating={isGenerating} manualProgress={loadingProgress} />
        </div>
    );
};

export default ReferencePanel;