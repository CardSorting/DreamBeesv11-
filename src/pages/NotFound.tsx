import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Compass, Box, Image as ImageIcon, ArrowLeft, Search } from 'lucide-react';
import NotFoundBg from '../assets/404-bg.png';

const NotFound = () => {
    const navigate = useNavigate();

    const popularLinks = [
        { name: 'Discovery', path: '/discovery', icon: <Compass size={20} />, description: 'Explore AI generated wonders' },
        { name: 'Models', path: '/models', icon: <Box size={20} />, description: 'Browse our specialized models' },
        { name: 'Mockups', path: '/mockups', icon: <ImageIcon size={20} />, description: 'Professional product mockups' },
    ];

    const containerVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <div className="not-found-page" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#050505',
            padding: '24px',
            color: '#fff'
        }}>
            {/* Background Image with Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                opacity: 0.4
            }}>
                <img
                    src={NotFoundBg}
                    alt="Not Found Background"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(4px) brightness(0.5)'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, transparent 0%, #050505 80%)'
                }} />
            </div>

            <motion.div
                className="not-found-content"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                style={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '800px',
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: 'clamp(4rem, 15vw, 10rem)',
                        fontWeight: '800',
                        lineHeight: 1,
                        margin: 0,
                        letterSpacing: '-0.05em',
                        background: 'linear-gradient(to bottom, #fff 30%, rgba(255,255,255,0.2))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        opacity: 0.8
                    }}>
                        404
                    </h1>
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                        fontWeight: '600',
                        marginTop: '-10px',
                        color: 'var(--color-zinc-100)'
                    }}>
                        Lost in the Hive?
                    </h2>
                    <p style={{
                        color: 'var(--color-zinc-400)',
                        fontSize: '1.1rem',
                        maxWidth: '500px',
                        margin: '20px auto 0'
                    }}>
                        The page you're looking for has flown away or never existed in this colony.
                    </p>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    style={{
                        display: 'flex',
                        gap: '16px',
                        justifyContent: 'center',
                        marginBottom: '60px'
                    }}
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-outline"
                        style={{ gap: '8px' }}
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                    <Link to="/" className="btn btn-primary" style={{ gap: '8px' }}>
                        <Home size={18} />
                        Return Home
                    </Link>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    style={{
                        textAlign: 'left',
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '24px',
                        padding: '32px'
                    }}
                >
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={18} color="var(--color-accent-primary)" />
                        Quick Navigation
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                    }}>
                        {popularLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ color: 'var(--color-accent-primary)', marginBottom: '8px' }}>
                                    {link.icon}
                                </div>
                                <span style={{ fontWeight: '600', color: '#fff' }}>{link.name}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-zinc-400)' }}>{link.description}</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default NotFound;
