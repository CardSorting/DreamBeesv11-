import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Music, Sparkles, Presentation, Star, Clock, Search, ChevronRight, Gamepad2, LayoutGrid, Heart, Smile, Zap } from 'lucide-react';
import './AppsHub.css';

// Components
const AppCard = memo(({ title, description, icon: Icon, path, tags = [], color = "violet", rating = "4.9", isCompact = false }) => {
    // Map internal color names to playful hexes
    const colorMap = {
        violet: "#A78BFA",
        pink: "#F472B6",
        amber: "#FBBF24",
        mint: "#34D399",
        rose: "#FB7185",
        sky: "#38BDF8",
        indigo: "#818CF8",
        blue: "#60A5FA"
    };

    const accentColor = colorMap[color] || colorMap.violet;

    return (
        <Link
            to={path}
            className={`app-card ${isCompact ? 'compact' : ''}`}
            style={{ '--card-accent': accentColor }}
        >
            <div className="app-card-content">
                <div className="app-icon-container">
                    <div className="app-icon-wrapper">
                        <Icon size={isCompact ? 20 : 28} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="app-info">
                    <h3 className="app-title">{title}</h3>
                    <div className="app-category">
                        {tags[0] || "Creative"}
                        {rating && (
                            <span className="app-rating">
                                {rating} <Star className="rating-star" size={10} fill="currentColor" />
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {!isCompact && (
                <>
                    <p className="app-description">
                        {description}
                    </p>

                    <div className="app-footer">
                        <button className="install-btn">Open</button>
                    </div>
                </>
            )}
        </Link>
    );
});

const SectionHeader = ({ title }) => (
    <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <div className="section-arrow">
            <ChevronRight size={24} />
        </div>
    </div>
);

// Extended mock data to demonstrate scalability
const recommendedApps = [
    {
        title: "Karaoke Party",
        description: "Sing your heart out with visual effects that react to your voice.",
        icon: Music,
        path: "/karaoke",
        color: "violet",
        tags: ["Music & Audio"],
        rating: "4.9"
    },
    {
        title: "Magic Wardrobe",
        description: "Try on digital outfits instantly. Your style, reimagined.",
        icon: Sparkles,
        path: "/dressup",
        color: "pink",
        tags: ["Lifestyle"],
        rating: "4.8"
    },
    {
        title: "Story Slides",
        description: "Turn ideas into beautiful presentations in seconds.",
        icon: Presentation,
        path: "/slideshow",
        color: "mint",
        tags: ["Productivity"],
        rating: "4.7"
    },
    {
        title: "Dream Canvas",
        description: "Generative art for everyone. Sketch, dream, and create.",
        icon: Palette,
        path: "/generate",
        color: "sky",
        tags: ["Art & Design"],
        rating: "4.6"
    },
    {
        title: "Pixel Sprite",
        description: "Make retro game assets for your next adventure.",
        icon: Gamepad2,
        path: "/generate",
        color: "indigo",
        tags: ["Game Dev"],
        rating: "4.9"
    },
    {
        title: "Beat Maker",
        description: "Compose lofi beats in seconds.",
        icon: Music,
        path: "/karaoke",
        color: "amber",
        tags: ["Music"],
        rating: "4.5"
    },
    {
        title: "Icon Gen",
        description: "Create app icons with AI.",
        icon: LayoutGrid,
        path: "/generate",
        color: "rose",
        tags: ["Design"],
        rating: "4.8"
    },
    {
        title: "Code Assistant",
        description: "Debug your code with a smile.",
        icon: Zap,
        path: "/",
        color: "blue",
        tags: ["Dev"],
        rating: "4.9"
    },
    {
        title: "Video Editor",
        description: "Edit videos like a pro directly in browser.",
        icon: LayoutGrid, // Using fallback icon
        path: "/generate",
        color: "violet",
        tags: ["Video"],
        rating: "4.7"
    },
    {
        title: "Note Master",
        description: "Keep your thoughts organized.",
        icon: Presentation, // Fallback
        path: "/",
        color: "amber",
        tags: ["Productivity"],
        rating: "4.6"
    },
    {
        title: "Sound Labs",
        description: "Experiment with synthetic audio.",
        icon: Music,
        path: "/",
        color: "sky",
        tags: ["Music"],
        rating: "4.8"
    },
    {
        title: "Dev Tools",
        description: "Essential utilities for developers.",
        icon: Zap,
        path: "/",
        color: "indigo",
        tags: ["Dev"],
        rating: "4.9"
    }
];

const AppsHub = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(3); // Start with 3 items for better density
    const loaderRef = useRef(null);

    // Filter Logic
    const filteredApps = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return recommendedApps.filter(app => (
            app.title.toLowerCase().includes(query) ||
            app.description.toLowerCase().includes(query) ||
            app.tags.some(tag => tag.toLowerCase().includes(query))
        ));
    }, [searchQuery]);

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
                        <div className="hero-image" style={{ background: '#4f46e5' }}></div>
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
                        displayedApps.map((app, idx) => (
                            <AppCard key={idx} {...app} />
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
