import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, ArrowRight, Layers, ChevronDown, Cpu, Expand, Clock, Check, Plus, Minus } from 'lucide-react';
import SEO from '../components/SEO';

export default function Landing() {
    return (
        <div className="landing-page bg-grid" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SEO
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "DreamBeesAI",
                    "applicationCategory": "DesignApplication",
                    "operatingSystem": "Web",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD"
                    },
                    "description": "Create stunning AI-generated images with DreamBeesAI. Use advanced models like Flux, SDXL, and more to bring your imagination to life."
                }}
            />

            {/* Hero Section */}
            <section style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '160px 20px 80px',
                overflow: 'hidden'
            }}>
                {/* Background Glow Blob */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    filter: 'blur(80px)',
                    zIndex: 0
                }}></div>

                <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="fade-in">
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 16px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '99px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            letterSpacing: '0.05em',
                            color: 'var(--color-zinc-400)',
                            marginBottom: '40px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                background: 'var(--color-accent-primary)',
                                borderRadius: '50%',
                                marginRight: '10px',
                                boxShadow: '0 0 10px var(--color-accent-primary)'
                            }}></span>
                            NEXT GENERATION SYNTHESIS
                        </span>
                    </div>

                    <h1 className="fade-in hero-title-gradient" style={{
                        fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                        fontWeight: '800',
                        lineHeight: 0.9,
                        letterSpacing: '-0.04em',
                        marginBottom: '32px',
                        animationDelay: '0.1s',
                        color: 'white' // Fallback
                    }}>
                        DREAM <br />
                        <span className="text-glow-accent">BEES</span>
                    </h1>

                    <p className="fade-in" style={{
                        fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
                        color: 'var(--color-zinc-400)',
                        maxWidth: '640px',
                        margin: '0 auto 48px',
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
                    <ChevronDown className="animate-bounce" color="var(--color-text-muted)" size={24} style={{ animationDuration: '2s' }} />
                </div>
            </section>

            {/* Infinite Marquee */}
            <section style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                <div style={{ padding: '60px 0', overflow: 'hidden' }}>
                    <MarqueeImages />
                </div>
            </section>

            {/* Bento Grid Features - "Why DreamBees?" */}
            <section style={{ padding: '160px 0', background: 'var(--color-bg)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '16px' }}>Engineered for Excellence</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>State-of-the-art infrastructure meets intuitive design.</p>
                    </div>

                    <div className="bento-grid">
                        {/* Large Card: Instant Inference */}
                        <BentoCard colSpan={8} title="Instant Inference" icon={Zap}>
                            <div style={{ padding: '0 32px 32px', color: 'var(--color-text-muted)' }}>
                                <p style={{ fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '90%' }}>
                                    Powered by H100 GPU clusters for sub-second latent diffusion generation.
                                    Eliminate wait times and stay in your creative flow state.
                                </p>
                                <div style={{ marginTop: '24px', display: 'flex', gap: '24px' }}>
                                    <div className="spec-badge">
                                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-zinc-400)' }}>LATENCY</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-accent-primary)' }}>{'<'}800ms</span>
                                    </div>
                                    <div className="spec-badge">
                                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-zinc-400)' }}>UPTIME</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'white' }}>99.9%</span>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>

                        {/* Small Card: Security */}
                        <BentoCard colSpan={4} title="Enterprise Security" icon={Shield}>
                            <div style={{ padding: '0 32px 32px', color: 'var(--color-text-muted)' }}>
                                <p>Private galleries, secure storage, and full commercial usage rights for all assets.</p>
                            </div>
                        </BentoCard>

                        {/* Medium Card: Control */}
                        <BentoCard colSpan={6} title="Precision Control" icon={Layers}>
                            <div style={{ padding: '0 32px 32px', color: 'var(--color-text-muted)' }}>
                                <p style={{ marginBottom: '16px' }}>Full control over generation parameters including Steps, CFG Scale, and Seed.</p>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-zinc-400)' }}>
                                    <div>Steps: 50</div>
                                    <div>CFG: 7.5</div>
                                    <div>Sampler: Euler a</div>
                                </div>
                            </div>
                        </BentoCard>

                        {/* Medium Card: Models */}
                        <BentoCard colSpan={6} title="Multi-Model Support" icon={Cpu}>
                            <div style={{ padding: '0 32px 32px', color: 'var(--color-text-muted)' }}>
                                <p style={{ marginBottom: '24px' }}>Access the world's most advanced open-source models.</p>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {['SDXL 1.0', 'Flux Pro', 'Midjourney V6 (Soon)'].map(m => (
                                        <span key={m} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', fontSize: '0.8rem' }}>{m}</span>
                                    ))}
                                </div>
                            </div>
                        </BentoCard>
                    </div>
                </div>
            </section>
            {/* How It Works */}
            <section style={{ padding: '80px 0 160px' }}>
                <div className="container">
                    <div style={{ padding: '0 20px', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '16px' }}>Workflow</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>From concept to masterpiece in three steps.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0' }}>
                        <StepCard
                            number="01"
                            title="Prompt"
                            desc="Describe your vision in natural language. Our semantic engine understands nuance, style, and artistic intent."
                        />
                        <StepCard
                            number="02"
                            title="Refine"
                            desc="Dial in your settings. Adjust aspect ratio, step count, and guidance scale for granular control over the output."
                        />
                        <StepCard
                            number="03"
                            title="Synthesis"
                            desc="Generate high-fidelity assets in sub-second timeframes using our H100 inference cluster."
                        />
                    </div>
                </div>
            </section>

            {/* Interactive Demo */}
            <section style={{ padding: '80px 0', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <div className="container">
                    <InteractiveDemo />
                </div>
            </section>

            {/* Technical Specs */}
            <section style={{ padding: '120px 0', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                <div className="container" style={{ maxWidth: '1000px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                        <h2 style={{ fontSize: '2rem' }}>Technical Specifications</h2>
                        <span style={{ color: 'var(--color-text-muted)' }}>Running on v2.4.1</span>
                    </div>

                    <div className="spec-list">
                        <SpecItem label="Generation Engine" value="Stable Diffusion XL Turbo" />
                        <SpecItem label="Max Resolution" value="1024 x 1024" />
                        <SpecItem label="Inference Time" value="~0.8 Seconds" />
                        <SpecItem label="Output Format" value="PNG / WEBP" />
                        <SpecItem label="Color Depth" value="24-bit True Color" />
                        <SpecItem label="License" value="Commercial / MIT" />
                    </div>
                </div>
            </section>
            {/* Sales Pitch / Value Prop */}
            <section style={{ padding: '160px 0', background: 'var(--color-bg)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '80px', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '32px', lineHeight: 1.1 }}>
                                Stop settling for <br />
                                <span style={{ color: 'var(--color-zinc-700)' }}>average inference.</span>
                            </h2>
                            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginBottom: '40px', lineHeight: 1.6 }}>
                                Most AI tools are wrappers around slow, shared APIs. DreamBees provides dedicated H100 throughput for a fraction of the cost.
                                Clean composition, no "AI slop" artifacts, and pure creative control.
                            </p>
                            <Link to="/auth" className="btn btn-primary" style={{ padding: '0 40px', height: '56px' }}>
                                Start Building Better Art
                            </Link>
                        </div>
                        <div className="glass-panel" style={{ padding: '40px' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '32px' }}>The Professional Advantage</h3>
                            <div className="value-prop-list">
                                <ValueItem text="Unrestricted Prompt Adherence" />
                                <ValueItem text="Zero-Queue Priority Access" />
                                <ValueItem text="Commercial IP Ownership" />
                                <ValueItem text="Raw Latent Access (Coming Soon)" />
                                <ValueItem text="Custom LoRA Training Support" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section style={{ padding: '160px 0' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '60px', textAlign: 'center' }}>Frequently Asked Questions</h2>
                    <div>
                        <AccordionItem title="Can I use the images for commercial work?">
                            Yes. You own 100% of the rights to any image you generate on DreamBees. You can use them for commercial projects, merchandise, or any other purpose without restriction.
                        </AccordionItem>
                        <AccordionItem title="How does the credit system work?">
                            We operate on a simple credit system. 1 Credit = 1 Image Generation. New users receive 30 free credits to get started. You can purchase additional credit packs or subscribe for monthly refills.
                        </AccordionItem>
                        <AccordionItem title="What models are currently supported?">
                            We currently support Stable Diffusion XL (SDXL) and SDXL Turbo for lightning-fast generation. We are actively testing Flux and other next-gen models for integration in the next update.
                        </AccordionItem>
                        <AccordionItem title="Is my data private?">
                            Yes. Your prompts and generated images are private to your account unless you explicitly choose to share them in the public gallery. We do not use your private generations to train our models without consent.
                        </AccordionItem>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{ padding: '0 0 160px', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '720px' }}>
                    <div style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
                        padding: '80px 40px',
                        borderRadius: '24px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', marginBottom: '32px', lineHeight: 1, fontWeight: '800', color: 'white' }}>
                            Ready to orchestrate <br /> your imagination?
                        </h2>
                        <Link to="/auth" className="btn btn-primary" style={{ padding: '0 48px', height: '64px', fontSize: '1.1rem', borderRadius: 'var(--radius-full)' }}>
                            Get Started Now <ArrowRight size={20} style={{ marginLeft: '12px' }} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Simplified Inline Footer */}
            <footer style={{
                padding: '40px 20px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                textAlign: 'center'
            }}>
                <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link to="/about" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>About</Link>
                        <Link to="/blog" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Blog</Link>
                        <Link to="/pricing" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Pricing</Link>
                        <Link to="/contact" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Contact</Link>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link to="/privacy" style={{ color: 'var(--color-zinc-600)', fontSize: '0.85rem' }}>Privacy</Link>
                        <Link to="/terms" style={{ color: 'var(--color-zinc-600)', fontSize: '0.85rem' }}>Terms</Link>
                    </div>
                    <div style={{ color: 'var(--color-zinc-700)', fontSize: '0.85rem' }}>
                        © {new Date().getFullYear()} DreamBeesAI. All rights reserved.
                    </div>
                </div>
            </footer>

        </div>
    );
}

