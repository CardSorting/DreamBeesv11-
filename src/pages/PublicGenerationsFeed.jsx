import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Zap, ShieldAlert } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SuggestedPanel from '../components/SuggestedPanel';
import { useModel } from '../contexts/ModelContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FeedPost from '../components/FeedPost';
import { getOptimizedImageUrl } from '../utils';
import { smartMix } from '../utils/feedHelpers'; // Import smartMix
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { isOver18 } from '../utils/age';
import CommunityConsentModal from '../components/CommunityConsentModal';
import '../components/FeedSwitcher/FeedSwitcher.css';
import './ModelFeed.css'; // Import shared styles

const FeedSkeleton = () => (
    <div className="animate-pulse space-y-4 mb-8">
        <div className="h-[400px] w-full bg-zinc-900/50 rounded-2xl border border-white/5" />
        <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-zinc-900/50 rounded-full" />
            <div className="space-y-2">
                <div className="h-4 w-32 bg-zinc-900/50 rounded" />
                <div className="h-3 w-24 bg-zinc-900/50 rounded" />
            </div>
        </div>
    </div>
);

class FeedItemErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Feed Item Corrupted:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Render nothing, effectively hiding the corrupted item
            return null;
        }
        return this.props.children;
    }
}

export default function PublicGenerationsFeed() {
    const navigate = useNavigate();
    const { availableModels } = useModel();
    const { currentUser } = useAuth();
    const { userProfile, isProfileLoaded, hiddenIds, likes, bookmarks, viewedIds } = useUserInteractions();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [focusImage, setFocusImage] = useState(null);
    const isFetchingRef = useRef(false);

    // Routing Params
    const [searchParams, setSearchParams] = useSearchParams();

    const observer = useRef();
    const lastImageElementRef = useRef();

    // Compute Affinity Map (Model Preferences)
    const affinityMap = useMemo(() => {
        const map = {};
        // Weight: Like = 3, Bookmark = 5
        likes.forEach(item => {
            if (item.modelId) map[item.modelId] = (map[item.modelId] || 0) + 3;
        });
        bookmarks.forEach(item => {
            if (item.modelId) map[item.modelId] = (map[item.modelId] || 0) + 5;
        });
        return map;
    }, [likes, bookmarks]);

    // Deep Linking for Focus Modal
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (!viewId) {
            if (focusImage) setFocusImage(null);
            return;
        }

        if (focusImage && focusImage.id === viewId) return;

        // Try to find in current list
        const found = images.find(img => img.id === viewId);
        if (found) {
            setFocusImage(found);
        } else {
            // Fetch directly from Firestore if not in cache
            const fetchImage = async () => {
                try {
                    const docRef = doc(db, 'generations', viewId);
                    const snapshot = await getDoc(docRef);
                    if (snapshot.exists()) {
                        setFocusImage({ id: snapshot.id, ...snapshot.data() });
                    }
                } catch (err) {
                    console.error("Error fetching deep-linked image:", err);
                }
            };
            fetchImage();
        }
    }, [searchParams, images, focusImage]);

    const openFocus = useCallback((img) => {
        setFocusImage(img);
        trackEvent('view_generation_detail', { image_id: img.id, model_id: img.modelId });
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', img.id);
            return newParams;
        });
    }, [setSearchParams]);

    const closeFocus = () => {
        setFocusImage(null);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('view');
            return newParams;
        });
    };

    const [lastTimestamp, setLastTimestamp] = useState(null);

    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');

    // Reset list when filter changes
    useEffect(() => {
        setImages([]);
        setLastTimestamp(null);
        setHasMore(true);
        // Trigger fetch is handled by effect dependency or manual call?
        // Let's add activeFilter to fetchGenerations dependency and dependency of simple effect
    }, [activeFilter]);


    const fetchGenerations = useCallback(async (isLoadMore = false) => {
        if (isFetchingRef.current) return;
        if (isLoadMore && (!lastTimestamp || !hasMore)) return;

        try {
            isFetchingRef.current = true;
            if (!isLoadMore) {
                setLoading(true);
                setError(null);
            }

            let collectionsToQuery = [];

            if (activeFilter === 'All') {
                collectionsToQuery = ['generations', 'images', 'videos', 'memes', 'mockups'];
            } else if (activeFilter === 'Images') {
                collectionsToQuery = ['images'];
            } else if (activeFilter === 'Videos') {
                collectionsToQuery = ['videos'];
            } else if (activeFilter === 'Mockups') {
                collectionsToQuery = ['generations', 'mockups'];
            } else if (activeFilter === 'Memes') {
                collectionsToQuery = ['memes'];
            }

            const PAGE_SIZE = 30; // Reduce strict limit per collection to avoid over-fetching, but high enough to mix

            // Parallel queries
            const queries = collectionsToQuery.map(colName => {
                let q = query(
                    collection(db, colName),
                    where('isPublic', '==', true),
                    orderBy('createdAt', 'desc'),
                    limit(PAGE_SIZE)
                );

                if (isLoadMore && lastTimestamp) {
                    q = query(q, startAfter(lastTimestamp));
                }

                return getDocs(q).then(snap => ({ colName, docs: snap.docs }));
            });

            const results = await Promise.all(queries);

            // Combine and Normalize
            let allDocs = [];
            results.forEach(({ colName, docs }) => {
                const normalized = docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        _collection: colName,
                        // Polyfill type based on collection
                        type: colName === 'videos' ? 'video' : (data.type || 'image'),
                        // Normalize Timestamp
                        createdAtMillis: data.createdAt?.toMillis ? data.createdAt.toMillis() :
                            (data.createdAt instanceof Date ? data.createdAt.getTime() :
                                (new Date(data.createdAt).getTime() || 0))
                    };
                });
                allDocs = [...allDocs, ...normalized];
            });

            // Filter valid/visible
            const validImages = allDocs.filter(img =>
                !img.hidden &&
                (!img.status || img.status === 'completed' || img.status === 'succeeded') &&
                !hiddenIds.has(img.id) &&
                (img.imageUrl || img.url || img.coverUrl || img.videoUrl) // Support videoUrl
            );

            // Sort merged results by time desc
            validImages.sort((a, b) => b.createdAtMillis - a.createdAtMillis);

            // Take top PAGE_SIZE for this "page" of the feed
            // Note: In a robust infinite scroll with merged sources, this simple slice is "good enough" for feed feel,
            // though technically might skip items if distribution is highly skewed. 
            // For a user feed, "newest mixed" is the goal.
            const displaySlice = validImages.slice(0, PAGE_SIZE);

            if (displaySlice.length === 0) {
                setHasMore(false); // Rough termination
                if (!isLoadMore) setLoading(false);
                return;
            }

            // Update Cursor (use the timestamp of the last item in our slice)
            const lastItem = displaySlice[displaySlice.length - 1];
            if (lastItem.createdAt) { // Keep the original object for startAfter if possible, but we use value here
                setLastTimestamp(lastItem.createdAt);
            }

            if (isLoadMore) {
                setImages(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = displaySlice.filter(img => !existingIds.has(img.id));
                    if (uniqueNew.length === 0) return prev;

                    const mixedNewImages = smartMix(uniqueNew, affinityMap, viewedIds);
                    return [...prev, ...mixedNewImages];
                });
            } else {
                const mixedImages = smartMix(displaySlice, affinityMap, viewedIds);
                setImages(mixedImages);
            }

            // Heuristic for "No More": If we fetched fewer than half page total from all sources, likely done.
            if (validImages.length < 5) {
                setHasMore(false);
            }

        } catch (error) {
            console.error("Error fetching generations:", error);
            setError("Failed to load feed. Please try again.");
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [lastTimestamp, hiddenIds, affinityMap, viewedIds, hasMore, activeFilter]);

    useEffect(() => {
        fetchGenerations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run ONCE on mount

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchGenerations(true);
            }
        }, { rootMargin: '800px' });

        if (lastImageElementRef.current) {
            observer.current.observe(lastImageElementRef.current);
        }

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [loading, hasMore, fetchGenerations]);

    return (
        <div className="feed-layout-wrapper">
            <SEO
                title={focusImage ? `${focusImage.prompt?.slice(0, 50)}... | Generations - DreamBees` : `Generations - DreamBees`}
                description={focusImage ? focusImage.prompt : `Explore the latest AI generations from the DreamBees community.`}
                image={focusImage ? (focusImage.thumbnailUrl || focusImage.imageUrl) : undefined}
                canonical={focusImage ? `/generations?view=${focusImage.id}` : undefined}
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "CreativeWorkSeries",
                            "name": "DreamBees AI Generation Stream",
                            "description": "A real-time stream of high-fidelity AI generated artwork, coloring books, and slideshows by the DreamBees community.",
                            "genre": "AI Art",
                            "about": { "@type": "Thing", "name": "Generative Artificial Intelligence" }
                        },
                        {
                            "@type": "ItemList",
                            "name": "All AI Generations",
                            "numberOfItems": images.length,
                            "itemListElement": images.slice(0, 10).map((img, idx) => ({
                                "@type": "ListItem",
                                "position": idx + 1,
                                "item": {
                                    "@type": "VisualArtwork",
                                    "name": img.prompt?.slice(0, 60) || "AI Generation",
                                    "image": img.imageUrl || img.url || img.coverUrl,
                                    "creator": { "@type": "Person", "name": img.userDisplayName || "Artist" }
                                }
                            }))
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Generations", "item": "https://dreambeesai.com/generations" }
                            ]
                        }
                    ]
                }}
                mentions={["Stable Diffusion", "SDXL", "Generative Art", "Latent Diffusion Models"]}
            />

            <Sidebar activeId="/generations" />

            <CommunityConsentModal />

            {/* Filter Pills */}
            <div className="feed-switcher-container">
                <div className="feed-switcher-pills">
                    {['All', 'Images', 'Videos', 'Mockups', 'Memes'].map(filter => (
                        <button
                            key={filter}
                            className={`feed-pill ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            <span className="pill-label" style={{ display: 'inline', fontSize: '0.9rem' }}>{filter}</span>
                            {activeFilter === filter && <div className="pill-active-indicator" />}
                        </button>
                    ))}
                </div>
            </div>

            <main className="feed-main-content">
                <div className="discovery-container">

                    {/* Age Restriction Check */}
                    {isProfileLoaded && currentUser && !isOver18(userProfile.birthday) ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                                <ShieldAlert size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Content Restricted</h2>
                            <p className="text-zinc-400 max-w-sm mx-auto mb-8">
                                The Community Feed is not available for users under 18. You can still use the studio to generate images privately.
                            </p>
                            <button
                                onClick={() => navigate('/generate')}
                                className="btn btn-primary"
                            >
                                Go to Studio
                            </button>
                        </div>
                    ) : (
                        <section className="feed-posts-container">
                            {error && (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <ShieldAlert className="text-red-400 mb-2" size={32} />
                                    <p className="text-white mb-4">{error}</p>
                                    <button
                                        onClick={() => fetchGenerations(false)}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {!error && (
                                <AnimatePresence mode="popLayout">
                                    {loading && images.length === 0 ? (
                                        <motion.div
                                            key="skeletons"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <FeedSkeleton />
                                            <FeedSkeleton />
                                            <FeedSkeleton />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="feed-content"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                            className="masonry-grid-view"
                                        >
                                            {images.map((imgItem, index) => {
                                                const itemModel = availableModels.find(m => m.id === imgItem.modelId) || { name: 'Unknown Model', image: '/dreambees_icon.png' };
                                                const creatorName = imgItem.userDisplayName || "DreamBees User";

                                                return (
                                                    <FeedItemErrorBoundary key={imgItem.id}>
                                                        <FeedPost
                                                            imgItem={imgItem}
                                                            index={index}
                                                            model={itemModel}
                                                            getOptimizedImageUrl={getOptimizedImageUrl}
                                                            navigate={navigate}
                                                            setActiveShowcaseImage={openFocus}
                                                            headerTitle={creatorName}
                                                            headerSubtitle={itemModel.name}
                                                            avatarImage="/dreambees_icon.png"
                                                            variant="masonry"
                                                        />
                                                    </FeedItemErrorBoundary>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}

                            {/* Sentinel */}
                            <div ref={lastImageElementRef} style={{ height: '20px', margin: '20px 0' }}>
                                {loading && hasMore && images.length > 0 && !error && (
                                    <div className="flex justify-center p-4">
                                        <Loader2 size={32} className="animate-spin text-purple-500" />
                                    </div>
                                )}
                            </div>

                            {!hasMore && images.length > 0 && !error && (
                                <div className="text-center text-zinc-500 py-8">
                                    That's all for now!
                                </div>
                            )}

                            {!loading && !error && images.length === 0 && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '60px 20px',
                                    gap: '20px',
                                    textAlign: 'center',
                                    color: 'rgba(255,255,255,0.6)'
                                }}>
                                    <Zap size={40} style={{ opacity: 0.5 }} />
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
                                            No generations found
                                        </h3>
                                        <p>Start generating to see content here!</p>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>

            {/* Focus Overlay */}
            <AnimatePresence>
                {focusImage && (
                    <motion.div
                        className="focus-overlay-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeFocus}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 50,
                            background: 'rgba(0,0,0,0.9)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            style={{
                                position: 'relative',
                                maxHeight: '90vh',
                                maxWidth: '90vw'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={focusImage.imageUrl || focusImage.url}
                                alt={focusImage.prompt}
                                style={{
                                    maxHeight: '85vh',
                                    maxWidth: '100%',
                                    borderRadius: '8px',
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                                }}
                            />
                            <div className="mt-4 text-center">
                                <p className="text-white/80 text-sm max-w-xl mx-auto">{focusImage.prompt}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SuggestedPanel
                availableModels={availableModels}
                setActiveFilter={() => navigate('/discovery')}
            />
        </div>
    );
}
