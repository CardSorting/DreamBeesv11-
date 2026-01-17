import React, { useEffect, useState, useMemo, useRef } from 'react';
import SEO from '../components/SEO';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import AppCard from '../components/AppCard';
import { ArrowLeft, Loader2, BadgeCheck, Zap, Settings, LayoutGrid, Music, Sparkles, Presentation, Hexagon, Home, ChevronDown, ChevronRight, LayoutTemplate, User, Film, Palette, Gamepad2, Star, Clock, Search, Heart, Smile } from 'lucide-react';
import { getOptimizedImageUrl, preloadImage } from '../utils';
import FeedPost from '../components/FeedPost';
import ShowcaseModal from '../components/ShowcaseModal';
import { useAppLikes } from '../hooks/useAppLikes';

const FeedPostSkeleton = () => (
    <div className="post-skeleton animate-pulse">
        <div className="sk-header">
            <div className="sk-avatar" />
            <div className="sk-name" />
        </div>
        <div className="sk-image" />
        <div className="sk-footer">
            <div className="sk-line" />
            <div className="sk-line" style={{ width: '40%' }} />
        </div>
    </div>
);

const CollapsibleGroup = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="nav-group">
            <button
                className="sidebar-group-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="group-title-text">{title}</span>
                {isOpen ? <ChevronDown size={14} className="group-chevron" /> : <ChevronRight size={14} className="group-chevron" />}
            </button>
            <div className={`group-content ${isOpen ? 'open' : ''}`}>
                {children}
            </div>
        </div>
    );
};

import Sidebar from '../components/Sidebar';

// Mapped Icons for Apps
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



const SuggestedPanel = ({ currentModel, availableModels, setActiveFilter }) => {
    const [featuredApps, setFeaturedApps] = useState([]);

    // Only fetch featured model for Logic, remove suggestions
    const [featuredModel, setFeaturedModel] = useState(null);

    const { currentUser } = useAuth();
    const { isLiked, toggleLike } = useAppLikes(currentUser?.uid);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                // Fetch top apps (we fetch by order for now, but in future could be by likeCount)
                // We'll fetch slightly more to sort client side if needed, or just rely on 'order' being manually curated for now as 'Featured'
                // The user asked for "most featured" based on popularity.
                // Let's try to order by likeCount if possible, or fallback.
                // Safest: Fetch by order, but maybe sort by likes if they exist?
                // Actually, let's stick to "order" to ensure list isn't empty, but allow liking.
                const q = query(collection(db, "apps"), orderBy("order"), limit(10));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const loadedApps = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            icon: ICON_MAP[data.icon] || LayoutGrid // Map string to component
                        };
                    });

                    // Client-side sort by popularity (likes) then order
                    loadedApps.sort((a, b) => {
                        const likesA = a.likeCount || 0;
                        const likesB = b.likeCount || 0;
                        if (likesA !== likesB) return likesB - likesA;
                        return (a.order || 999) - (b.order || 999);
                    });

                    setFeaturedApps(loadedApps.slice(0, 5));
                }
            } catch (error) {
                console.error("Error fetching apps:", error);
            }
        };

        fetchApps();
    }, []);

    useEffect(() => {
        if (!availableModels || availableModels.length === 0) return;

        const filtered = availableModels.filter(m => m.id !== currentModel?.id);
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());

        setFeaturedModel(shuffled[0]);
    }, [availableModels, currentModel]);

    // Cleanup: Removed suggestions/popularTags destructuring since we removed the state
    // const { suggestions, featuredModel, popularTags } = suggestedData;

    // We render even if availableModels is empty, to show apps
    // if (!availableModels || availableModels.length === 0) return null; 

    return (
        <aside className="feed-sidebar-right">
            {/* Featured Apps Section - Enhanced Styling */}
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
                        // Skeleton loader for apps
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
                            <img src={featuredModel.image} alt={featuredModel.name} className="spotlight-bg" />
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



            {/* Popular Tags */}


            <style>{`
                .sidebar-section {
                    margin-bottom: 24px;
                }
                
                .inline-icon {
                    display: inline-block;
                    margin-right: 6px;
                    margin-bottom: 2px;
                    color: #fbbf24;
                }

                .spotlight-card {
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    aspect-ratio: 16/10;
                    border: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 8px;
                }
                .spotlight-bg {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }
                .spotlight-card:hover .spotlight-bg {
                    transform: scale(1.05);
                }
                .spotlight-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
                }
                .spotlight-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                }
                .spotlight-badge {
                    background: #f59e0b;
                    color: #000;
                    font-size: 0.65rem;
                    font-weight: 800;
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .spotlight-name {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .spotlight-desc {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.8);
                    margin: 0 0 8px 0;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                .spotlight-btn {
                    background: #fff;
                    color: #000;
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 6px 14px;
                    border-radius: 99px;
                    text-decoration: none;
                }

                .suggestion-follow-btn {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border: none;
                    border-radius: 99px;
                    padding: 6px 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .suggestion-follow-btn:hover {
                    background: #fff;
                    color: #000;
                }

                .sidebar-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                .sidebar-tag {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.6);
                    padding: 5px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .sidebar-tag:hover {
                    background: rgba(255,255,255,0.15);
                    color: #fff;
                    border-color: rgba(255,255,255,0.2);
                }

                .suggestion-link-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    color: inherit;
                    flex: 1;
                    min-width: 0;
                }
            `}</style>

            <footer className="panel-footer">
                <p>© 2026 DreamBees AI</p>
                <div className="footer-links">
                    <span>About</span> · <span>Help</span> · <span>Press</span> · <span>API</span> · <span>Jobs</span> · <span>Privacy</span> · <span>Terms</span>
                </div>
            </footer>
        </aside>
    );
};
const SuggestedPanelMemo = React.memo(SuggestedPanel);

