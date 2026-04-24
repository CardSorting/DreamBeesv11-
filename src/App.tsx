import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { LiteProvider } from './contexts/LiteContext';
import { Toaster } from 'react-hot-toast';
import AnimatedRoutes from './components/AnimatedRoutes';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <Router>
      <LiteProvider>
        <div className="app-container" style={{ minHeight: '100vh', background: '#000' }}>
          <main className="app-main">
            <AnimatedRoutes />
          </main>
          <BottomNav />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#18181b',
                color: '#fff',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }
            }}
          />
        </div>
      </LiteProvider>
    </Router>
  );
}

export default App;
