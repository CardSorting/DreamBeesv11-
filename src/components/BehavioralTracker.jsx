import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackBehavior } from '../utils/analytics';

/**
 * BehavioralTracker monitors user frustration (rage clicks) 
 * and engagement quality (scroll depth).
 */
export default function BehavioralTracker() {
    const location = useLocation();
    const clickRef = useRef({ count: 0, lastTime: 0 });
    const scrollPoints = useRef(new Set());

    useEffect(() => {
        // Reset scroll points on route change
        scrollPoints.current.clear();

        const handleScroll = () => {
            const h = document.documentElement,
                b = document.body,
                st = 'scrollTop',
                sh = 'scrollHeight';
            const percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;

            const thresholds = [25, 50, 75, 90];
            thresholds.forEach(t => {
                if (percent >= t && !scrollPoints.current.has(t)) {
                    scrollPoints.current.add(t);
                    trackBehavior('scroll_depth', {
                        percent: t,
                        page_path: location.pathname
                    });
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    useEffect(() => {
        const handleClick = (e) => {
            const now = Date.now();
            const timeDiff = now - clickRef.current.lastTime;

            if (timeDiff < 500) {
                clickRef.current.count++;
            } else {
                clickRef.current.count = 1;
            }

            clickRef.current.lastTime = now;

            if (clickRef.current.count === 4) { // 4 rapid clicks
                const target = e.target;
                trackBehavior('rage_click', {
                    element_type: target.tagName,
                    element_id: target.id,
                    element_text: target.innerText?.slice(0, 20),
                    page_path: location.pathname
                });
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [location.pathname]);

    return null;
}
