import React, { useRef, useEffect } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const FeedSkeleton = () => (
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

export default function FeedGrid({
    items,
    loading,
    error,
    hasMore,
    onLoadMore,
    renderItem,
    emptyState,
    skeletonCount = 3,
    layoutClass = "feed-posts-container masonry-feed"
}) {
    const observer = useRef();
    const lastElementRef = useRef();

    useEffect(() => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                onLoadMore(true);
            }
        }, { rootMargin: '800px' });

        if (lastElementRef.current) {
            observer.current.observe(lastElementRef.current);
        }

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [loading, hasMore, onLoadMore]);

    return (
        <div className={layoutClass}>
            {error && (
                <div className="empty-feed-state">
                    <Zap className="text-red-400" size={32} />
                    <p>{error}</p>
                    <button onClick={() => onLoadMore(false)} className="px-4 py-2 bg-white text-black rounded-full font-bold mt-4">Retry</button>
                </div>
            )}

            {!error && (
                <AnimatePresence mode="popLayout">
                    {loading && items.length === 0 ? (
                        <div className="feed-loader-skeletons">
                            {Array.from({ length: skeletonCount }).map((_, i) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <FeedSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        items.map((item, index) => renderItem(item, index))
                    )}
                </AnimatePresence>
            )}

            {/* Sentinel */}
            <div ref={lastElementRef} style={{ height: '20px', width: '100%', margin: '20px 0' }}>
                {loading && hasMore && items.length > 0 && !error && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Loader2 size={32} className="animate-spin text-purple-500" />
                    </div>
                )}
            </div>

            {!hasMore && items.length > 0 && !error && (
                <div className="panel-footer" style={{ border: 'none', textAlign: 'center', width: '100%' }}>
                    That's all for now!
                </div>
            )}

            {!loading && !error && items.length === 0 && (
                emptyState || (
                    <div className="empty-feed-state">
                        <Zap size={40} style={{ opacity: 0.5 }} />
                        <h3>No content found</h3>
                        <p>Check back later!</p>
                    </div>
                )
            )}
        </div>
    );
}
