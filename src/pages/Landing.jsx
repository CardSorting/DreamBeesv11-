import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, Image as ImageIcon, ArrowRight, Wand2, Download, Share2 } from 'lucide-react';

export default function Landing() {
    return (
        <div className="landing-page" style={{ overflowX: 'hidden' }}>
            {/* Hero Section */}
            <section style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '120px 20px 60px',
                overflow: 'hidden'
            }}>
                {/* Background Effects */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, var(--color-bg) 100%), radial-gradient(circle at 50% 50%, rgba(24, 24, 27, 0) 0%, var(--color-bg) 100%)',
                    zIndex: 0
                }} />

                {/* Animated Orbs */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '15%',
                    width: '300px',
                    height: '300px',
                    background: 'var(--color-primary)',
                    filter: 'blur(120px)',
                    opacity: 0.2,
                    zIndex: 0,
                    borderRadius: '50%',
                    animation: 'pulseFast 4s ease-in-out infinite alternate'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '15%',
                    width: '400px',
                    height: '400px',
                    background: 'var(--color-secondary)',
                    filter: 'blur(120px)',
                    opacity: 0.15,
                    zIndex: 0,
                    borderRadius: '50%',
                    animation: 'pulseFast 5s ease-in-out infinite alternate-reverse'
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '900px' }}>
                    <div className="fade-in" style={{ animationDelay: '0.1s' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '50px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            color: 'var(--color-primary)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '32px',
                            boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)'
                        }}>
                            <Sparkles size={16} />
                            <span>Next Generation AI Art</span>
                        </span>
                    </div>

                    <h1 className="fade-in" style={{
                        fontSize: 'clamp(3rem, 8vw, 5rem)',
                        fontWeight: '800',
                        lineHeight: 1.1,
                        marginBottom: '32px',
                        letterSpacing: '-2px',
                        animationDelay: '0.2s'
                    }}>
                        Dream it. <br />
                        <span style={{
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.3))'
                        }}>Create it.</span>
                    </h1>

                    <p className="fade-in" style={{
                        fontSize: 'clamp(1.1rem, 4vw, 1.25rem)',
                        color: 'var(--color-text-muted)',
                        marginBottom: '48px',
                        maxWidth: '600px',
                        margin: '0 auto 48px',
                        lineHeight: 1.6,
                        animationDelay: '0.3s'
                    }}>
                        Transform your imagination into reality with our state-of-the-art AI.
                        Create stunning, high-fidelity images in seconds.
                    </p>

                    <div className="fade-in" style={{
                        display: 'flex',
                        gap: '20px',
                        justifyContent: 'center',
                        marginBottom: '80px',
                        animationDelay: '0.4s',
                        flexWrap: 'wrap'
                    }}>
                        <Link to="/auth" className="btn btn-primary" style={{
                            padding: '16px 40px',
                            fontSize: '1.1rem',
                            borderRadius: '50px'
                        }}>
                            <Sparkles size={20} style={{ marginRight: '8px' }} />
                            Start Creating Free
                        </Link>
                        <Link to="/gallery" className="btn btn-outline" style={{
                            padding: '16px 40px',
                            fontSize: '1.1rem',
                            borderRadius: '50px',
                            background: 'rgba(255,255,255,0.02)'
                        }}>
                            Explore Gallery
                        </Link>
                    </div>
                </div>
            </section>

            {/* Marquee Showcase */}
            <section style={{
                padding: '60px 0',
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: '100px',
                    background: 'linear-gradient(to right, var(--color-bg), transparent)',
                    zIndex: 2,
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute',
                    right: 0, top: 0, bottom: 0,
                    width: '100px',
                    background: 'linear-gradient(to left, var(--color-bg), transparent)',
                    zIndex: 2,
                    pointerEvents: 'none'
                }} />

                <div style={{
                    display: 'flex',
                    width: '200%',
                    gap: '24px'
                }} className="animate-marquee">
                    {/* Double the items for seamless loop */}
                    {[...Array(12)].map((_, i) => (
                        <div key={i} style={{
                            flex: '0 0 300px',
                            height: '200px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <img
                                src={`https://picsum.photos/seed/${i + 1337}/600/400`}
                                alt="AI Generated Art"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.5s ease',
                                    filter: 'brightness(0.8)'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'scale(1.1)';
                                    e.target.style.filter = 'brightness(1)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.filter = 'brightness(0.8)';
                                }}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section style={{ padding: '100px 0', position: 'relative' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: '800' }}>How It Works</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>From text to masterpiece in three simple steps.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '40px',
                        textAlign: 'center'
                    }}>
                        <StepCard
                            number="01"
                            icon={<Wand2 size={32} color="var(--color-primary)" />}
                            title="Describe Your Vision"
                            description="Enter a simple text prompt describing what you want to see. The more detailed, the better."
                        />
                        <StepCard
                            number="02"
                            icon={<Zap size={32} color="var(--color-secondary)" />}
                            title="AI Magic Happens"
                            description="Our advanced models process your request instantly, generating variations of your idea."
                        />
                        <StepCard
                            number="03"
                            icon={<Download size={32} color="#10b981" />}
                            title="Download & Share"
                            description="Select your favorite, upscale it if needed, and share your creation with the world."
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '100px 0', background: 'rgba(255,255,255,0.02)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: '800' }}>Why DreamBees?</h2>
                    </div>
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
                            title="High Fidelity"
                            description="Access state-of-the-art models capable of photorealistic details, complex lighting, and artistic styles."
                        />
                        <FeatureCard
                            icon={<Shield size={32} color="#8b5cf6" />}
                            title="Secure & Private"
                            description="Your creations are yours. We respect your privacy and provide a secure environment for your art."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section style={{ padding: '100px 0', textAlign: 'center' }}>
                <div className="glass-panel" style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '60px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', fontWeight: '800' }}>Ready to start creating?</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '40px', fontSize: '1.2rem' }}>
                            Join the community of creators today and get clear access to the best AI models.
                        </p>
                        <Link to="/auth" className="btn btn-primary" style={{ padding: '16px 40px', borderRadius: '50px', fontSize: '1.1rem' }}>
                            Get Started Now <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="glass-panel" style={{
            padding: '40px',
            transition: 'all 0.3s ease',
            height: '100%',
            cursor: 'default'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(24, 24, 27, 0.7)';
            }}
        >
            <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.05)', width: 'fit-content', padding: '12px', borderRadius: '12px' }}>{icon}</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', fontWeight: '700' }}>{title}</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{description}</p>
        </div>
    );
}

function StepCard({ number, icon, title, description }) {
    return (
        <div style={{ position: 'relative', padding: '20px' }}>
            <div style={{
                fontSize: '4rem',
                fontWeight: '900',
                color: 'rgba(255,255,255,0.03)',
                position: 'absolute',
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                lineHeight: 1
            }}>
                {number}
            </div>
            <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                padding: '40px 20px',
                borderRadius: '24px',
                marginTop: '30px'
            }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 'bold' }}>{title}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{description}</p>
            </div>
        </div>
    )
}
