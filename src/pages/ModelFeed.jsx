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
import SafeImage from '../components/SafeImage';
import './ModelFeed.css';

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



            {/* Popular Tags */}




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
    const { availableModels, getShowcaseImages, getGlobalShowcaseImages, rateShowcaseImage, getUserVideos, globalShowcaseCache, showcaseCache, hasGlobalFeedEnded } = useModel();

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

    const [activeFilter, setActiveFilter] = useState('All');



    // Stable Global Model Object
    const GLOBAL_MODEL = useMemo(() => ({ name: "Global", image: "/dreambees_icon.png" }), []);

    const model = useMemo(() => {
        if (!id) return GLOBAL_MODEL;
        if (availableModels.length > 0) {
            return availableModels.find(m => m.id === id) || null;
        }
        return null; // Return null if waiting for models
    }, [id, availableModels, GLOBAL_MODEL]);

    // --- Helper: Smart Mix (Diversity Shuffle) ---
    const smartMix = (array) => {
        if (!array || array.length === 0) return [];

        // 1. Group by modelId
        const groups = {};
        array.forEach(item => {
            const mId = item.modelId || 'unknown';
            if (!groups[mId]) groups[mId] = [];
            groups[mId].push(item);
        });

        // 2. Interleave with per-round shuffle (Organically Randomized Round Robin)
        const result = [];
        let maxLen = 0;
        const modelIds = Object.keys(groups);
        modelIds.forEach(id => maxLen = Math.max(maxLen, groups[id].length));

        // Create a working copy of IDs to shuffle each round
        let roundIds = [...modelIds];

        for (let i = 0; i < maxLen; i++) {
            // Shuffle the order of models for THIS specific round
            // This prevents "A, B, C, A, B, C" patterns and makes it "A, C, B, C, A, B" etc.
            for (let k = roundIds.length - 1; k > 0; k--) {
                const j = Math.floor(Math.random() * (k + 1));
                [roundIds[k], roundIds[j]] = [roundIds[j], roundIds[k]];
            }

            roundIds.forEach(id => {
                const group = groups[id];
                if (i < group.length) {
                    result.push(group[i]);
                }
            });
        }

        return result;
    };

    // Track initialization to prevent duplicate fetches on navigation
    // We use a ref that survives re-renders but we need to be careful about when we reset it
    const hasInitializedRef = useRef(false);
    const lastIdRef = useRef(id);

    // Track raw fetched count to calculate diffs for mixing
    const fetchedCountRef = useRef(0);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // --- Data Loading Effect ---
    useEffect(() => {
        // Reset initialization when id changes (navigating to different model)
        if (lastIdRef.current !== id) {
            hasInitializedRef.current = false;
            lastIdRef.current = id;
            fetchedCountRef.current = 0; // Reset raw count
        }

        // Skip if already initialized for this id to prevent double-fetching
        if (hasInitializedRef.current) {
            return;
        }

        const loadShowcase = async () => {
            // Mark as initialized immediately
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
                    // Single Model Mode - Fetch using ID directly (don't wait for model metadata)
                    console.log(`[ModelFeed] Loading showcase for model: ${id}`);
                    images = await getShowcaseImages(id);
                } else {
                    // Global Feed Mode - use context's robust fetcher
                    console.log("[ModelFeed] Loading global showcase");
                    images = await getGlobalShowcaseImages(false, 'modelfeed_init');
                }

                if (images && images.length > 0) {
                    // Initial Sort/Shuffle
                    let processedImages = [...images];

                    // Track raw count for paginated diffing
                    fetchedCountRef.current = processedImages.length;

                    // Default to smart mix for diversity
                    processedImages = smartMix(processedImages);

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

        // Initialize immediately - detached from model metadata availability
        loadShowcase();

        // Cleanup: reset on unmount
        // REMOVED cleanup to prevent StrictMode double-fetch

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, getShowcaseImages, getGlobalShowcaseImages, getUserVideos]); // Minimized dependencies





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

        // If random, we just return the filtered list (which preserves the initial shuffle order)
        return filtered;
    }, [feedItems, videos, id, availableModels, activeFilter]);



    const visibleImages = useMemo(() => {
        return imagesToRender.slice(0, displayPage * imagesPerPage);
    }, [imagesToRender, displayPage]);


    // --- Infinite Scroll Logic (Robust Backend Fetching) ---
    const handleLoadMore = async () => {
        if (isFetchingMore || hasGlobalFeedEnded || id) return; // Only global feed supports infinite scroll for now

        try {
            setIsFetchingMore(true);
            // Fetch next page from context
            const allFetchedImages = await getGlobalShowcaseImages(true, 'infinite_scroll');

            // Calculate Diff (New Items Only)
            // We use the raw count ref to know where we left off
            const newImages = allFetchedImages.slice(fetchedCountRef.current);

            if (newImages.length > 0) {
                console.log(`[Infinite Scroll] Found ${newImages.length} new items. Mixing and appending...`);

                // Mix ONLY the new batch to preserve history
                const mixedNewImages = smartMix(newImages);

                // Append
                setFeedItems(prev => [...prev, ...mixedNewImages]);
                fetchedCountRef.current = allFetchedImages.length;
            }
        } catch (err) {
            console.error("Error loading more images:", err);
        } finally {
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        if (!model) return;
        let timeoutId;
        const handleScroll = () => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                const scrollPos = window.innerHeight + window.scrollY;
                const threshold = document.body.offsetHeight - 1200;

                // 1. Local Pagination (Reveal more of what we have)
                if (scrollPos >= threshold && visibleImages.length < imagesToRender.length) {
                    setDisplayPage(prev => prev + 1);
                }

                // 2. Backend Fetch (Get more if we are running low)
                // Trigger if we have shown almost everything we have
                if (!id && scrollPos >= threshold && !isFetchingMore && !hasGlobalFeedEnded) {
                    // Check if we are near the end of the loaded buffer
                    if (visibleImages.length >= imagesToRender.length - 12) { // 1 page buffer
                        handleLoadMore();
                    }
                }

                timeoutId = null;
            }, 150);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutId) clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleImages.length, imagesToRender.length, model, isFetchingMore, hasGlobalFeedEnded]);

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


        </div>
    );
}
