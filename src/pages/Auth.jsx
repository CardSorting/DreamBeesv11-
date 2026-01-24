import React, { useState } from 'react';
import SEO from '../components/SEO';
import './Auth.css';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, Check } from 'lucide-react';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthday, setBirthday] = useState('');
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
                if (!birthday) {
                    setError('Birth date is required.');
                    setLoading(false);
                    return;
                }
                await signup(email, password, birthday);
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
        <div className="auth-container">
            <SEO
                title={isLogin ? 'Log In' : 'Sign Up'}
                description="Access your DreamBees AI studio account or create a new one to start generating images."
            />

            {/* Left: Brand / Art Showcase (Hidden on Mobile) */}
            <div className="auth-brand-section">
                {/* Background Image / Texture */}
                <div
                    className="auth-bg-image"
                    style={{ backgroundImage: `url(${heroImage})` }}
                />
                <div className="auth-bg-gradient" />

                <div className="auth-brand-content">
                    <h1 className="auth-brand-title">
                        Orchestrate your <br /> visual dreams.
                    </h1>
                    <p className="auth-brand-text">
                        Access the world's most advanced generative models with professional precision and speed.
                    </p>

                    <div className="auth-features">
                        {['Private Gallery', 'Commercial License', 'H100 Generation'].map(feature => (
                            <div key={feature} className="auth-feature-item">
                                <div className="auth-feature-icon">
                                    <Check size={12} color="black" strokeWidth={3} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Auth Form */}
            <div className="auth-form-section">
                <div className="auth-form-container">

                    <div style={{ marginBottom: '40px' }}>
                        <Link to="/" className="auth-logo-link">
                            DreamBees
                        </Link>
                    </div>

                    <h2 className="auth-title">
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="auth-subtitle">
                        {isLogin ? 'Enter your details to access your studio.' : 'Start your creative journey today.'}
                    </p>

                    {error && (
                        <div className="auth-error-message">
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
                        className="auth-google-btn"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="auth-divider">
                        <div className="auth-divider-line"></div>
                        <span className="auth-divider-text">OR EMAIL</span>
                        <div className="auth-divider-line"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field auth-input"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field auth-input"
                            />
                        </div>
                        {!isLogin && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', marginLeft: '12px' }}>
                                    Birth Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    className="input-field auth-input"
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                        )}
                        <button
                            disabled={loading}
                            className="btn btn-primary auth-submit-btn"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
                            {!loading && <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
                        </button>
                    </form>

                    <div className="auth-switch-text">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="auth-switch-btn"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
