import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--color-border)',
            background: 'rgba(9, 9, 11, 0.95)',
            padding: '60px 0 30px',
            marginTop: 'auto',
            backdropFilter: 'blur(20px)'
        }}>
            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '40px',
                    marginBottom: '60px'
                }}>
                    {/* Brand Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>
                            <span style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                            }}>DB</span>
                            DreamBees
                        </Link>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', maxWidth: '280px' }}>
                            The next generation of AI image generation. Create stunning visuals in seconds with our advanced diffusion models.
                        </p>
                        <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
                            {[
                                { icon: Github, href: "https://github.com" },
                                { icon: Twitter, href: "https://twitter.com" },
                                { icon: Sparkles, href: "/showcase" }
                            ].map((item, i) => (
                                <a key={i} href={item.href} target={item.href.startsWith('http') ? "_blank" : undefined} rel="noreferrer" style={{
                                    color: 'var(--color-text-muted)',
                                    transition: 'all 0.2s',
                                    width: '36px', height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.background = 'var(--color-primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--color-text-muted)';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    }}>
                                    <item.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h4 style={{ color: 'white', fontWeight: '600' }}>Product</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { name: 'Features', path: '/features' },
                                { name: 'Gallery', path: '/gallery' },
                                { name: 'Pricing', path: '/pricing' },
                                { name: 'API Access', path: '/api' },
                                { name: 'Showcase', path: '/showcase' }
                            ].map((link) => (
                                <Link key={link.name} to={link.path} style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Company Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h4 style={{ color: 'white', fontWeight: '600' }}>Company</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { name: 'About Us', path: '/about' },
                                { name: 'Blog', path: '/blog' },
                                { name: 'Careers', path: '/careers' },
                                { name: 'Brand Guide', path: '/brand' },
                                { name: 'Contact Support', path: '/contact' }
                            ].map((link) => (
                                <Link key={link.name} to={link.path} style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h4 style={{ color: 'white', fontWeight: '600' }}>Stay Updated</h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            Subscribe to our newsletter for the latest AI trends and feature updates.
                        </p>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--color-border)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                            <button style={{
                                position: 'absolute',
                                right: '6px',
                                top: '6px',
                                bottom: '6px',
                                padding: '0 12px',
                                borderRadius: '8px',
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                                Join
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: '30px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-muted)'
                }}>
                    <p>© {new Date().getFullYear()} DreamBees Inc. All rights reserved.</p>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        {/* Built with love moved here */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Made with <Heart size={14} color="#ec4899" fill="#ec4899" /> in San Francisco
                        </div>
                        <div style={{ width: '1px', height: '14px', background: 'var(--color-border)' }}></div>
                        <Link to="/privacy" className="hover:text-white" style={{ transition: 'color 0.2s' }}>Privacy</Link>
                        <Link to="/terms" className="hover:text-white" style={{ transition: 'color 0.2s' }}>Terms</Link>
                        <Link to="/cookies" className="hover:text-white" style={{ transition: 'color 0.2s' }}>Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
