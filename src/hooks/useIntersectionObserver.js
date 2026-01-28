import { useEffect, useRef, useCallback } from 'react';

/**
 * A custom hook that triggers a callback when a target element intersects with the viewport.
 * 
 * @param {Object} options 
 * @param {Function} options.onIntersect - Callback function when element is visible
 * @param {number} [options.threshold=0.1] - Intersection threshold (0 to 1)
 * @param {string} [options.rootMargin='0px 0px 400px 0px'] - Buffer margin for earlier triggers
 * @param {boolean} [options.enabled=true] - Whether the listener is active
 * @returns {import('react').RefObject} The ref to attach to the target element
 */
export function useIntersectionObserver({
    onIntersect,
    threshold = 0.1,
    rootMargin = '0px 0px 400px 0px',
    enabled = true
}) {
    const targetRef = useRef(null);
    const callbackRef = useRef(onIntersect);

    // Keep callback ref fresh to avoid stale closures without re-running effect
    useEffect(() => {
        callbackRef.current = onIntersect;
    }, [onIntersect]);

    useEffect(() => {
        if (!enabled || !targetRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        callbackRef.current();
                    }
                });
            },
            {
                threshold,
                rootMargin
            }
        );

        observer.observe(targetRef.current);

        return () => {
            if (targetRef.current) {
                observer.unobserve(targetRef.current);
            }
        };
    }, [threshold, rootMargin, enabled]);

    return targetRef;
}
