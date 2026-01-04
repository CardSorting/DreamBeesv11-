import React from 'react';
import SEO from '../components/SEO';

export default function About() {
    return (
        <div className="container" style={{ padding: '120px 20px 60px', maxWidth: '800px' }}>
            <SEO
                title="About Us"
                description="Learn about the mission and team behind DreamBeesAI. We are dedicated to democratizing creativity through artificial intelligence."
            />
            <h1 style={{
                fontSize: '3.5rem',
                fontWeight: '800',
                marginBottom: '40px',
                background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
            }}>
                About DreamBees
            </h1>

            <div className="glass-panel" style={{ padding: '40px' }}>
                <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                    DreamBees was founded with a simple mission: to democratize creativity through artificial intelligence. We believe that everyone serves the right to bring their imagination to life, regardless of their artistic training.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                    Our team consists of researchers, engineers, and artists passionate about the intersection of technology and art. We leverage cutting-edge diffusion models to provide a seamless and powerful image generation experience.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text-muted)' }}>
                    Whether you're a professional designer looking for inspiration or a hobbyist exploring digital art, DreamBees is built for you.
                </p>
            </div>
        </div>
    );
}
