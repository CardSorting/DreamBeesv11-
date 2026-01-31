import React from 'react';
import { Zap, Shield, Image as ImageIcon, Cpu, Share2, Layers } from 'lucide-react';
import SEO from '../components/SEO';

export default function Features() {
    const features = [
        {
            icon: <Zap size={24} />,
            title: "Lightning Fast Generation",
            description: "Generate high-quality images in seconds using our optimized inference infrastructure."
        },
        {
            icon: <ImageIcon size={24} />,
            title: "High Resolution Support",
            description: "Create stunning visuals up to 4k resolution with incredible detail and clarity."
        },
        {
            icon: <Cpu size={24} />,
            title: "Advanced AI Models",
            description: "Access state-of-the-art diffusion models including SDXL, Midjourney-style, and more."
        },
        {
            icon: <Shield size={24} />,
            title: "Secure & Private",
            description: "Your generations are private by default. Enterprise-grade security for your assets."
        },
        {
            icon: <Layers size={24} />,
            title: "Batch Generation",
            description: "Generate multiple variations at once to find the perfect image for your needs."
        },
        {
            icon: <Share2 size={24} />,
            title: "Easy Sharing",
            description: "Share your creations directly to social media or download them in various formats."
        }
    ];

    return (
        <div className="container" style={{ padding: '120px 20px 60px' }}>
            <SEO
                title="Features"
                description="Explore the powerful features of DreamBeesAI, including lightning-fast generation, high-resolution support, and advanced AI models."
                keywords="AI art features, image generation capabilities, SDXL models, fast AI generation, high resolution AI art"
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "ItemList",
                            "name": "DreamBeesAI Features",
                            "description": "Key features of the DreamBeesAI image generation platform",
                            "numberOfItems": 6,
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Lightning Fast Generation" },
                                { "@type": "ListItem", "position": 2, "name": "High Resolution Support" },
                                { "@type": "ListItem", "position": 3, "name": "Advanced AI Models" },
                                { "@type": "ListItem", "position": 4, "name": "Secure & Private" },
                                { "@type": "ListItem", "position": 5, "name": "Batch Generation" },
                                { "@type": "ListItem", "position": 6, "name": "Easy Sharing" }
                            ]
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Features", "item": "https://dreambeesai.com/features" }
                            ]
                        }
                    ]
                }}
            />
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    fontWeight: '800',
                    marginBottom: '20px',
                    background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Powerful Features
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Everything you need to bring your imagination to life.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px'
            }}>
                {features.map((feature) => (
                    <div key={feature.title} className="glass-panel" style={{ padding: '30px', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            color: 'white'
                        }}>
                            {feature.icon}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '12px', color: 'white' }}>
                            {feature.title}
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
