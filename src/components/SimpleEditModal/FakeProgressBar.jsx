import React, { useState, useEffect } from 'react';

const FakeProgressBar = ({ isGenerating, duration = 15000 }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isGenerating) {
            const timeout = setTimeout(() => setProgress(0), 0);
            return () => clearTimeout(timeout);
        }

        const timeout = setTimeout(() => setProgress(0), 0);
        const interval = 100; // Update every 100ms
        const steps = duration / interval;
        const increment = 95 / steps; // Target 95% completion

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    clearInterval(timer);
                    return 95;
                }
                // Add a little randomness to make it feel natural
                const noise = (Math.random() - 0.5) * increment * 0.5;
                return Math.min(95, prev + increment + noise);
            });
        }, interval);

        return () => {
            clearTimeout(timeout);
            clearInterval(timer);
        };
    }, [isGenerating, duration]);

    if (!isGenerating || progress === 0) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
            width: `${progress}%`,
            transition: 'width 0.1s linear',
            boxShadow: '0 -2px 10px rgba(168, 85, 247, 0.5)',
            zIndex: 50,
            borderTopRightRadius: '2px',
            borderBottomRightRadius: '2px'
        }} />
    );
};

export default FakeProgressBar;