export default function ModelFeed() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { availableModels, getShowcaseImages, getGlobalShowcaseImages, rateShowcaseImage, getUserVideos, globalShowcaseCache, showcaseCache } = useModel();

    // "feedItems" is the master list of all content, shuffled or sorted
    // Initialize from cache if available to prevent flash of loading
    const [feedItems, setFeedItems] = useState(() => {
        if (!id && globalShowcaseCache) return globalShowcaseCache;
        if (id && showcaseCache[id]) return showcaseCache[id];
        return [];
    });

    // Separate video state (fetched once)
    const [videos, setVideos] = useState([]);

    // Loading state - false if we have data already
    const [isLoading, setIsLoading] = useState(() => {
        if (!id && globalShowcaseCache) return false;
        if (id && showcaseCache[id]) return false;
        return true;
    });

    const [displayPage, setDisplayPage] = useState(2);
    const [activeShowcaseImage, setActiveShowcaseImage] = useState(null);
    const imagesPerPage = 12;

    const location = useLocation();

    const [activeFilter, setActiveFilter] = useState(() => {
        return location.pathname === '/videos' ? 'Videos' : 'All';
    });

    useEffect(() => {
        if (location.pathname === '/videos') {
            setActiveFilter('Videos');
        } else if (location.pathname === '/' && activeFilter === 'Videos') {
            setActiveFilter('All');
        }
    }, [location.pathname]);

    const [sortMode, setSortMode] = useState('random'); // 'random' | 'top'

    const model = useMemo(() => {
        if (!id) return { name: "Global", image: "/dreambees_icon.png" }; // Virtual model for Global Feed
        if (availableModels.length > 0) {
            return availableModels.find(m => m.id === id) || null;
        }
        return null;
    }, [id, availableModels]);

    // --- Helper: Stable Shuffle ---
    const shuffleArray = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    // Track initialization to prevent duplicate fetches on navigation
    const hasInitializedRef = useRef(false);
    const lastIdRef = useRef(id);

    // --- Data Loading Effect ---
    useEffect(() => {
        // Reset initialization when id changes (navigating to different model)
        if (lastIdRef.current !== id) {
            hasInitializedRef.current = false;
            lastIdRef.current = id;
        }

        // Skip if already initialized for this id
        if (hasInitializedRef.current) {
            console.log("[ModelFeed] Already initialized, skipping duplicate fetch");
            return;
        }

        const loadShowcase = async () => {
            // Mark as initialized immediately to prevent race conditions
            hasInitializedRef.current = true;

            // Reset state ONLY if we don't have cache, to prevent white flash
            const hasCache = (!id && globalShowcaseCache?.length > 0) || (id && showcaseCache[id]);
            if (!hasCache) {
                setFeedItems([]);
                setIsLoading(true);
            }

            try {
                let images = [];
                if (id) {
                    // Single Model Mode
                    if (!model || model.name === "Global") return; // Wait for model resolution
                    console.log(`[ModelFeed] Loading showcase for model: ${model.id}`);
                    images = await getShowcaseImages(model.id);
                } else {
                    // Global Feed Mode - context handles deduplication
                    console.log("[ModelFeed] Loading global showcase");
                    images = await getGlobalShowcaseImages(false, 'modelfeed_init');
                }

                if (images && images.length > 0) {
                    // Initial Sort/Shuffle
                    let processedImages = [...images];

                    // Default to shuffle for variety
                    processedImages = shuffleArray(processedImages);

                    setFeedItems(processedImages);

                    // --- Curated Video Logic (Only fetch once) ---
                    const CURATED_USER_ID = 'prT9j3royVTstWLDDcKMoUOU7aQ2';
                    const curatedVideos = await getUserVideos(CURATED_USER_ID);

                    if (curatedVideos && curatedVideos.length > 0) {
                        setVideos(curatedVideos);
                    }

                    // Preload top 4 images from the PROCESSED list
                    processedImages.slice(0, 4).forEach(img => {
                        if (img.type !== 'video') {
                            const preloadUrl = getOptimizedImageUrl(img.thumbnailUrl || img.url || img.imageUrl);
                            preloadImage(preloadUrl, 'high');
                        }
                    });
                }
            } catch (error) {
                console.error("Error fetching showcase:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Initialize immediately - don't wait for models to load for Global Feed
        loadShowcase();

        // Cleanup: reset on unmount
        return () => {
            // Only reset if this is the same id (not during navigation)
            if (lastIdRef.current === id) {
                hasInitializedRef.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, model?.id, getShowcaseImages, getGlobalShowcaseImages, getUserVideos]); // Use model?.id instead of availableModels.length



    const allTags = useMemo(() => {
        const tags = new Set();
        // Only collect tags from models that actually have images in the current feed
        // Use feedItems (or just availableModels if we want ALL tags)
        // Let's us feedItems to be accurate about what's actually displayable
        const activeModelIds = new Set(feedItems.map(img => img.modelId));

        availableModels.forEach(m => {
            if (activeModelIds.has(m.id) && Array.isArray(m.tags)) {
                m.tags.forEach(t => tags.add(t));
            }
        });
        return Array.from(tags).sort();
    }, [availableModels, feedItems]); // Re-calc tags only if base data changes

    // --- Derived Data for Render ---
    // Helper: Validate if a URL is potentially loadable
    const isValidImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        if (url.length < 10) return false; // Too short to be a real URL
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:')) return true;
        return false;
    };

    const imagesToRender = useMemo(() => {
        // SELECT SOURCE
        let sourceData = activeFilter === 'Videos' ? videos : feedItems;

        const seenUrls = new Set();
        let filtered = (sourceData || [])
            .filter(img => {
                if (!img) return false;

                // Check for a valid URL in either url or imageUrl field
                const primaryUrl = img.url || img.imageUrl;
                if (!isValidImageUrl(primaryUrl)) return false;

                // Dedupe by URL
                if (seenUrls.has(primaryUrl)) return false;
                seenUrls.add(primaryUrl);
                return true;
            })
            .map(img => {
                // Attach model if missing (essential for filtering by tag)
                if (!id && img.modelId) {
                    const sourceModel = availableModels.find(m => m.id === img.modelId);
                    if (sourceModel) {
                        return { ...img, _model: sourceModel };
                    }
                }
                return img;
            });

        // Filter Logic
        if (!id && activeFilter !== 'All' && activeFilter !== 'Videos') {
            filtered = filtered.filter(img => {
                // Check Model Tags
                const modelTags = img._model?.tags || [];
                if (modelTags.includes(activeFilter)) return true;

                // Check Discovery Vibe Tags (NEW)
                const vibeTags = img.discovery?.vibeTags || [];
                if (vibeTags.includes(activeFilter)) return true;

                // Check explicit Tags
                if (img.tags && img.tags.includes(activeFilter)) return true;

                return false;
            });
        }

        // Sort Logic (Applied on top of filtered results)
        // If 'random', we rely on the pre-shuffled order of `feedItems`.
        // If 'top', we sort specifically.
        if (sortMode === 'top') {
            return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        // If random, we just return the filtered list (which preserves the initial shuffle order)
        return filtered;
    }, [feedItems, videos, id, availableModels, activeFilter, sortMode]);

    // Manual Shuffle Handler
    const handleShuffle = () => {
        setSortMode('random');
        setFeedItems(prev => shuffleArray(prev));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

            <Sidebar activeId={id ? `/models` : location.pathname} /> {/* Dynamic active ID */}

            <main className="feed-main-content">
                {/* Mobile Header */}
                <header className="mobile-feed-header">
                    <button onClick={() => navigate(`/model/${id}`)} className="back-btn">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="header-title">
                        <span>{id ? `${model?.name} Feed` : 'THE HIVE'}</span>
                        <BadgeCheck size={16} className="text-blue-500 fill-blue-500" />
                    </div>
                </header>

                {/* Filter & Sort Bar (Global Only) */}


                <div className="feed-posts-container">
                    {visibleImages.map((imgItem, index) => (
                        <FeedPost
                            key={imgItem.id || index}
                            imgItem={imgItem}
                            index={index}
                            model={model.name === "Global" ? (imgItem._model || availableModels.find(m => m.id === imgItem.modelId) || model) : model}
                            getOptimizedImageUrl={getOptimizedImageUrl}
                            rateShowcaseImage={rateShowcaseImage}
                            navigate={navigate}
                            setActiveShowcaseImage={setActiveShowcaseImage}
                        />
                    ))}

                    {isLoading && (
                        <div className="feed-loader-skeletons">
                            {[...Array(3)].map((_, i) => <FeedPostSkeleton key={i} />)}
                        </div>
                    )}

                    {!isLoading && visibleImages.length === 0 && (
                        <div className="empty-feed-state">
                            <Sparkles size={48} />
                            <h3>No posts found</h3>
                            <p>Try adjusting your filters or check back later.</p>
                            <button onClick={() => setActiveFilter('All')} className="reset-filter-btn">
                                Clear Filters
                            </button>
                        </div>
                    )}

                    {!isLoading && visibleImages.length > 0 && visibleImages.length < imagesToRender.length && (
                        <div className="feed-loader-skeletons">
                            {[...Array(1)].map((_, i) => <FeedPostSkeleton key={i} />)}
                        </div>
                    )}
                </div>
            </main>

            <SuggestedPanelMemo
                currentModel={model}
                availableModels={availableModels}
                setActiveFilter={setActiveFilter}
            />

            {activeShowcaseImage && (
                <ShowcaseModal
                    image={activeShowcaseImage}
                    model={model}
                    onClose={() => setActiveShowcaseImage(null)}
                />
            )}

            <style>{`
                .empty-feed-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    text-align: center;
                    color: rgba(255,255,255,0.4);
                    gap: 16px;
                }
                .empty-feed-state h3 {
                    color: #fff;
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin: 0;
                }
                .empty-feed-state p {
                    font-size: 0.9rem;
                    margin: 0;
                }
                .reset-filter-btn {
                    margin-top: 12px;
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 99px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .reset-filter-btn:hover {
                    transform: scale(1.05);
                }

                .feed-layout-wrapper {
                    display: flex;
                    justify-content: center;
                    background: #000;
                    min-height: 100vh;
                    color: #fff;
                }

                .feed-filter-bar {
                    position: sticky;
                    top: 0;
                    z-index: 90;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding: 12px 16px;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                
                @media (max-width: 600px) {
                    .feed-filter-bar { top: 60px; /* Below mobile header */ }
                }

                .filter-scroll {
                    flex: 1;
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .filter-scroll::-webkit-scrollbar { display: none; }

                .filter-chip {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: rgba(255,255,255,0.7);
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .filter-chip:hover { background: rgba(255,255,255,0.2); color: #fff; }
                .filter-chip.active { background: #fff; color: #000; }

                .sort-toggle {
                    display: flex;
                    gap: 4px;
                    background: rgba(255,255,255,0.1);
                    padding: 4px;
                    border-radius: 8px;
                }
                .sort-btn {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.5);
                    padding: 6px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                }
                .sort-btn.active { background: rgba(255,255,255,0.1); color: #fff; }

                /* Sidebar Left */
                .feed-sidebar-left {
                    width: 245px;
                    height: 100vh;
                    position: sticky;
                    top: 0;
                    padding: 32px 24px 20px 24px;
                    border-right: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    flex-direction: column;
                    gap: 36px;
                }


                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 0 12px;
                    text-decoration: none;
                    color: #fff;
                    margin-bottom: 8px;
                }

                .logo-text {
                    font-family: 'Outfit', sans-serif; /* Assuming font is available */
                    font-size: 1.6rem;
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    background: linear-gradient(135deg, #fff 0%, #ccc 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 14px 12px;
                    border-radius: 12px;
                    text-decoration: none;
                    color: rgba(255,255,255,0.6);
                    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
                    font-weight: 500;
                }

                .sidebar-link:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                    transform: translateX(4px);
                }
                
                .sidebar-link.active {
                    color: #fff;
                    font-weight: 700;
                }
                .sidebar-link.active svg {
                    stroke-width: 3px;
                }

                .link-label {
                    font-size: 1.05rem;
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
                    padding: 40px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 24px; /* Slightly tighter gap */
                    align-items: center;
                }

                /* SKELETON LOADER */
                .feed-loader-skeletons {
                    width: 100%;
                    max-width: 470px; /* Match feed post width roughly */
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 20px 0;
                }
                
                .post-skeleton {
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .sk-header {
                    height: 56px;
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                    gap: 10px;
                }
                .sk-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.08); }
                .sk-name { width: 100px; height: 14px; border-radius: 4px; background: rgba(255,255,255,0.08); }
                .sk-image {
                    width: 100%;
                    aspect-ratio: 4/5;
                    background: rgba(255,255,255,0.05);
                }
                .sk-footer { height: 60px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
                .sk-line { height: 12px; border-radius: 4px; background: rgba(255,255,255,0.08); width: 60%; }
                
                .animate-pulse {
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }

                /* Sidebar Right */
                .feed-sidebar-right {
                    width: 360px; /* Slightly wider */
                    padding: 42px 40px; /* More padding */
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .feed-sidebar-right::-webkit-scrollbar { display: none; }

                .section-title {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 8px;
                    letter-spacing: 0.05em;
                }

                .suggestions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .suggestion-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    color: #fff;
                    padding: 4px 0;
                    margin-left: -8px; 
                    padding: 8px;
                    border-radius: 8px;
                    transition: background 0.2s;
                }
                .suggestion-item:hover {
                    background: rgba(255,255,255,0.05);
                }

                .suggestion-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.1);
                    flex-shrink: 0;
                }

                .suggestion-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .suggestion-info {
                    flex: 1;
                    min-width: 0; /* Text truncation handling */
                }

                .suggestion-name {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .suggestion-meta {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.4);
                    margin-top: 2px;
                }

                .suggestion-action {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #0095f6;
                    background: none;
                    border: none;
                    cursor: pointer;
                    white-space: nowrap;
                }
                .suggestion-action:hover {
                    color: #fff;
                }

                .panel-footer {
                    margin-top: 24px;
                    color: rgba(255,255,255,0.2);
                    font-size: 0.75rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding-top: 24px;
                }

                .footer-links {
                    margin-top: 12px;
                    line-height: 1.6;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px 12px;
                }
                .footer-links span {
                    cursor: pointer;
                }
                .footer-links span:hover {
                    text-decoration: underline;
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
                    .sidebar-logo { padding: 8px; justify-content: center; margin-bottom: 24px; }
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
