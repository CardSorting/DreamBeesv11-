import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function Landing() {
    return (
        <div className="landing-page" style={{ overflowX: 'hidden' }}>
            {/* Hero Section */}
            <section style={{
                position: 'relative',
                minHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '0 20px',
                overflow: 'hidden'
            }}>
                {/* Background Glows */}
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '20%',
                    width: '500px',
                    height: '500px',
                    background: 'var(--color-primary)',
                    filter: 'blur(150px)',
                    opacity: 0.2,
                    zIndex: 0,
                    borderRadius: '50%'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '20%',
                    width: '500px',
                    height: '500px',
                    background: 'var(--color-secondary)',
                    filter: 'blur(150px)',
                    opacity: 0.15,
                    zIndex: 0,
                    borderRadius: '50%'
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '900px' }}>
                    <div className="fade-in" style={{ animationDelay: '0.1s' }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            borderRadius: '50px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            color: 'var(--color-primary)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '24px'
                        }}>
                            Next Generation AI Art
                        </span>
                    </div>

                    <h1 className="fade-in" style={{
                        fontSize: '4.5rem',
                        fontWeight: '800',
                        lineHeight: 1.1,
                        marginBottom: '24px',
                        background: 'linear-gradient(135deg, white 0%, #a1a1aa 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-2px',
                        animationDelay: '0.2s'
                    }}>
                        Dream it. <span style={{
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Create it.</span>
                    </h1>

                    <p className="fade-in" style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: '40px',
                        maxWidth: '600px',
                        margin: '0 auto 40px',
                        lineHeight: 1.6,
                        animationDelay: '0.3s'
                    }}>
                        Generate stunning, high-fidelity images in seconds with our advanced AI models.
                        Join thousands of creators turning imagination into reality.
                    </p>

                    <div className="fade-in" style={{
                        display: 'flex',
                        gap: '20px',
                        justifyContent: 'center',
                        marginBottom: '60px',
                        animationDelay: '0.4s'
                    }}>
                        <Link to="/auth" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                            <Sparkles size={20} style={{ marginRight: '8px' }} />
                            Start Creating
                        </Link>
                        <Link to="/gallery" className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                            View Gallery
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '100px 0', background: 'rgba(255,255,255,0.02)' }}>
                <div className="container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '30px'
                    }}>
                        <FeatureCard
                            icon={<Zap size={32} color="var(--color-primary)" />}
                            title="Lightning Fast"
                            description="Generate images in seconds. Our optimized infrastructure ensures you never lose your flow state."
                        />
                        <FeatureCard
                            icon={<ImageIcon size={32} color="#ec4899" />}
                            title="High Quality"
                            description="Access state-of-the-art models capable of photorealistic details and artistic styles."
                        />
                        <FeatureCard
                            icon={<Shield size={32} color="#8b5cf6" />}
                            title="Secure & Private"
                            description="Your creations are yours. We respect your privacy and provide a secure environment for your art."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="glass-panel" style={{ padding: '40px', transition: 'transform 0.3s ease' }}>
            <div style={{ marginBottom: '20px' }}>{icon}</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', fontWeight: '700' }}>{title}</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{description}</p>
        </div>
    );
}
