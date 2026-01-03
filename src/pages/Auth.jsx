import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
                setError('Error: Authentication not enabled. Please enable Email/Password Sign-in in the Firebase Console (Authentication > Sign-in method).');
            } else {
                setError('Failed to ' + (isLogin ? 'log in' : 'create account') + ': ' + err.message);
            }
        }

        setLoading(false);
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #2e1065, #09090b)'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px', textAlign: 'center' }}>
                    {isLogin ? 'Welcome Back' : 'Join DreamBees'}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '32px' }}>
                    {isLogin ? 'Enter your details to access your gallery' : 'Start creating AI art today'}
                </p>

                {error && <div style={{
                    background: 'rgba(236, 72, 153, 0.2)',
                    color: '#f9a8d4',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '0.9rem'
                }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ marginTop: '10px' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        try {
                            setLoading(true);
                            await loginWithGoogle();
                        } catch (err) {
                            console.error(err);
                            setError('Failed to sign in with Google: ' + err.message);
                            setLoading(false);
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#18181b', // light theme text for contrast
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginBottom: '24px'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <div style={{ marginTop: '0px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
