import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, ArrowRight, Layers, ChevronDown } from 'lucide-react';

export default function Landing() {
    return (
        <div className="landing-page bg-grid" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Hero Section */}
            <section style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '240px 20px 120px',
            }}>
                <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="fade-in">
                        <span style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '99px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            letterSpacing: '0.05em',
                            color: 'var(--color-text-muted)',
                            marginBottom: '40px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <span style={{ color: 'var(--color-accent-primary)', marginRight: '8px' }}>●</span>
                            NEXT GENERATION SYNTHESIS
                        </span>
                    </div>

                    <h1 className="fade-in" style={{
                        fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                        fontWeight: '800',
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        marginBottom: '40px',
                        animationDelay: '0.1s',
                        color: 'white'
                    }}>
                        DREAM <br />
                        <span className="text-gradient-accent">BEES</span>
                    </h1>

                    <p className="fade-in" style={{
                        fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
                        color: 'var(--color-text-muted)',
                        maxWidth: '640px',
                        margin: '0 auto 60px',
                        lineHeight: 1.5,
                        animationDelay: '0.2s',
                        fontWeight: '400'
                    }}>
                        The professional platform for high-performance generative art.
                        Engineered for speed, precision, and boundless creativity.
                    </p>

                    <div className="fade-in" style={{ animationDelay: '0.3s', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/auth" className="btn btn-primary" style={{ height: '56px', padding: '0 40px', fontSize: '1rem' }}>
                            Start Creating
                        </Link>
                        <Link to="/gallery" className="btn btn-outline" style={{ height: '56px', padding: '0 40px', fontSize: '1rem' }}>
                            View Gallery
                        </Link>
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 0.5 }}>
                    <ChevronDown color="var(--color-text-muted)" size={24} />
                </div>
            </section>

            {/* Infinite Marquee */}
            <section style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <div style={{ padding: '80px 0', overflow: 'hidden' }}>
                    <MarqueeImages />
                </div>
            </section>

            {/* Features Grid */}
            <section style={{ padding: '160px 0', background: 'var(--color-bg)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>

                        <FeatureCard
                            icon={Zap}
                            title="Instant Inference"
                            desc="Powered by H100 GPU clusters for sub-second latent diffusion generation. Zero latency, infinite creative flow."
                        />
                        <FeatureCard
                            icon={Layers}
                            title="Professional Control"
                            desc="Precise control over CFG scale, steps, seeds, and advanced negative prompting for exacting requirements."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Enterprise Security"
                            desc="Private galleries, secure storage, and full commercial usage rights for all assets generated on our platform."
                        />

                    </div>
                </div>
            </section>

            {/* Minimal CTA */}
            <section style={{ padding: '160px 0', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '720px' }}>
                    <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '40px', letterSpacing: '-0.04em', lineHeight: 1, fontWeight: '800', color: 'white' }}>
                        Ready to orchestrate <br /> your imagination?
                    </h2>
                    <Link to="/auth" className="btn btn-primary" style={{ padding: '0 48px', height: '64px', fontSize: '1.1rem', borderRadius: 'var(--radius-full)' }}>
                        Get Started Now <ArrowRight size={20} style={{ marginLeft: '12px' }} />
                    </Link>
                </div>
            </section>

        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }) {
    return (
        <div className="glass-panel card-hoverable" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{
                width: '48px', height: '48px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white'
            }}>
                <Icon size={24} />
            </div>
            <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{title}</h3>
                <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
        </div>
    )
}

function MarqueeImages() {
    // Dynamic import of generated assets
    const generatedImages = import.meta.glob('../assets/images/landing/*.png', { eager: true, query: '?url', import: 'default' });
    const generatedImageUrls = Object.values(generatedImages);

    // Fallback if no images generated yet
    const hasGeneratedCallback = generatedImageUrls.length > 0;
    const baseImages = hasGeneratedCallback ? generatedImageUrls : [...Array(8)].map((_, i) => `https://picsum.photos/seed/${i + 1337}/600/400`);

    // Triple the array to ensure smooth seamless loop
    const displayImages = [...baseImages, ...baseImages, ...baseImages];

    return (
        <div style={{
            display: 'flex',
            width: 'max-content',
            gap: '32px'
        }} className="animate-marquee">
            {displayImages.map((src, i) => (
                <div key={i} style={{
                    flex: '0 0 320px',
                    height: '240px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative',
                    filter: 'grayscale(100%) brightness(0.7)',
                    transition: 'all 0.4s ease'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'grayscale(0%) brightness(1)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'grayscale(100%) brightness(0.7)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <img
                        src={src}
                        alt="AI Generated Art"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </div>
            ))}
        </div>
    )
}
