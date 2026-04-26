import React, { useState, useEffect } from 'react';
import { useLite } from '../contexts/LiteContext';
import { useNavigate } from 'react-router-dom';
import { IconLoader, IconZap } from '../icons';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthday, setBirthday] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, loginWithGoogle, currentUser, addToast } = useLite();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) navigate('/generate');
    }, [currentUser, navigate]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (!birthday) throw new Error("Birth date is required");
                await signup(email, password, birthday);
            }
            navigate('/generate');
        } catch (err: any) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="lite-auth-immersive">
            {/* Soft mesh background to match the new inviting vibe */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="auth-card-warm glass-warm"
            >
                <header>
                    <div className="brand-logo">
                        <IconZap size={32} fill="#8b5cf6" />
                    </div>
                    <h1>DreamBees<span>LITE</span></h1>
                    <p className="welcome-text">
                        {isLogin ? 'Welcome back, Creator' : 'Start your creative journey'}
                    </p>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            required 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                        />
                    </div>
                    <div className="input-group">
                        <input 
                            type="password" 
                            placeholder="Password" 
                            required 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                    </div>
                    
                    <AnimatePresence>
                        {!isLogin && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="input-group"
                            >
                                <label className="field-label">Date of Birth</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={birthday} 
                                    onChange={e => setBirthday(e.target.value)} 
                                    className="date-input"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <button type="submit" disabled={loading} className="primary-btn glow-soft">
                        {loading ? <IconLoader size={20} /> : (isLogin ? 'Enter Studio' : 'Create Account')}
                    </button>
                </form>

                <div className="social-spacer">
                    <div className="line"></div>
                    <span>OR CONTINUE WITH</span>
                    <div className="line"></div>
                </div>

                <button 
                    type="button" 
                    className="google-btn-warm" 
                    onClick={() => loginWithGoogle()}
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </button>

                <div className="community-trust">
                    <div className="avatar-stack">
                        <div className="mini-avatar"></div>
                        <div className="mini-avatar"></div>
                        <div className="mini-avatar"></div>
                        <div className="mini-count">+12k</div>
                    </div>
                    <span>Joined the collective of creators</span>
                </div>

                <p className="footer-toggle">
                    {isLogin ? "Don't have an account? " : "Already with us? "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Join now' : 'Sign in'}</button>
                </p>
            </motion.div>

            <style>{`
                .lite-auth-immersive { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: #09090b; position: relative; overflow: hidden; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(100px); animation: float 20s infinite alternate ease-in-out; }
                .mesh-1 { width: 600px; height: 600px; background: rgba(139, 92, 246, 0.2); top: -200px; right: -100px; }
                .mesh-2 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); bottom: -100px; left: -100px; animation-delay: -5s; }
                
                @keyframes float { 
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(50px, 50px) scale(1.1); }
                }

                .glass-warm { background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 80px rgba(0,0,0,0.6); }

                .auth-card-warm { width: 100%; max-width: 440px; padding: 50px; border-radius: 48px; position: relative; z-index: 10; }
                header { text-align: center; margin-bottom: 40px; }
                .brand-logo { margin-bottom: 20px; display: flex; justify-content: center; filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.4)); }
                header h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -2px; line-height: 1; }
                header h1 span { color: #8b5cf6; margin-left: 5px; }
                .welcome-text { color: #a1a1aa; margin-top: 10px; font-size: 1.1rem; font-weight: 500; }

                form { display: flex; flex-direction: column; gap: 16px; }
                .input-group { display: flex; flex-direction: column; gap: 8px; }
                .field-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #52525b; letter-spacing: 1px; padding-left: 5px; }
                input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 18px 24px; border-radius: 20px; color: white; font-size: 1rem; outline: none; transition: all 0.3s; }
                input:focus { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.05); box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
                .date-input { color: #71717a; }

                .primary-btn { background: #8b5cf6; color: white; border: none; padding: 18px; border-radius: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; margin-top: 10px; transition: all 0.3s; font-size: 0.9rem; }
                .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4); }
                .primary-btn:active { transform: translateY(0); }

                .social-spacer { display: flex; align-items: center; gap: 15px; margin: 30px 0; }
                .social-spacer .line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
                .social-spacer span { font-size: 0.65rem; font-weight: 900; color: #3f3f46; letter-spacing: 2px; }

                .google-btn-warm { background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 20px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.3s; }
                .google-btn-warm:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

                .community-trust { margin-top: 30px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                .avatar-stack { display: flex; align-items: center; justify-content: center; }
                .mini-avatar { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #18181b; background: #27272a; margin-right: -10px; }
                .mini-avatar:nth-child(2) { background: #3f3f46; }
                .mini-avatar:nth-child(3) { background: #52525b; }
                .mini-count { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #18181b; background: #8b5cf6; color: white; font-size: 0.6rem; font-weight: 900; display: flex; align-items: center; justify-content: center; z-index: 5; }
                .community-trust span { font-size: 0.75rem; color: #52525b; font-weight: 700; }

                .footer-toggle { text-align: center; margin-top: 30px; color: #71717a; font-size: 1rem; font-weight: 500; }
                .footer-toggle button { background: transparent; border: none; color: #8b5cf6; font-weight: 800; cursor: pointer; margin-left: 5px; text-decoration: underline; text-underline-offset: 4px; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                .glow-soft { box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
            `}</style>
        </div>
    );
}
