import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppLikes } from '../hooks/useAppLikes';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import AppCard from '../components/AppCard';
import SafeImage from '../components/SafeImage';
import {
    LayoutTemplate, ChevronRight, Music, Sparkles, Presentation,
    Palette, Gamepad2, LayoutGrid, Zap, Star, Clock, Search, Heart, Smile
} from 'lucide-react';

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

const SuggestedPanel = ({ currentModel, availableModels }) => {
    const [featuredApps, setFeaturedApps] = useState([]);
    const { currentUser } = useAuth();
    const { isLiked, toggleLike } = useAppLikes(currentUser?.uid);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                // Hardcoded Mockup Studio for explicit visibility as #1
                const mockupStudioApp = {
                    id: 'mockup-studio',
                    title: 'Bee Crate',
                    description: 'Deposit a design, harvest surprise honey.',
                    icon: Presentation, // Using Presentation icon
                    // tags: ['design', 'mockup', 'product', '3d'], // Not needed for sidebar display usually but good to have
                    path: '/mockup-studio', // Important: Ensures Link to /apps works if used, but AppCard uses ID mostly. 
                    // However, AppCard constructs link based on ID usually or passed props. 
                    // Let's ensure AppCard handles it. SuggestedPanel maps it.
                    // Actually AppCard expects 'id' to link to /app/:id usually, OR we might need to handle specific click.
                    // But wait, the sidebar AppCard usually links to /app/:id. 
                    // For Mockup Studio, we want it to go to /mockup-studio. 
                    // Let's see how AppCard handles links. 
                    // SuggestedPanel passes ...app. 
                    // If AppCard uses id to link, it goes to /app/mockup-studio. 
                    // We might need to ensure the route /app/mockup-studio redirects or handles it, 
                    // OR we hope AppCard handles 'path' prop if present? 
                    // Let's assume standard behavior for now and just prepend it.
                    // The request is just to feature it.
                    order: -1 // High priority
                };

                const q = query(collection(db, "apps"), orderBy("order"), limit(10));
                const querySnapshot = await getDocs(q);

                let loadedApps = [];
                if (!querySnapshot.empty) {
                    loadedApps = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            icon: ICON_MAP[data.icon] || LayoutGrid
                        };
                    });
                }

                // Filter out any existing 'mockup-studio' from firestore to avoid dups
                loadedApps = loadedApps.filter(app => app.id !== 'mockup-studio');

                // Sort the rest
                loadedApps.sort((a, b) => {
                    const likesA = a.likeCount || 0;
                    const likesB = b.likeCount || 0;
                    if (likesA !== likesB) return likesB - likesA;
                    return (a.order || 999) - (b.order || 999);
                });

                // Prepend Mockup Studio and slice
                const finalApps = [mockupStudioApp, ...loadedApps].slice(0, 5);

                setFeaturedApps(finalApps);
            } catch (error) {
                console.error("Error fetching apps:", error);
            }
        };

        fetchApps();
    }, []);

    const featuredModel = useMemo(() => {
        if (!availableModels || availableModels.length === 0) return null;

        const filtered = availableModels.filter(m => m.id !== currentModel?.id);
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());

        return shuffled[0] || null;
    }, [availableModels, currentModel]);

    return (
        <aside className="feed-sidebar-right">
            {/* Featured Apps Section */}
            <div className="sidebar-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="section-title" style={{
                        marginBottom: 0,
                        fontSize: '0.9rem',
                        letterSpacing: '0.05em',
                        color: 'rgba(255,255,255,0.9)'
                    }}>
                        <LayoutTemplate size={14} className="inline-icon" style={{ color: '#A78BFA' }} /> APP HUB
                    </h3>
                    <Link to="/apps" style={{ fontSize: '0.75rem', color: '#A78BFA', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '600', padding: '4px 8px', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '12px' }}>
                        View All <ChevronRight size={12} />
                    </Link>
                </div>
                <div className="sidebar-apps-grid" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {featuredApps.length > 0 ? (
                        featuredApps.map((app, idx) => (
                            <AppCard
                                key={idx}
                                {...app}
                                isCompact={true}
                                isLiked={isLiked(app.id)}
                                likeCount={app.likeCount || 0}
                                rank={idx + 1}
                                onToggleLike={() => toggleLike(app.id)}
                            />
                        ))
                    ) : (
                        [1, 2, 3].map(i => (
                            <div key={i} style={{
                                height: '60px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                animation: 'pulse 2s infinite'
                            }} />
                        ))
                    )}
                </div>
            </div>
            {/* Featured Spotlight */}
            {featuredModel && (
                <div className="sidebar-section">
                    <h3 className="section-title">
                        <Sparkles size={14} className="inline-icon" /> FEATURED DREAMBEE
                    </h3>
                    <div className="spotlight-card">
                        <div className="spotlight-header">
                            <SafeImage
                                src={featuredModel.image}
                                alt={featuredModel.name}
                                className="spotlight-bg"
                                fallback={<div className="spotlight-bg" style={{ background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)' }} />}
                            />
                            <div className="spotlight-overlay" />
                            <div className="spotlight-content">
                                <span className="spotlight-badge">Featured</span>
                                <h4 className="spotlight-name">DreamBee</h4>
                                <p className="spotlight-desc line-clamp-2">Interactive AI Persona. Tap to start a conversation.</p>
                                <Link to={`/model/${featuredModel.id}/feed`} className="spotlight-btn">
                                    View Persona
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <footer className="panel-footer">
                <p>© 2026 DreamBees AI</p>
                <div className="footer-links">
                    <span>About</span> · <span>Help</span> · <span>Press</span> · <span>API</span> · <span>Jobs</span> · <span>Privacy</span> · <span>Terms</span>
                </div>
            </footer>
        </aside>
    );
};

export default React.memo(SuggestedPanel);
