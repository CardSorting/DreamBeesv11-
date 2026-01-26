import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

/**
 * A component that listens to route changes and sends page_view events to GA.
 * This should be placed inside the Router component in App.jsx.
 */
const GoogleAnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        trackPageView(location.pathname + location.search);
    }, [location]);

    return null;
};

export default GoogleAnalyticsTracker;
