import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EditHeader = ({ isMobile }) => {
    const navigate = useNavigate();

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
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '10px',
                        marginRight: isMobile ? '-4px' : '0',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateX(-2px)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h3 style={{
                        fontSize: isMobile ? '1.1rem' : '1.4rem',
                        fontWeight: '800',
                        color: 'white',
                        margin: 0,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2
                    }}>
                        {isMobile ? 'Edit & Remix' : 'Edit and Remix Images'}
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

        </div>
    );
};

export default EditHeader;