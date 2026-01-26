import React, { useState, useMemo, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MoreHorizontal, Bookmark, BadgeCheck, Aperture, Volume2, VolumeX, Flag, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useAuth } from '../contexts/AuthContext';
import SafeImage from './SafeImage';

const FeedPost = ({
    imgItem,
    index,
    model,
    getOptimizedImageUrl,
    navigate,
    setActiveShowcaseImage,
    variant = 'feed',
    headerTitle,
    headerSubtitle,
    avatarImage,
    onCreatorClick,
    onTagClick
}) => {
    // Resilience Guard: Prevent crash if critical data is missing
    if (!imgItem || !imgItem.id) {
        console.warn('FeedPost: Received invalid item', imgItem);
        return null;
    }

    const { _currentUser } = useAuth();
    const { isLiked, isBookmarked, toggleLike, toggleBookmark, hidePost, unhidePost, reportPost, appealPost, isHidden } = useUserInteractions();

    const [activeSlide, setActiveSlide] = useState(0);
    const [showLargeHeart, setShowLargeHeart] = useState(false);
    const [lastTap, setLastTap] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [manualUnmute, setManualUnmute] = useState(false);
    const [showReportMenu, setShowReportMenu] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const timerRef = useRef(null);
    const videoRef = useRef(null);

    const liked = isLiked(imgItem.id);
    const bookmarked = isBookmarked(imgItem.id);

    const handleLike = useCallback(() => {
        toggleLike(imgItem, model);
    }, [toggleLike, imgItem, model]);

    const handleDoubleTap = useCallback(() => {
        const now = Date.now();
        if (now - lastTap < 300) {
            handleLike();
            setShowLargeHeart(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setShowLargeHeart(false);
                timerRef.current = null;
            }, 800);
        }
        setLastTap(now);
    }, [lastTap, handleLike]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);





    const handleSave = () => {
        toggleBookmark(imgItem, model);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        const newState = !isMuted;
        setIsMuted(newState);
        // If unmuting via click, lock it (manualUnmute = true)
        // If muting via click, unlock it (manualUnmute = false) so hover logic resumes? 
        // Or if they mute, they probably want it muted. Let's assume click = lock state preference.
        // Actually user said "mute if didnt click". So if they clicked to unmute, it stays unmuted.
        // If they click to mute, does hover unmute it again? Probably yes, unless we treat "manual mute" as a lock too.
        // For simplicity: Click Unmute -> Lock Open. Click Mute -> Reset to default (Hover sensitive).
        if (!newState) { // Unmuted
            setManualUnmute(true);
        } else {
            setManualUnmute(false);
        }
    };

    const handleMouseEnter = () => {
        if (imgItem.type === 'video' && !manualUnmute) {
            setIsMuted(false);
        }
    };

    const handleMouseLeave = () => {
        if (imgItem.type === 'video' && !manualUnmute) {
            setIsMuted(true);
        }
    };

    const timeAgo = useMemo(() => {
        const options = ["2 HOURS AGO", "5 HOURS AGO", "1 DAY AGO", "3 DAYS AGO", "JUST NOW"];
        return options[index % options.length];
    }, [index]);

    const isMasonry = variant === 'masonry';

    // Helper: Validate image URL
    const isValidUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        if (url.length < 10) return false;
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:');
    };

    // Get the primary URL for this item
    const primaryUrl = imgItem.url || imgItem.imageUrl || (typeof imgItem === 'string' ? imgItem : '');

    // Guard: Don't render if URL is invalid (extra safety layer)
    if (!isValidUrl(primaryUrl) && imgItem.type !== 'video') {
        console.warn('[FeedPost] Skipping render due to invalid URL:', imgItem.id, primaryUrl?.substring(0, 30));
        return null;
    }

    // --- Moderation State ---

    // Derived state: Is this post effectively hidden for the user?
    const isPostHidden = isHidden(imgItem.id);

    // If dismissed (user clicked 'X' on the hidden overlay), don't render anything
    if (dismissed) return null;

    // If hidden (reported/hidden), render the "Hidden Overlay" state instead of the post
    if (isPostHidden) {
        const isOwner = _currentUser?.uid === imgItem.userId;

        return (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                    maxWidth: isMasonry ? '100%' : '600px',
                    width: '100%',
                    margin: isMasonry ? '0 0 16px 0' : '0 auto 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    textAlign: 'center'
                }}
            >
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    {isOwner ? "This content has been hidden by the community." : "Content Hidden"}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {!isOwner && (
                        <button
                            onClick={() => unhidePost(imgItem)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
                            Undo
                        </button>
                    )}

                    {isOwner ? (
                        <button
                            onClick={() => appealPost && appealPost(imgItem)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                background: 'rgba(59, 130, 246, 0.2)', // Blue tint
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                color: '#93c5fd',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <span role="img" aria-label="scale">⚖️</span> Appeal Decision
                        </button>
                    ) : (
                        <button
                            onClick={() => setDismissed(true)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    /* --- Report Menu Handlers --- */
    const handleReportClick = (reason) => {
        reportPost(imgItem, reason);
        setShowReportMenu(false);
    };

    return (
        <article
            className={`feed-post ${isMasonry ? 'masonry-item' : ''}`}
            style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                animation: `fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(index * 0.1, 1.0)}s both`,
                // Layout Conditional
                maxWidth: isMasonry ? '100%' : '600px',
                width: '100%',
                margin: isMasonry ? '0 0 16px 0' : '0 auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                breakInside: 'avoid', // Crucial for CSS columns
                marginBottom: isMasonry ? '16px' : '40px',
                position: 'relative' // For absolute positioning of report menu
            }}
        >
            {/* Report Reason Selection Menu */}
            <AnimatePresence>
                {showReportMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        style={{
                            position: 'absolute',
                            bottom: '60px',
                            right: '20px',
                            zIndex: 100,
                            background: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '8px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: '180px'
                        }}
                    >
                        <div style={{ padding: '8px', fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Report Reason</div>
                        {['NSFW / Inappropriate', 'Spam / Bot', 'Low Quality', 'Other'].map(reason => (
                            <button
                                key={reason}
                                onClick={() => handleReportClick(reason)}
                                style={{
                                    padding: '10px',
                                    textAlign: 'left',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {reason}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowReportMenu(false)}
                            style={{
                                marginTop: '8px',
                                padding: '8px',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: '#ccc',
                                fontSize: '0.8rem',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Post Header */}
            <div style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.02)'
            }}>
                <div
                    onClick={(e) => {
                        if (onCreatorClick) {
                            e.stopPropagation();
                            onCreatorClick();
                        }
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        cursor: onCreatorClick ? 'pointer' : 'default'
                    }}
                >
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                        padding: '2px'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: '#1a1a1a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid #000'
                        }}>
                            <SafeImage
                                src={avatarImage || model?.image}
                                alt={headerTitle || model?.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                fallback={<div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '10px', color: '#888' }}>DB</span></div>}
                            />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white', letterSpacing: '-0.01em' }}>
                                {headerTitle || "DreamBees"}
                            </div>
                            <BadgeCheck size={14} className="text-blue-500 fill-blue-500" />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
                            {headerSubtitle || "Official Showcase"}
                        </div>
                    </div>
                </div>
                <button className="btn-ghost" style={{ padding: '8px', opacity: 0.5 }}>
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Post Image Container */}
            <div
                onClick={() => {
                    handleDoubleTap();
                }}
                onDoubleClick={(e) => {
                    e.preventDefault();
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    cursor: 'pointer',
                    background: '#000',
                    position: 'relative',
                    overflow: 'hidden',
                    userSelect: 'none'
                }}
                className="feed-image-container"
            >
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: '100%', height: '100%' }}
                >
                    {imgItem.type === 'slideshow' && imgItem.results?.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <SafeImage
                                src={getOptimizedImageUrl(imgItem.results?.[activeSlide]?.imageUrl || imgItem.results?.[activeSlide]?.url)}
                                alt={`Slide ${(activeSlide || 0) + 1}`}
                                className="feed-post-image"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                    aspectRatio: imgItem.aspectRatio || '1/1'
                                }}
                            />
                            {imgItem.results.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveSlide(prev => Math.max(0, prev - 1)); }}
                                        style={{
                                            position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
                                            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white',
                                            cursor: 'pointer', zIndex: 10, display: activeSlide === 0 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveSlide(prev => Math.min(imgItem.results.length - 1, prev + 1)); }}
                                        style={{
                                            position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
                                            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white',
                                            cursor: 'pointer', zIndex: 10, display: activeSlide === imgItem.results.length - 1 ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                    <div style={{
                                        position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                                        display: 'flex', gap: '6px', zIndex: 10
                                    }}>
                                        {imgItem.results.map((_, i) => (
                                            <div key={i} style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                background: i === activeSlide ? 'white' : 'rgba(255,255,255,0.4)',
                                                transition: 'all 0.3s ease'
                                            }} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : imgItem.type === 'video' ? (
                        <>
                            <video
                                ref={videoRef}
                                src={imgItem.videoUrl}
                                poster={imgItem.imageUrl}
                                autoPlay
                                muted={isMuted}
                                loop
                                playsInline
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                            {/* Sound Toggle Overlay */}
                            <button
                                onClick={toggleMute}
                                style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    right: '16px',
                                    background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(4px)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    zIndex: 20
                                }}
                            >
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                        </>
                    ) : (
                        <SafeImage
                            src={getOptimizedImageUrl(imgItem.url || imgItem.imageUrl || (typeof imgItem === 'string' ? imgItem : ''))}
                            alt={imgItem.prompt || "Model Generation"}
                            loading={index < 2 ? "eager" : "lazy"}
                            className="feed-post-image"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                aspectRatio: imgItem.aspectRatio || '1/1'
                            }}
                        />
                    )}
                </motion.div>

                {/* Big Heart Overlay Animation */}
                <AnimatePresence>
                    {showLargeHeart && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.8, times: [0, 0.5, 1] }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                zIndex: 10,
                                filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))',
                                pointerEvents: 'none'
                            }}
                        >
                            <Heart size={80} fill="white" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Expand Overlay Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveShowcaseImage(imgItem);
                    }}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'opacity 0.3s'
                    }}
                    className="expand-hint-btn"
                >
                    <Aperture size={16} />
                </button>
            </div>

            {/* Post Actions Area */}
            <div style={{ padding: '16px 20px 20px 20px', background: 'rgba(255,255,255,0.005)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '18px' }}>
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={handleLike}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: liked ? '#ff3040' : 'white',
                                cursor: 'pointer',
                                padding: 0,
                                position: 'relative'
                            }}
                            title="Helpful"
                        >
                            <Heart size={28} fill={liked ? "currentColor" : "none"} strokeWidth={1.5} />

                            <AnimatePresence>
                                {liked && (
                                    <motion.div
                                        key="heart-burst"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: [0.8, 2, 2.5], opacity: [1, 0.8, 0] }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            color: '#ff3040',
                                            pointerEvents: 'none',
                                            zIndex: 10
                                        }}
                                    >
                                        <Heart size={32} fill="currentColor" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>






                        {imgItem.mockupItemId && (
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/mockup-catalog/item/${imgItem.mockupItemId}`);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                }}
                                title="Remix this design"
                            >
                                <Aperture size={16} /> Remix
                            </motion.button>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/channel/${imgItem.id}`, { state: { imageItem: imgItem } });
                            }}
                            style={{
                                background: 'rgba(169, 112, 255, 0.2)',
                                border: '1px solid rgba(169, 112, 255, 0.4)',
                                color: '#a970ff',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700
                            }}
                            title="Talk to this character"
                        >
                            <MessageCircle size={16} /> Talk to a picture
                        </motion.button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={handleSave}
                            style={{ background: 'none', border: 'none', color: bookmarked ? 'white' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0 }}
                            title="Save"
                        >
                            <Bookmark size={28} fill={bookmarked ? "currentColor" : "none"} strokeWidth={1.5} />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Open the new interactive report menu
                                setShowReportMenu(prev => !prev);
                            }}
                            style={{ background: 'none', border: 'none', color: showReportMenu ? '#ef4444' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0 }}
                            title="Report / Flag Content"
                        >
                            <Flag size={28} strokeWidth={1.5} className={(showReportMenu ? "text-red-500 fill-red-500/20" : "") + " hover:text-red-500 transition-colors"} />
                        </motion.button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white', fontFamily: 'monospace' }}>
                        {imgItem.likesCount || 0} VOTES
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                        {imgItem.bookmarksCount || 0} SAVES
                    </div>
                </div>



                <div style={{ marginTop: '8px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: '0.05em' }}>
                    {timeAgo}
                </div>



                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', opacity: 0.8 }}>
                    {['#AI', '#DreamBees'].map(tag => (
                        <span
                            key={tag}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onTagClick) onTagClick(tag);
                            }}
                            style={{
                                color: 'var(--color-accent-primary)',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                cursor: onTagClick ? 'pointer' : 'default',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '1'}
                            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div style={{ marginTop: '24px' }}></div>
            </div>
        </article >
    );
};

// Memoize to prevent re-renders when parent filters change but this post is unaffected
export default React.memo(FeedPost);
