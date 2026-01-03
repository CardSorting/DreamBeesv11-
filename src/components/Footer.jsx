import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Heart, Sparkles, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            padding: '80px 0 40px',
            marginTop: 'auto'
        }}>
            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '60px',
                    marginBottom: '80px'
                }}>
                    {/* Brand Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '6px',
                                background: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: '900', color: 'black'
                            }}>DB</div>
                            DreamBees
                        </Link>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', maxWidth: '300px', fontSize: '0.9rem' }}>
                            Pioneering the future of generative media with professional-grade tools for creators and enterprises.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <SocialIcon icon={Github} />
                            <SocialIcon icon={Twitter} />
                            <SocialIcon icon={Instagram} />
                            <SocialIcon icon={Linkedin} />
                        </div>
                    </div>

                    {/* Columns */}
                    <FooterColumn title="Platform">
                        <FooterLink to="/generate">Generate</FooterLink>
                        <FooterLink to="/models">Models</FooterLink>
                        <FooterLink to="/gallery">Gallery</FooterLink>
                        <FooterLink to="/features">Features</FooterLink>
                    </FooterColumn>

                    <FooterColumn title="Company">
                        <FooterLink to="/about">About</FooterLink>
                        <FooterLink to="/careers">Careers</FooterLink>
                        <FooterLink to="/blog">Blog</FooterLink>
                        <FooterLink to="/contact">Contact</FooterLink>
                    </FooterColumn>

                    <FooterColumn title="Legal">
                        <FooterLink to="/privacy">Privacy Policy</FooterLink>
                        <FooterLink to="/terms">Terms of Service</FooterLink>
                        <FooterLink to="/cookies">Cookie Policy</FooterLink>
                    </FooterColumn>

                </div>

                <div style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '32px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    fontSize: '0.85rem',
                    color: 'var(--color-zinc-700)'
                }}>
                    <p>© {new Date().getFullYear()} DreamBees Inc.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Designed in California
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({ title, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {children}
            </div>
        </div>
    )
}

function FooterLink({ to, children }) {
    return (
        <Link to={to} style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>
            {children}
        </Link>
    )
}

function SocialIcon({ icon: Icon }) {
    return (
        <a href="#" style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)',
            transition: 'all 0.2s'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'white';
                e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
        >
            <Icon size={16} />
        </a>
    )
}
