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

    const containerVariants = {
        hidden: { opacity: 0, y: 40, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
                duration: 0.8, 
                ease: [0.23, 1, 0.32, 1],
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="lite-auth-immersive">
            {/* Dynamic Mesh Background */}
            <div className="mesh-gradient-container">
                <motion.div 
                    animate={{ 
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="mesh-ball mesh-1"
                ></motion.div>
                <motion.div 
                    animate={{ 
                        x: [0, -80, 0],
                        y: [0, 60, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="mesh-ball mesh-2"
                ></motion.div>
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="mesh-ball mesh-3"
                ></motion.div>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="auth-jewel-card glass-immersive"
            >
                <header className="auth-header">
                    <motion.div variants={itemVariants} className="brand-orb-visual">
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
                    </motion.div>
                    <motion.h1 variants={itemVariants} className="text-jeweled">
                        DreamBees<span>Lite</span>
                    </motion.h1>
                    <motion.p variants={itemVariants} className="poetic-welcome">
                        {isLogin ? 'Reawaken your latent vision.' : 'Step into the garden of creation.'}
                    </motion.p>
                </header>

                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="auth-form">
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
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 15 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="field-group overflow-hidden"
                            >
                                <label>Date of Awakening</label>
                                <div className="date-input-wrapper">
                                    <input 
                                        type="date" 
                                        required 
                                        value={birthday} 
                                        onChange={e => setBirthday(e.target.value)} 
                                        className="date-input"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <button type="submit" disabled={loading} className="manifest-btn clickable">
                        {loading ? <IconLoader size={20} className="spin" /> : (isLogin ? 'Enter Studio' : 'Begin Journey')}
                    </button>
                </motion.form>

                <motion.div variants={itemVariants} className="auth-divider">
                    <div className="line"></div>
                    <span>SECURE ACCESS</span>
                    <div className="line"></div>
                </motion.div>

                <motion.button 
                    variants={itemVariants}
                    type="button" 
                    className="google-jewel-btn clickable" 
                    onClick={() => loginWithGoogle()}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Continue with Google</span>
                </motion.button>

                <motion.div variants={itemVariants} className="creator-trust">
                    <div className="avatar-cluster">
                        <div className="mini-orb orb-gold"></div>
                        <div className="mini-orb orb-purple"></div>
                        <div className="mini-orb orb-amber"></div>
                        <div className="mini-plus">+12k</div>
                    </div>
                    <span>The collective is waiting for you</span>
                </motion.div>

                <motion.p variants={itemVariants} className="auth-footer">
                    {isLogin ? "New to the archive? " : "Already a creator? "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="toggle-auth-mode">
                        {isLogin ? 'Join now' : 'Sign in'}
                    </button>
                </motion.p>
            </motion.div>

            <style>{`
                .lite-auth-immersive { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; background: #060608; position: relative; overflow: hidden; }
                
                .mesh-gradient-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.4; filter: blur(40px); }
                .mesh-ball { position: absolute; border-radius: 50%; filter: blur(100px); }
                .mesh-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 70%); top: -100px; right: -100px; }
                .mesh-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(245, 158, 11, 0.2), transparent 70%); bottom: -100px; left: -100px; }
                .mesh-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent 70%); top: 40%; left: 20%; }
                
                .auth-jewel-card { width: 100%; max-width: 440px; padding: 48px; border-radius: 48px; position: relative; z-index: 10; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }
                
                .auth-header { text-align: center; margin-bottom: 40px; }
                .brand-orb-visual { position: relative; width: 72px; height: 72px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; }
                .orb-ring { position: absolute; inset: -10px; border: 1px dashed rgba(139, 92, 246, 0.3); border-radius: 50%; }
                .ring-sparkle { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); color: var(--color-soft-gold); filter: drop-shadow(0 0 8px var(--color-soft-gold)); }
                .orb-core { width: 100%; height: 100%; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
                
                .auth-header h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -2px; margin-bottom: 8px; }
                .auth-header h1 span { opacity: 0.5; margin-left: 2px; }
                .poetic-welcome { color: var(--color-zinc-400); font-size: 1rem; font-weight: 500; opacity: 0.8; }

                .auth-form { display: flex; flex-direction: column; gap: 20px; }
                .field-group { display: flex; flex-direction: column; gap: 8px; }
                .field-group label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--color-accent); letter-spacing: 1.5px; padding-left: 4px; }
                
                input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 18px 24px; border-radius: 24px; color: white; font-size: 1rem; outline: none; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); width: 100%; }
                input:focus { border-color: var(--color-accent); background: rgba(139, 92, 246, 0.05); box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
                input::placeholder { color: rgba(255,255,255,0.2); }
                
                .date-input-wrapper { position: relative; }
                .date-input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.3; cursor: pointer; }

                .manifest-btn { background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); color: white; border: none; padding: 18px; border-radius: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px; font-size: 0.9rem; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); }
                .manifest-btn:disabled { opacity: 0.6; transform: none !important; box-shadow: none; }

                .auth-divider { display: flex; align-items: center; gap: 20px; margin: 32px 0; }
                .auth-divider .line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
                .auth-divider span { font-size: 0.65rem; font-weight: 800; color: var(--color-zinc-500); letter-spacing: 2.5px; white-space: nowrap; }

                .google-jewel-btn { background: rgba(255,255,255,0.04); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 24px; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 14px; width: 100%; }
                
                .creator-trust { margin-top: 40px; text-align: center; }
                .avatar-cluster { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
                .mini-orb { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0c0c0e; margin-right: -12px; transition: transform 0.3s; }
                .mini-orb:hover { transform: translateY(-4px) scale(1.1); z-index: 10; }
                .orb-gold { background: var(--color-soft-gold); }
                .orb-purple { background: var(--color-dream-purple); }
                .orb-amber { background: var(--color-warm-amber); }
                .mini-plus { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0c0c0e; background: var(--color-accent); color: white; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; justify-content: center; z-index: 5; }
                .creator-trust span { font-size: 0.85rem; color: var(--color-zinc-500); font-weight: 600; letter-spacing: 0.5px; }

                .auth-footer { text-align: center; margin-top: 40px; color: var(--color-zinc-500); font-size: 1rem; font-weight: 500; }
                .toggle-auth-mode { background: transparent; border: none; color: var(--color-accent); font-weight: 700; cursor: pointer; margin-left: 8px; text-decoration: none; position: relative; }
                .toggle-auth-mode::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 1px; background: currentColor; transform: scaleX(0); transition: transform 0.3s; transform-origin: right; }
                .toggle-auth-mode:hover::after { transform: scaleX(1); transform-origin: left; }

                .spin { animation: spin 2s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
