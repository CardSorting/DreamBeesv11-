import React from 'react';
import { motion } from 'framer-motion';  
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import ForbiddenBg from '../assets/forbidden-bg.png';

const AccessDenied = () => {
    return (
        <div className="error-page-container" style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#050505',
            color: '#fff',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}>
                <img src={ForbiddenBg} alt="Access Denied" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, transparent 0%, #050505 85%)'
                }} />
            </div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '600px',
                    padding: '40px'
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#ef4444',
                    marginBottom: '24px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em'
                }}>
                    <ShieldAlert size={20} />
                    <span>Access Restricted</span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                    fontWeight: '800',
                    marginBottom: '24px',
                    lineHeight: 1,
                    letterSpacing: '-0.04em'
                }}>
                    Royal Chambers Only
                </h1>

                <p style={{
                    color: 'var(--color-zinc-400)',
                    fontSize: '1.2rem',
                    lineHeight: '1.7',
                    marginBottom: '48px',
                    maxWidth: '480px'
                }}>
                    You've reached a section of the hive that requires higher clearance or special authorization.
                </p>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Link to="/auth" className="btn btn-primary" style={{ gap: '10px', padding: '0 32px' }}>
                        <LogIn size={18} />
                        Sign In
                    </Link>
                    <Link to="/" className="btn btn-outline" style={{ gap: '10px', padding: '0 32px' }}>
                        <Home size={18} />
                        Go Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessDenied;
