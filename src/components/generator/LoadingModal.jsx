import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

// Format elapsed time: 0s, 1s, ..., 1:00, 1:01, etc.
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
        ? `${mins}:${secs.toString().padStart(2, '0')}`
        : `${secs}s`;
};

export default function LoadingModal({ useTurbo, onCancel }) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Elapsed time counter
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const accentColor = useTurbo ? '#fbbf24' : '#8b5cf6';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontFamily: '"Outfit", sans-serif'
            }}
        >
            {/* Ambient glow */}
            <motion.div
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
                style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    pointerEvents: 'none'
                }}
            />

            {/* Main content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    zIndex: 1
                }}
            >
                {/* Large elapsed time - the hero element */}
                <motion.div
                    key={elapsedSeconds}
                    initial={{ opacity: 0.5, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        fontFamily: 'monospace',
                        fontSize: '4rem',
                        fontWeight: '300',
                        color: 'white',
                        letterSpacing: '-0.02em',
                        lineHeight: 1
                    }}
                >
                    {formatTime(elapsedSeconds)}
                </motion.div>

                {/* Subtle status text */}
                <div style={{
                    fontSize: '1rem',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {useTurbo && <Zap size={16} style={{ color: accentColor }} fill={accentColor} />}
                    <span>Generating{useTurbo ? ' with Turbo' : ''}</span>
                    <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        ...
                    </motion.span>
                </div>

                {/* Minimal progress indicator */}
                <div style={{
                    width: '120px',
                    height: '2px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '1px',
                    overflow: 'hidden',
                    marginTop: '8px'
                }}>
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        style={{
                            width: '50%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
                        }}
                    />
                </div>
            </motion.div>

            {/* Cancel button - very subtle at bottom */}
            {onCancel && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    whileHover={{ opacity: 1 }}
                    onClick={onCancel}
                    style={{
                        position: 'absolute',
                        bottom: '32px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                    }}
                >
                    <X size={14} />
                    Cancel
                </motion.button>
            )}
        </motion.div>
    );
}
