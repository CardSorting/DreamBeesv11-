import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("GlobalErrorBoundary Caught Error:", error, errorInfo);
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
                    backgroundColor: '#000',
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #000 100%)',
                    color: '#e4e4e7',
                    fontFamily: '"Outfit", sans-serif',
                    padding: '20px',
                    textAlign: 'center',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'rgba(24, 24, 27, 0.4)', // zinc-900 with alpha
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        padding: '48px 32px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        animation: 'fadeInUp 0.6s ease-out',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(139, 92, 246, 0.2))',
                            padding: '20px',
                            borderRadius: '50%',
                            width: 'fit-content',
                            margin: '0 auto 28px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
                        }}>
                            <AlertCircle size={48} color="#ef4444" />
                        </div>

                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            marginBottom: '16px',
                            color: '#fff',
                            letterSpacing: '-0.02em'
                        }}>
                            The Hive Stumbled
                        </h1>

                        <p style={{
                            marginBottom: '32px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            lineHeight: '1.6',
                            fontSize: '16px',
                            maxWidth: '400px'
                        }}>
                            We encountered an unexpected error. The drones are already buzzing to fix it.
                        </p>

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', marginBottom: '24px' }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: '#fff',
                                    color: '#000',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, opacity 0.2s',
                                    fontSize: '15px',
                                    flex: 1,
                                    minWidth: '140px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <RefreshCw size={18} />
                                Try Again
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    color: '#fff',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '15px',
                                    flex: 1,
                                    minWidth: '140px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
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
                                        color: 'rgba(255, 255, 255, 0.4)',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        padding: '8px'
                                    }}
                                >
                                    {this.state.showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
                                </button>

                                {this.state.showDetails && (
                                    <div style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        textAlign: 'left',
                                        marginTop: '12px',
                                        overflow: 'auto',
                                        maxHeight: '150px',
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                        color: '#fca5a5', // red-300
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{this.state.error.toString()}</div>
                                        {this.state.errorInfo && (
                                            <div style={{ whiteSpace: 'pre-wrap', opacity: 0.7 }}>
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
