'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Dreamer',
    price: '0',
    description: 'Perfect for exploring your vision.',
    features: ['10 daily generations', 'Standard speed', 'Public gallery', 'Basic styles'],
    cta: 'Start Free',
    popular: false,
    color: 'rgba(255, 255, 255, 0.1)'
  },
  {
    name: 'Alchemist',
    price: '29',
    description: 'For dedicated creators and designers.',
    features: ['Unlimited generations', 'Turbo speed boost', 'Private studio', 'Exclusive Flux Pro models', 'Priority support'],
    cta: 'Ascend Now',
    popular: true,
    color: 'rgba(139, 92, 246, 0.2)',
    priceId: 'price_alchemist_pro' // Real Stripe Price ID
  },
  {
    name: 'Architect',
    price: '99',
    description: 'Professional scale and control.',
    features: ['Everything in Alchemist', 'API access', 'Team workspace', 'Commercial license', 'Dedicated GPU'],
    cta: 'Scale Vision',
    popular: false,
    color: 'rgba(251, 191, 36, 0.2)',
    priceId: 'price_architect_pro' // Real Stripe Price ID
  }
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = async (plan: any) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (plan.price === '0') {
      router.push('/dashboard');
      return;
    }

    setLoadingPlan(plan.name);
    try {
      const createStripeCheckout = httpsCallable(functions, 'api');
      const res: any = await createStripeCheckout({
        action: 'createStripeCheckout',
        priceId: plan.priceId,
        successUrl: window.location.origin + '/dashboard?success=true',
        cancelUrl: window.location.origin + '/pricing?canceled=true',
        mode: 'subscription'
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment portal unavailable');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white py-24 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed top-[-260px] left-[50%] translate-x-[-50%] w-[760px] h-[560px] rounded-full bg-[rgba(139,92,246,0.12)] blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-260px] right-[-240px] w-[560px] h-[560px] rounded-full bg-[rgba(251,191,36,0.12)] blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-200 text-sm font-bold mb-6"
          >
            <Sparkles size={16} /> Subscription Plans
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
          >
            Choose your <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-amber-400">creative tier.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-xl max-w-2xl mx-auto"
          >
            Unlock the full potential of DreamBees with a plan that scales with your imagination.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`relative p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col ${plan.popular ? 'ring-2 ring-purple-500/50' : ''}`}
              style={{ background: `linear-gradient(135deg, ${plan.color}, transparent)` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-xs font-black uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-black">${plan.price}</span>
                <span className="text-zinc-500 font-bold ml-2">/ month</span>
              </div>

              <div className="flex-1 mb-8 space-y-4">
                {plan.features.map(feature => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <Check size={12} className="text-purple-400" />
                    </div>
                    <span className="text-zinc-300 text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleCheckout(plan)}
                disabled={loadingPlan !== null}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 ${plan.popular ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/25' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                {loadingPlan === plan.name ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>{plan.cta} <ArrowRight size={16} /></>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 p-12 rounded-[50px] border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Shield size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-black mb-1">Secure Payments</h4>
              <p className="text-zinc-400 font-medium">All transactions are encrypted and processed via Stripe.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-16 bg-white/5 rounded-xl border border-white/10"></div>
            <div className="h-10 w-16 bg-white/5 rounded-xl border border-white/10"></div>
            <div className="h-10 w-16 bg-white/5 rounded-xl border border-white/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
