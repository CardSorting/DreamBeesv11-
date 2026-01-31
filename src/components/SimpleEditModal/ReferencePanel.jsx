import { Loader2 } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils';

const ReferencePanel = ({
    referenceImage,
    generatedImage,
    isGenerating
}) => {
    const imageUrl = referenceImage ? getOptimizedImageUrl(referenceImage.imageUrl || referenceImage.url || referenceImage) : '';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Reference Image
            </label>

            <div style={{
                position: 'relative',
                aspectRatio: '1/1',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-zinc-900)',
                border: '1px solid var(--color-border)'
            }}>
                <img
                    src={imageUrl}
                    alt="Reference"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Loading Overlay */}
                {isGenerating && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: '-4px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(45deg, #6366f1, #a855f7, #ec4899)',
                                    filter: 'blur(8px)',
                                    opacity: 0.7,
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }} />
                                <div style={{
                                    background: 'var(--color-zinc-900)',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    position: 'relative'
                                }}>
                                    <Loader2 size={32} color="#a855f7" className="animate-spin" />
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    margin: 0,
                                    background: 'linear-gradient(to right, #fff, #a8a8a8)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>Dreaming up new pixels...</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Takes about 15 seconds</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Original Image Badge (when result exists) */}
                {generatedImage && !isGenerating && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <p style={{
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            background: 'rgba(0,0,0,0.5)',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-full)',
                            backdropFilter: 'blur(8px)'
                        }}>Original Image</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.1); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ReferencePanel;
