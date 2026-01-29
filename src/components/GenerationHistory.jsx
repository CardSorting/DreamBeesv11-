import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getOptimizedImageUrl, getLCPAttributes, preloadImage } from '../utils';
import { ChevronLeft, ChevronRight, Clock, Wand2 } from 'lucide-react';

const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = timestamp.toDate();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

import { motion, AnimatePresence } from 'framer-motion';

export default function GenerationHistory({ onSelect, selectedJobId, onUsePrompt, onRestyle }) {
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        if (!currentUser) return;

        const fetchHistory = async () => {
            try {
                const q = query(
                    collection(db, 'generation_queue'),
                    where('userId', '==', currentUser.uid),
                    where('status', '==', 'completed'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );

                const snapshot = await getDocs(q);
                const jobs = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(job => !job.hidden);

                const isNewItem = history.length > 0 && jobs.length > 0 && jobs[0].id !== history[0].id;
                setHistory(jobs);
                setLoading(false);

                // Programmatic Preloading for LCP
                jobs.slice(0, 5).forEach(job => {
                    const preloadUrl = getOptimizedImageUrl(job.thumbnailUrl || job.imageUrl);
                    preloadImage(preloadUrl, 'auto');
                });

                if (isNewItem && scrollContainerRef.current) {
                    setTimeout(() => {
                        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    }, 300);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
                setLoading(false);
            }
        };

        fetchHistory();
    }, [currentUser, history]);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };



    // Skeleton Loader
    if (loading) {
        return (
            <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', paddingLeft: '4px' }}>
                    History
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }} className="no-scrollbar">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse" style={{
                            minWidth: '64px', height: '64px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', flexShrink: 0
                        }} />
                    ))}
                </div>
            </div>
        );
    }

    if (history.length === 0) return null;

    return (

        <div className="history-filmstrip-container" style={{ marginTop: '16px', position: 'relative' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                padding: '0 4px'
            }}>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                }}>
                    History
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        <button onClick={() => scroll('left')} className="btn-icon-mini" title="Scroll Left"><ChevronLeft size={14} /></button>
                        <button onClick={() => scroll('right')} className="btn-icon-mini" title="Scroll Right"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    padding: '4px',
                    paddingBottom: '8px',
                    width: '100%',
                    scrollBehavior: 'smooth',
                    maskImage: 'linear-gradient(to right, black 90%, transparent 100%)' // Fade out edge
                }}
                className="no-scrollbar"
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {history.map((job) => (
                        <motion.div
                            key={job.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                            className={`history-item ${selectedJobId === job.id ? 'active' : ''}`}
                            onClick={() => onSelect(job)}
                            whileHover={{ y: -4 }}
                        >
                            <div style={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                background: job.lqip ? `url(${job.lqip}) center/cover no-repeat` : 'rgba(255,255,255,0.03)',
                                filter: job.lqip ? 'blur(10px)' : 'none',
                                overflow: 'hidden'
                            }}>
                                <img
                                    src={getOptimizedImageUrl(job.thumbnailUrl || job.imageUrl)}
                                    alt={`Previously generated image: ${job.prompt?.substring(0, 100)}${job.prompt?.length > 100 ? '...' : ''}`}
                                    title={job.prompt?.length > 100 ? job.prompt.substring(0, 100) + '...' : job.prompt}
                                    {...getLCPAttributes(history.indexOf(job), 5)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.4s ease',
                                        position: 'relative',
                                        zIndex: 1,
                                        filter: 'none'
                                    }}
                                    onLoad={(e) => {
                                        e.target.parentElement.style.filter = 'none';
                                    }}
                                />
                            </div>

                            {/* Hover Overlay */}
                            <div className="history-overlay">
                                {/* Time Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(4px)',
                                    padding: '2px 6px',
                                    borderRadius: '100px',
                                    fontSize: '0.55rem',
                                    color: 'rgba(255,255,255,0.9)',
                                    display: 'flex', alignItems: 'center', gap: '3px'
                                }}>
                                    <Clock size={8} />
                                    {getTimeAgo(job.createdAt)}
                                </div>

                                <div style={{ flex: 1 }} />

                                {/* Quick Stats */}
                                <div style={{
                                    fontSize: '0.6rem',
                                    color: 'rgba(255,255,255,0.8)',
                                    marginBottom: '6px',
                                    fontFamily: 'monospace',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '4px' }}>{job.aspectRatio || '1:1'}</span>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', width: '100%' }}>
                                    {onRestyle && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRestyle(job);
                                            }}
                                            className="btn-mini-action"
                                            title="Restyle this image (Reuse Seed)"
                                            style={{ width: '32px', flexShrink: 0 }}
                                        >
                                            <Wand2 size={12} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onUsePrompt) {
                                                onUsePrompt(job);
                                            } else {
                                                navigator.clipboard.writeText(job.prompt);
                                            }
                                        }}
                                        className="btn-mini-action"
                                        title="Use Prompt"
                                        style={{ flex: 1 }}
                                    >
                                        <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>USE</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <style>{`
                .btn-icon-mini {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.05);
                    color: var(--color-text-muted);
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon-mini:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }

                .history-item img {
                    transform: scale(1.01);
                }
                .history-item:hover img {
                    transform: scale(1.1);
                    filter: brightness(0.5);
                }
                .history-overlay {
                    position: absolute;
                    inset: 0;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    opacity: 0;
                    transition: all 0.2s ease;
                }
                .history-item:hover .history-overlay {
                    opacity: 1;
                }
                
                .history-item {
                    min-width: 96px;
                    width: 96px;
                    height: 96px;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    cursor: pointer;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: #111;
                    flex-shrink: 0;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .history-item.active {
                    border: 2px solid #fff;
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
                    transform: scale(0.95);
                }

                .history-item:hover {
                    box-shadow: 0 10px 25px rgba(0,0,0,0.6);
                    border-color: rgba(255,255,255,0.2);
                }

                .history-item:hover img {
                    transform: scale(1.1);
                }

                .history-item.active::after {
                    content: 'VIEWING';
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.6rem;
                    font-weight: 800;
                    letter-spacing: 0.1em;
                    color: white;
                    z-index: 5;
                }
                
                .btn-mini-action {
                    height: 28px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.15);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    backdrop-filter: blur(8px);
                }
                .btn-mini-action:hover {
                    background: white;
                    color: black;
                }

                @media (max-width: 768px) {
                    .history-item {
                        min-width: 80px;
                        width: 80px;
                        height: 80px;
                        border-radius: 10px;
                    }
                }

                .no-scrollbar::-webkit-scrollbar { height: 0px; display: none; }
            `}</style>
        </div>
    );
}
