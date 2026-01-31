import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils';

const ResultPanel = ({
    referenceImage,
    generatedImage,
    isComparing,
    setIsComparing,
    onReset,
    prompt
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Result</label>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    flex: 1,
                    position: 'relative',
                    aspectRatio: '1/1',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: 'var(--color-zinc-900)',
                    border: '2px solid rgba(168, 85, 247, 0.5)',
                    boxShadow: '0 0 30px rgba(168, 85, 247, 0.2)'
                }}
            >
                <img
                    src={isComparing ? getOptimizedImageUrl(referenceImage.imageUrl || referenceImage.url || referenceImage) : getOptimizedImageUrl(generatedImage)}
                    alt="Edited Result"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseDown={() => setIsComparing(true)}
                    onMouseUp={() => setIsComparing(false)}
                    onMouseLeave={() => setIsComparing(false)}
                    onTouchStart={() => setIsComparing(true)}
                    onTouchEnd={() => setIsComparing(false)}
                />

                {/* Compare Tooltip */}
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    pointerEvents: 'none',
                    opacity: isComparing ? 1 : 0.8,
                    transition: 'opacity 0.2s'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: 'white',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                    }}>
                        {isComparing ? 'Original' : 'Press & hold to compare'}
                    </p>
                </div>

                {/* Download Button */}
                <div style={{ position: 'absolute', top: '16px', right: '16px' }} onMouseDown={e => e.stopPropagation()}>
                    <a
                        href={generatedImage}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '8px',
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white',
                            display: 'flex',
                            backdropFilter: 'blur(8px)'
                        }}
                        title="Download Result"
                    >
                        <Download size={18} />
                    </a>
                </div>

                {/* Prompt Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                }}>
                    <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>"{prompt}"</p>
                </div>
            </motion.div>

            <button
                onClick={onReset}
                className="btn btn-outline"
                style={{ width: '100%', height: '44px' }}
            >
                TRY ANOTHER EDIT
            </button>
        </div>
    );
};

export default ResultPanel;
