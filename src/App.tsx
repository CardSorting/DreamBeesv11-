import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { LiteProvider, useLite } from './contexts/LiteContext';
import { Toaster } from 'react-hot-toast';
import AnimatedRoutes from './components/AnimatedRoutes';
import Sidebar from './components/Sidebar';
import SplashScreen from './components/SplashScreen';

function AppContent() {
  const { sidebarCollapsed } = useLite();

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />
      <main className="app-main">
        <AnimatedRoutes />
      </main>
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
  );
}

function App() {
  return (
    <Router>
      <LiteProvider>
        <SplashScreen />
        <AppContent />
      </LiteProvider>
    </Router>
  );
}

export default App;
