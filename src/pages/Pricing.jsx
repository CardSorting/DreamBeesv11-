import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { functions as _firebaseFunctions } from '../firebase';
import { useApi } from '../hooks/useApi';
import { Check, Film, Image, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const SUBSCRIPTION_PLANS = [
    {
        name: 'Pro Membership',
        price: '19.99',
        period: '/month',
        id: 'price_1SotWSIA2zQnWbn5y538tBDA',
        features: [
            '∞ Unlimited Standard Generations',
            '⚡ 500 Monthly Zaps (for Turbo)',
            '🚀 Priority Queue Access',
            '🎨 Private Gallery',
            '💼 Commercial License'
        ],
        isPopular: true,
        buttonText: 'Join Pro'
    }
];

const ZAP_PACKS = [
    {
        name: 'Starter Zaps',
        zaps: 50,
        price: '5.00',
        id: 'price_1SotScIA2zQnWbn5fMli7VZY',
        features: ['50 Turbo Images', '100 Standard Images', 'No Expiry']
    },
    {
        name: 'Creator Zaps',
        zaps: 250,
        price: '20.00',
        id: 'price_1SotScIA2zQnWbn5KdlWpyGU',
        features: ['250 Turbo Images', '500 Standard Images', 'No Expiry']
    }
];

const REEL_PACKS = [
    {
        name: 'Reels Starter',
        reels: 600,
        price: '6.00',
        id: 'price_1Sn17SIA2zQnWbn5MloTdTqZ',
        features: ['~5× 1080p videos (10s)', 'Access to standard video models', 'Private gallery']
    },
    {
        name: 'Reels Creator',
        reels: 1500,
        price: '15.00',
        id: 'price_1Sn17TIA2zQnWbn5ZXOyQbbU',
        isPopular: true,
        features: ['~3× 2K videos (20s) or ~12× 1080p (10s)', 'Access to HD video models', 'Private gallery', 'Commercial license']
    },
    {
        name: 'Reels Pro',
        reels: 3600,
        price: '35.00',
        id: 'price_1Sn17TIA2zQnWbn5d7pa8iB8',
        features: ['~7× 2K videos (20s)', 'Priority generation speed', 'Private gallery', 'Commercial license']
    },
    {
        name: 'Reels Studio',
        reels: 9000,
        price: '85.00',
        id: 'price_1Sn17TIA2zQnWbn5pR1T6V5g',
        features: ['~9× 4K videos (20s)', 'Max generation speed', 'Private gallery', 'Commercial license', 'Priority support']
    }
];

export default function Pricing() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currencyType, setCurrencyType] = useState('membership'); // 'membership', 'zaps', 'reels'

    let packs = [];
    if (currencyType === 'membership') packs = SUBSCRIPTION_PLANS;
    else if (currencyType === 'zaps') packs = ZAP_PACKS;
    else packs = REEL_PACKS;

    const { call: apiCall } = useApi();

    const handlePurchase = async (priceId) => {
        if (!currentUser) {
            toast.error("Please log in to purchase.");
            return;
        }
        setLoading(true);
        try {
            const result = await apiCall('api', {
                action: 'createStripeCheckout',
                priceId: priceId,
                successUrl: window.location.origin + '/generator?success=true',
                cancelUrl: window.location.origin + '/pricing?canceled=true',
                mode: currencyType === 'membership' ? 'subscription' : 'payment'
            });
            // eslint-disable-next-line
            window.location.href = result.data.url;
        } catch (error) {
            console.error("Error creating checkout session:", error);
            // toast.error("Failed to start checkout. Please try again."); // Handled by useApi
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '160px', paddingBottom: '120px' }}>
            <SEO
                title="Pricing"
                description="Get started with AI image generation. Flexible credit packs from $5 or unlimited Pro membership for $19.99/month. No subscription required."
                keywords="AI art pricing, image generation credits, AI image generator cost, text to image subscription, cheap AI art"
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Product",
                            "name": "DreamBeesAI Pro Membership",
                            "description": "Unlimited AI image generation with 500 monthly Turbo credits, priority queue, and commercial license.",
                            "offers": {
                                "@type": "Offer",
                                "price": "19.99",
                                "priceCurrency": "USD",
                                "availability": "https://schema.org/InStock",
                                "priceValidUntil": "2027-12-31"
                            }
                        },
                        {
                            "@type": "Product",
                            "name": "DreamBeesAI Starter Zaps",
                            "description": "50 Turbo image generation credits with no expiry.",
                            "offers": {
                                "@type": "Offer",
                                "price": "5.00",
                                "priceCurrency": "USD",
                                "availability": "https://schema.org/InStock"
                            }
                        },
                        {
                            "@type": "Product",
                            "name": "DreamBeesAI Creator Zaps",
                            "description": "250 Turbo image generation credits with no expiry.",
                            "offers": {
                                "@type": "Offer",
                                "price": "20.00",
                                "priceCurrency": "USD",
                                "availability": "https://schema.org/InStock"
                            }
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Pricing", "item": "https://dreambeesai.com/pricing" }
                            ]
                        }
                    ]
                }}
            />

            <div style={{ maxWidth: '800px', margin: '0 auto 60px', textAlign: 'center' }}>
                <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1', marginBottom: '32px', color: 'white' }}>
                    Create without limits.
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', lineHeight: '1.6', mb: '1rem' }}>
                    Join <b>Pro</b> for unlimited generation or buy <b>Zaps ⚡</b> for on-demand power.
                </p>
            </div>

            {/* Currency Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setCurrencyType('membership')}
                        className={`btn`}
                        style={{
                            background: currencyType === 'membership' ? 'var(--color-primary)' : 'transparent',
                            color: currencyType === 'membership' ? 'white' : 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', border: 'none'
                        }}
                    >
                        <Zap size={18} fill={currencyType === 'membership' ? 'currentColor' : 'none'} /> Pro
                    </button>
                    <button
                        onClick={() => setCurrencyType('zaps')}
                        className={`btn`}
                        style={{
                            background: currencyType === 'zaps' ? 'var(--color-accent-secondary, #f59e0b)' : 'transparent',
                            color: currencyType === 'zaps' ? 'black' : 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', border: 'none'
                        }}
                    >
                        <Zap size={18} /> Zaps
                    </button>
                    <button
                        onClick={() => setCurrencyType('reels')}
                        className={`btn`}
                        style={{
                            background: currencyType === 'reels' ? 'var(--color-accent-purple, #8b5cf6)' : 'transparent',
                            color: currencyType === 'reels' ? 'white' : 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', border: 'none'
                        }}
                    >
                        <Film size={18} /> Reels
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
                        overflow: 'hidden',
                        background: pack.isPopular && currencyType === 'membership' ? 'linear-gradient(145deg, rgba(var(--color-primary-rgb), 0.1) 0%, rgba(0,0,0,0) 100%)' : undefined
                    }}>
                        {pack.isPopular && (
                            <div style={{
                                position: 'absolute', top: 0, right: 0,
                                background: currencyType === 'reels' ? 'var(--color-accent-primary)' : 'var(--color-primary)',
                                color: 'white', padding: '4px 12px', fontSize: '0.75rem', fontWeight: '700', borderBottomLeftRadius: '8px'
                            }}>
                                {currencyType === 'membership' ? 'BEST VALUE' : 'POPULAR'}
                            </div>
                        )}

                        <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px' }}>{pack.name}</h3>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                            ${pack.price} {pack.period && <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>{pack.period}</span>}
                        </div>

                        <div style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
                            {/* Descriptive text based on type */}
                            {currencyType === 'zaps' && <span>⚡ {pack.zaps} Zaps incl.</span>}
                            {currencyType === 'reels' && <span>🎞️ {pack.reels} Reels incl.</span>}
                            {currencyType === 'membership' && <span>Everything you need to create.</span>}
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
                            {loading ? 'Processing...' : (pack.buttonText || 'Buy Now')}
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
                                        <span>1080p</span> <span style={{ color: 'white' }}>12 Reels / sec</span>
                                    </li>
                                    <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
                                        <span>2K</span> <span style={{ color: 'white' }}>26 Reels / sec</span>
                                    </li>
                                    <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
                                        <span>4K</span> <span style={{ color: 'white' }}>50 Reels / sec</span>
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
