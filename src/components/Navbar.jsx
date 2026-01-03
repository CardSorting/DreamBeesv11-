import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutGrid, Sparkles, Cpu, LogIn, UserPlus, Menu, X } from 'lucide-react';

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Close menu when route changes
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    async function handleLogout() {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, children }) => (
        <Link
            to={to}
            className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full
                ${isActive(to) ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}
            `}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '99px',
                color: isActive(to) ? 'white' : 'var(--color-text-muted)',
                background: isActive(to) ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
                if (!isActive(to)) {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive(to)) {
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                    e.currentTarget.style.background = 'transparent';
                }
            }}
        >
            {Icon && <Icon size={16} />}
            {children}
        </Link>
    );

    return (
        <>
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 'var(--header-height)',
                zIndex: 100,
                backdropFilter: 'blur(12px)',
                background: 'rgba(0,0,0,0.5)',
                borderBottom: '1px solid rgba(255,255,255,0.03)'
            }}>
                <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    {/* Brand */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'white',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span style={{ fontWeight: '900', color: 'black', fontSize: '14px' }}>DB</span>
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>DreamBees</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {currentUser ? (
                            <>
                                <NavItem to="/models" icon={Cpu}>Models</NavItem>
                                <NavItem to="/generate" icon={Sparkles}>Generate</NavItem>
                                <NavItem to="/gallery" icon={LayoutGrid}>Gallery</NavItem>
                                <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 12px' }} />
                                <button
                                    onClick={handleLogout}
                                    className="btn-ghost"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '8px 16px', borderRadius: '99px',
                                        color: 'var(--color-text-muted)'
                                    }}
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavItem to="/gallery" icon={LayoutGrid}>Gallery</NavItem>
                                <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 12px' }} />
                                <Link to="/auth" style={{
                                    marginRight: '12px',
                                    fontSize: '0.9rem',
                                    color: 'var(--color-text-muted)',
                                    fontWeight: '500'
                                }}>
                                    Log in
                                </Link>
                                <Link to="/auth" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="visible-mobile"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ color: 'white', padding: '8px' }}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Content */}
            {isMenuOpen && (
                <div style={{
                    position: 'fixed',
                    top: 'var(--header-height)',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'var(--color-bg)',
                    zIndex: 90,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {currentUser ? (
                        <>
                            <Link to="/models" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><Cpu size={18} style={{ marginRight: '8px' }} /> Models</Link>
                            <Link to="/generate" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}><Sparkles size={18} style={{ marginRight: '8px' }} /> Generate</Link>
                            <Link to="/gallery" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><LayoutGrid size={18} style={{ marginRight: '8px' }} /> Gallery</Link>
                            <button onClick={handleLogout} className="btn btn-ghost" style={{ justifyContent: 'flex-start', border: '1px solid var(--color-border)' }}>
                                <LogOut size={18} style={{ marginRight: '8px' }} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/gallery" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}><LayoutGrid size={18} style={{ marginRight: '8px' }} /> Gallery</Link>
                            <div style={{ height: '1px', background: 'var(--color-border)', margin: '12px 0' }} />
                            <Link to="/auth" className="btn btn-outline">Log In</Link>
                            <Link to="/auth" className="btn btn-primary">Sign Up</Link>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
