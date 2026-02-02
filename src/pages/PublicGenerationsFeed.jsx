import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, ShieldAlert } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { usePublicFeed } from '../hooks/usePublicFeed';
import { trackEvent } from '../utils/analytics';
import { getOptimizedImageUrl } from '../utils';
import { isOver18 } from '../utils/age';

import FeedLayout from '../components/FeedLayout';
import FeedGrid from '../components/FeedGrid';
import FeedPost from '../components/FeedPost';
import ShowcaseModal from '../components/ShowcaseModal';
import CommunityConsentModal from '../components/CommunityConsentModal';
import '../styles/Feeds.css';

// Note: CSS imported by FeedLayout

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
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

export default function PublicGenerationsFeed() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Global Contexts
    const { availableModels } = useModel();
    const { currentUser } = useAuth();
    const { userProfile, isProfileLoaded, hiddenIds, likes, bookmarks, viewedIds } = useUserInteractions();

    // Local State
    const [activeFilter, setActiveFilter] = useState('All');
    const [focusImage, setFocusImage] = useState(null);

    // Derived Affinity Map
    const affinityMap = useMemo(() => {
        const map = {};
        likes.forEach(item => { if (item.modelId) map[item.modelId] = (map[item.modelId] || 0) + 3; });
        bookmarks.forEach(item => { if (item.modelId) map[item.modelId] = (map[item.modelId] || 0) + 5; });
        return map;
    }, [likes, bookmarks]);

    // Data Fetching Hook
    const { images, loading, hasMore, error, fetchGenerations } = usePublicFeed(activeFilter, affinityMap, viewedIds, hiddenIds);

    // Initial Fetch
    useEffect(() => {
        fetchGenerations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter]);

    // Deep Linking Logic
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (!viewId) {
            if (focusImage) setFocusImage(null);
            return;
        }

        if (focusImage && focusImage.id === viewId) return;

        const found = images.find(img => img.id === viewId);
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
                } catch (err) {
                    console.error("Error fetching deep-linked image:", err);
                }
            };
            fetchImage();
        }
    }, [searchParams, images, focusImage]);

    // Handlers
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

    return (
        <FeedLayout
            activeSidebarId="/generations"
            seoProps={{
                title: focusImage ? `${focusImage.prompt?.slice(0, 50)}... | Generations` : `Generations - DreamBees`,
                description: focusImage ? focusImage.prompt : `Explore the latest AI generations.`,
                image: focusImage ? (focusImage.thumbnailUrl || focusImage.imageUrl) : undefined,
                canonical: focusImage ? `/generations?view=${focusImage.id}` : undefined
            }}
            showcaseModal={focusImage && (
                <ShowcaseModal
                    image={focusImage}
                    model={availableModels.find(m => m.id === focusImage.modelId) || { name: 'Unknown', image: '/dreambees_icon.png' }}
                    onClose={closeFocus}
                    onNext={() => {
                        const idx = images.findIndex(img => img.id === focusImage.id);
                        if (idx !== -1 && idx < images.length - 1) openFocus(images[idx + 1]);
                    }}
                    onPrev={() => {
                        const idx = images.findIndex(img => img.id === focusImage.id);
                        if (idx > 0) openFocus(images[idx - 1]);
                    }}
                    hasNext={images.findIndex(img => img.id === focusImage.id) < images.length - 1}
                    hasPrev={images.findIndex(img => img.id === focusImage.id) > 0}
                />
            )}
        >
            <CommunityConsentModal />

            {/* Filter Pills */}
            <div className="feed-filter-bar" style={{ justifyContent: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="filter-scroll" style={{ justifyContent: 'center' }}>
                    {['All', 'Images', 'Videos', 'Mockups', 'Memes'].map(filter => (
                        <button
                            key={filter}
                            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '12px',
                marginBottom: '12px',
                padding: '0 20px'
            }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '10px 24px',
                        borderRadius: '100px',
                        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
                        maxWidth: '1000px'
                    }}
                >
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.1)',
                        flexShrink: 0
                    }}>
                        <ShieldAlert size={16} className="text-amber-400" />
                    </div>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.6)',
                        margin: 0,
                        fontWeight: '500',
                        letterSpacing: '0.01em',
                        lineHeight: '1.5',
                        textAlign: 'left'
                    }}>
                        <span style={{ color: 'white', fontWeight: '800', marginRight: '8px', textTransform: 'uppercase', fontSize: '0.7rem' }}>Content Advisory:</span>
                        This feed contains experimental, user-generated AI content. Individual discretion is advised. All content is moderated according to our Community Safety Guidelines.
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '12px' }}>
                {/* Age Restriction */}
                {isProfileLoaded && currentUser && !isOver18(userProfile.birthday) ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <ShieldAlert size={32} className="text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-3">Content Restricted</h2>
                        <button onClick={() => navigate('/generate')} className="suggestion-follow-btn" style={{ background: '#fff', color: '#000', padding: '10px 20px' }}>
                            Go to Studio
                        </button>
                    </div>
                ) : (
                    <FeedGrid
                        items={images}
                        loading={loading}
                        error={error}
                        hasMore={hasMore}
                        onLoadMore={fetchGenerations}
                        renderItem={(imgItem, index) => {
                            const itemModel = availableModels.find(m => m.id === imgItem.modelId) || { name: 'Unknown', image: '/dreambees_icon.png' };
                            return (
                                <FeedItemErrorBoundary key={imgItem.id}>
                                    <FeedPost
                                        imgItem={imgItem}
                                        index={index}
                                        model={itemModel}
                                        getOptimizedImageUrl={getOptimizedImageUrl}
                                        navigate={navigate}
                                        setActiveShowcaseImage={openFocus}
                                        headerTitle={imgItem.userDisplayName || "User"}
                                        headerSubtitle={itemModel.name}
                                        avatarImage="/dreambees_icon.png"
                                        variant="masonry"
                                    />
                                </FeedItemErrorBoundary>
                            );
                        }}
                        emptyState={
                            <div className="empty-feed-state">
                                <Zap size={40} style={{ opacity: 0.5 }} />
                                <h3>No generations found</h3>
                                <p>Start generating to see content here!</p>
                            </div>
                        }
                    />
                )}
            </div>
        </FeedLayout>
    );
}
