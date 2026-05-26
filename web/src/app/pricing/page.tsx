'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

type Plan = {
  name: string;
  price: string;
  tierKey: 'free' | 'pro' | 'architect';
  tagline: string;
  features: string[];
  cta: string;
  popular: boolean;
  color: string;
  priceId?: string;
};

const plans: Plan[] = [
  {
    name: 'Dreamer',
    price: '0',
    tierKey: 'free',
    tagline: 'Explore at your pace',
    features: ['10 daily generations', 'Standard speed', 'Public gallery'],
    cta: 'Start free',
    popular: false,
    color: 'rgba(255, 255, 255, 0.08)',
  },
  {
    name: 'Alchemist',
    price: '29',
    tierKey: 'pro',
    tagline: 'For daily creators',
    features: ['Unlimited generations', 'Turbo speed', 'Private studio', 'Flux Pro models'],
    cta: 'Upgrade',
    popular: true,
    color: 'rgba(139, 92, 246, 0.18)',
    priceId: 'price_alchemist_pro',
  },
  {
    name: 'Architect',
    price: '99',
    tierKey: 'architect',
    tagline: 'Teams and scale',
    features: ['Everything in Alchemist', 'API access', 'Commercial license', 'Dedicated GPU'],
    cta: 'Scale up',
    popular: false,
    color: 'rgba(251, 191, 36, 0.15)',
    priceId: 'price_architect_pro',
  },
];

function displayName(user: { displayName?: string | null; email?: string | null } | null) {
  if (!user) return null;
  if (user.displayName) return user.displayName.split(' ')[0];
  if (user.email) return user.email.split('@')[0];
  return null;
}

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const currentTier = userData?.tier || 'free';
  const firstName = displayName(user);

  React.useEffect(() => {
    const canceled = new URLSearchParams(window.location.search).get('canceled') === 'true';
    if (canceled) toast.error('Checkout canceled — your plan is unchanged.');
  }, []);

  const handleCheckout = async (plan: Plan) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (plan.price === '0') {
      router.push('/dashboard');
      return;
    }

    if (plan.tierKey === currentTier) {
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
        mode: 'subscription',
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

  const planCta = (plan: Plan) => {
    if (plan.tierKey === currentTier) return 'Current plan';
    if (plan.price === '0' && currentTier !== 'free') return 'Included';
    if (!user) return plan.cta;
    if (currentTier === 'free' && plan.tierKey === 'pro') return 'Upgrade to Alchemist';
    if (currentTier === 'pro' && plan.tierKey === 'architect') return 'Upgrade to Architect';
    if (currentTier === 'architect' && plan.tierKey !== 'architect') return 'Contact support';
    return plan.cta;
  };

  const headline = firstName
    ? `${firstName}, pick what fits your workflow`
    : 'Plans built for how you create';

  const subcopy = user
    ? `You're on ${plans.find((p) => p.tierKey === currentTier)?.name ?? 'Dreamer'}. Change anytime — billed securely via Stripe.`
    : 'Start free, upgrade when you need more speed and privacy.';

  return (
    <div className="min-h-screen bg-[#070708] text-white font-[family-name:var(--font-outfit)] relative overflow-hidden flex flex-col">
      <div className="fixed top-[-200px] left-[50%] translate-x-[-50%] w-[600px] h-[400px] rounded-full bg-[rgba(139,92,246,0.10)] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-180px] w-[400px] h-[400px] rounded-full bg-[rgba(251,191,36,0.08)] blur-[120px] pointer-events-none" />

      <SiteHeader />

      <main className="flex-1 relative z-10 pt-28 pb-12 px-5 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-200 text-xs font-bold mb-4"
          >
            <Sparkles size={14} /> {user ? 'Your studio plans' : 'Simple pricing'}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-black tracking-tight mb-3"
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-sm md:text-base max-w-md mx-auto leading-relaxed"
          >
            {subcopy}
          </motion.p>
          {user && !loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-xs font-bold text-purple-300/90 uppercase tracking-widest"
            >
              Signed in as {user.email}
            </motion.p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {plans.map((plan, index) => {
            const isCurrent = plan.tierKey === currentTier;
            const cta = planCta(plan);
            const disabled = loadingPlan !== null || isCurrent || (currentTier === 'architect' && plan.tierKey !== 'architect');

            return (
              <motion.article
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.06 }}
                className={`relative p-5 md:p-6 rounded-3xl border flex flex-col ${
                  isCurrent
                    ? 'border-amber-500/40 ring-1 ring-amber-500/30'
                    : plan.popular
                      ? 'border-purple-500/40 ring-1 ring-purple-500/30'
                      : 'border-white/10'
                } bg-white/[0.04] backdrop-blur-xl`}
                style={{ background: `linear-gradient(160deg, ${plan.color}, transparent 70%)` }}
              >
                {plan.popular && !isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                    Recommended
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-full">
                    Your plan
                  </span>
                )}

                <div className="mb-4">
                  <h2 className="text-lg font-black">{plan.name}</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">{plan.tagline}</p>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-black">${plan.price}</span>
                  {plan.price !== '0' && <span className="text-zinc-500 text-xs font-bold ml-1">/mo</span>}
                </div>

                <ul className="flex-1 mb-5 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                      <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-amber-400" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleCheckout(plan)}
                  disabled={disabled}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    plan.popular && !isCurrent
                      ? 'bg-purple-500 hover:bg-purple-400 text-white'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {loadingPlan === plan.name ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      {cta}
                      {!isCurrent && <ArrowRight size={14} />}
                    </>
                  )}
                </button>
              </motion.article>
            );
          })}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-zinc-500 text-xs font-medium">
          <Shield size={14} className="text-amber-500/80 shrink-0" />
          Payments encrypted and processed by Stripe.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
