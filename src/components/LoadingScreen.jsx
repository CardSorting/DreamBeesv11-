import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <Loader2 className="animate-spin" size={48} color="#8b5cf6" />
            <p style={{
                marginTop: '16px',
                color: 'var(--color-text-muted)',
                fontSize: '0.9rem',
                letterSpacing: '0.05em'
            }}>
                INITIALIZING STUDIO...
            </p>
        </div>
    );
}
