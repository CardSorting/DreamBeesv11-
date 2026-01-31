import { X, Sparkles } from 'lucide-react';

const EditHeader = ({ onClose }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: '1px solid var(--color-border)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    padding: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex'
                }}>
                    <Sparkles size={20} color="white" />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>Edit with Klein 4B</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>Transform this image with AI instructions</p>
                </div>
            </div>
            <button onClick={onClose} style={{
                padding: '8px',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                transition: 'color 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                <X size={24} />
            </button>
        </div>
    );
};

export default EditHeader;
