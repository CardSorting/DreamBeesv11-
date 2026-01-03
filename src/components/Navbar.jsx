import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutGrid, Sparkles, Cpu, LogIn, UserPlus } from 'lucide-react';

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

    const linkStyle = (path) => ({
        color: location.pathname === path ? 'white' : 'var(--color-text-muted)',
        display: 'flex', alignItems: 'center', gap: '6px',
        transition: 'color 0.2s',
        fontSize: '0.95rem',
        fontWeight: '500',
        textDecoration: 'none'
    });

    const mobileLinkStyle = (path) => ({
        ...linkStyle(path),
        fontSize: '1.2rem',
        padding: '16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        width: '100%'
    });

    const NavLinks = ({ isMobile = false }) => {
        const style = isMobile ? mobileLinkStyle : linkStyle;

        return (
            <>
                {currentUser ? (
                    <>
                        <Link to="/models" style={style('/models')}><Cpu size={18} /> Models</Link>
                        <Link to="/generate" style={style('/generate')}><Sparkles size={18} /> Generate</Link>
                        <Link to="/gallery" style={style('/gallery')}><LayoutGrid size={18} /> Gallery</Link>
                        {!isMobile && <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>}
                        <button onClick={handleLogout} style={{ ...style(''), color: 'var(--color-text-muted)' }} className="hover:text-white">
                            <LogOut size={18} />
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/gallery" style={style('/gallery')}><LayoutGrid size={18} /> Gallery</Link>
                        {!isMobile && <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>}
                        <Link to="/auth" style={style('/auth')}>
                            <LogIn size={18} /> Login
                        </Link>
                        <Link to="/auth" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem', color: 'white', display: 'flex', gap: '6px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                            <UserPlus size={18} /> Get Started
                        </Link>
                    </>
                )}
            </>
        );
    };

    return (
        <>
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                padding: '0 20px',
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
                background: 'rgba(9, 9, 11, 0.8)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <Link to="/" style={{ fontWeight: '800', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white'
                        }}>DB</span>
                        DreamBees
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden-mobile" style={{ gap: '30px', alignItems: 'center' }}>
                        <NavLinks />
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="visible-mobile">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{ color: 'white', padding: '8px' }}
                        >
                            {isMenuOpen ? <X size={24} /> : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ width: '24px', height: '2px', background: 'white' }}></span>
                                <span style={{ width: '24px', height: '2px', background: 'white' }}></span>
                                <span style={{ width: '24px', height: '2px', background: 'white' }}></span>
                            </div>}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div style={{
                    position: 'fixed',
                    top: '70px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'var(--color-bg)',
                    zIndex: 99,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    borderTop: '1px solid var(--color-border)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <NavLinks isMobile={true} />
                </div>
            )}
        </>
    );
}
