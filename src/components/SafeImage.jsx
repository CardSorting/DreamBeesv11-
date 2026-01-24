import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * A wrapper around <img> that handles loading errors gracefully.
 * 
 * Props:
 * - src: string
 * - alt: string
 * - className: string
 * - style: object
 * - fallback: ReactNode (optional custom fallback)
 * - ...props: standard img props
 */
export default function SafeImage({ src, alt, className, style, fallback, ...props }) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    if (hasError || !src) {
        if (fallback) return fallback;

        // Default fallback UI
        return (
            <div
                className={className}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#27272a', // zinc-800
                    color: '#71717a', // zinc-500
                    width: '100%',
                    height: '100%'
                }}
            >
                <div style={{ textAlign: 'center', width: '100%', overflow: 'hidden' }}>
                    <ImageOff size={24} style={{ margin: '0 auto', display: 'block' }} />
                </div>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            style={{
                ...style,
                opacity: isLoading ? 0 : 1,
                transition: 'opacity 0.2s ease-in-out'
            }}
            onError={handleError}
            onLoad={handleLoad}
            {...props}
        />
    );
}
