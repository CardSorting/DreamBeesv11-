import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Global Error Boundary caught:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#09090b',
                    color: '#fff',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: 'rgba(255,50,50,0.1)',
                        padding: '24px',
                        borderRadius: '50%',
                        marginBottom: '24px'
                    }}>
                        <AlertTriangle size={48} className="text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
                    <p className="text-zinc-400 mb-8 max-w-md">
                        We encountered an unexpected error. This usually resolves by refreshing the page.
                    </p>

                    <button
                        onClick={this.handleReload}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors"
                    >
                        <RefreshCw size={20} />
                        Reload Application
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-zinc-900 rounded-lg text-left max-w-2xl w-full overflow-auto border border-zinc-800">
                            <pre className="text-red-400 text-xs font-mono">{this.state.error?.toString()}</pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
