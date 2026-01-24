import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Palette, Music, Sparkles, Presentation, Star, Clock, Search, ChevronRight, Gamepad2, LayoutGrid, Heart, Smile, Zap, ShoppingBag } from 'lucide-react';
import './AppsHub.css';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure this path is correct based on project structure

// Components
import AppCard from '../components/AppCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppLikes } from '../hooks/useAppLikes';
import SEO from '../components/SEO';

const SectionHeader = ({ title }) => (
    <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <div className="section-arrow">
            <ChevronRight size={24} />
        </div>
    </div>
);

// Extended mock data to demonstrate scalability
// Mapped Icons
const ICON_MAP = {
    Music: Music,
    Sparkles: Sparkles,
    Presentation: Presentation,
    Palette: Palette,
    Gamepad2: Gamepad2,
    LayoutGrid: LayoutGrid,
    Zap: Zap,
    Star: Star,
    Clock: Clock,
    Search: Search,
    ChevronRight: ChevronRight,
    Heart: Heart,
    Smile: Smile,
    ShoppingBag: ShoppingBag
};

// Data to seed if not present

const AppsHub = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get('q') || '';
    const pageParam = parseInt(searchParams.get('page')) || 1;

    const [searchQuery, setSearchQuery] = useState(queryParam);
    const [apps, setApps] = useState([]);
    const [currentPage, setCurrentPage] = useState(pageParam);
    const APPS_PER_PAGE = 6;

    const { currentUser } = useAuth();
    const { isLiked, toggleLike } = useAppLikes(currentUser?.uid);

    // Initial Fetch & Update Images
    useEffect(() => {
        const fetchApps = async () => {
            try {
                // Hardcoded Mockup Studio for explicit visibility without Firestore update
                const mockupStudioApp = {
                    id: 'mockup-studio',
                    title: 'Bee Crate',
                    description: 'Deposit a design, harvest surprise honey-mockups.',
                    icon: Presentation, // Using Presentation icon
                    tags: ['design', 'mockup', 'product', '3d'],
                    path: '/mockup-studio',
                    previewImage: 'https://cdn.dreambeesai.com/file/printeregg/app-previews/bee-crate.png',
                    isNew: true
                };

                const quickMockupsApp = {
                    id: 'quick-mockups',
                    title: 'Mockup Maker',
                    description: 'Fast, premium, individually flavored mockup pages.',
                    icon: LayoutGrid, // Using LayoutGrid for variety
                    tags: ['design', 'mockup', 'fast', 'premium'],
                    path: '/quick-mockups',
                    previewImage: '/app-previews/mockup_maker.png',
                    isNew: true
                };

                const memeFormatterApp = {
                    id: 'meme-formatter',
                    title: 'Meme Formatter',
                    description: 'Internet-Shaped Image Processor.',
                    icon: Smile,
                    tags: ['meme', 'fun', 'image', 'tool'],
                    path: '/meme-formatter',
                    previewImage: '/app-previews/meme_formatter.png', // Placeholder or use null
                    isNew: true
                };

                const autoCsvApp = {
                    id: 'auto-csv',
                    title: 'AutoCSV',
                    description: 'Analyze product photos and generate e-commerce CSVs instantly.',
                    icon: ShoppingBag,
                    tags: ['ecommerce', 'csv', 'automation', 'seo'],
                    path: '/autocsv',
                    previewImage: '/app-previews/autocsv.png',
                    isNew: true
                };

                const meowaccApp = {
                    id: 'meowacc',
                    title: 'MeowAcc',
                    description: 'Transform your photos into the cozy, playful, and pastel Y2K MEOWACC aesthetic.',
                    icon: Sparkles,
                    tags: ['cat', 'aesthetic', 'transformer', 'fun'],
                    path: '/meowacc',
                    previewImage: '/app-previews/meowacc.png',
                    isNew: true
                };

                const avatarForgeApp = {
                    id: 'avatar-forge',
                    title: 'Avatar Forge',
                    description: 'Forge premium curated PFP collections with NFT-style aesthetics.',
                    icon: Zap,
                    tags: ['avatar', 'pfp', 'collection', 'nft'],
                    path: '/avatar-forge',
                    previewImage: '/app-previews/avatar_forge.png',
                    isNew: true
                };

                const q = query(collection(db, "apps"), orderBy("order"));
                const querySnapshot = await getDocs(q);

                let loadedApps = [];
                if (!querySnapshot.empty) {
                    loadedApps = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            icon: ICON_MAP[data.icon] || LayoutGrid
                        };
                    });
                }

                // Prepend Quick Mockups, Mockup Studio, Meme Formatter, AutoCSV, MeowAcc & Avatar Forge
                setApps([quickMockupsApp, mockupStudioApp, memeFormatterApp, autoCsvApp, meowaccApp, avatarForgeApp, ...loadedApps]);

            } catch (error) {
                console.error("Error fetching apps:", error);
            }
        };

        fetchApps();
    }, []);

    // Filter Logic
    const filteredApps = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return apps.filter(app => (
            app.title.toLowerCase().includes(query) ||
            app.description.toLowerCase().includes(query) ||
            app.tags.some(tag => tag.toLowerCase().includes(query))
        ));
    }, [searchQuery, apps]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredApps.length / APPS_PER_PAGE);

    const displayedApps = useMemo(() => {
        const startIndex = (currentPage - 1) * APPS_PER_PAGE;
        return filteredApps.slice(startIndex, startIndex + APPS_PER_PAGE);
    }, [filteredApps, currentPage]);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <div className="play-store-container">
            <SEO
                title="App Hub"
                description="Explore our curated collection of AI apps, games, and creative tools. From Mockup Studio to Meme Formatter."
            />
            {/* Background Glows Removed for Minimalist Flat Style */}

            {/* Top Bar with Search */}
            <div className="play-top-bar">
                <div className="search-bar-container">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search apps, games, & inspiration"
                        value={searchQuery}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSearchQuery(val);
                            setSearchParams(prev => {
                                const next = new URLSearchParams(prev);
                                if (val) next.set('q', val);
                                else next.delete('q');
                                next.delete('page'); // Reset page on search
                                return next;
                            }, { replace: true });
                        }}
                    />
                </div>
                <div className="user-avatar">D</div>
            </div>

            {/* Content Area */}
            <div className="play-content">

                {/* Hero Banner */}
                <div className="hero-section">
                    <div className="hero-banner">
                        {/* More organic/warm gradient */}
                        <div className="hero-image" style={{ backgroundImage: 'url(/dreambees_creative_hero.png)' }}></div>
                        <div className="hero-content">
                            <div className="hero-tag">FEATURED UPDATE</div>
                            <h1 className="hero-title">DreamBees Creative</h1>
                            <p className="hero-subtitle">Turn your wildest ideas into reality. Your personal studio for art, design, and magic.</p>
                            <div className="hero-actions">
                                <Link to="/generate">
                                    <button className="btn-primary">Get Started</button>
                                </Link>
                                <button className="btn-secondary">Learn More</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Explore Apps Grid */}
                <SectionHeader title="Explore Apps" />
                <div className="play-grid-section">
                    {displayedApps.length > 0 ? (
                        displayedApps.map((app) => (
                            <AppCard
                                key={app.id || app.title} // Fallback if no ID, but should have one
                                {...app}
                                isLiked={isLiked(app.id)}
                                likeCount={app.likeCount || 0}
                                onToggleLike={() => toggleLike(app.id)}
                            />
                        ))
                    ) : (
                        <div className="no-results">
                            <p>No apps found matching "{searchQuery}"</p>
                        </div>
                    )}

                    {/* Lab / Experiments Item (Always show at end if matches or just keep separately? Keeping it for now) */}
                    {/* Only show Lab if no search or if it matches generic curiosity */}
                    <div className="app-card coming-soon">
                        <div className="app-card-content">
                            <div className="app-icon-container" style={{ '--card-accent': '#71717A' }}>
                                <div className="app-icon-wrapper">
                                    <Clock size={28} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="app-info">
                                <h3 className="app-title">Lab</h3>
                                <div className="app-category">Experiments</div>
                            </div>
                        </div>
                        <div className="app-footer">
                            <button className="install-btn" disabled>Soon</button>
                        </div>
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="apps-pagination">
                        <button
                            className="page-nav-btn"
                            disabled={currentPage === 1}
                            onClick={() => {
                                const next = currentPage - 1;
                                setCurrentPage(next);
                                setSearchParams(prev => {
                                    const m = new URLSearchParams(prev);
                                    if (next > 1) m.set('page', next);
                                    else m.delete('page');
                                    return m;
                                });
                            }}
                        >
                            <ChevronRight size={20} className="rotate-180" />
                        </button>

                        <div className="page-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    className={`page-num-btn ${currentPage === num ? 'active' : ''}`}
                                    onClick={() => {
                                        setCurrentPage(num);
                                        setSearchParams(prev => {
                                            const m = new URLSearchParams(prev);
                                            if (num > 1) m.set('page', num);
                                            else m.delete('page');
                                            return m;
                                        });
                                    }}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <button
                            className="page-nav-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => {
                                const next = currentPage + 1;
                                setCurrentPage(next);
                                setSearchParams(prev => {
                                    const m = new URLSearchParams(prev);
                                    m.set('page', next);
                                    return m;
                                });
                            }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppsHub;
