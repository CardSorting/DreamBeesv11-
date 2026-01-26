import React, { Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { setUserProperties, trackChurnSignal } from './utils/analytics';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModelProvider } from './contexts/ModelContext';
import { UserInteractionsProvider, useUserInteractions } from './contexts/UserInteractionsContext';
import { Toaster } from 'react-hot-toast';
import MinimalHeader from './components/MinimalHeader';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
// Imports for Animations
import AnimatedRoutes from './components/AnimatedRoutes';
import GoogleAnalyticsTracker from './components/GoogleAnalyticsTracker';
import PerformanceTracker from './components/PerformanceTracker';
import BehavioralTracker from './components/BehavioralTracker';
// import PublicGenerationsFeed from './pages/PublicGenerationsFeed';
import SmoothScroll from './components/SmoothScroll';
import NetworkStatus from './components/NetworkStatus';
import UsernameOnboarding from './components/UsernameOnboarding';
import AgeVerificationModal from './components/AgeVerificationModal';
import { useIsMobile } from './hooks/useIsMobile';

function Layout() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const isLanding = pathname === '/';

  const { currentUser } = useAuth();
  const { userProfile, isProfileLoaded } = useUserInteractions();

  const isShowcaseDetail = pathname.startsWith('/discovery/') && pathname !== '/discovery';

  // Check if we need to show onboarding
  const showOnboarding = currentUser && isProfileLoaded && !userProfile.username;

  // Determine if we should hide the header based on the current route
  const hideHeaderRoutes = [
    '/',
    '/discovery',
    '/mockups',
    '/memes',
    '/filter',
    '/showcase',
    '/mockup-catalog'
  ];

  const shouldHideHeader = hideHeaderRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) || pathname.startsWith('/model/');

  return (
    <div className="app-layout">
      <AgeVerificationModal />
      {showOnboarding && <UsernameOnboarding />}
      {!shouldHideHeader && <MinimalHeader />}
      <main className="app-main">

        <AnimatedRoutes />
      </main>
      {!isLanding && !isShowcaseDetail && !pathname.startsWith('/discovery') && pathname !== '/generate' && !(pathname.startsWith('/mockup-catalog') && isMobile) && (
        <div className="app-footer">
          <Footer />
        </div>
      )}

      {!isShowcaseDetail && !pathname.startsWith('/discovery') && pathname !== '/generate' && <BottomNav />}
      <BackToTop />
    </div>
  );
}

import { TwitchProvider } from './contexts/TwitchContext';

function App() {
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');

    if (utmSource || utmMedium || utmCampaign) {
      setUserProperties({
        campaign_source: utmSource || 'direct',
        campaign_medium: utmMedium || 'none',
        campaign_name: utmCampaign || 'none'
      });
    }

    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
      setUserProperties({ referral_source: refCode });
    }

    // Session Heartbeat (every 5 mins)
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        setUserProperties({ last_active: new Date().toISOString() });
      }
    }, 300000);

    // Exit Intent Tracking
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        trackChurnSignal('exit_intent', 'mouse_left_top', {
          path: window.location.pathname
        });
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <Router>
      <GoogleAnalyticsTracker />
      <PerformanceTracker />
      <BehavioralTracker />
      <NetworkStatus />
      <SmoothScroll />
      <ScrollToTop />
      <AuthProvider>
        <ModelProvider>
          <UserInteractionsProvider>
            <TwitchProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#18181b',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#8b5cf6',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              <Layout />
            </TwitchProvider>
          </UserInteractionsProvider>
        </ModelProvider>
      </AuthProvider>
    </Router>
  );
}


export default App;
