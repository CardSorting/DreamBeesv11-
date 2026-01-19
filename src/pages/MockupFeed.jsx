import React, { useEffect, useState, useRef } from 'react';
import SEO from '../components/SEO';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { Loader2, Heart, Palette } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SuggestedPanel from '../components/SuggestedPanel';
import { useModel } from '../contexts/ModelContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Discovery.css'; // Re-use discovery styles

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

    const fetchMockups = async (isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true);

            let q = query(
                collection(db, 'generations'),
                where('type', '==', 'mockup'),
                where('isPublic', '==', true),
                // orderBy('createdAt', 'desc'), // TODO: Re-enable after building compound index
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
    };

    useEffect(() => {
        fetchMockups();
    }, []);

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
    }, [loading, hasMore]);

    return (
        <div className="feed-layout-wrapper">
            <SEO
                title="Mockup Gallery - DreamBees"
                description="Explore community generated product mockups."
            />

            <Sidebar activeId="/mockups" />

            <main className="feed-main-content">
                <div className="discovery-container">
                    {/* Header */}
                    <div style={{
                        padding: '40px 0 20px 0',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <h1 className="page-title" style={{ fontSize: '3rem', margin: 0 }}>
                            MOCKUP FEED
                        </h1>
                        <p className="page-subtitle" style={{ maxWidth: '400px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
                            Freshly printed designs from the studio.
                        </p>
                    </div>

                    {/* Grid */}
                    <section className="gallery-section" style={{ minHeight: '60vh' }}>
                        <div className="masonry-grid">
                            {images.map((imgItem, index) => {
                                // Default square for mockups usually
                                const ratio = '1/1';

                                return (
                                    <article
                                        key={imgItem.id}
                                        className="masonry-item group"
                                        style={{
                                            cursor: 'pointer',
                                            animation: `fadeInUp 0.6s ease ${index * 0.05}s both`
                                        }}
                                        onClick={() => setFocusImage(imgItem)}
                                    >
                                        <div className="image-card">
                                            <div className="image-wrapper" style={{
                                                aspectRatio: ratio,
                                                background: '#1a1a1a',
                                                overflow: 'hidden'
                                            }}>
                                                <img
                                                    src={imgItem.thumbnailUrl || imgItem.url}
                                                    alt={imgItem.prompt}
                                                    loading="lazy"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

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
                        onClick={() => setFocusImage(null)}
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
