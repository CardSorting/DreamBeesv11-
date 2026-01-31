import { Loader2, Image as ImageIcon } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils';

const ReferencePanel = ({
    referenceImage,
    generatedImage,
    isGenerating,
    isMobile
}) => {
    const imageUrl = referenceImage ? getOptimizedImageUrl(referenceImage.imageUrl || referenceImage.url || referenceImage) : '';

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
                        Processing
                    </span>
                )}
            </div>

            <div style={{
                position: 'relative',
                aspectRatio: '1/1',
                borderRadius: isMobile ? '16px' : '20px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                maxWidth: isMobile ? '200px' : 'none',
                margin: isMobile ? '0 auto' : '0',
                width: isMobile ? '100%' : 'auto'
            }}>
                <img
                    src={imageUrl}
                    alt="Reference"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: isGenerating ? 0.4 : 1,
                        transition: 'opacity 0.5s',
                        filter: isGenerating ? 'grayscale(30%) blur(1px)' : 'none'
                    }}
                />

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
                            {/* Animated Spinner */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: isMobile ? '-12px' : '-16px',
                                    borderRadius: '50%',
                                    background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #6366f1)',
                                    filter: 'blur(12px)',
                                    opacity: 0.6,
                                    animation: 'spin-slow 3s linear infinite'
                                }} />
                                <div style={{
                                    background: 'rgba(9, 9, 11, 0.9)',
                                    borderRadius: '50%',
                                    padding: isMobile ? '12px' : '16px',
                                    position: 'relative',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                                }}>
                                    <Loader2 size={isMobile ? 24 : 32} color="#a855f7" style={{ animation: 'spin 1.5s linear infinite' }} />
                                </div>
                            </div>

                            {/* Progress Text */}
                            <div style={{ textAlign: 'center' }}>
                                <p style={{
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: isMobile ? '0.9rem' : '1rem',
                                    margin: 0,
                                    letterSpacing: '0.02em'
                                }}>
                                    Creating...
                                </p>
                                <p style={{
                                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    marginTop: '4px',
                                    fontWeight: '500'
                                }}>
                                    {isMobile ? '~10-20s' : 'This usually takes 10-20 seconds'}
                                </p>
                            </div>

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
            `}</style>
        </div>
    );
};

export default ReferencePanel;