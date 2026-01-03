import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { Check, Zap, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Pricing() {
    const { currentUser } = useAuth();
    const [userTier, setUserTier] = useState('free');
    const [loading, setLoading] = useState(false);
    const functions = getFunctions();
    const db = getFirestore();
    // Fetch user tier on load
    useEffect(() => {
        if (currentUser) {
            // We can listen to the realtime updates if we want, or just check once.
            // Since subscription status is in public claims or user doc, let's assume we check the doc or claims.
            // For simplicity, we can rely on the fact that App.jsx or context might have it, but here we'll just use a quick check 
            // or rely on what we know. A better way is to pass it from context or fetch it.
            // Let's assume we use a quick fetch or context if available. 
            // Actually, we can just use the state from Generator logic or similar.
            // Let's replicate the snapshot listener for accurate status, or just fetching once.
            // Fetching once is safer for 'status' pages.
        }
    }, [currentUser]);

    // Use a listener actually, to be reactive
    // Listen to subscription status
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


    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const createStripePortalSession = httpsCallable(functions, 'createStripePortalSession');
            const result = await createStripePortalSession({
                returnUrl: window.location.href
            });
            window.location.href = result.data.url;
        } catch (error) {
            console.error("Error opening portal:", error);
            toast.error("Failed to open subscription settings.");
            setLoading(false);
        }
    };

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
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', backgroundImage: 'linear-gradient(to right, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Choose Your Plan
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
                    Unlock full creative power with DreamBees Pro
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>

                {/* Free Tier */}
                <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px' }}>Starter</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>
                        Free
                        <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}> / forever</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', flex: 1 }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Check size={20} color="#4ade80" />
                            <span>5 daily credits (resets every 24h)</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Check size={20} color="#4ade80" />
                            <span>Standard generation speed</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Check size={20} color="#4ade80" />
                            <span>Access to base models</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Check size={20} color="#4ade80" />
                            <span>Personal gallery</span>
                        </li>
                    </ul>

                    <button className="btn btn-outline" style={{ width: '100%' }} disabled>
                        {userTier === 'free' ? 'Current Plan' : 'Included'}
                    </button>
                </div>

                {/* Pro Tier */}
                <div className="glass-panel" style={{
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: '1px solid var(--color-primary)',
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-primary)',
                        padding: '4px 16px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Recommended
                    </div>

                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Pro <Crown size={20} color="#fbbf24" fill="#fbbf24" />
                    </h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>
                        $10
                        <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}> / 30 days</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', flex: 1 }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Check size={20} color="#4ade80" />
                            <span><strong>Unlimited</strong> generations*</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Zap size={20} color="#fbbf24" />
                            <span><strong>Priority</strong> processing (skip queue)</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Check size={20} color="#4ade80" />
                            <span>Access to <strong>Premium Models</strong></span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Check size={20} color="#4ade80" />
                            <span>Commercial usage rights</span>
                        </li>
                    </ul>

                    {userTier === 'pro' ? (
                        <button
                            className="btn btn-outline"
                            style={{ width: '100%', borderColor: 'var(--color-primary)', color: 'white' }}
                            onClick={() => { }} // No portal for one-time payments usually, or just billing history
                            disabled={true} // Disable for now as portal logic was for subs
                        >
                            Active - Expires in 30 days
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => handleSubscribe('price_1SlZ0TIA2zQnWbn5xLtW3auh', 'payment')}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Buy 30 Days Access'}
                        </button>
                    )}
                    <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        One-time payment. No auto-renewal.
                    </p>
                </div>

            </div>
        </div>
    );
}
