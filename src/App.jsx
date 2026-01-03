import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ModelProvider>
          <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
            <Navbar />
            <div style={{ flex: 1 }}>
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
                <Route path="/models" element={
                  <PrivateRoute>
                    <Models />
                  </PrivateRoute>
                } />
              </Routes>
            </div>
            <Footer />
          </div>
        </ModelProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
