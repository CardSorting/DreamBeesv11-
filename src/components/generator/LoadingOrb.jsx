import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';

export default function LoadingOrb({ size = 'large', useTurbo = false }) {
    const isSmall = size === 'small';
    const containerSize = isSmall ? '40px' : '80px';
    const iconSize = isSmall ? 18 : 32;

    return (
        <div style={{ position: 'relative', width: containerSize, height: containerSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Spinning Gradient Ring */}
            <div style={{
                position: 'absolute', inset: isSmall ? -4 : -10,
                background: useTurbo
                    ? 'conic-gradient(from 0deg, #f59e0b, #fcd34d, #f59e0b)'
                    : 'conic-gradient(from 0deg, #8b5cf6, #ec4899, #8b5cf6)',
                borderRadius: '50%',
                filter: isSmall ? 'blur(10px)' : 'blur(25px)',
                opacity: 0.4,
                animation: 'spin 4s linear infinite',
            }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {/* Inner Core */}
            <div style={{
                width: '100%', height: '100%',
                background: useTurbo
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1))'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.1)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Pulsing Core Animation */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute', inset: 0,
                        background: useTurbo
                            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                        borderRadius: '50%'
                    }}
                />

                {useTurbo ? (
                    <Zap size={iconSize} className="text-amber-400" color="#fbbf24" fill="currentColor" />
                ) : (
                    <Sparkles size={iconSize} className="text-purple-400" color="#c084fc" />
                )}
            </div>
        </div>
    );
}
