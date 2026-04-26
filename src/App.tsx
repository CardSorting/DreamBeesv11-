import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { LiteProvider } from './contexts/LiteContext';
import { Toaster } from 'react-hot-toast';
import AnimatedRoutes from './components/AnimatedRoutes';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';

function App() {
  return (
    <Router>
      <LiteProvider>
        <SplashScreen />
        <div className="app-container" style={{ minHeight: '100vh', background: '#09090b' }}>
          <main className="app-main">
            <AnimatedRoutes />
          </main>
          <BottomNav />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(24, 24, 27, 0.8)',
                backdropFilter: 'blur(20px)',
                color: '#fff',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px',
                fontSize: '0.9rem',
                fontWeight: 600,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                maxWidth: '400px'
              },
              success: {
                iconTheme: {
                  primary: '#8b5cf6',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </LiteProvider>
    </Router>
  );
}

export default App;
