import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Check, Film, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const CREDIT_PACKS = [
    {
        name: 'Starter Pack',
        credits: 100,
        price: '4.99',
        id: 'price_1SmMWqIA2zQnWbn58u3TzNWC',
        features: ['Access to all models', 'Standard generation speed', 'Private gallery']
    },
    {
        name: 'Pro Pack',
        credits: 500,
        price: '19.99',
        id: 'price_1SmMWqIA2zQnWbn5gj16f4Rx',
        isPopular: true,
        features: ['Access to all models', 'Priority generation speed', 'Private gallery', 'Commercial license']
    },
    {
        name: 'Studio Pack',
        credits: 1500,
        price: '49.99',
        id: 'price_1SmMWqIA2zQnWbn5ogGzTmcc',
        features: ['Access to all models', 'Max generation speed', 'Private gallery', 'Commercial license', 'Priority support']
    }
];

const REEL_PACKS = [
    {
        name: 'Reels Starter',
        reels: 600,
        price: '6.00',
        id: 'price_1Sn17SIA2zQnWbn5MloTdTqZ',
        features: ['~3× 1080p videos (10s)', 'Access to standard video models', 'Private gallery']
    },
    {
        name: 'Reels Creator',
        reels: 1500,
        price: '15.00',
        id: 'price_1Sn17TIA2zQnWbn5ZXOyQbbU',
        isPopular: true,
        features: ['~2× 2K videos (20s) or ~8× 1080p (10s)', 'Access to HD video models', 'Private gallery', 'Commercial license']
    },
    {
        name: 'Reels Pro',
        reels: 3600,
        price: '35.00',
        id: 'price_1Sn17TIA2zQnWbn5d7pa8iB8',
        features: ['~5× 2K videos (20s)', 'Priority generation speed', 'Private gallery', 'Commercial license']
    },
    {
        name: 'Reels Studio',
        reels: 9000,
        price: '85.00',
        id: 'price_1Sn17TIA2zQnWbn5pR1T6V5g',
        features: ['~6× 4K videos (20s)', 'Max generation speed', 'Private gallery', 'Commercial license', 'Priority support']
    }
];

export default function Pricing() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currencyType, setCurrencyType] = useState('credits'); // 'credits' or 'reels'
    const functions = getFunctions();

    const packs = currencyType === 'credits' ? CREDIT_PACKS : REEL_PACKS;

    const handlePurchase = async (priceId) => {
        if (!currentUser) {
            toast.error("Please log in to purchase.");
            return;
        }
        setLoading(true);
        try {
            const createStripeCheckout = httpsCallable(functions, 'createStripeCheckout');
            const result = await createStripeCheckout({
                priceId: priceId,
                successUrl: window.location.origin + '/generator?success=true',
                cancelUrl: window.location.origin + '/pricing?canceled=true',
                mode: 'payment'
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
                description="Purchase Credits for images or Reels for videos. Flexible pay-as-you-go options."
            />

            <div style={{ maxWidth: '800px', margin: '0 auto 60px', textAlign: 'center' }}>
                <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', marginBottom: '32px', color: 'white' }}>
                    Pay as you go.
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                    Purchase <b>Credits</b> for images or <b>Reels</b> for videos.<br />
                    Separate currencies for specialized creative needs.
                </p>
            </div>

            {/* Currency Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setCurrencyType('credits')}
                        className={`btn`}
                        style={{
                            background: currencyType === 'credits' ? 'var(--color-primary)' : 'transparent',
                            color: currencyType === 'credits' ? 'white' : 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: '600'
                        }}
                    >
                        <Image size={18} /> Credits (Images)
                    </button>
                    <button
                        onClick={() => setCurrencyType('reels')}
                        className={`btn`}
                        style={{
                            background: currencyType === 'reels' ? 'var(--color-accent-primary)' : 'transparent',
                            color: currencyType === 'reels' ? 'white' : 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: '600'
                        }}
                    >
                        <Film size={18} /> Reels (Video)
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                {packs.map((pack) => (
                    <div key={pack.id} className="glass-panel" style={{
                        padding: '32px',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        border: pack.isPopular ? `1px solid ${currencyType === 'reels' ? 'var(--color-accent-primary)' : 'var(--color-primary)'}` : '1px solid rgba(255,255,255,0.1)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {pack.isPopular && (
                            <div style={{
                                position: 'absolute', top: 0, right: 0,
                                background: currencyType === 'reels' ? 'var(--color-accent-primary)' : 'var(--color-primary)',
                                color: 'white', padding: '4px 12px', fontSize: '0.75rem', fontWeight: '700', borderBottomLeftRadius: '8px'
                            }}>
                                POPULAR
                            </div>
                        )}

                        <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>{pack.name}</h3>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                            ${pack.price}
                        </div>
                        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', display: 'inline-block', textAlign: 'center' }}>
                            <span style={{ color: currencyType === 'reels' ? 'var(--color-accent-primary)' : 'var(--color-primary)', fontWeight: '600' }}>
                                {pack.credits ? `${pack.credits} Credits` : `${pack.reels} Reels`}
                            </span>
                        </div>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', padding: 0 }}>
                            {pack.features.map((feature, idx) => (
                                <FeatureItem key={idx} text={feature} highlight={pack.isPopular} accentColor={currencyType === 'reels' ? 'var(--color-accent-primary)' : 'var(--color-primary)'} />
                            ))}
                        </ul>
                        <div style={{ flex: 1 }}></div>
                        <button
                            className={pack.isPopular ? "btn btn-primary" : "btn btn-outline"}
                            style={{
                                width: '100%',
                                ...(pack.isPopular && currencyType === 'reels' ? { backgroundColor: 'var(--color-accent-primary)', borderColor: 'var(--color-accent-primary)' } : {})
                            }}
                            onClick={() => handlePurchase(pack.id)}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Buy Now'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Video Pricing Info */}
            {currencyType === 'reels' && (
                <div style={{ marginTop: '80px', maxWidth: '800px', margin: '80px auto 0' }}>
                    <div className="glass-panel" style={{ padding: '40px' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '24px', textAlign: 'center' }}>
                            Video Generation Costs
                        </h3>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
                            Video generation is compute-intensive. Reels are deducted based on resolution and duration.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                            <div>
                                <h4 style={{ color: 'white', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                    Resolution Rates
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
                                        <span>1080p</span> <span style={{ color: 'white' }}>18 Reels / sec</span>
                                    </li>
                                    <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
                                        <span>2K</span> <span style={{ color: 'white' }}>36 Reels / sec</span>
                                    </li>
                                    <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
                                        <span>4K</span> <span style={{ color: 'white' }}>72 Reels / sec</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ color: 'white', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                    Fixed Durations
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
                                        <span>5 seconds</span> <span style={{ color: 'var(--color-text-muted)' }}>(Min)</span>
                                    </li>
                                    <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
                                        <span>20 seconds</span> <span style={{ color: 'var(--color-text-muted)' }}>(Max)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                <strong>Note:</strong> Reels are charged before generation and automatically refunded if generation fails due to a system error.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FeatureItem({ text, highlight, accentColor }) {
    return (
        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: highlight ? 'white' : 'var(--color-text-muted)' }}>
            <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                <Check size={18} color={highlight ? (accentColor || 'var(--color-primary)') : 'currentColor'} />
            </div>
            <span style={{ fontSize: '0.95rem' }}>{text}</span>
        </li>
    )
}
