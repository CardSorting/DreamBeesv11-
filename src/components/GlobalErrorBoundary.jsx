import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
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
                    backgroundColor: '#09090b', // zinc-950
                    color: '#e4e4e7', // zinc-200
                    fontFamily: 'Inter, sans-serif',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#18181b', // zinc-900
                        padding: '40px',
                        borderRadius: '16px',
                        border: '1px solid #27272a', // zinc-800
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
                            padding: '16px',
                            borderRadius: '50%',
                            width: 'fit-content',
                            margin: '0 auto 24px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertCircle size={48} color="#ef4444" />
                        </div>

                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            color: '#fff'
                        }}>
                            Something went wrong
                        </h1>

                        <p style={{
                            marginBottom: '24px',
                            color: '#a1a1aa', // zinc-400
                            lineHeight: '1.5'
                        }}>
                            The application encountered an unexpected error.
                            We've logged this issue and are looking into it.
                        </p>

                        {this.state.error && (
                            <div style={{
                                backgroundColor: '#000',
                                padding: '12px',
                                borderRadius: '8px',
                                textAlign: 'left',
                                marginBottom: '24px',
                                overflow: 'auto',
                                maxHeight: '150px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                color: '#f87171' // red-400
                            }}>
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#fff',
                                    color: '#000',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <RefreshCw size={18} />
                                Reload Page
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #3f3f46', // zinc-700
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <Home size={18} />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
