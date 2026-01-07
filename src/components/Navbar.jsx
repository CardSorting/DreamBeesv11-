import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Hexagon, LogOut, LayoutGrid, Zap, Settings, User } from 'lucide-react';
import { useModel } from '../contexts/ModelContext';

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const { credits } = useModel();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const navLinks = [
        { path: '/generate', label: 'Studio', icon: Zap },
        { path: '/models', label: 'Engine', icon: Settings },
        { path: '/gallery', label: 'Gallery', icon: LayoutGrid },
        { path: '/pricing', label: 'Refill', icon: Hexagon },
    ];

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 100,
            padding: '0 20px',
            pointerEvents: 'none' /* Passthrough clicks outside nav */
        }}>
            <nav style={{
                pointerEvents: 'auto',
                background: 'rgba(10, 10, 10, 0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '8px 8px 8px 20px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                width: '100%',
                maxWidth: '900px', // Constrained width for "island" look
                boxShadow: '0 8px 32px -8px rgba(0,0,0,0.3)',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: scrolled ? 'translateY(0)' : 'translateY(0)'
            }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
                    <div style={{
                        width: '32px', height: '32px', background: 'var(--color-white)', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black'
                    }}>
                        <Hexagon size={18} fill="black" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }} className="hidden-mobile">
                        DreamBees
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden-mobile" style={{ display: 'flex', gap: '4px' }}>
                    {currentUser && navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '99px',
                                fontSize: '0.9rem',
                                color: location.pathname === link.path ? 'var(--color-white)' : 'var(--color-text-muted)',
                                background: location.pathname === link.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                                fontWeight: 500
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {!currentUser && (
                        <>
                            <Link
                                to="/models"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '99px',
                                    fontSize: '0.9rem',
                                    color: location.pathname === '/models' ? 'var(--color-white)' : 'var(--color-text-muted)',
                                    background: location.pathname === '/models' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    fontWeight: 500
                                }}
                            >
                                Engine
                            </Link>
                            <Link
                                to="/pricing"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '99px',
                                    fontSize: '0.9rem',
                                    color: location.pathname === '/pricing' ? 'var(--color-white)' : 'var(--color-text-muted)',
                                    background: location.pathname === '/pricing' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    fontWeight: 500
                                }}
                            >
                                Pricing
                            </Link>
                        </>
                    )}
                </div>

                {/* Right Side Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {currentUser ? (
                        <>
                            <button
                                onClick={handleLogout}
                                className="hidden-mobile"
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white'
                                }}
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <Link to="/auth" className="btn btn-primary" style={{ height: '36px', padding: '0 20px', fontSize: '0.85rem' }}>
                            Sign In
                        </Link>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="visible-mobile"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ padding: '8px', color: 'white' }}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="visible-mobile bg-grid" style={{
                    position: 'fixed',
                    top: '80px',
                    left: '20px',
                    right: '20px',
                    background: 'var(--color-zinc-900)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '24px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    pointerEvents: 'auto',
                    zIndex: 99
                }}>
                    {currentUser ? (
                        <>
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: location.pathname === link.path ? 'var(--color-white)' : 'rgba(255,255,255,0.03)',
                                        color: location.pathname === link.path ? 'black' : 'white',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '12px'
                                    }}
                                >
                                    <link.icon size={20} />
                                    {link.label}
                                </Link>
                            ))}
                            <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} style={{ color: '#ef4444', fontWeight: 600 }}>Sign Out</button>
                            </div>
                        </>
                    ) : (
                        <Link
                            to="/auth"
                            onClick={() => setIsMenuOpen(false)}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            Sign In / Sign Up
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
