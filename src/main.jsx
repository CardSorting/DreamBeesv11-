import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './tailwind.css'
import App from './App.jsx'

import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx'

// Global Async Error Handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('[System] Unhandled Promise Rejection:', event.reason);
  // In a production environment, this would be sent to Sentry/LogRocket
  if (import.meta.env.DEV) {
    console.warn('[Dev] Check your async handlers for missing .catch() or try/catch blocks.');
  }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[SW] New content is available; please refresh.');
                } else {
                  console.log('[SW] Content is cached for offline use.');
                }
              }
            };
          }
        };
      })
      .catch(err => {
        console.warn('SW registration failed:', err);
      });
  });
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
)
