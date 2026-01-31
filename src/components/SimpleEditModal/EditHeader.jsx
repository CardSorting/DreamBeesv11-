import { X, Sparkles } from 'lucide-react';

const EditHeader = ({ onClose, isMobile }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '16px 20px' : '28px 32px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                <div style={{
                    padding: isMobile ? '8px' : '10px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                    borderRadius: isMobile ? '12px' : '14px',
                    display: 'flex',
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <Sparkles size={isMobile ? 18 : 22} color="white" />
                </div>
                <div>
                    <h3 style={{
                        fontSize: isMobile ? '1.1rem' : '1.4rem',
                        fontWeight: '800',
                        color: 'white',
                        margin: 0,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2
                    }}>
                        Edit and Remix Images
                    </h3>
                    {!isMobile && (
                        <p style={{
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            margin: '4px 0 0',
                            fontWeight: '500'
                        }}>
                            Transform this image with AI instructions
                        </p>
                    )}
                </div>
            </div>
            <button
                onClick={onClose}
                style={{
                    padding: isMobile ? '10px' : '10px',
                    minWidth: isMobile ? '44px' : 'auto',
                    minHeight: isMobile ? '44px' : 'auto',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                }}
                onTouchStart={e => {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onTouchEnd={e => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                aria-label="Close modal"
            >
                <X size={isMobile ? 22 : 24} />
            </button>
        </div>
    );
};

export default EditHeader;