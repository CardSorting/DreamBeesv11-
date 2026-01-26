import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export default function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <motion.div
            initial={{ y: -100, x: '-50%' }}
            animate={{ y: 0, x: '-50%' }}
            style={{
                position: 'fixed',
                top: '24px',
                left: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
                backdropFilter: 'blur(12px)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '99px',
                zIndex: 100000,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
            }}
            onClick={() => window.location.href = '/offline'}
        >
            <WifiOff size={18} strokeWidth={2.5} />
            <span>Connection Interrupted</span>
            <div style={{
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '99px',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                Offline Mode
            </div>
        </motion.div>
    );
}
