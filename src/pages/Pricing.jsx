import React from 'react';
import { Check } from 'lucide-react';

export default function Pricing() {
    const plans = [
        {
            name: "Starter",
            price: "Free",
            description: "Perfect for exploring AI art generation.",
            features: [
                "100 Daily Credits",
                "Standard Speed",
                "Public Gallery",
                "Standard Resolution",
                "CC BY-NC 4.0 License"
            ],
            highlight: false
        },
        {
            name: "Pro",
            price: "$29",
            period: "/month",
            description: "For creators who need more power.",
            features: [
                "Unlimited Slow Generations",
                "500 Fast Credits / mo",
                "Private Mode",
                "Upscaling Support",
                "Commercial License",
                "Priority Support"
            ],
            highlight: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "Scalable solutions for teams.",
            features: [
                "Custom API Access",
                "Dedicated GPU Instance",
                "SSO Scim",
                "Custom Models",
                "SLA Guarantee",
                "24/7 Account Manager"
            ],
            highlight: false
        }
    ];

    return (
        <div className="container" style={{ padding: '120px 20px 60px' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    fontWeight: '800',
                    marginBottom: '20px',
                    background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Simple Pricing
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Choose the plan that fits your creative needs.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                maxWidth: '1100px',
                margin: '0 auto'
            }}>
                {plans.map((plan, index) => (
                    <div key={index} className="glass-panel" style={{
                        padding: '40px',
                        position: 'relative',
                        border: plan.highlight ? '1px solid var(--color-primary)' : undefined,
                        background: plan.highlight ? 'rgba(139, 92, 246, 0.1)' : undefined
                    }}>
                        {plan.highlight && (
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                MOST POPULAR
                            </div>
                        )}
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '10px', color: 'white' }}>{plan.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '20px' }}>
                            <span style={{ fontSize: '3rem', fontWeight: '800', color: 'white' }}>{plan.price}</span>
                            {plan.period && <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>{plan.period}</span>}
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px' }}>{plan.description}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                            {plan.features.map((feature, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Check size={12} color="var(--color-primary)" />
                                    </div>
                                    <span style={{ color: 'var(--color-text-main)', fontSize: '0.95rem' }}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            background: plan.highlight ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '1rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                            {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
