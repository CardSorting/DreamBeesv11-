import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
    // Initialize with synchronous check to prevent hydration mismatch
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < breakpoint;
        }
        return false;
    });

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Check initially (in case window resized before effect ran)
        checkMobile();

        // Add listener
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint]);

    return isMobile;
}
