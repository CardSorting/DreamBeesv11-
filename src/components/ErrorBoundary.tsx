import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IconZap } from '../icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Renderer Error]', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fatal-error-immersive">
          <div className="error-content">
            <div className="error-orb">
              <IconZap size={48} />
            </div>
            <h1>The vision was interrupted</h1>
            <p>A fatal glitch occurred in the latent space. We've captured the diagnostics for analysis.</p>
            <button 
              onClick={() => window.location.reload()}
              className="retry-btn clickable"
            >
              Reawaken Studio
            </button>
            <pre className="error-stack">
              {this.state.error?.message}
            </pre>
          </div>

          <style>{`
            .fatal-error-immersive { height: 100vh; display: flex; align-items: center; justify-content: center; background: #060608; color: white; text-align: center; padding: 20px; }
            .error-content { max-width: 480px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
            .error-orb { width: 100px; height: 100px; border-radius: 50%; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); display: flex; align-items: center; justify-content: center; color: #8b5cf6; box-shadow: 0 0 40px rgba(139, 92, 246, 0.1); margin-bottom: 10px; }
            h1 { font-size: 2rem; font-weight: 900; letter-spacing: -1px; }
            p { color: #a1a1aa; line-height: 1.5; font-size: 1.1rem; }
            .retry-btn { background: #8b5cf6; color: white; padding: 14px 32px; border-radius: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; border: none; transition: all 0.3s; }
            .retry-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); }
            .error-stack { margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 12px; font-family: monospace; font-size: 0.7rem; color: #71717a; text-align: left; width: 100%; overflow-x: auto; border: 1px solid rgba(255,255,255,0.05); }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
