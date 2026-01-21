import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import SmoothScroll from './components/SmoothScroll';
import NetworkStatus from './components/NetworkStatus';
import UsernameOnboarding from './components/UsernameOnboarding';
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

  return (
    <div className="app-layout">
      {showOnboarding && <UsernameOnboarding />}
      {!pathname.startsWith('/discovery') && !pathname.startsWith('/model/') && !pathname.startsWith('/mockups') && pathname !== '/' && <MinimalHeader />}
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

function App() {
  return (
    <Router>
      <NetworkStatus />
      <SmoothScroll />
      <ScrollToTop />
      <AuthProvider>
        <ModelProvider>
          <UserInteractionsProvider>
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
          </UserInteractionsProvider>
        </ModelProvider>
      </AuthProvider>
    </Router>
  );
}


export default App;
