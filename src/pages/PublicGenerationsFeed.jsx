import React, { useEffect, useState, useRef, useCallback } from 'react';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Zap, ShieldAlert, HelpCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SuggestedPanel from '../components/SuggestedPanel';
import { useModel } from '../contexts/ModelContext';
import { AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FeedPost from '../components/FeedPost';
import { getOptimizedImageUrl } from '../utils';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { isOver18 } from '../utils/age';
import CommunityConsentModal from '../components/CommunityConsentModal';
import './Discovery.css';
import BookCard from '../components/BookCard';
import BookReaderModal from '../components/BookReaderModal';

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
    const { userProfile, isProfileLoaded } = useUserInteractions();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [focusImage, setFocusImage] = useState(null);
    const [activeBook, setActiveBook] = useState(null);

    // Filter Cache for instantaneous switching
    const [filterCache, setFilterCache] = useState({});

    // Routing Params
    const [searchParams, setSearchParams] = useSearchParams();
    const activeFilter = searchParams.get('filter') || 'all';

    const setActiveFilter = (newFilter) => {
        trackEvent('change_discovery_filter', { filter: newFilter });
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (newFilter === 'all') next.delete('filter');
            else next.set('filter', newFilter);
            return next;
        }, { replace: true });
        // Scroll to top of feed container when filter changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const FILTERS = [
        { id: 'all', label: 'All', icon: '✨' },
        { id: 'coloring-books', label: 'Coloring Books', icon: '🎨' },
        { id: 'slideshow', label: 'Slideshows', icon: '📽️' },
        { id: 'meowacc', label: 'MeowAcc', icon: '🐱' },
        { id: 'dress-up', label: 'Dress Up', icon: '👗' },
    ];

    const observer = useRef();
    const lastImageElementRef = useRef();

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
                    const docRef = doc(db, 'generation_queue', viewId);
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

    const openFocus = (img) => {
        setFocusImage(img);
        trackEvent('view_generation_detail', { image_id: img.id, model_id: img.modelId });
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', img.id);
            return newParams;
        });
    };

    const closeFocus = () => {
        setFocusImage(null);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('view');
            return newParams;
        });
    };

    const [error, setError] = useState(null);
    const activeFilterRef = useRef(activeFilter);

    useEffect(() => {
        activeFilterRef.current = activeFilter;
    }, [activeFilter]);

    const fetchGenerations = useCallback(async (isLoadMore = false) => {
        const currentFilter = activeFilter; // Capture filter at start of request

        try {
            if (!isLoadMore) {
                setLoading(true);
                setError(null);
            }

            let q;

            if (activeFilter === 'coloring-books') {
                q = query(
                    collection(db, 'coloring_books'),
                    where('status', '==', 'completed'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            } else {
                // Query generation_queue for completed jobs
                q = query(
                    collection(db, 'generation_queue'),
                    where('status', '==', 'completed')
                );

                // Apply filter
                if (activeFilter === 'slideshow') {
                    q = query(q, where('type', '==', 'slideshow'));
                } else if (activeFilter === 'dress-up') {
                    q = query(q, where('type', '==', 'dress-up'));
                } else if (activeFilter === 'meowacc') {
                    q = query(q, where('modelId', '==', 'meowacc'));
                }

                // Final order and pagination
                q = query(q, orderBy('createdAt', 'desc'), limit(20));
            }

            if (isLoadMore && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);

            // Race Condition Check: If filter changed while fetching, discard results
            if (currentFilter !== activeFilterRef.current) return;

            if (snapshot.empty) {
                setHasMore(false);
                if (!isLoadMore) setLoading(false);
                return;
            }

            const newImages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter out any hidden or potentially invalid images just in case
            const validImages = newImages.filter(img => !img.hidden && (img.imageUrl || img.url || img.coverUrl));

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

            if (isLoadMore) {
                const updatedImages = [...images, ...validImages];

                // Memory Safety: Limit individual feed-length in cache
                if (updatedImages.length > 500) {
                    // If feed gets too long, stop caching to prevent memory overflow
                    setImages(updatedImages);
                } else {
                    setImages(updatedImages);
                    setFilterCache(prev => ({
                        ...prev,
                        [activeFilter]: {
                            images: updatedImages,
                            lastDoc: snapshot.docs[snapshot.docs.length - 1],
                            hasMore: snapshot.docs.length === 20
                        }
                    }));
                }
            } else {
                setImages(validImages);
                setFilterCache(prev => ({
                    ...prev,
                    [activeFilter]: {
                        images: validImages,
                        lastDoc: snapshot.docs[snapshot.docs.length - 1],
                        hasMore: snapshot.docs.length === 20
                    }
                }));
            }
        } catch (error) {
            console.error("Error fetching generations:", error);
            // Only set error if we are on the same filter
            if (currentFilter === activeFilterRef.current) {
                setError("Failed to load feed. Please try again.");
            }
        } finally {
            if (currentFilter === activeFilterRef.current) {
                setLoading(false);
            }
        }
    }, [lastDoc, activeFilter, images]);

    useEffect(() => {
        // Hydrate from cache if available
        if (filterCache[activeFilter]) {
            setImages(filterCache[activeFilter].images);
            setLastDoc(filterCache[activeFilter].lastDoc);
            setHasMore(filterCache[activeFilter].hasMore);
            setLoading(false);
            // Optionally: Could trigger a background update here
        } else {
            setImages([]);
            setLastDoc(null);
            setHasMore(true);
            fetchGenerations();
        }
    }, [activeFilter]); // Run on mount and filter change

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchGenerations(true);
            }
        });

        if (lastImageElementRef.current) {
            observer.current.observe(lastImageElementRef.current);
        }

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [loading, hasMore, fetchGenerations]);

    return (
        <div className="feed-layout-wrapper">
            <BookReaderModal book={activeBook} onClose={() => setActiveBook(null)} />
            <SEO
                title={focusImage ? `${focusImage.prompt?.slice(0, 50)}... | Generations - DreamBees` : `${FILTERS.find(f => f.id === activeFilter)?.label || 'Recent'} Generations - DreamBees`}
                description={focusImage ? focusImage.prompt : `Explore the latest ${activeFilter !== 'all' ? activeFilter : ''} AI generations from the DreamBees community.`}
                image={focusImage ? (focusImage.thumbnailUrl || focusImage.imageUrl) : undefined}
                canonical={focusImage ? `/generations?view=${focusImage.id}` : undefined}
                structuredData={{ /* ... reusable structured data ... */ }}
            />

            <Sidebar activeId="/generations" />

            <CommunityConsentModal />

            <main className="feed-main-content">
                <div className="discovery-container">

                    {/* Header specific to this feed */}
                    <div style={{ maxWidth: '600px', margin: '0 auto 10px', padding: '0 20px' }}>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Community Feed</h1>
                            <div className="group relative">
                                <HelpCircle size={14} className="text-zinc-600 cursor-help hover:text-zinc-400 transition-colors" />
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 text-[11px] leading-relaxed text-zinc-300">
                                    <div className="font-bold text-white mb-1">About this experiment</div>
                                    This feed explores community annotation and context, not algorithmic ranking. Content is provided "as is" by users.
                                </div>
                            </div>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Live stream of creations from all users.</p>

                        <div className="flex items-center gap-2 py-1 px-3 bg-zinc-800/30 border border-white/5 rounded-full w-fit">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                Community-Moderated Feed · Experimental
                            </span>
                        </div>
                    </div>

                    {/* Filter Slider */}
                    <div className="models-header-bar" style={{ maxWidth: '600px', padding: '0 20px 16px', margin: '0 auto 10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {FILTERS.map(f => (
                                <button
                                    key={f.id}
                                    className={`model-pill ${activeFilter === f.id ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(f.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span>{f.icon}</span>
                                    <span>{f.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

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
                        <section className="feed-posts-container" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '60px', minHeight: '80vh' }}>
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
                                            key={activeFilter}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                        >
                                            {activeFilter === 'coloring-books' ? (
                                                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 px-4">
                                                    {images.map((book, index) => (
                                                        <BookCard
                                                            key={book.id}
                                                            book={book}
                                                            index={index}
                                                            onClick={setActiveBook}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                images.map((imgItem, index) => {
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
                                                            />
                                                        </FeedItemErrorBoundary>
                                                    );
                                                })
                                            )}
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
