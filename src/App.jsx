import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModelProvider } from './contexts/ModelContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Generator from './pages/Generator';
import Gallery from './pages/Gallery';
import Models from './pages/Models';

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
