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

    handleReload = () => {
        // Try to recover state by remounting? simpler to just reload page or reset state
        // For now, reload page is safest, but we could try clear error
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh', // Takes up space but not full screen
                    textAlign: 'center',
                    color: '#e4e4e7'
                }}>
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        padding: '24px',
                        borderRadius: '50%',
                        marginBottom: '24px'
                    }}>
                        <AlertTriangle size={48} color="#ef4444" />
                    </div>

                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                        This page hit a snag
                    </h2>

                    <p style={{ color: '#a1a1aa', maxWidth: '400px', marginBottom: '32px', lineHeight: '1.6' }}>
                        We couldn't load this specific part of the application.
                        The rest of the app is still working!
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={this.handleReload}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: '#fff',
                                color: '#000',
                                borderRadius: '12px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '15px'
                            }}
                        >
                            <RefreshCw size={18} />
                            Reload Page
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                borderRadius: '12px',
                                fontWeight: '600',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                fontSize: '15px'
                            }}
                        >
                            Return Home
                        </button>
                    </div>

                    {/* Optional technical details for dev */}
                    {/* {this.state.error && <pre style={{marginTop: 20, fontSize: 10, opacity: 0.5}}>{this.state.error.message}</pre>} */}
                </div>
            );
        }

        return this.props.children;
    }
}

export default RouteErrorBoundary;
