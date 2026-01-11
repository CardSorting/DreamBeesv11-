import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModelProvider } from './contexts/ModelContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Generator from './pages/Generator';
import Gallery from './pages/Gallery';
import Models from './pages/Models';
import ImageDetail from './pages/ImageDetail';
import ModelDetail from './pages/ModelDetail';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import { Privacy, Terms, Cookies } from './pages/Legal';
import { Blog as PlaceholderBlog, Careers, Brand, Api, Showcase } from './pages/Misc';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import KaraokeGenie from './pages/KaraokeGenie';
import DressUp from './pages/DressUp';
import Slideshow from './pages/Slideshow';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" />;
}

function Layout() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
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
        </ModelProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
