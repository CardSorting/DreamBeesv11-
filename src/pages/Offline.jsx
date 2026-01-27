import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import OfflineBg from '../assets/offline-bg.png';

const Offline = () => {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="error-page-container" style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 100000,
            backgroundColor: '#050505',
            color: '#fff',
            fontFamily: 'var(--font-body)'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.5
            }}>
                <img src={OfflineBg} alt="Offline" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.5)' }} />
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, transparent 0%, #050505 90%)'
                }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    padding: '40px',
                    maxWidth: '500px'
                }}
            >
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '24px',
                    borderRadius: '50%',
                    width: 'fit-content',
                    margin: '0 auto 32px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)'
                }}>
                    <WifiOff size={48} color="var(--color-zinc-400)" />
                </div>

                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '16px', letterSpacing: '-0.03em' }}>
                    Signal Lost
                </h1>
                <p style={{ color: 'var(--color-zinc-400)', lineHeight: '1.7', fontSize: '1.1rem', marginBottom: '40px' }}>
                    The hive is out of reach. Check your connection to rejoin the colony.
                </p>

                <button
                    onClick={handleRetry}
                    className="btn btn-primary"
                    style={{ gap: '10px', padding: '0 32px' }}
                >
                    <RefreshCw size={18} />
                    Try Reconnecting
                </button>
            </motion.div>
        </div>
    );
};

export default Offline;
