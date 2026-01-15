import React, { Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ModelProvider } from './contexts/ModelContext';
import { UserInteractionsProvider } from './contexts/UserInteractionsContext';
import { Toaster } from 'react-hot-toast';
import MinimalHeader from './components/MinimalHeader';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';

// Imports for Animations
import AnimatedRoutes from './components/AnimatedRoutes';
import SmoothScroll from './components/SmoothScroll';

function Layout() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  const isShowcaseDetail = pathname.startsWith('/discovery/') && pathname !== '/discovery';

  return (
    <div className="app-layout">
      {!pathname.startsWith('/discovery') && !pathname.startsWith('/model/') && pathname !== '/' && <MinimalHeader />}
      <main className="app-main">
        <AnimatedRoutes />
      </main>
      {!isLanding && !isShowcaseDetail && (
        <div className="app-footer">
          <Footer />
        </div>
      )}
      {!isShowcaseDetail && <BottomNav />}
      <BackToTop />
    </div>
  );
}

function App() {
  return (
    <Router>
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
