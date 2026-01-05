import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getOptimizedImageUrl } from '../utils';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

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

export default function GenerationHistory({ onSelect, selectedJobId, onUsePrompt }) {
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'generation_queue'),
            where('userId', '==', currentUser.uid),
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobs = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(job => !job.hidden); // Filter out hidden (disliked) items

            const isNewItem = history.length > 0 && jobs.length > 0 && jobs[0].id !== history[0].id;
            setHistory(jobs);
            setLoading(false);

            if (isNewItem && scrollContainerRef.current) {
                setTimeout(() => {
                    scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                }, 300);
            }
        }, (error) => {
            console.error("Error fetching history:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

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

        <div className="history-filmstrip-container" style={{ marginTop: '24px', position: 'relative' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
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
                    gap: '12px',
                    overflowX: 'auto',
                    padding: '4px',
                    paddingBottom: '12px',
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
                            style={{
                                minWidth: '110px',
                                width: '110px',
                                height: '110px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                border: selectedJobId === job.id ? '2px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.08)',
                                background: '#111',
                                flexShrink: 0,
                                boxShadow: selectedJobId === job.id ? '0 0 20px rgba(var(--color-accent-rgb), 0.3)' : 'none',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            whileHover={{ y: -4, boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
                        >
                            <img
                                src={getOptimizedImageUrl(job.imageUrl)}
                                alt={job.prompt}
                                loading="lazy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.4s ease',
                                }}
                            />

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
                                        style={{ width: '100%' }}
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
                
                .btn-mini-action {
                    height: 24px;
                    border-radius: 6px;
                    border: 1px solid rgba(255,255,255,0.2);
                    background: rgba(0,0,0,0.4);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    backdrop-filter: blur(4px);
                }
                .btn-mini-action:hover {
                    background: white;
                    color: black;
                }

                .no-scrollbar::-webkit-scrollbar { height: 0px; display: none; }
            `}</style>
        </div>
    );
}
