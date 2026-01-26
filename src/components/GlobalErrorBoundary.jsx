import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { trackException } from '../utils/analytics';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidMount() {
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
        window.addEventListener('error', this.handleGlobalError);
    }

    componentWillUnmount() {
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
        window.removeEventListener('error', this.handleGlobalError);
    }

    handleUnhandledRejection = (event) => {
        // Prevent default console error logging if we're handling it
        // event.preventDefault(); 
        console.error("GlobalErrorBoundary Caught Unhandled Rejection:", event.reason);
        trackException(`Unhandled Rejection: ${event.reason}`, true);
        this.setState({
            hasError: true,
            error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
            errorInfo: { componentStack: 'Unhandled Promise Rejection' }
        });
    };

    handleGlobalError = (event) => {
        // event.error might be undefined for cross-origin script errors
        console.error("GlobalErrorBoundary Caught Global Error:", event.error || event.message);
        trackException(`Global Error: ${event.message || 'Unknown'}`, true);
        this.setState({
            hasError: true,
            error: event.error || new Error(event.message || 'Unknown Global Error'),
            errorInfo: { componentStack: 'Global Script Error' }
        });
    };

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("GlobalErrorBoundary Caught React Error:", error, errorInfo);
        trackException(`React Error: ${error.message}`, true);
        this.setState({ error, errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    toggleDetails = () => {
        this.setState(prevState => ({ showDetails: !prevState.showDetails }));
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    width: '100vw',
                    backgroundColor: '#050505',
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #171717 0%, #050505 100%)',
                    color: 'var(--color-text-main)',
                    fontFamily: 'var(--font-body)',
                    padding: '24px',
                    textAlign: 'center',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 99999
                }}>
                    <div className="glass-panel" style={{
                        padding: '60px 40px',
                        maxWidth: '540px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        animation: 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(79, 70, 229, 0.1))',
                            padding: '24px',
                            borderRadius: '50%',
                            marginBottom: '32px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            boxShadow: '0 0 40px rgba(239, 68, 68, 0.1)'
                        }}>
                            <AlertCircle size={56} color="#ef4444" strokeWidth={1.5} />
                        </div>

                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            marginBottom: '16px',
                            letterSpacing: '-0.03em',
                            fontFamily: 'var(--font-display)'
                        }}>
                            The Hive Stumbled
                        </h1>

                        <p style={{
                            marginBottom: '40px',
                            color: 'var(--color-text-muted)',
                            lineHeight: '1.7',
                            fontSize: '1.1rem',
                            maxWidth: '420px'
                        }}>
                            We've encountered a critical turbulence in the system. The drones have been notified, but a quick restart should clear the air.
                        </p>

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', marginBottom: '32px' }}>
                            <button
                                onClick={this.handleReload}
                                className="btn btn-primary"
                                style={{ flex: 1, minWidth: '160px', gap: '8px' }}
                            >
                                <RefreshCw size={18} />
                                Try Recovery
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="btn btn-outline"
                                style={{ flex: 1, minWidth: '160px', gap: '8px' }}
                            >
                                <Home size={18} />
                                Return Home
                            </button>
                        </div>

                        {this.state.error && (
                            <div style={{ width: '100%' }}>
                                <button
                                    onClick={this.toggleDetails}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-zinc-700)',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-zinc-400)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-zinc-700)'}
                                >
                                    {this.state.showDetails ? 'Hide Error Signature' : 'View Error Signature'}
                                </button>

                                {this.state.showDetails && (
                                    <div style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        padding: '20px',
                                        borderRadius: '16px',
                                        textAlign: 'left',
                                        marginTop: '20px',
                                        overflowX: 'auto',
                                        maxHeight: '200px',
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.1)',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{this.state.error.toString()}</div>
                                        {this.state.errorInfo && (
                                            <div style={{ whiteSpace: 'pre-wrap', opacity: 0.6 }}>
                                                {this.state.errorInfo.componentStack}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
