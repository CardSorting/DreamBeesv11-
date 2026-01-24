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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
)
