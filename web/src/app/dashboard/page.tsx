'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, History, Settings, LogOut, Zap, Crown, Shield, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, userData, loading, logout } = useAuth();
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [imageCount, setImageCount] = React.useState(0);
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        const q = query(collection(db, 'images'), where('userId', '==', user.uid));
        const snap = await getCountFromServer(q);
        setImageCount(snap.data().count);
      };
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070708] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return null;
  }

  const tier = userData?.tier || 'free';
  const zaps = userData?.zaps ?? (tier === 'free' ? 10 : 'unlimited');
  const maxZaps = tier === 'free' ? 10 : (tier === 'pro' ? 1000 : 'unlimited');
  const usagePercent = typeof zaps === 'number' && typeof maxZaps === 'number' ? ((maxZaps - zaps) / maxZaps) * 100 : 0;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handlePortal = async () => {
    if (!userData?.stripeCustomerId) {
      router.push('/pricing');
      return;
    }
    setPortalLoading(true);
    try {
      const createPortalSession = httpsCallable(functions, 'api');
      const res: any = await createPortalSession({
        action: 'createStripePortalSession',
        returnUrl: window.location.href
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error('Unable to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/10 p-8 hidden lg:flex flex-col gap-8 bg-black/20 backdrop-blur-3xl">
        <div className="flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black">
            <Zap size={20} fill="black" />
          </div>
          <span className="text-xl font-black tracking-tight">DreamBees</span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <NavItem icon={User} label="Profile" active />
          <NavItem icon={CreditCard} label="Subscription" />
          <NavItem icon={History} label="Billing History" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all font-bold"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Creative Hub</h1>
              <p className="text-zinc-400 font-medium text-lg">Manage your identity and creation power.</p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${tier === 'free' ? 'bg-zinc-700' : 'bg-purple-500'}`}>
                <Crown size={24} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-purple-400">Current Plan</div>
                <div className="text-lg font-black capitalize">{tier} {tier !== 'free' ? 'Pro' : 'Level'}</div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Profile Card */}
            <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black">Identity</h3>
                <button className="text-sm font-black text-amber-500 uppercase tracking-widest">Edit</button>
              </div>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-[32px] bg-linear-to-br from-amber-400 to-purple-500 flex items-center justify-center text-3xl font-black uppercase">
                  {user.email?.[0] || 'D'}
                </div>
                <div>
                  <div className="text-2xl font-black">{user.displayName || user.email?.split('@')[0]}</div>
                  <div className="text-zinc-500 font-medium">{user.email}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-zinc-500 font-bold text-sm uppercase tracking-wider">Member Since</span>
                  <span className="font-bold">May 2026</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-zinc-500 font-bold text-sm uppercase tracking-wider">Birth Date</span>
                  <span className="font-bold">1995-10-10</span>
                </div>
              </div>
            </section>

            {/* Creation Stats */}
            <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
              <h3 className="text-xl font-black mb-8">Usage Meter</h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="font-bold">Monthly Generations</span>
                    <span className="text-purple-400 font-black">
                      {typeof zaps === 'number' && typeof maxZaps === 'number' ? maxZaps - zaps : (zaps === 'unlimited' ? '∞' : '0')} / {maxZaps === 'unlimited' ? '∞' : maxZaps}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-purple-500 to-amber-500 transition-all duration-1000" 
                      style={{ width: `${maxZaps === 'unlimited' ? 100 : usagePercent}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <div className="text-zinc-500 text-xs font-black uppercase mb-1">Saved Assets</div>
                    <div className="text-2xl font-black text-amber-500">{imageCount}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <div className="text-zinc-500 text-xs font-black uppercase mb-1">Status</div>
                    <div className="text-2xl font-black text-purple-500 uppercase text-[10px] tracking-widest">{tier}</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Billing Section */}
          <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
            <h3 className="text-xl font-black mb-8">Billing & Security</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="font-black">{userData?.stripeCustomerId ? 'Stripe Billing Active' : 'No Payment Method'}</div>
                  <div className="text-zinc-500 text-sm font-medium">
                    {tier === 'free' ? 'Upgrade to Alchemist for Pro features' : 'Managed via Stripe Portal'}
                  </div>
                </div>
                <button 
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="ml-auto text-xs font-black uppercase tracking-widest text-amber-500 hover:text-white flex items-center gap-2"
                >
                  {portalLoading ? <Loader2 size={12} className="animate-spin" /> : (userData?.stripeCustomerId ? <><ExternalLink size={12} /> Manage</> : 'Setup')}
                </button>
              </div>
              <div className="flex-1 p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <div className="font-black">Two-Factor Auth</div>
                  <div className="text-zinc-500 text-sm font-medium italic">Highly Recommended</div>
                </div>
                <button className="ml-auto text-xs font-black uppercase tracking-widest text-amber-500">Enable</button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${active ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
      <Icon size={20} /> {label}
    </button>
  );
}
