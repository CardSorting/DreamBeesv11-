import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModelProvider } from './contexts/ModelContext';
import { UserInteractionsProvider } from './contexts/UserInteractionsContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import ModelFeed from './pages/ModelFeed'; // Critical Path: Keep eager

// Lazy Load Non-Critical Pages
const Auth = React.lazy(() => import('./pages/Auth'));
const Generator = React.lazy(() => import('./pages/Generator'));
const Gallery = React.lazy(() => import('./pages/Gallery'));
const Models = React.lazy(() => import('./pages/Models'));
const ImageDetail = React.lazy(() => import('./pages/ImageDetail'));
const ModelDetail = React.lazy(() => import('./pages/ModelDetail'));
const Features = React.lazy(() => import('./pages/Features'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const Blog = React.lazy(() => import('./pages/Blog'));
const KaraokeGenie = React.lazy(() => import('./pages/KaraokeGenie'));
const DressUp = React.lazy(() => import('./pages/DressUp'));
const Slideshow = React.lazy(() => import('./pages/Slideshow'));
const AppsHub = React.lazy(() => import('./pages/AppsHub'));

// Lazy Load Legal & Misc (Grouped if exports allows, but individual is safer for tree shaking if default exports)
// Assuming Legal.jsx exports named components, we might need a wrapper or handle named imports differently with lazy.
// React.lazy only supports default exports. We'll use a helper or keep them eager if they are small.
// For now, let's keep the small text pages eager to avoid complexity with named exports, OR wrap them.
// Given they are text, eager is fine.
import { Privacy, Terms, Cookies } from './pages/Legal';
import { Careers, Brand, Api, Showcase } from './pages/Misc';


function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" />;
}

// Simple Loading Fallback
const PageLoader = () => (
  <div style={{
    height: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.5)'
  }}>
    <div className="loading-pulse">Loading...</div>
  </div>
);

function Layout() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<ModelFeed />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            } />
            <Route path="/generate" element={
              <PrivateRoute>
                <Generator />
              </PrivateRoute>
            } />
            <Route path="/gallery" element={
              <PrivateRoute>
                <Gallery />
              </PrivateRoute>
            } />
            <Route path="/gallery/:id" element={
              <PrivateRoute>
                <ImageDetail />
              </PrivateRoute>
            } />
            <Route path="/models" element={<Models />} />
            <Route path="/model/:id" element={<ModelDetail />} />
            <Route path="/model/:id/feed" element={<ModelFeed />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/brand" element={<Brand />} />
            <Route path="/api" element={<Api />} />
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/apps" element={<AppsHub />} />
            <Route path="/karaoke" element={<KaraokeGenie />} />
            <Route path="/dressup" element={
              <PrivateRoute>
                <DressUp />
              </PrivateRoute>
            } />
            <Route path="/slideshow" element={
              <PrivateRoute>
                <Slideshow />
              </PrivateRoute>
            } />
          </Routes>
        </Suspense>
      </main>
      {!isLanding && (
        <div className="app-footer">
          <Footer />
        </div>
      )}
    </div>
  );
}



function App() {
  return (
    <Router>
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
