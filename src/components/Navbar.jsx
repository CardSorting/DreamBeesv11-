import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutGrid, Sparkles, Cpu, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
        fontWeight: '500'
    });

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '70px',
            padding: '0 40px',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            background: 'rgba(9, 9, 11, 0.5)',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
            <Link to="/" style={{ fontWeight: '800', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                    width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white'
                }}>DB</span>
                DreamBees
            </Link>

            <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                {currentUser ? (
                    <>
                        <Link to="/models" style={linkStyle('/models')}><Cpu size={18} /> Models</Link>
                        <Link to="/generate" style={linkStyle('/generate')}><Sparkles size={18} /> Generate</Link>
                        <Link to="/gallery" style={linkStyle('/gallery')}><LayoutGrid size={18} /> Gallery</Link>
                        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>
                        <button onClick={handleLogout} style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }} className="hover:text-white">
                            <LogOut size={18} />
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/gallery" style={linkStyle('/gallery')}><LayoutGrid size={18} /> Gallery</Link>
                        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>
                        <Link to="/auth" style={linkStyle('/auth')}>
                            <LogIn size={18} /> Login
                        </Link>
                        <Link to="/auth" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem', color: 'white', display: 'flex', gap: '6px' }}>
                            <UserPlus size={18} /> Get Started
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
