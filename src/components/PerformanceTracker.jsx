import { useEffect } from 'react';
import { trackMetric, trackEvent } from '../utils/analytics';

/**
 * PerformanceTracker monitors Core Web Vitals (LCP, FID, CLS) 
 * and reports them to Google Analytics.
 */
export default function PerformanceTracker() {
    useEffect(() => {
        // Cumulative Layout Shift (CLS)
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });

            // Report CLS periodically or on visibility change
            const reportCls = () => {
                if (clsValue > 0) {
                    trackMetric({ name: 'CLS', delta: clsValue, id: 'cls-metric', value: clsValue });
                }
            };

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    reportCls();
                }
            });
        } catch (e) {
            console.warn('CLS tracking not supported', e);
        }

        // First Input Delay (FID)
        try {
            const fidObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    const delay = entry.processingStart - entry.startTime;
                    trackMetric({ name: 'FID', delta: delay, id: entry.name, value: delay });
                }
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) {
            console.warn('FID tracking not supported', e);
        }

        // Largest Contentful Paint (LCP)
        try {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                trackMetric({ name: 'LCP', delta: lastEntry.startTime, id: 'lcp-metric', value: lastEntry.startTime });
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
            console.warn('LCP tracking not supported', e);
        }

        // Interaction to Next Paint (INP) - Experimental/Simulated via long tasks
        try {
            const inpObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    trackEvent('long_task', { duration: entry.duration, startTime: entry.startTime });
                }
            });
            inpObserver.observe({ type: 'longtask', buffered: true });
        } catch (e) {
            // Not supported in all browsers
        }

    }, []);

    return null;
}
