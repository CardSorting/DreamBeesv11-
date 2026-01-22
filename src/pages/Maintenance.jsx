import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, Clock } from 'lucide-react';
import MaintenanceBg from '../assets/maintenance-bg.png';

const Maintenance = () => {
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
            color: '#fff'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.6
            }}>
                <img src={MaintenanceBg} alt="Maintenance" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, transparent, #050505)'
                }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    padding: '60px 40px',
                    background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '32px',
                    maxWidth: '540px',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                    color: 'var(--color-accent-primary)'
                }}>
                    <Hammer size={24} />
                    <span style={{ fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                        Hive Expansion in Progress
                    </span>
                </div>

                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.04em' }}>
                    Polishing <br /> the Honey
                </h1>

                <p style={{ color: 'var(--color-zinc-400)', lineHeight: '1.7', fontSize: '1.15rem', marginBottom: '40px' }}>
                    We're currently performing some essential maintenance to make the hive even better. We'll be back shortly.
                </p>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: 'var(--color-zinc-500)',
                    fontSize: '0.95rem'
                }}>
                    <Clock size={16} />
                    <span>Expected back in: ~15 mins</span>
                </div>
            </motion.div>
        </div>
    );
};

export default Maintenance;
