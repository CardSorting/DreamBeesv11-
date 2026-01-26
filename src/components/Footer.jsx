import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { trackEvent, trackOutboundLink } from '../utils/analytics';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            padding: '120px 0 60px',
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            zIndex: 10
        }}>
            <div className="container">

                {/* Top Section: CTA & Newsletter */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '80px', marginBottom: '120px' }}>

                    <div style={{ maxWidth: '500px' }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', lineHeight: 1, letterSpacing: '-0.03em', color: 'white', marginBottom: '24px' }}>
                            Stay in the flow.
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.5, marginBottom: '40px' }}>
                            Join the newsletter for updates on new models, specialized workflows, and featured artist showcases.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                style={{
                                    flex: 1,
                                    minWidth: '240px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--color-border)',
                                    padding: '12px 0',
                                    fontSize: '1rem',
                                    color: 'white',
                                    borderRadius: 0,
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={() => trackEvent('newsletter_signup_start')}
                                className="btn btn-outline"
                                style={{ borderRadius: '99px', padding: '0 24px' }}>
                                Subscribe
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                        <FooterColumn title="Platform">
                            <FooterLink to="/generate">Studio</FooterLink>
                            <FooterLink to="/gallery">Gallery</FooterLink>
                            <FooterLink to="/pricing">Pricing</FooterLink>
                            <FooterLink to="/models">Models</FooterLink>
                        </FooterColumn>
                        <FooterColumn title="Studio">
                            <Link
                                to="/blog"
                                onClick={() => trackEvent('click_footer_blog')}
                                style={{ color: 'white', fontWeight: '500', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Blog <ArrowUpRight size={16} color="var(--color-accent-primary)" />
                            </Link>
                            <FooterLink to="/about">About Us</FooterLink>
                            <FooterLink to="/careers">Careers</FooterLink>
                            <FooterLink to="/brand">Brand Assets</FooterLink>
                            <FooterLink to="/contact">Contact</FooterLink>
                        </FooterColumn>
                    </div>

                </div>

                {/* Bottom Section: Legal & Social */}
                <div style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
                        {/* Huge Brand Name */}
                        <div style={{ fontSize: '14vw', lineHeight: 0.8, fontWeight: '900', letterSpacing: '-0.06em', color: 'var(--color-zinc-900)', userSelect: 'none', pointerEvents: 'none', marginLeft: '-0.5vw' }}>
                            DREAMBEES
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <Link to="/privacy" onClick={() => trackEvent('view_privacy')}>Privacy</Link>
                            <Link to="/terms" onClick={() => trackEvent('view_terms')}>Terms</Link>
                            <Link to="/cookies" onClick={() => trackEvent('view_cookies')}>Cookies</Link>
                        </div>



                        <div>
                            &copy; {new Date().getFullYear()} DreamBees Inc.
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}

function FooterColumn({ title, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
        </div>
    )
}

function FooterLink({ to, children }) {
    return (
        <Link to={to} className="footer-link" style={{ color: 'var(--color-text-muted)', fontSize: '1rem', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {children}
        </Link>
    )
}


