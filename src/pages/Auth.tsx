import React, { useState, useEffect } from 'react';
import { useLite } from '../contexts/LiteContext';
import { useNavigate } from 'react-router-dom';
import { IconLoader } from '../icons';

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
        <div className="lite-auth fade-in">
            <div className="auth-card glass">
                <header>
                    <h1>DreamBees<span>LITE</span></h1>
                    <p>{isLogin ? 'Access your studio' : 'Start your journey'}</p>
                </header>

                <form onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                    />
                    {!isLogin && (
                        <input 
                            type="date" 
                            required 
                            value={birthday} 
                            onChange={e => setBirthday(e.target.value)} 
                            className="date-input"
                        />
                    )}
                    
                    <button type="submit" disabled={loading} className="main-btn">
                        {loading ? <IconLoader size={20} /> : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="divider"><span>OR</span></div>

                <button 
                    type="button" 
                    className="google-btn" 
                    onClick={() => loginWithGoogle()}
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <p className="toggle-text">
                    {isLogin ? "New here? " : "Joined before? "}
                    <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Create Account' : 'Sign In'}</button>
                </p>
            </div>

            <style>{`
                .lite-auth { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: #000; }
                .auth-card { width: 100%; max-width: 400px; padding: 40px; border-radius: 32px; background: #09090b; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
                header { text-align: center; margin-bottom: 30px; }
                header h1 { font-size: 2rem; font-weight: 900; letter-spacing: -1px; margin: 0; color: white; }
                header h1 span { color: #8b5cf6; margin-left: 5px; }
                header p { color: #71717a; margin-top: 5px; font-size: 0.9rem; }

                form { display: flex; flex-direction: column; gap: 12px; }
                input { background: #18181b; border: 1px solid rgba(255,255,255,0.05); padding: 14px 20px; border-radius: 14px; color: white; font-size: 1rem; outline: none; transition: border-color 0.2s; }
                input:focus { border-color: #8b5cf6; }
                .date-input { color: #71717a; }

                .main-btn { background: #8b5cf6; color: white; border: none; padding: 14px; border-radius: 14px; font-weight: 600; cursor: pointer; margin-top: 10px; transition: transform 0.2s; display: flex; align-items: center; justify-content: center; }
                .main-btn:hover { background: #7c3aed; }
                .main-btn:active { transform: scale(0.98); }

                .divider { display: flex; align-items: center; gap: 15px; margin: 25px 0; color: #3f3f46; font-size: 0.7rem; font-weight: 800; }
                .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #18181b; }

                .google-btn { background: #fff; color: #000; border: none; padding: 12px; border-radius: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.2s; }
                .google-btn:hover { background: #f4f4f5; }

                .toggle-text { text-align: center; margin-top: 25px; color: #71717a; font-size: 0.9rem; }
                .toggle-text button { background: transparent; border: none; color: #8b5cf6; font-weight: 600; cursor: pointer; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
