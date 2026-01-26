/* global process */
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class RouteErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Route Error:", error, errorInfo);
    }

    componentDidUpdate(prevProps) {
        // Automatically reset error if location changes (requires router prop or similar trigger)
        // For simplicity, we rely on the parent wrapper to remount us or we can use a key
        // But if this component stays mounted and location updates, we should clear error.
        // We can't easily detect location change here without props.
        if (this.props.resetKeys && prevProps.resetKeys !== this.props.resetKeys) {
            this.handleReset();
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '60px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    textAlign: 'center',
                    color: 'var(--color-text-main)',
                    animation: 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        padding: '32px',
                        borderRadius: '50%',
                        marginBottom: '32px',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        boxShadow: '0 0 40px rgba(239, 68, 68, 0.1), inset 0 0 20px rgba(239, 68, 68, 0.05)'
                    }}>
                        <AlertTriangle size={56} color="#ef4444" strokeWidth={1.5} />
                    </div>

                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        marginBottom: '16px',
                        letterSpacing: '-0.02em',
                        fontFamily: 'var(--font-display)'
                    }}>
                        Something stung the code...
                    </h2>

                    <p style={{
                        color: 'var(--color-zinc-400)',
                        maxWidth: '460px',
                        marginBottom: '40px',
                        lineHeight: '1.7',
                        fontSize: '1.05rem'
                    }}>
                        We've hit an unexpected turbulence in this section. Don't worry, the rest of the hive is functioning perfectly.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={this.handleReset}
                            className="btn btn-primary"
                            style={{ gap: '10px', padding: '0 32px' }}
                        >
                            <RefreshCw size={18} />
                            Try Recovery
                        </button>

                        <button
                            onClick={this.handleReload}
                            className="btn btn-outline"
                            style={{ gap: '10px', padding: '0 32px' }}
                        >
                            <RefreshCw size={18} />
                            Hard Reload
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn btn-ghost"
                            style={{ padding: '0 24px' }}
                        >
                            Return Home
                        </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <div style={{
                            marginTop: '48px',
                            padding: '16px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: '#ef4444',
                            maxWidth: '100%',
                            overflowX: 'auto',
                            textAlign: 'left'
                        }}>
                            <strong>Error Context:</strong> {this.state.error?.message}
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default RouteErrorBoundary;
