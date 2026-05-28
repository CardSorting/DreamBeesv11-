'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Redirect to downloads page or dashboard
      router.push('/downloads');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/downloads');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 opacity-40 blur-[100px] pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/20 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[440px] p-12 rounded-[48px] border border-white/10 bg-white/5 backdrop-blur-2xl relative z-10"
      >
        <header className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-amber-500 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={32} fill="white" className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            DreamBees<span className="opacity-50">Web</span>
          </h1>
          <p className="text-zinc-500 font-medium italic">
            {isLogin ? 'Welcome back to the collective.' : 'Join the garden of creation.'}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 pl-4">Identity</label>
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 pl-4">Secret</label>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium text-white"
              required
            />
          </div>

          {error && (
            <div className="text-xs font-semibold text-rose-500 text-center bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-amber-600 font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 cursor-pointer text-white"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'Enter Studio' : 'Begin Journey')}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">Or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mt-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 cursor-pointer text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" className="mr-2">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google Account
        </button>

        <p className="mt-8 text-center text-zinc-500 font-medium">
          {isLogin ? "New to the archive? " : "Already a creator? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-amber-500 font-black hover:underline ml-1 cursor-pointer">
            {isLogin ? 'Join now' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
