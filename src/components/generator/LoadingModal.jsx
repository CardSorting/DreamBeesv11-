import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';

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

export default function LoadingModal({ prompt, useTurbo }) {
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
                fontFamily: '"Outfit", sans-serif'
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
                    width: '90%',
                    textAlign: 'center',
                    padding: '40px',
                    background: 'rgba(24, 24, 27, 0.6)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
            >
                <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        position: 'absolute', inset: -10,
                        background: 'conic-gradient(from 0deg, #8b5cf6, #ec4899, #8b5cf6)',
                        borderRadius: '50%',
                        filter: 'blur(25px)',
                        opacity: 0.4,
                        animation: 'spin 4s linear infinite',
                    }} />
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute', inset: 0,
                                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                                borderRadius: '50%'
                            }}
                        />
                        <Sparkles size={32} className="text-purple-400" color="#c084fc" />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1, width: '100%' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', letterSpacing: '-0.02em' }}>
                        Creating
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
                                margin: 0
                            }}
                        >
                            {showGraceMessage
                                ? GRACE_MESSAGES[Math.floor(Math.random() * GRACE_MESSAGES.length)]
                                : LOADING_MESSAGES[messageIndex]
                            }
                        </motion.p>
                    </div>
                </div>

                {useTurbo && (
                    <div style={{
                        marginTop: '8px', padding: '6px 16px',
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
            </motion.div>
        </motion.div>
    );
}
