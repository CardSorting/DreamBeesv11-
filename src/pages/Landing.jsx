import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, Image as ImageIcon, ArrowRight, Wand2, Download, Share2, Search, Sliders, Layers, Cpu, Lock } from 'lucide-react';

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
                        <Link to="/auth" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '50px' }}>
                            <Sparkles size={20} style={{ marginRight: '8px' }} />
                            Start Creating Free
                        </Link>
                        <Link to="/gallery" className="btn btn-outline" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '50px', background: 'rgba(255,255,255,0.02)' }}>
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

            {/* Detailed Capabilities */}
            <section style={{ padding: '120px 0', position: 'relative' }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0',
                    width: '30%',
                    height: '100%',
                    background: 'radial-gradient(ellipse at right center, rgba(139, 92, 246, 0.15), transparent 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ maxWidth: '600px', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '3rem', marginBottom: '24px', fontWeight: '800', lineHeight: 1.1 }}>
                            Powered by <br />
                            <span style={{ color: 'var(--color-primary)' }}>Advanced Latent Diffusion</span>
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', lineHeight: 1.6 }}>
                            We leverage the latest SDXL models run on high-performance H100 GPUs to deliver exceptional quality at breakneck speeds.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '40px'
                    }}>
                        <CapabilityCard
                            icon={<Cpu size={32} color="#f43f5e" />}
                            title="SDXL Engine"
                            description="Utilizing Stable Diffusion XL for superior composition, realism, and prompt adherence."
                            stat="1024px"
                            statLabel="Native Resolution"
                        />
                        <CapabilityCard
                            icon={<Zap size={32} color="#eab308" />}
                            title="Instant Results"
                            description="Optimized inference pipeline running on our global edge network."
                            stat="< 5s"
                            statLabel="Generation Time"
                        />
                        <CapabilityCard
                            icon={<Layers size={32} color="#3b82f6" />}
                            title="Batch Processing"
                            description="Generate multiple variations simultaneously to find the perfect image faster."
                            stat="4x"
                            statLabel="Parallel Grids"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works (Zig Zag Walkthrough) */}
            <section style={{ padding: '100px 0', background: 'rgba(255,255,255,0.02)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '100px' }}>
                        <span style={{
                            color: 'var(--color-secondary)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem'
                        }}>Workflow</span>
                        <h2 style={{ fontSize: '2.5rem', marginTop: '16px', fontWeight: '800' }}>From Text to Masterpiece</h2>
                    </div>

                    <div className="mobile-stack" style={{ gap: '120px' }}>

                        {/* Step 1 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '4rem', fontWeight: '900', color: 'rgba(139, 92, 246, 0.1)', lineHeight: 1, marginBottom: '24px' }}>01</div>
                                <h3 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: '700' }}>Craft Your Vision</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                    Start with a simple description. Our prompt helper will assist you in adding details, styles, and lighting effects to get exactly what you want.
                                </p>
                            </div>
                            <div className="mock-browser">
                                <div className="mock-browser-header">
                                    <div className="mock-dot" style={{ background: '#ff5f56' }} />
                                    <div className="mock-dot" style={{ background: '#ffbd2e' }} />
                                    <div className="mock-dot" style={{ background: '#27c93f' }} />
                                </div>
                                <div className="mock-content" style={{ background: '#09090b' }}>
                                    <div style={{
                                        border: '1px solid var(--color-border)',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        color: 'var(--color-text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <Search size={18} />
                                        <span>A futuristic cyberpunk city with neon lights...|</span>
                                    </div>
                                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                        <div style={{ padding: '6px 12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--color-primary)' }}>Cyberpunk</div>
                                        <div style={{ padding: '6px 12px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--color-secondary)' }}>Cinematic</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
                            <div style={{ order: 2 }}> {/* Mobile order switch handled by grid usually, but explicit mobile-stack check needed for pure CSS without media queries? using class above */}
                                <div style={{ fontSize: '4rem', fontWeight: '900', color: 'rgba(236, 72, 153, 0.1)', lineHeight: 1, marginBottom: '24px' }}>02</div>
                                <h3 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: '700' }}>AI Magic in Seconds</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                    Our H100 GPU cluster processes your request instantly. Watch as noise transforms into clarity in real-time.
                                </p>
                            </div>
                            <div className="mock-browser" style={{ order: 1 }}>
                                <div className="mock-browser-header">
                                    <div className="mock-dot" style={{ background: '#ff5f56' }} />
                                    <div className="mock-dot" style={{ background: '#ffbd2e' }} />
                                    <div className="mock-dot" style={{ background: '#27c93f' }} />
                                </div>
                                <div className="mock-content" style={{ background: '#09090b', alignItems: 'center' }}>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#27272a',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{ width: '70%', height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }} />
                                    </div>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Generating variations...</span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px', width: '100%' }}>
                                        <div className="skeleton" style={{ height: '80px', borderRadius: '4px' }} />
                                        <div className="skeleton" style={{ height: '80px', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '4rem', fontWeight: '900', color: 'rgba(16, 185, 129, 0.1)', lineHeight: 1, marginBottom: '24px' }}>03</div>
                                <h3 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: '700' }}>Refine, Upscale, Export</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                    Select the best variation. Upscale it to 4K resolution, or remix it with new parameters. Your art is ready for the world.
                                </p>
                            </div>
                            <div className="mock-browser">
                                <div className="mock-browser-header">
                                    <div className="mock-dot" style={{ background: '#ff5f56' }} />
                                    <div className="mock-dot" style={{ background: '#ffbd2e' }} />
                                    <div className="mock-dot" style={{ background: '#27c93f' }} />
                                </div>
                                <div className="mock-content" style={{ background: '#09090b', position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute', inset: '0',
                                        background: 'url(https://picsum.photos/seed/cyber/600/400)',
                                        backgroundSize: 'cover',
                                        opacity: 0.5
                                    }} />
                                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px', justifyContent: 'center', marginTop: 'auto' }}>
                                        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                                            <Download size={16} style={{ marginRight: '8px' }} /> Download
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.5)' }}>
                                            <Share2 size={16} style={{ marginRight: '8px' }} /> Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section style={{ padding: '100px 0', position: 'relative' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: '800' }}>Frequently Asked Questions</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Everything you need to know about DreamBees.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <FAQItem
                            question="Is DreamBees free to use?"
                            answer="Yes! You can start creating immediately for free with our daily credit allowance. For power users needing more generations and faster speeds, we offer premium capabilities."
                        />
                        <FAQItem
                            question="Can I use the images commercially?"
                            answer="Absolutely. You own full commercial rights to all images you generate on DreamBees, regardless of whether you are on a free or paid plan."
                        />
                        <FAQItem
                            question="What models do you use?"
                            answer="We primarily utilize Stable Diffusion XL (SDXL) for its superior prompt adherence and image quality. We also offer fine-tuned variants for specific styles like Anime or Photorealism."
                        />
                        <FAQItem
                            question="How long are my images stored?"
                            answer="Your images are stored securely in your private gallery indefinitely. You can download or delete them at any time."
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

function CapabilityCard({ icon, title, description, stat, statLabel }) {
    return (
        <div className="glass-panel" style={{
            padding: '32px',
            transition: 'all 0.3s ease',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
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
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '24px', flex: 1 }}>{description}</p>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stat}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{statLabel}</div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div
            className="glass-panel"
            style={{
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                border: isOpen ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer'
            }}
            onClick={() => setIsOpen(!isOpen)}
        >
            <div style={{
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: isOpen ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>{question}</h3>
                <div style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: isOpen ? 'var(--color-primary)' : 'var(--color-text-muted)'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </div>
            <div style={{
                maxHeight: isOpen ? '200px' : '0',
                opacity: isOpen ? 1 : 0,
                padding: isOpen ? '0 24px 24px' : '0 24px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6
            }}>
                {answer}
            </div>
        </div>
    );
}
