import React, { useState, useEffect } from 'react';

const FakeProgressBar = ({ isGenerating, duration = 15000, manualProgress }) => {
    const [progress, setProgress] = useState(0);

    // Sync state with prop during render (React recommended pattern for syncing state to props)
    if (manualProgress !== undefined && manualProgress > progress) {
        setProgress(manualProgress);
    }

    useEffect(() => {
        if (!isGenerating) {
            const timeout = setTimeout(() => setProgress(0), 100);
            return () => clearTimeout(timeout);
        }

        if (manualProgress !== undefined) return; // Skip interval if manual

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
    }, [isGenerating, duration, manualProgress]);

    if (!isGenerating || progress === 0) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
            width: `${progress}%`,
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 -2px 10px rgba(168, 85, 247, 0.5)',
            zIndex: 50,
            borderTopRightRadius: '2px',
            borderBottomRightRadius: '2px'
        }} />
    );
};

export default FakeProgressBar;
