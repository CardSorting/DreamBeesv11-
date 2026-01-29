import React, { useEffect, useState, useRef } from 'react';
import SEO from '../components/SEO';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { Loader2, Heart, Palette, Flag } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import FeedSwitcher from '../components/FeedSwitcher';
import SuggestedPanel from '../components/SuggestedPanel';
import { useModel } from '../contexts/ModelContext';

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { slugify, unslugify } from '../utils/urlHelpers';
import FeedPost from '../components/FeedPost';
import { getOptimizedImageUrl } from '../utils';


export default function MockupFeed() {
    const navigate = useNavigate();
    const { availableModels } = useModel();

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [focusImage, setFocusImage] = useState(null);

    const observer = useRef();
    const lastImageElementRef = useRef();
    const currentFilterRef = useRef(); // To track filter without causing dependency loops
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Routing Params
    const { tag, userId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize filter state from URL - only on first mount
    const [creatorFilter, setCreatorFilter] = useState(() => {
        if (tag) return { type: 'tag', value: unslugify(tag), slug: tag };
        if (userId) return { id: userId, name: 'Creator' };
        return null;
    });

    // Update ref when filter changes
    useEffect(() => {
        currentFilterRef.current = creatorFilter;
    }, [creatorFilter]);

    // Sync URL changes back to state - but only when URL actually changes, not on state changes
    useEffect(() => {
        const currentTagFromUrl = tag ? { type: 'tag', value: unslugify(tag), slug: tag } : null;
        const currentUserFromUrl = userId ? { id: userId, name: 'Creator' } : null;
        const urlFilter = currentTagFromUrl || currentUserFromUrl;

        // Only update state if URL and current filter are different
        // Use ref to avoid dependency on creatorFilter state which causes loops
        const isDifferent = JSON.stringify(urlFilter) !== JSON.stringify(currentFilterRef.current);
        if (isDifferent) {
            setCreatorFilter(urlFilter);
            // Note: pagination reset is handled by the filter change effect below
        }
    }, [tag, userId]); // Only depend on URL params, not on creatorFilter state

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
                    // Mockups are usually in generations collection
                    const docRef = doc(db, 'generations', viewId);
                    const snapshot = await getDoc(docRef);
                    if (snapshot.exists()) {
                        setFocusImage({ id: snapshot.id, ...snapshot.data() });
                    }
                } catch (err) {
                    console.error("Error fetching mockup deep-linked image:", err);
                }
            };
            fetchImage();
        }
    }, [searchParams, images, focusImage]);

    const openFocus = (img) => {
        setFocusImage(img);
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

    const handleFilterChange = (newFilter) => {
        // If clicking the same filter, do nothing
        if (creatorFilter?.id === newFilter?.id && creatorFilter?.value === newFilter?.value) return;

        setIsTransitioning(true);

        // Wait for fade out (300ms)
        setTimeout(() => {
            // Navigate instead of setting state directly
            if (!newFilter) {
                navigate('/mockups');
            } else if (newFilter.type === 'tag') {
                navigate(`/mockups/tag/${slugify(newFilter.value)}`);
            } else if (newFilter.id) {
                navigate(`/mockups/creator/${newFilter.id}`);
            }

            // Instant scroll to top while hidden
            if (window.lenis) {
                window.lenis.scrollTo(0, { immediate: true });
            } else {
                window.scrollTo(0, 0);
            }

            // Fade back in
            setTimeout(() => {
                setIsTransitioning(false);
            }, 100);
        }, 300);
    };

    const fetchMockups = React.useCallback(async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true);

            let q = query(
                collection(db, 'generations'),
                where('type', '==', 'mockup'),
                where('isPublic', '==', true),
                orderBy('createdAt', 'desc'),
                limit(20)
            );

            if (isLoadMore && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            if (creatorFilter) {
                if (creatorFilter.type === 'tag') {
                    // Check local tags array (case sensitive usually, but depends on DB)
                    // Assuming DB has 'AI', 'DreamBees' etc.
                    q = query(q, where('tags', 'array-contains', creatorFilter.value));
                } else if (creatorFilter.id) {
                    q = query(q, where('userId', '==', creatorFilter.id));
                }
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
                if (!isLoadMore) setLoading(false);
                return;
            }

            const newImages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

            if (isLoadMore) {
                setImages(prev => [...prev, ...newImages]);
            } else {
                setImages(newImages);
            }
        } catch (error) {
            console.error("Error fetching mockups:", error);
        } finally {
            setLoading(false);
        }
    }, [lastDoc, creatorFilter]);

    useEffect(() => {
        setImages([]); // Clear images when filter changes
        setLastDoc(null); // Reset lastDoc for new query
        setHasMore(true); // Assume more data for new query
        fetchMockups();
        // Scroll logic moved to handleFilterChange
    }, [creatorFilter, fetchMockups]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMockups(true);
            }
        });

        if (lastImageElementRef.current) {
            observer.current.observe(lastImageElementRef.current);
        }

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [loading, hasMore, fetchMockups]);

    return (
        <div className="feed-layout-wrapper">
            {/* Transition Overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: '#09090b', // Match dark theme background
                    zIndex: 9999, // High z-index to cover everything
                    opacity: isTransitioning ? 1 : 0,
                    pointerEvents: isTransitioning ? 'all' : 'none',
                    transition: 'opacity 0.3s ease-in-out'
                }}
            />

            <SEO
                title={focusImage ? `${focusImage.prompt?.slice(0, 50)}... | Mockups - DreamBees` : (creatorFilter ? `${creatorFilter.value || creatorFilter.name} Mockups - DreamBees` : "Mockup Gallery - Discovery Feed")}
                description={focusImage ? focusImage.prompt : "Explore community generated product mockups. Discover unique designs for apparel, tech, and more."}
                image={focusImage ? (focusImage.thumbnailUrl || focusImage.imageUrl) : undefined}
                canonical={focusImage ? `/discovery/${focusImage.id}` : undefined}
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "ImageGallery",
                            "name": creatorFilter ? `${creatorFilter.value || creatorFilter.name} Mockup Collection` : "DreamBees AI Mockup Showcase",
                            "description": "A collection of AI-generated product mockups.",
                            "image": images.slice(0, 5).map(img => img.thumbnailUrl || img.imageUrl)
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Mockups", "item": "https://dreambeesai.com/mockups" },
                                ...(creatorFilter ? [{ "@type": "ListItem", "position": 3, "name": creatorFilter.value || creatorFilter.name, "item": `https://dreambeesai.com/mockups/${creatorFilter.type}/${slugify(creatorFilter.value)}` }] : [])
                            ]
                        },
                        ...(focusImage ? [{
                            "@type": "VisualArtwork",
                            "name": focusImage.prompt?.slice(0, 60) || "AI Mockup",
                            "description": focusImage.prompt,
                            "image": focusImage.url || focusImage.imageUrl,
                            "artworkSurface": "Digital",
                            "artMedium": "AI Generated Mockup"
                        }] : [])
                    ]
                }}
            />

            <Sidebar activeId="/mockups" />

            <main className="feed-main-content">
                <div className="discovery-container">

                    <FeedSwitcher />

                    {/* Tag Filters */}
                    <div style={{
                        maxWidth: '600px',
                        margin: '0 auto 20px',
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {['All', 'AI', 'DreamBees'].map(tag => {
                            const isSelected = (creatorFilter?.type === 'tag' && creatorFilter.value === tag)
                                || (!creatorFilter && tag === 'All')
                                || (creatorFilter?.type === 'tag' && slugify(tag) === creatorFilter.slug); // Handle slug match from URL

                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleFilterChange(tag === 'All' ? null : { type: 'tag', value: tag })}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        background: isSelected
                                            ? 'var(--primary)'
                                            : 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {tag === 'All' ? 'All' : '#' + tag}
                                </button>
                            );
                        })}
                    </div>

                    {/* Filter Indicator */}
                    {creatorFilter && creatorFilter.type !== 'tag' && (
                        <div style={{
                            maxWidth: '600px',
                            margin: '0 auto 20px',
                            padding: '0 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(168, 85, 247, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '8px',
                            height: '50px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#d8b4fe' }}>
                                    Filtering by <strong>{creatorFilter.name}</strong>
                                </span>
                            </div>
                            <button
                                onClick={() => handleFilterChange(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Clear Filter
                            </button>
                        </div>
                    )}

                    {/* Feed List */}
                    <section className="feed-posts-container" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '60px' }}>
                        {images.map((imgItem, index) => {
                            // Mock Model Data for the FeedPost
                            const mockModel = {
                                name: "Studio",
                                image: "/dreambees_icon.png" // Fallback or global icon
                            };

                            const creatorName = imgItem.userDisplayName || "Creator";

                            return (
                                <FeedPost
                                    key={imgItem.id}
                                    imgItem={imgItem}
                                    index={index}
                                    model={mockModel}
                                    getOptimizedImageUrl={getOptimizedImageUrl}
                                    navigate={navigate}
                                    setActiveShowcaseImage={openFocus}
                                    headerTitle={creatorName}
                                    headerSubtitle="Mockup Studio"
                                    avatarImage="/dreambees_icon.png" // Use app icon as avatar for now
                                    onCreatorClick={() => {
                                        if (imgItem.userId) {
                                            handleFilterChange({
                                                id: imgItem.userId,
                                                name: creatorName
                                            });
                                        }
                                    }}
                                    onTagClick={(tag) => handleFilterChange({ type: 'tag', value: tag })}
                                />
                            );
                        })}

                        {/* Sentinel */}
                        <div ref={lastImageElementRef} style={{ height: '20px', margin: '20px 0' }}>
                            {loading && hasMore && (
                                <div className="flex justify-center p-4">
                                    <Loader2 size={32} className="animate-spin text-purple-500" />
                                </div>
                            )}
                        </div>

                        {!hasMore && images.length > 0 && (
                            <div className="text-center text-zinc-500 py-8">
                                That's all for now!
                            </div>
                        )}

                        {!loading && images.length === 0 && (
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
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <Palette size={40} style={{ opacity: 0.8 }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
                                        No mockups yet
                                    </h3>
                                    <p style={{ maxWidth: '300px', margin: '0 auto' }}>
                                        Be the first to share your designs with the community.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/mockup-studio')}
                                    style={{
                                        marginTop: '10px',
                                        padding: '12px 24px',
                                        borderRadius: '30px',
                                        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
                                        transition: 'transform 0.2s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    Create Mockup
                                </button>
                            </div>
                        )}
                    </section>
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
                                src={focusImage.url}
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
