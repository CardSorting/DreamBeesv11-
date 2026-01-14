import React, { useState } from 'react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, Check } from 'lucide-react';

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
            navigate('/generate');
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
            navigate('/generate');
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

    // Dynamic import (simulated for Marquee or use a static high res image)
    const heroImage = "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop";

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#000', paddingTop: '100px' }}>
            <SEO
                title={isLogin ? 'Log In' : 'Sign Up'}
                description="Access your DreamBees AI studio account or create a new one to start generating images."
            />

            {/* Left: Brand / Art Showcase (Hidden on Mobile) */}
            <div className="hidden-mobile" style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                background: '#050505',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '60px'
            }}>
                {/* Background Image / Texture */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${heroImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.6,
                    mixBlendMode: 'luminosity'
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 10%, transparent)' }} />

                <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '24px', color: 'white' }}>
                        Orchestrate your <br /> visual dreams.
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>
                        Access the world's most advanced generative models with professional precision and speed.
                    </p>

                    <div style={{ display: 'flex', gap: '24px' }}>
                        {['Private Gallery', 'Commercial License', 'H100 Generation'].map(feature => (
                            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Check size={12} color="black" strokeWidth={3} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Auth Form */}
            <div style={{
                flex: '0 0 550px',
                background: '#0a0a0a',
                borderLeft: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px'
            }}>
                <div style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}>

                    <div style={{ marginBottom: '40px' }}>
                        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'white', textDecoration: 'none' }}>
                            DreamBees
                        </Link>
                    </div>

                    <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
                        {isLogin ? 'Enter your details to access your studio.' : 'Start your creative journey today.'}
                    </p>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fb7185',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            marginBottom: '24px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Google Button */}
                    <button
                        type="button"
                        disabled={loading}
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
                            height: '48px',
                            background: 'white',
                            color: 'black',
                            borderRadius: '99px',
                            fontWeight: '600',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            border: 'none',
                            fontSize: '0.95rem',
                            marginBottom: '24px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>OR EMAIL</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                style={{ background: 'transparent' }}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                style={{ background: 'transparent' }}
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', height: '48px', justifyContent: 'center' }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
                            {!loading && <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
                        </button>
                    </form>

                    <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{ color: 'white', textDecoration: 'underline', fontWeight: '500' }}
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .hidden-mobile { display: none !important; }
                    .flex-0-0-550 { flex: 1 !important; width: 100% !important; }
                }
            `}</style>
        </div>
    );
}
