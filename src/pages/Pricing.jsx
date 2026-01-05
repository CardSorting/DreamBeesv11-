import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

export default function Pricing() {
    const { currentUser } = useAuth();
    const [userTier, setUserTier] = useState('free');
    const [loading, setLoading] = useState(false);
    const functions = getFunctions();
    const db = getFirestore();

    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.subscriptionStatus === 'active') {
                    setUserTier('pro');
                } else {
                    setUserTier('free');
                }
            }
        });
        return () => unsub();
    }, [currentUser, db]);

    const handleSubscribe = async (priceId, mode = 'subscription') => {
        if (!currentUser) {
            toast.error("Please log in to upgrade.");
            return;
        }
        setLoading(true);
        try {
            const createStripeCheckout = httpsCallable(functions, 'createStripeCheckout');
            const result = await createStripeCheckout({
                priceId: priceId,
                successUrl: window.location.origin + '/generator?success=true',
                cancelUrl: window.location.origin + '/pricing?canceled=true',
                mode: mode
            });
            window.location.href = result.data.url;
        } catch (error) {
            console.error("Error creating checkout session:", error);
            toast.error("Failed to start checkout. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '160px', paddingBottom: '120px' }}>
            <SEO
                title="Pricing"
                description="Choose the perfect plan for your creative needs. DreamBeesAI offers flexible pricing options for hobbyists and professionals."
            />

            <div style={{ maxWidth: '800px', margin: '0 auto 120px', textAlign: 'center' }}>
                <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', marginBottom: '32px', color: 'white' }}>
                    Unlock your <br /> full potential.
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                    Select the plan that aligns with your creative velocity. <br />
                    Transparent pricing, no hidden limits.
                </p>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px' }}>

                {/* Free Plan */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '500', color: 'white', marginBottom: '8px' }}>Free</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>For exploration and hobbies.</p>
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '32px', color: 'white' }}>
                        $0
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                        <FeatureItem text="5 Credits Daily" />
                        <FeatureItem text="Standard Generation Speed" />
                        <FeatureItem text="Base Models Only" />
                        <FeatureItem text="Private Gallery" />
                        <FeatureItem text="Personal License" muted />
                    </div>
                    <button className="btn btn-outline" style={{ width: '100%' }} disabled>
                        Included
                    </button>
                </div>

                {/* Pro Plan */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '24px', borderBottom: '1px solid white', paddingBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '500', color: 'white', marginBottom: '8px' }}>Pro Membership</h3>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'white', color: 'black', padding: '4px 12px', borderRadius: '99px' }}>Recommended</span>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)' }}>For professionals and power users.</p>
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '32px', color: 'white' }}>
                        $10 <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/ mo</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                        <FeatureItem text="Unlimited Generations" highlight />
                        <FeatureItem text="Priority GPU Access" highlight />
                        <FeatureItem text="Advanced Models (Flux Pro)" highlight />
                        <FeatureItem text="Commercial License" highlight />
                        <FeatureItem text="Priority You.com Support" />
                    </div>

                    {userTier === 'pro' ? (
                        <button className="btn btn-outline" style={{ width: '100%', borderColor: 'white', color: 'white' }} disabled>
                            Active Membership
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => handleSubscribe('price_1SlZ0TIA2zQnWbn5xLtW3auh', 'payment')}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Upgrade Now'}
                        </button>
                    )}
                </div>

            </div>

            {/* Credit Packs Section */}
            <div style={{ marginTop: '120px', maxWidth: '1000px', margin: '120px auto 0', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700', color: 'white', marginBottom: '16px' }}>
                    Refill your creativity.
                </h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '60px', fontSize: '1.1rem' }}>
                    Pay as you go with one-time credit packs. No subscription required.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                    {/* Starter Pack */}
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Starter Pack</h3>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                            $4.99
                        </div>
                        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', display: 'inline-block', textAlign: 'center' }}>
                            <span style={{ color: 'var(--color-accent-primary)', fontWeight: '600' }}>100 Credits</span>
                        </div>
                        <div style={{ flex: 1 }}></div>
                        <button
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                            onClick={() => handleSubscribe('price_1SmMWqIA2zQnWbn58u3TzNWC', 'payment')}
                            disabled={loading}
                        >
                            Buy Now
                        </button>
                    </div>

                    {/* Pro Pack */}
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-accent-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Pro Pack</h3>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--color-accent-primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', height: 'fit-content' }}>Popular</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                            $19.99
                        </div>
                        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', display: 'inline-block', textAlign: 'center' }}>
                            <span style={{ color: 'var(--color-accent-primary)', fontWeight: '600' }}>500 Credits</span>
                        </div>
                        <div style={{ flex: 1 }}></div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => handleSubscribe('price_1SmMWqIA2zQnWbn5gj16f4Rx', 'payment')}
                            disabled={loading}
                        >
                            Buy Now
                        </button>
                    </div>

                    {/* Studio Pack */}
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>Studio Pack</h3>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                            $49.99
                        </div>
                        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', display: 'inline-block', textAlign: 'center' }}>
                            <span style={{ color: 'var(--color-accent-primary)', fontWeight: '600' }}>1500 Credits</span>
                        </div>
                        <div style={{ flex: 1 }}></div>
                        <button
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                            onClick={() => handleSubscribe('price_1SmMWqIA2zQnWbn5ogGzTmcc', 'payment')}
                            disabled={loading}
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text, highlight, muted }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: muted ? 'var(--color-text-dim)' : (highlight ? 'white' : 'var(--color-text-muted)') }}>
            <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                <Check size={18} color={highlight ? 'white' : 'currentColor'} />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: highlight ? '600' : '400' }}>{text}</span>
        </div>
    )
}
