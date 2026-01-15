import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LazyImage Component
 * Handles lazy loading with Intersection Observer, themed skeletons, 
 * and fluid entrance transitions using framer-motion.
 */
const LazyImage = ({
    src,
    srcSet,
    sizes,
    alt,
    aspectRatio = '1/1',
    className = '',
    style = {},
    onClick,
    priority = false,
    delay = 0,
    fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='9' cy='9' r='2'%3E%3C/circle%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'%3E%3C/path%3E%3C/svg%3E"
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [retryCount, setRetryCount] = useState(0);
    const [forceRenderKey, setForceRenderKey] = useState(0);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Immediate check for empty src
    useEffect(() => {
        if (!src) {
            setHasError(true);
            setIsLoaded(true);
        }
    }, [src]);

    // Network Recovery Listener
    useEffect(() => {
        const handleOnline = () => {
            if (hasError) {
                // Reset and try again when back online
                console.log("Network back online, retrying image:", src);
                setHasError(false);
                setIsLoaded(false);
                setRetryCount(0);
                setForceRenderKey(prev => prev + 1);
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [hasError, src]);

    useEffect(() => {
        if (priority || isInView) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // Load slightly before it enters the viewport
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [priority, isInView]);

    // Handle cached images and timeouts
    useEffect(() => {
        if (!isInView || isLoaded || hasError) return;

        // Check if already loaded (pull from cache)
        if (imageRef.current && imageRef.current.complete) {
            if (imageRef.current.naturalWidth > 0) {
                handleLoad();
            } else {
                handleError(); // Loaded but empty/broken
            }
            return;
        }

        // Timeout failsafe
        const timeoutId = setTimeout(() => {
            if (!isLoaded && !hasError) {
                // Force error state if stuck loading
                handleError();
            }
        }, 7000);

        return () => clearTimeout(timeoutId);
    }, [isInView, isLoaded, hasError, forceRenderKey]); // Add forceRenderKey dependency

    const handleLoad = () => {
        setIsLoaded(true);
        setHasError(false);
    };

    const handleError = () => {
        if (retryCount < 3) {
            // Retry logic
            const delay = (retryCount + 1) * 1000; // 1s, 2s, 3s
            setTimeout(() => {
                if (!isLoaded) { // Check again in case it loaded meanwhile
                    setRetryCount(prev => prev + 1);
                    setForceRenderKey(prev => prev + 1); // Force re-mount of img
                }
            }, delay);
        } else {
            // Give up
            setIsLoaded(true);
            setHasError(true);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`lazy-image-container ${className}`}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.03)',
                ...style
            }}
            onClick={onClick}
        >
            {/* Skeleton / Placeholder */}
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 1,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s infinite'
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Actual Image */}
            {isInView && (
                <motion.img
                    key={forceRenderKey}
                    ref={imageRef}
                    src={hasError ? fallbackSrc : src}
                    srcSet={hasError ? undefined : srcSet}
                    sizes={sizes}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    animate={isLoaded ? {
                        opacity: 1,
                        scale: hasError ? 0.4 : 1, // Keep error icon small
                        filter: 'blur(0px)'
                    } : {}}
                    transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 20,
                        mass: 1,
                        delay: delay,
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: hasError ? 'contain' : 'cover',
                        display: 'block',
                        opacity: hasError ? 0.3 : 1
                    }}
                />
            )}

            <style>{`
                .lazy-image-container::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.03),
                        transparent
                    );
                    transform: translateX(-100%);
                    animation: premium-shimmer 2s infinite;
                    z-index: 1; /* Ensure it's above the background color but below the image */
                    pointer-events: none; /* Allow clicks to pass through */
                    opacity: ${isLoaded ? 0 : 1}; /* Hide shimmer when image is loaded */
                    transition: opacity 0.5s ease-out;
                }

                @keyframes premium-shimmer {
                    100% { transform: translateX(100%); }
                }
                .lazy-image-container {
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default LazyImage;
