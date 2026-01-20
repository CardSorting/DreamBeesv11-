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
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh', // Takes up space but not full screen
                    textAlign: 'center',
                    color: '#e4e4e7',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        padding: '24px',
                        borderRadius: '50%',
                        marginBottom: '24px',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
                    }}>
                        <AlertTriangle size={48} color="#ef4444" />
                    </div>

                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                        This part of the hive is buzzing...
                    </h2>

                    <p style={{ color: '#a1a1aa', maxWidth: '400px', marginBottom: '32px', lineHeight: '1.6' }}>
                        We encountered a glitch in this specific area. The rest of the application is still safe to explore.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: 'rgb(79, 70, 229)', // Indigo-600
                                color: 'white',
                                borderRadius: '12px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '15px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(67, 56, 202)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(79, 70, 229)'}
                        >
                            <RefreshCw size={18} />
                            Try Again
                        </button>

                        <button
                            onClick={this.handleReload}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                borderRadius: '12px',
                                fontWeight: '600',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                fontSize: '15px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
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
                                backgroundColor: 'transparent',
                                color: '#a1a1aa',
                                borderRadius: '12px',
                                fontWeight: '600',
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                fontSize: '15px',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                            onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}
                        >
                            Or go Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default RouteErrorBoundary;
