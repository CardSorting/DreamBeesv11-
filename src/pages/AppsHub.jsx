import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Music, Sparkles, Presentation, Star, Clock, Search, ChevronRight, Gamepad2, LayoutGrid, Heart, Smile, Zap } from 'lucide-react';
import './AppsHub.css';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure this path is correct based on project structure

// Components
import AppCard from '../components/AppCard';
import { useAuth } from '../contexts/AuthContext';
import { useAppLikes } from '../hooks/useAppLikes';

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
    Smile: Smile
};

// Data to seed if not present

const AppsHub = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [apps, setApps] = useState([]);
    const [visibleCount, setVisibleCount] = useState(3);

    const loaderRef = useRef(null);

    const { currentUser } = useAuth();
    const { isLiked, toggleLike } = useAppLikes(currentUser?.uid);

    // Initial Fetch & Update Images
    useEffect(() => {
        const fetchApps = async () => {
            try {
                const q = query(collection(db, "apps"), orderBy("order"));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const loadedApps = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id, // Ensure ID is captured
                            ...data,
                            icon: ICON_MAP[data.icon] || LayoutGrid // Map string to component
                        };
                    });
                    setApps(loadedApps);
                }
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
    const displayedApps = useMemo(() => filteredApps.slice(0, visibleCount), [filteredApps, visibleCount]);
    const hasMore = visibleCount < filteredApps.length;

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting && hasMore) {
                // Simulate network delay for feel, or just load instantly
                setTimeout(() => {
                    setVisibleCount(prev => prev + 6);
                }, 300); // 300ms delay for "loading" feel
            }
        }, {
            root: null,
            rootMargin: '100px', // Load before user hits bottom
            threshold: 0.1
        });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
        };
    }, [hasMore, filteredApps.length]); // Re-run if dependencies change

    return (
        <div className="play-store-container">
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
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                        <div className="hero-image" style={{ backgroundImage: 'url(/feature_hero_bg.png)' }}></div>
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

                {/* Infinite Scroll Sentinel */}
                {hasMore && (
                    <div ref={loaderRef} className="loading-sentinel">
                        {/* Optional: Add a subtle spinner here if desired, otherwise invisible trigger */}
                        <div className="loading-spinner"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppsHub;
