import React, { useEffect, useState, useRef, useCallback } from 'react';
import SEO from '../components/SEO';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Zap, ShieldAlert, HelpCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SuggestedPanel from '../components/SuggestedPanel';
import { useModel } from '../contexts/ModelContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FeedPost from '../components/FeedPost';
import { getOptimizedImageUrl } from '../utils';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { isOver18 } from '../utils/age';
import CommunityConsentModal from '../components/CommunityConsentModal';
import './Discovery.css';

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

    const observer = useRef();
    const lastImageElementRef = useRef();

    // Routing Params
    const [searchParams, setSearchParams] = useSearchParams();

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

    const fetchGenerations = useCallback(async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true);

            // Query generation_queue for completed jobs
            let q = query(
                collection(db, 'generation_queue'),
                where('status', '==', 'completed'),
                orderBy('createdAt', 'desc'),
                limit(20)
            );

            if (isLoadMore && lastDoc) {
                q = query(q, startAfter(lastDoc));
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

            // Filter out any hidden or potentially invalid images just in case
            const validImages = newImages.filter(img => !img.hidden && (img.imageUrl || img.url));

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

            if (isLoadMore) {
                setImages(prev => [...prev, ...validImages]);
            } else {
                setImages(validImages);
            }
        } catch (error) {
            console.error("Error fetching generations:", error);
        } finally {
            setLoading(false);
        }
    }, [lastDoc]);

    useEffect(() => {
        setImages([]);
        setLastDoc(null);
        setHasMore(true);
        fetchGenerations();
    }, []); // Only run once on mount

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
            <SEO
                title={focusImage ? `${focusImage.prompt?.slice(0, 50)}... | Generations - DreamBees` : "Recent Generations - DreamBees"}
                description={focusImage ? focusImage.prompt : "Explore the latest AI generations from the DreamBees community."}
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
                        <section className="feed-posts-container" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '60px' }}>
                            {images.map((imgItem, index) => {
                                const itemModel = availableModels.find(m => m.id === imgItem.modelId) || { name: 'Unknown Model', image: '/dreambees_icon.png' };
                                const creatorName = imgItem.userDisplayName || "DreamBees User";

                                return (
                                    <FeedPost
                                        key={imgItem.id}
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
