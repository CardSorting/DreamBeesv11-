import React, { useState, useEffect } from 'react';
import { useLite } from '../contexts/LiteContext';
import { useNavigate } from 'react-router-dom';
import { IconLoader, IconZap, IconSparkles, IconMagic } from '../icons';
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
                addToast("Welcome back to the dream.", "success");
            } else {
                if (!birthday) throw new Error("A birth date is required for the archive.");
                await signup(email, password, birthday);
                addToast("Your creative journey begins now.", "success");
            }
            navigate('/generate');
        } catch (err: any) {
            addToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="lite-auth-immersive fade-in">
            {/* Dynamic Mesh Background */}
            <div className="mesh-gradient-container">
                <div className="mesh-ball mesh-1"></div>
                <div className="mesh-ball mesh-2"></div>
                <div className="mesh-ball mesh-3"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="auth-jewel-card glass-immersive"
            >
                <header className="auth-header">
                    <div className="brand-orb-visual">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="orb-ring"
                        >
                            <IconSparkles size={24} className="ring-sparkle" />
                        </motion.div>
                        <div className="orb-core">
                            <IconMagic size={32} fill="white" />
                        </div>
                    </div>
                    <h1>DreamBees<span>Lite</span></h1>
                    <p className="poetic-welcome">
                        {isLogin ? 'Reawaken your latent vision.' : 'Step into the garden of creation.'}
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="field-group">
                        <label>Identity</label>
                        <input 
                            type="email" 
                            placeholder="Email address" 
                            required 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                        />
                    </div>
                    <div className="field-group">
                        <label>Secret</label>
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
                                className="field-group"
                            >
                                <label>Date of Awakening</label>
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
                    
                    <button type="submit" disabled={loading} className="manifest-btn">
                        {loading ? <IconLoader size={20} className="spin" /> : (isLogin ? 'Enter Studio' : 'Begin Journey')}
                    </button>
                </form>

                <div className="auth-divider">
                    <div className="line"></div>
                    <span>OR CONTINUE WITH</span>
                    <div className="line"></div>
                </div>

                <button 
                    type="button" 
                    className="google-jewel-btn" 
                    onClick={() => loginWithGoogle()}
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Universal Account</span>
                </button>

                <div className="creator-trust">
                    <div className="avatar-cluster">
                        <div className="mini-orb"></div>
                        <div className="mini-orb"></div>
                        <div className="mini-orb"></div>
                        <div className="mini-plus">+12k</div>
                    </div>
                    <span>Joined the collective of creators</span>
                </div>

                <p className="auth-footer">
                    {isLogin ? "New to the archive? " : "Already a creator? "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Join now' : 'Sign in'}</button>
                </p>
            </motion.div>

            <style>{`
                .lite-auth-immersive { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; background: #09090b; position: relative; overflow: hidden; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.3; }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(120px); animation: drift 25s infinite alternate ease-in-out; }
                .mesh-1 { width: 700px; height: 700px; background: rgba(139, 92, 246, 0.2); top: -250px; right: -150px; }
                .mesh-2 { width: 600px; height: 600px; background: rgba(245, 158, 11, 0.15); bottom: -150px; left: -150px; animation-delay: -7s; }
                .mesh-3 { width: 500px; height: 500px; background: rgba(217, 70, 239, 0.1); top: 30%; left: 10%; animation-duration: 30s; }
                
                @keyframes drift { 
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    100% { transform: translate(60px, 60px) scale(1.15) rotate(15deg); }
                }

                .auth-jewel-card { width: 100%; max-width: 480px; padding: 60px; border-radius: 64px; position: relative; z-index: 10; box-shadow: 0 40px 100px rgba(0,0,0,0.6); }
                
                .auth-header { text-align: center; margin-bottom: 50px; }
                .brand-orb-visual { position: relative; width: 80px; height: 80px; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; }
                .orb-ring { position: absolute; inset: -10px; border: 2px dashed rgba(139, 92, 246, 0.3); border-radius: 50%; }
                .ring-sparkle { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); color: var(--color-soft-gold); }
                .orb-core { width: 100%; height: 100%; background: var(--color-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
                
                .auth-header h1 { font-size: 2.8rem; font-weight: 900; letter-spacing: -3px; line-height: 1; color: white; }
                .auth-header h1 span { color: var(--color-accent); margin-left: 5px; opacity: 0.8; }
                .poetic-welcome { color: var(--color-zinc-400); margin-top: 12px; font-size: 1.15rem; font-weight: 600; }

                .auth-form { display: flex; flex-direction: column; gap: 20px; }
                .field-group { display: flex; flex-direction: column; gap: 8px; }
                .field-group label { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: var(--color-accent); letter-spacing: 3px; padding-left: 5px; opacity: 0.8; }
                input { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 20px 28px; border-radius: 24px; color: white; font-size: 1rem; outline: none; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
                input:focus { border-color: var(--color-accent); background: rgba(139, 92, 246, 0.04); box-shadow: 0 0 30px rgba(139, 92, 246, 0.15); }
                .date-input { color: #71717a; }

                .manifest-btn { background: var(--color-accent); color: white; border: none; padding: 20px; border-radius: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; margin-top: 15px; transition: all 0.4s; font-size: 0.95rem; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3); }
                .manifest-btn:hover:not(:disabled) { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(139, 92, 246, 0.5); }
                .manifest-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .auth-divider { display: flex; align-items: center; gap: 20px; margin: 40px 0; }
                .auth-divider .line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
                .auth-divider span { font-size: 0.7rem; font-weight: 900; color: #3f3f46; letter-spacing: 3px; }

                .google-jewel-btn { background: rgba(255,255,255,0.03); color: white; border: 1px solid rgba(255,255,255,0.08); padding: 18px; border-radius: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 15px; transition: all 0.4s; }
                .google-jewel-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }

                .creator-trust { margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
                .avatar-cluster { display: flex; align-items: center; justify-content: center; }
                .mini-orb { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #09090b; background: #27272a; margin-right: -12px; }
                .mini-orb:nth-child(2) { background: #3f3f46; }
                .mini-orb:nth-child(3) { background: #52525b; }
                .mini-plus { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #09090b; background: var(--color-accent); color: white; font-size: 0.65rem; font-weight: 900; display: flex; align-items: center; justify-content: center; z-index: 5; }
                .creator-trust span { font-size: 0.8rem; color: var(--color-zinc-400); font-weight: 800; letter-spacing: 1px; }

                .auth-footer { text-align: center; margin-top: 40px; color: #52525b; font-size: 1.1rem; font-weight: 600; }
                .auth-footer button { background: transparent; border: none; color: var(--color-accent); font-weight: 900; cursor: pointer; margin-left: 8px; text-decoration: underline; text-underline-offset: 6px; font-size: 1.1rem; transition: all 0.3s; }
                .auth-footer button:hover { color: var(--color-dream-purple); }

                .spin { animation: spin 2s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
