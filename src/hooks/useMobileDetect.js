import { useState, useEffect } from 'react';

export const useMobileDetect = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobileBreakpoint = 640; // sm breakpoint
            const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
            const isNarrowScreen = window.innerWidth < mobileBreakpoint;
            setIsMobile(isTouchDevice || isNarrowScreen);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

export default useMobileDetect;