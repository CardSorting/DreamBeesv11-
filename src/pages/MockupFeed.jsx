import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Palette } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebase';
import FeedPost from '../components/FeedPost';
import FeedSwitcher from '../components/FeedSwitcher';
import { getOptimizedImageUrl } from '../utils';
import { slugify, unslugify } from '../utils/urlHelpers';

import FeedLayout from '../components/FeedLayout';
import FeedGrid from '../components/FeedGrid';
import { useMockupData } from '../hooks/useMockupData';

export default function MockupFeed() {
    const navigate = useNavigate();
    const { tag, userId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // Local State
    const [focusImage, setFocusImage] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Initial Filter from URL
    const creatorFilter = useMemo(() => {
        if (tag) return { type: 'tag', value: unslugify(tag), slug: tag };
        if (userId) return { id: userId, name: 'Creator' };
        return null;
    }, [tag, userId]);

    // Data Fetching Hook
    const { images, loading, hasMore, fetchMockups } = useMockupData(creatorFilter);

    // Deep Linking Logic
    // Deep Linking Logic
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (!viewId) {
            setFocusImage(prev => prev ? null : prev);
            return;
        }

        if (focusImage && focusImage.id === viewId) return;

        const found = images?.find(img => img.id === viewId);
        if (found) {
            setFocusImage(found);
        } else {
            const fetchImage = async () => {
                try {
                    const docRef = doc(db, 'generations', viewId);
                    const snapshot = await getDoc(docRef);
                    if (snapshot.exists()) {
                        setFocusImage({ id: snapshot.id, ...snapshot.data() });
                    }
                } catch {
                    // console.error("Error fetching mockup deep-linked image:", err);
                }
            };
            fetchImage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, images]);

    // Handlers
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
        if (creatorFilter?.id === newFilter?.id && creatorFilter?.value === newFilter?.value) return;
        setIsTransitioning(true);

        setTimeout(() => {
            if (!newFilter) {
                navigate('/mockups');
            } else if (newFilter.type === 'tag') {
                navigate(`/mockups/tag/${slugify(newFilter.value)}`);
            } else if (newFilter.id) {
                navigate(`/mockups/creator/${newFilter.id}`);
            }

            if (window.lenis) {
                window.lenis.scrollTo(0, { immediate: true });
            } else {
                window.scrollTo(0, 0);
            }

            setTimeout(() => {
                setIsTransitioning(false);
            }, 100);
        }, 300);
    };

    return (
        <FeedLayout
            activeSidebarId="/mockups"
            seoProps={{
                title: focusImage ? `${focusImage.prompt?.slice(0, 50)}... | Mockups` : (creatorFilter ? `${creatorFilter.value || creatorFilter.name} Mockups` : "Mockup Gallery"),
                description: focusImage ? focusImage.prompt : "Explore community generated product mockups.",
                image: focusImage ? (focusImage.thumbnailUrl || focusImage.imageUrl) : undefined,
                canonical: focusImage ? `/discovery/${focusImage.id}` : undefined
            }}
            focusImage={focusImage}
            onCloseFocus={closeFocus}
            isTransitioning={isTransitioning}
        >
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
                            || (creatorFilter?.type === 'tag' && slugify(tag) === creatorFilter.slug);

                        return (
                            <button
                                key={tag}
                                onClick={() => handleFilterChange(tag === 'All' ? null : { type: 'tag', value: tag })}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
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
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Clear Filter
                        </button>
                    </div>
                )}

                <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '60px' }}>
                    <FeedGrid
                        items={images}
                        loading={loading}
                        hasMore={hasMore}
                        onLoadMore={fetchMockups}
                        layoutClass="feed-posts-container" // Linear list for consistency
                        renderItem={(imgItem, index) => {
                            const mockModel = { name: "Studio", image: "/dreambees_icon.png" };
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
                                    avatarImage="/dreambees_icon.png"
                                    onCreatorClick={() => {
                                        if (imgItem.userId) {
                                            handleFilterChange({ id: imgItem.userId, name: creatorName });
                                        }
                                    }}
                                    onTagClick={(tag) => handleFilterChange({ type: 'tag', value: tag })}
                                />
                            );
                        }}
                        emptyState={
                            <div className="empty-feed-state">
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                    <Palette size={40} style={{ opacity: 0.8 }} />
                                </div>
                                <h3>No mockups yet</h3>
                                <p style={{ maxWidth: '300px', margin: '0 auto' }}>Be the first to share your designs with the community.</p>
                                <button
                                    onClick={() => navigate('/mockup-studio')}
                                    style={{ marginTop: '10px', padding: '12px 24px', borderRadius: '30px', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)', transition: 'transform 0.2s ease' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    Create Mockup
                                </button>
                            </div>
                        }
                    />
                </div>
            </div>
        </FeedLayout>
    );
}
