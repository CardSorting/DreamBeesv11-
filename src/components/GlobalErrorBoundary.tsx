import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRITICAL] Global App Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          color: '#fff',
          padding: '20px',
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            padding: '40px',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: '600px',
            backdropFilter: 'blur(10px)'
          }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', color: '#8b5cf6' }}>System Error</h1>
            <p style={{ color: '#a1a1aa', fontSize: '1.1rem', marginBottom: '32px', lineHeight: '1.6' }}>
              The application encountered a fatal error. This usually happens due to a failed database connection or a network disruption.
            </p>
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              padding: '16px', 
              borderRadius: '12px', 
              fontSize: '0.9rem', 
              marginBottom: '32px',
              textAlign: 'left',
              overflowX: 'auto'
            }}>
              <code>{this.state.error?.toString()}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '16px 32px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '1rem',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Restart DreamBees
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
