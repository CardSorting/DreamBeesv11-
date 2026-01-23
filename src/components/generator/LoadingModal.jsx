import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import LoadingOrb from './LoadingOrb';

const LOADING_MESSAGES = [
    "Dreaming up your vision...",
    "Mixing pixels and imagination...",
    "Applying artistic styles...",
    "Refining details and lighting...",
    "Polishing your masterpiece..."
];

const GRACE_MESSAGES = [
    "This is taking a bit longer than usual...",
    "Complex prompts need a little more time...",
    "Our GPUs are crunching hard for you..."
];

export default function LoadingModal({ prompt, useTurbo, onCancel }) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [showGraceMessage, setShowGraceMessage] = useState(false);

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500);

        const graceTimeout = setTimeout(() => {
            setShowGraceMessage(true);
        }, 12000);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(graceTimeout);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Outfit", sans-serif',
                padding: '20px' // Ensure padding on mobile
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    maxWidth: '400px',
                    width: '100%',
                    textAlign: 'center',
                    padding: '32px 24px',
                    background: 'rgba(24, 24, 27, 0.8)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                <div style={{ marginBottom: '8px' }}>
                    <LoadingOrb size="large" useTurbo={useTurbo} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1, width: '100%' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Creating
                        <span style={{ display: 'inline-flex' }}>
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
                        </span>
                    </h3>
                    <div style={{ height: '24px', position: 'relative', width: '100%' }}>
                        <motion.p
                            key={showGraceMessage ? 'grace' : messageIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                fontSize: '1rem',
                                color: '#a1a1aa',
                                position: 'absolute',
                                width: '100%',
                                textAlign: 'center',
                                margin: 0,
                                padding: '0 10px'
                            }}
                        >
                            {showGraceMessage
                                ? GRACE_MESSAGES[Math.floor(Math.random() * GRACE_MESSAGES.length)]
                                : LOADING_MESSAGES[messageIndex]
                            }
                        </motion.p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', maxWidth: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px', position: 'relative' }}>
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '95%' }}
                        transition={{ duration: 12, ease: "linear" }}
                        style={{
                            height: '100%',
                            background: useTurbo ? '#fbbf24' : '#8b5cf6',
                            borderRadius: '2px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Shimmer Effect */}
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, bottom: 0, width: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            transform: 'translateX(-100%)',
                            animation: 'shimmer 1.5s infinite',
                        }} />
                    </motion.div>
                </div>
                <style>{`
                    @keyframes shimmer {
                        100% { transform: translateX(100%); }
                    }
                `}</style>

                {useTurbo && (
                    <div style={{
                        marginTop: '0px', padding: '6px 16px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '20px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: '#fbbf24', fontSize: '0.85rem', fontWeight: '600'
                    }}>
                        <Zap size={14} fill="currentColor" />
                        TURBO MODE ACTIVE
                    </div>
                )}

                {onCancel && (
                    <button
                        onClick={onCancel}
                        style={{
                            marginTop: '12px',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#ef4444',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s',
                            opacity: 0.8
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                        onMouseOut={e => e.currentTarget.style.opacity = 0.8}
                    >
                        <X size={16} />
                        Stop Generating
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
}
