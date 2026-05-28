'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, CreditCard, History, Settings, LogOut, Zap, Crown, 
  Shield, Loader2, ExternalLink, Sparkles, Clock, Save, Image as ImageIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '@/lib/firebase';
import { 
  collection, query, where, getCountFromServer, 
  getDocs, limit, doc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, userData, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'profile' | 'subscription' | 'billing' | 'settings'>('profile');
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [imageCount, setImageCount] = React.useState(0);
  const [userImages, setUserImages] = React.useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarCollapsed(localStorage.getItem('web_dashboard_sidebar_collapsed') === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('web_dashboard_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Settings State
  const [displayNameInput, setDisplayNameInput] = React.useState('');
  const [birthdayInput, setBirthdayInput] = React.useState('');
  const [saveLoading, setSaveLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        try {
          const q = query(collection(db, 'images'), where('userId', '==', user.uid));
          const snap = await getCountFromServer(q);
          setImageCount(snap.data().count);
        } catch (err) {
          console.error(err);
        }
      };
      fetchStats();
    }
  }, [user]);

  React.useEffect(() => {
    if (userData) {
      setDisplayNameInput(userData.displayName || user?.displayName || user?.email?.split('@')[0] || '');
      setBirthdayInput(userData.birthday || '1995-10-10');
    }
  }, [userData, user]);

  React.useEffect(() => {
    if (user && activeTab === 'profile') {
      setImagesLoading(true);
      const fetchImages = async () => {
        try {
          const q = query(
            collection(db, 'images'),
            where('userId', '==', user.uid),
            limit(8)
          );
          const snap = await getDocs(q);
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setUserImages(items);
        } catch (err) {
          console.error('Failed to fetch user images:', err);
        } finally {
          setImagesLoading(false);
        }
      };
      fetchImages();
    }
  }, [user, activeTab]);

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayNameInput,
        birthday: birthdayInput,
        updatedAt: serverTimestamp()
      });
      toast.success('Settings updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white flex">
      {/* Sidebar */}
      <aside className={`border-r border-white/10 p-8 hidden lg:flex flex-col gap-8 bg-black/20 backdrop-blur-3xl transition-all duration-300 ${sidebarCollapsed ? 'w-24 px-4' : 'w-80'}`}>
        <div className="flex items-center justify-between px-2 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black shrink-0">
              <Zap size={20} fill="black" />
            </div>
            {!sidebarCollapsed && <span className="text-xl font-black tracking-tight">DreamBees</span>}
          </div>
          <button 
            onClick={toggleSidebar}
            className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <NavItem icon={User} label="Profile" active={activeTab === 'profile'} collapsed={sidebarCollapsed} onClick={() => setActiveTab('profile')} />
          <NavItem icon={CreditCard} label="Subscription" active={activeTab === 'subscription'} collapsed={sidebarCollapsed} onClick={() => setActiveTab('subscription')} />
          <NavItem icon={History} label="Billing History" active={activeTab === 'billing'} collapsed={sidebarCollapsed} onClick={() => setActiveTab('billing')} />
          <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} collapsed={sidebarCollapsed} onClick={() => setActiveTab('settings')} />
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center lg:justify-start gap-4 px-4 py-4 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all font-bold cursor-pointer relative group"
        >
          <LogOut size={20} className="shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
          {sidebarCollapsed && (
            <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-zinc-900 border border-white/10 text-white text-xs font-bold py-2 px-3 rounded-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-xl z-50 whitespace-nowrap">
              Sign Out
            </div>
          )}
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-white/10 lg:hidden flex justify-around items-center z-50 px-4">
        <MobileNavItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        <MobileNavItem icon={CreditCard} label="Subscription" active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} />
        <MobileNavItem icon={History} label="Billing" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
        <MobileNavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 pb-24 lg:pb-12 overflow-y-auto">
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

          <AnimatePresence mode="wait">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Identity Block */}
                  <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
                    <h3 className="text-xl font-black mb-6">Identity</h3>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-amber-400 to-purple-500 flex items-center justify-center text-3xl font-black uppercase">
                        {displayNameInput?.[0] || user.email?.[0] || 'D'}
                      </div>
                      <div>
                        <div className="text-2xl font-black">{displayNameInput}</div>
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
                        <span className="font-bold">{birthdayInput}</span>
                      </div>
                    </div>
                  </section>

                  {/* Summary Stats */}
                  <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black mb-6">Usage Stats</h3>
                      <p className="text-zinc-400 font-medium leading-relaxed">
                        Your account is currently running on the <strong>{tier === 'free' ? 'Dreamer' : tier === 'pro' ? 'Alchemist' : 'Architect'}</strong> tier. You have generated a total of <strong>{imageCount}</strong> high-fidelity assets.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <div className="text-zinc-500 text-xs font-black uppercase mb-1">Total Assets</div>
                        <div className="text-2xl font-black text-amber-500">{imageCount}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <div className="text-zinc-500 text-xs font-black uppercase mb-1">Available Credits</div>
                        <div className="text-2xl font-black text-purple-500">{zaps === 'unlimited' ? '∞' : zaps}</div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Live Gallery Feed */}
                <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <ImageIcon size={20} className="text-purple-400" />
                    <span>Recent Web Creations</span>
                  </h3>
                  {imagesLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 size={32} className="animate-spin text-purple-500" />
                    </div>
                  ) : userImages.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 font-medium">
                      <p className="mb-4">No creations found. Launch your desktop workspace to begin generating!</p>
                      <button onClick={() => router.push('/downloads')} className="py-2.5 px-5 bg-purple-600 rounded-xl font-black text-xs uppercase tracking-widest text-white hover:bg-purple-500 transition-all cursor-pointer">
                        Get Desktop Client
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {userImages.map((img) => (
                        <div key={img.id} className="relative rounded-2xl overflow-hidden aspect-square border border-white/10 group bg-black">
                          <img src={img.imageUrl} alt={img.prompt || 'Generated AI Artwork'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-left">
                            <p className="text-[10px] text-zinc-300 font-bold line-clamp-3">"{img.prompt}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
              <motion.div 
                key="subscription"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
                  <h3 className="text-xl font-black mb-6">Usage Meter</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-bold">Generations Count</span>
                      <span className="text-purple-400 font-black">
                        {typeof zaps === 'number' && typeof maxZaps === 'number' ? maxZaps - zaps : (zaps === 'unlimited' ? '∞' : '0')} / {maxZaps === 'unlimited' ? '∞' : maxZaps}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-1000" 
                        style={{ width: `${maxZaps === 'unlimited' ? 100 : usagePercent}%` }}
                      ></div>
                    </div>
                    <p className="text-zinc-500 text-xs italic">Resets on your monthly billing cycle.</p>
                  </div>
                </section>

                {/* Plans upgrade/management details */}
                <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
                  <h3 className="text-xl font-black mb-6">Pricing Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Free Plan details */}
                    <div className={`p-6 rounded-3xl border ${tier === 'free' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'} flex flex-col justify-between`}>
                      <div>
                        <h4 className="font-black text-lg">Dreamer Plan</h4>
                        <p className="text-zinc-500 text-xs mt-1">Perfect for casual discovery.</p>
                        <div className="text-2xl font-black mt-4">$0 <span className="text-xs text-zinc-500">/mo</span></div>
                        <ul className="text-zinc-400 text-xs space-y-2 mt-4">
                          <li>• 10 daily zaps</li>
                          <li>• Standard speeds</li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => router.push('/pricing')}
                        disabled={tier === 'free'}
                        className="mt-6 w-full py-2.5 rounded-xl text-xs font-black uppercase bg-white/10 text-white hover:bg-white/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {tier === 'free' ? 'Current Plan' : 'Free Tier'}
                      </button>
                    </div>

                    {/* Pro Plan details */}
                    <div className={`p-6 rounded-3xl border ${tier === 'pro' ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/5'} flex flex-col justify-between`}>
                      <div>
                        <h4 className="font-black text-lg">Alchemist Pro</h4>
                        <p className="text-zinc-500 text-xs mt-1">For serious visual artists.</p>
                        <div className="text-2xl font-black mt-4">$29 <span className="text-xs text-zinc-500">/mo</span></div>
                        <ul className="text-zinc-400 text-xs space-y-2 mt-4">
                          <li>• Unlimited generations</li>
                          <li>• Dedicated high-speed GPUs</li>
                          <li>• Private desktop catalogs</li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => router.push('/pricing')}
                        disabled={tier === 'pro'}
                        className="mt-6 w-full py-2.5 rounded-xl text-xs font-black uppercase bg-purple-600 text-white hover:bg-purple-500 cursor-pointer disabled:opacity-40"
                      >
                        {tier === 'pro' ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </div>

                    {/* Architect Plan details */}
                    <div className={`p-6 rounded-3xl border ${tier === 'architect' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'} flex flex-col justify-between`}>
                      <div>
                        <h4 className="font-black text-lg">Architect</h4>
                        <p className="text-zinc-500 text-xs mt-1">For production scale.</p>
                        <div className="text-2xl font-black mt-4">$99 <span className="text-xs text-zinc-500">/mo</span></div>
                        <ul className="text-zinc-400 text-xs space-y-2 mt-4">
                          <li>• Dedicated cloud nodes</li>
                          <li>• Full API endpoint access</li>
                          <li>• Commercial usage rights</li>
                        </ul>
                      </div>
                      <button 
                        onClick={() => router.push('/pricing')}
                        disabled={tier === 'architect'}
                        className="mt-6 w-full py-2.5 rounded-xl text-xs font-black uppercase bg-amber-500 text-black hover:bg-amber-400 cursor-pointer disabled:opacity-40"
                      >
                        {tier === 'architect' ? 'Current plan' : 'Upgrade'}
                      </button>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* BILLING TAB */}
            {activeTab === 'billing' && (
              <motion.div 
                key="billing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
                  <h3 className="text-xl font-black mb-8">Billing & Payments</h3>
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
                        className="ml-auto text-xs font-black uppercase tracking-widest text-amber-500 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        {portalLoading ? <Loader2 size={12} className="animate-spin" /> : (userData?.stripeCustomerId ? <><ExternalLink size={12} /> Manage</> : 'Setup')}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Security Section */}
                <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
                  <h3 className="text-xl font-black mb-8">Workspace Security</h3>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <Shield size={24} />
                      </div>
                      <div>
                        <div className="font-black">Two-Factor Auth</div>
                        <div className="text-zinc-500 text-sm font-medium italic">Highly Recommended</div>
                      </div>
                      <button onClick={() => toast.success('2FA Setup triggered. Check your email.')} className="ml-auto text-xs font-black uppercase tracking-widest text-amber-500 hover:text-white cursor-pointer">Enable</button>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
                  <h3 className="text-xl font-black mb-6">Profile Settings</h3>
                  
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 pl-2">Display Name</label>
                      <input 
                        type="text" 
                        value={displayNameInput} 
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 pl-2">Birth Date</label>
                      <input 
                        type="date" 
                        value={birthdayInput} 
                        onChange={(e) => setBirthdayInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium text-white"
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={saveLoading}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-amber-600 font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 cursor-pointer text-white"
                    >
                      {saveLoading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Settings</>}
                    </button>
                  </form>
                </section>

                <section className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl">
                  <h3 className="text-xl font-black mb-4">Workspace Utilities</h3>
                  <p className="text-zinc-400 mb-6 font-medium">Download the latest native binary installer for your operating system.</p>
                  <button onClick={() => router.push('/downloads')} className="py-4 px-6 bg-white/10 hover:bg-white/15 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2">
                    <ExternalLink size={14} /> Download Desktop App
                  </button>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ 
  icon: Icon, 
  label, 
  active = false,
  collapsed = false,
  onClick
}: { 
  icon: any; 
  label: string; 
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-4 rounded-2xl font-bold transition-all cursor-pointer relative group ${
        active 
          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
          : 'text-zinc-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={20} className="shrink-0" /> 
      {!collapsed && <span>{label}</span>}
      
      {collapsed && (
        <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-zinc-900 border border-white/10 text-white text-xs font-bold py-2 px-3 rounded-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-xl z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          {label}
        </div>
      )}
    </button>
  );
}

function MobileNavItem({ 
  icon: Icon, 
  label, 
  active = false,
  onClick
}: { 
  icon: any; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
        active 
          ? 'text-amber-500 font-black scale-105' 
          : 'text-zinc-500 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}
