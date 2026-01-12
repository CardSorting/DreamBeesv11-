import React, { useEffect, useState, useMemo } from 'react';
import SEO from '../components/SEO';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { ArrowLeft, Loader2, BadgeCheck, Zap, Settings, LayoutGrid, Music, Sparkles, Presentation, Hexagon, Home } from 'lucide-react';
import { getOptimizedImageUrl, preloadImage } from '../utils';
import FeedPost from '../components/FeedPost';
import ShowcaseModal from '../components/ShowcaseModal';

const Sidebar = ({ activeId }) => {
    const navLinks = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/generate', label: 'Studio', icon: Zap },
        { path: '/models', label: 'Engine', icon: Settings },
        { path: '/gallery', label: 'Gallery', icon: LayoutGrid },
        { path: '/karaoke', label: 'Karaoke', icon: Music },
        { path: '/dressup', label: 'Dress Up', icon: Sparkles },
        { path: '/slideshow', label: 'Infographic', icon: Presentation },
        { path: '/pricing', label: 'Refill', icon: Hexagon },
    ];

    return (
        <aside className="feed-sidebar-left">
            <Link to="/" className="sidebar-logo">
                <Hexagon size={24} fill="white" />
                <span className="logo-text">DreamBees</span>
            </Link>

            <nav className="sidebar-nav">
                {navLinks.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`sidebar-link ${activeId === link.path ? 'active' : ''}`}
                    >
                        <link.icon size={22} />
                        <span className="link-label">{link.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

const SuggestedPanel = ({ currentModel, availableModels }) => {
    const suggestions = useMemo(() => {
        return availableModels
            .filter(m => m.id !== currentModel?.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
    }, [currentModel, availableModels]);

    return (
        <aside className="feed-sidebar-right">
            <h3 className="section-title">SUGGESTED FOR YOU</h3>
            <div className="suggestions-list">
                {suggestions.map(m => (
                    <Link key={m.id} to={`/model/${m.id}/feed`} className="suggestion-item">
                        <div className="suggestion-avatar">
                            <img src={m.image} alt={m.name} />
                        </div>
                        <div className="suggestion-info">
                            <div className="suggestion-name">
                                {m.name}
                                <BadgeCheck size={12} className="text-blue-500 fill-blue-500" />
                            </div>
                            <div className="suggestion-meta">Recommended model</div>
                        </div>
                        <button className="suggestion-action">Link</button>
                    </Link>
                ))}
            </div>

            <footer className="panel-footer">
                <p>© 2026 DreamBees AI</p>
                <div className="footer-links">
                    <span>About</span> · <span>Help</span> · <span>Press</span> · <span>API</span> · <span>Jobs</span> · <span>Privacy</span> · <span>Terms</span>
                </div>
            </footer>
        </aside>
    );
};

export default function ModelFeed() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { availableModels, showcaseCache, getShowcaseImages, rateShowcaseImage } = useModel();
    const [showcaseImages, setShowcaseImages] = useState(() => {
        return (id && showcaseCache[id]) ? showcaseCache[id] : [];
    });
    const [displayPage, setDisplayPage] = useState(2);
    const [activeShowcaseImage, setActiveShowcaseImage] = useState(null);
    const imagesPerPage = 12;

    const model = useMemo(() => {
        if (availableModels.length > 0) {
            return availableModels.find(m => m.id === id) || null;
        }
        return null;
    }, [id, availableModels]);

    useEffect(() => {
        if (!model) return;

        const loadShowcase = async () => {
            try {
                const images = await getShowcaseImages(model.id);
                if (images && images.length > 0) {
                    setShowcaseImages(images);
                    images.slice(0, 4).forEach(img => {
                        const preloadUrl = getOptimizedImageUrl(img.thumbnailUrl || img.url || img.imageUrl);
                        preloadImage(preloadUrl, 'high');
                    });
                }
            } catch (error) {
                console.error("Error fetching showcase:", error);
            }
        };

        loadShowcase();
    }, [model, getShowcaseImages]);

    const imagesToRender = useMemo(() => {
        const seenUrls = new Set();
        return (showcaseImages || [])
            .filter(img => {
                if (!img || !img.url || typeof img.url !== 'string' || img.url.length <= 5) return false;
                if (seenUrls.has(img.url)) return false;
                seenUrls.add(img.url);
                return true;
            })
            .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }, [showcaseImages]);

    const visibleImages = useMemo(() => {
        return imagesToRender.slice(0, displayPage * imagesPerPage);
    }, [imagesToRender, displayPage]);

    useEffect(() => {
        if (!model) return;
        let timeoutId;
        const handleScroll = () => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                const scrollPos = window.innerHeight + window.scrollY;
                const threshold = document.body.offsetHeight - 1200;
                if (scrollPos >= threshold && visibleImages.length < imagesToRender.length) {
                    setDisplayPage(prev => prev + 1);
                }
                timeoutId = null;
            }, 150);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [visibleImages.length, imagesToRender.length, model]);

    if (!model) {
        return (
            <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                <div className="loading-pulse">LOADING FEED...</div>
            </div>
        );
    }

    return (
        <div className="feed-layout-wrapper">
            <SEO
                title={`${model.name} Feed - DreamBees`}
                description={`Instagram-style showcase feed for the ${model.name} AI model.`}
            />

            <Sidebar />

            <main className="feed-main-content">
                {/* Mobile Header */}
                <header className="mobile-feed-header">
                    <button onClick={() => navigate(`/model/${id}`)} className="back-btn">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="header-title">
                        <span>{model.name} Feed</span>
                        <BadgeCheck size={16} className="text-blue-500 fill-blue-500" />
                    </div>
                </header>

                <div className="feed-posts-container">
                    {visibleImages.map((imgItem, index) => (
                        <FeedPost
                            key={imgItem.id || index}
                            imgItem={imgItem}
                            index={index}
                            model={model}
                            getOptimizedImageUrl={getOptimizedImageUrl}
                            rateShowcaseImage={rateShowcaseImage}
                            navigate={navigate}
                            setActiveShowcaseImage={setActiveShowcaseImage}
                        />
                    ))}

                    {visibleImages.length < imagesToRender.length && (
                        <div className="feed-loader">
                            <Loader2 size={16} className="animate-spin" /> LOADING CONTENT
                        </div>
                    )}
                </div>
            </main>

            <SuggestedPanel currentModel={model} availableModels={availableModels} />

            {activeShowcaseImage && (
                <ShowcaseModal
                    image={activeShowcaseImage}
                    model={model}
                    onClose={() => setActiveShowcaseImage(null)}
                />
            )}

            <style>{`
                .feed-layout-wrapper {
                    display: flex;
                    justify-content: center;
                    background: #000;
                    min-height: 100vh;
                    color: #fff;
                }

                /* Sidebar Left */
                .feed-sidebar-left {
                    width: 245px;
                    height: 100vh;
                    position: sticky;
                    top: 0;
                    padding: 20px 12px 20px 24px;
                    border-right: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    text-decoration: none;
                    color: #fff;
                }

                .logo-text {
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.05em;
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    border-radius: 8px;
                    text-decoration: none;
                    color: #fff;
                    transition: background 0.2s, transform 0.1s;
                }

                .sidebar-link:hover {
                    background: rgba(255,255,255,0.05);
                    transform: scale(1.02);
                }

                .link-label {
                    font-size: 1rem;
                    font-weight: 500;
                }

                /* Main Content */
                .feed-main-content {
                    width: 100%;
                    max-width: 630px;
                    min-height: 100vh;
                }

                .mobile-feed-header {
                    display: none;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(20px);
                    padding: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    align-items: center;
                    gap: 16px;
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 700;
                }

                .feed-posts-container {
                    padding: 40px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                }

                .feed-loader {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 12px;
                    padding: 40px 0;
                    color: rgba(255,255,255,0.3);
                    font-size: 0.8rem;
                    letter-spacing: 0.1em;
                }

                /* Sidebar Right */
                .feed-sidebar-right {
                    width: 320px;
                    padding: 40px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .section-title {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 8px;
                }

                .suggestions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .suggestion-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    color: #fff;
                }

                .suggestion-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .suggestion-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .suggestion-info {
                    flex: 1;
                }

                .suggestion-name {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.9rem;
                    font-weight: 700;
                }

                .suggestion-meta {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.4);
                }

                .suggestion-action {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #0095f6;
                    background: none;
                    border: none;
                    cursor: pointer;
                }

                .panel-footer {
                    margin-top: 40px;
                    color: rgba(255,255,255,0.2);
                    font-size: 0.7rem;
                }

                .footer-links {
                    margin-top: 12px;
                    line-height: 1.5;
                }

                /* Responsive */
                @media (max-width: 1160px) {
                    .feed-sidebar-right { display: none; }
                }

                @media (max-width: 900px) {
                    .feed-sidebar-left { 
                        width: 72px; 
                        padding: 20px 8px; 
                        align-items: center;
                    }
                    .logo-text, .link-label { display: none; }
                    .sidebar-logo { padding: 8px; }
                }

                @media (max-width: 600px) {
                    .feed-sidebar-left { display: none; }
                    .mobile-feed-header { display: flex; }
                    .feed-posts-container { padding: 0; gap: 0; }
                    .feed-layout-wrapper { background: #000; }
                }

                @keyframes fadeInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