function BentoCard({ colSpan, title, icon: Icon, children }) {
    const cardRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div
            ref={cardRef}
            className="bento-card"
            style={{
                gridColumn: `span ${colSpan}`,
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`
            }}
            onMouseMove={handleMouseMove}
        >
            <div className="spotlight-overlay"></div>
            <div style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                <div style={{
                    width: '40px', height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white'
                }}>
                    <Icon size={20} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '500' }}>{title}</h3>
            </div>
            <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
                {children}
            </div>
        </div>
    );
}

function SpecItem({ label, value }) {
    return (
        <div className="spec-item">
            <span className="spec-label">{label}</span>
            <span className="spec-value">{value}</span>
        </div>
    )
}

function AccordionItem({ title, children }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="accordion-item">
            <div className="accordion-summary" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                {isOpen ? <Minus size={20} color="var(--color-accent-primary)" /> : <Plus size={20} color="var(--color-zinc-400)" />}
            </div>
            <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                <p style={{ lineHeight: 1.6 }}>{children}</p>
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
    const baseImages = hasGeneratedCallback ? generatedImageUrls : [
        'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1633412803830-298ecea34dbd?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1614730341194-75c60740a2d3?w=600&h=600&fit=crop'
    ];

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
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    filter: 'grayscale(100%) brightness(0.8)',
                    transition: 'all 0.4s ease'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'grayscale(0%) brightness(1)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'grayscale(100%) brightness(0.8)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <img
                        src={src}
                        alt={`Generative art created with AI: ${src.split('/').pop()}`}
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

function StepCard({ number, title, desc }) {
    return (
        <div className="step-card">
            <div className="step-number">{number}</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: '500' }}>{title}</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{desc}</p>
        </div>
    )
}

function ValueItem({ text }) {
    return (
        <div className="value-prop-item">
            <div className="check-icon-circle">
                <Check size={14} strokeWidth={3} />
            </div>
            <span>{text}</span>
        </div>
    )
}

// Demo Asset Imports
import demoAngel from '../assets/images/landing/ethereal_clockwork_angel_ascending_over_foggy_victorian.jpeg';
import demoLibrary from '../assets/images/landing/infinite_arcane_library_with_spiraling_towers_of.jpeg';
import demoPhoenix from '../assets/images/landing/majestic_cosmic_phoenix_formed_from_supernova_stardust.jpeg';

function InteractiveDemo() {
    const demos = [
        {
            prompt: "Ethereal Clockwork Angel ascending over foggy Victorian London, intricate brass gears, radiant golden wings, divine volumetric lighting, atmospheric depth, cinematic composition, 8k resolution, unreal engine 5 render, steampunk masterpiece",
            image: demoAngel,
            model: "SDXL Turbo",
            seed: "CHRONOS_01",
            time: "0.8s"
        },
        {
            prompt: "Infinite Arcane Library with spiraling towers of floating grimoires, bioluminescent runes, swirling stardust, mystical atmosphere, photorealistic wood textures, deep depth of field, fantasy concept art, trending on ArtStation",
            image: demoLibrary,
            model: "Flux Pro",
            seed: "AKASHIC_V9",
            time: "1.2s"
        },
        {
            prompt: "Majestic Cosmic Phoenix formed from supernova stardust, wings of molten solar plasma, vibrant nebula colors, deep space backdrop, hyper-realistic, dramatic lighting, epic scale, 8k, sharp focus, raytraced global illumination",
            image: demoPhoenix,
            model: "SDXL 1.0",
            seed: "SOLARIS_X",
            time: "0.9s"
        }
    ];

    const [index, setIndex] = useState(0);
    const [displayedPrompt, setDisplayedPrompt] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [showStatus, setShowStatus] = useState(false);

    useEffect(() => {
        let timeout;
        const currentDemo = demos[index];

        if (isTyping) {
            setShowStatus(false);
            if (displayedPrompt.length < currentDemo.prompt.length) {
                timeout = setTimeout(() => {
                    setDisplayedPrompt(currentDemo.prompt.slice(0, displayedPrompt.length + 1));
                }, 20); // Faster typing speed
            } else {
                setIsTyping(false);
                setShowStatus(true);
                setIsScanning(true);
                setTimeout(() => {
                    setIsScanning(false);
                    // Wait before next demo
                    setTimeout(() => {
                        setIndex((prev) => (prev + 1) % demos.length);
                        setDisplayedPrompt("");
                        setIsTyping(true);
                    }, 4000); // Longer pause to admire
                }, 1600); // Scan duration matches CSS animation
            }
        }
        return () => clearTimeout(timeout);
    }, [displayedPrompt, isTyping, index, demos]);

    const currentDemo = demos[index];

    return (
        <div className="demo-container">
            <div className="demo-terminal">
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8B5CF6' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D946EF' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F472B6' }}></div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-zinc-700)', letterSpacing: '0.1em' }}>DREAM_CORE_V1.0</div>
                    </div>

                    <div style={{ color: 'var(--color-zinc-400)', marginBottom: '12px', fontSize: '0.85rem' }}>// Weaving latent threads...</div>
                    <div style={{ fontSize: '1.25rem', lineHeight: 1.6, minHeight: '80px', fontFamily: 'monospace', color: 'var(--color-text-main)' }}>
                        <span style={{ color: 'var(--color-accent-primary)', marginRight: '12px' }}>➜</span>
                        {displayedPrompt}<span className="typing-cursor"></span>
                    </div>
                </div>

                {/* Status Footer */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', opacity: showStatus ? 1 : 0, transition: 'opacity 0.3s' }}>
                    <div className="status-badge">
                        <Cpu size={12} /> {currentDemo.model}
                    </div>
                    <div className="status-badge">
                        <Clock size={12} /> {currentDemo.time}
                    </div>
                    <div className="status-badge" style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <Check size={12} /> Manifested
                    </div>
                </div>
            </div>

            <div className="demo-preview-wrapper">
                <div className="demo-preview">
                    {/* Tech Overlays */}
                    <div className="tech-grid-overlay"></div>
                    <div className={`scan-line ${isScanning ? 'scan-active' : ''}`}></div>

                    {/* Previous Image (Background) */}
                    <img
                        src={demos[(index - 1 + demos.length) % demos.length].image}
                        alt="Previous"
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                            filter: 'brightness(0.3) blur(4px)', // Stronger blur for dream feel
                            transform: 'scale(1.1)'
                        }}
                    />

                    {/* Current Image (Revealed) */}
                    <img
                        src={demos[index].image}
                        alt="Current"
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                            opacity: isScanning ? 1 : (isTyping ? 0 : 1),
                            clipPath: isScanning ? 'polygon(0 0, 100% 0, 100% 0, 0 0)' : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                            animation: isScanning ? 'revealImage 1.6s linear forwards' : 'none'
                        }}
                    />

                    {/* Scanning Text Overlay */}
                    {isScanning && (
                        <div style={{
                            position: 'absolute', bottom: '20px', right: '20px',
                            fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-accent-primary)',
                            background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px'
                        }}>
                            Diffusing Reality... {(Math.random() * 100).toFixed(0)}%
                        </div>
                    )}
                </div>
            </div>

            {/* Inline Style for keyframe since it's specific */}
            <style>{`
                @keyframes revealImage {
                    0% { clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); }
                    100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
                }
            `}</style>
        </div>
    );
}
