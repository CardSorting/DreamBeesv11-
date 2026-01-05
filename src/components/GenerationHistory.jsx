import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getOptimizedImageUrl } from '../utils';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GenerationHistory({ onSelect, selectedJobId }) {
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

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
            const jobs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHistory(jobs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching history:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleDelete = async (e, jobId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this from history?')) {
            try {
                await deleteDoc(doc(db, 'generation_queue', jobId));
            } catch (error) {
                console.error("Error deleting job:", error);
            }
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
        <div className="history-filmstrip-container" style={{ marginTop: '16px' }}>
            <div style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                paddingLeft: '4px'
            }}>
                History
            </div>

            <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '4px',
                paddingBottom: '8px',
                width: '100%',
                scrollBehavior: 'smooth'
            }} className="no-scrollbar">
                <AnimatePresence mode="popLayout" initial={false}>
                    {history.map((job) => (
                        <motion.div
                            key={job.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                            onClick={() => onSelect(job)}
                            className={`history-item ${selectedJobId === job.id ? 'active' : ''}`}
                            style={{
                                minWidth: '64px',
                                width: '64px',
                                height: '64px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                border: selectedJobId === job.id ? '2px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                                background: '#111',
                                flexShrink: 0,
                                zIndex: 0 // Baseline z-index
                            }}
                            whileHover={{ width: '140px', zIndex: 10 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <img
                                src={getOptimizedImageUrl(job.imageUrl)}
                                alt={job.prompt}
                                loading="lazy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity: selectedJobId === job.id ? 1 : 0.7,
                                    transition: 'opacity 0.2s',
                                }}
                            />

                            {/* Overlay with Delete */}
                            <div className="history-overlay" style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                padding: '6px'
                            }}>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    style={{ width: '100%' }}
                                >
                                    {/* Prompt Tooltip (Truncated) */}
                                    <div style={{
                                        color: 'white',
                                        fontSize: '0.55rem',
                                        lineHeight: '1.2',
                                        marginBottom: '16px', // space for delete icon area if needed, or overlap
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textShadow: '0 1px 2px black'
                                    }}>
                                        {job.prompt}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={(e) => handleDelete(e, job.id)}
                                            className="btn-icon-danger"
                                            style={{
                                                padding: '4px',
                                                borderRadius: '50%',
                                                background: 'rgba(255,50,50,0.2)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(255,50,50,0.3)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <style>{`
                .history-item:hover {
                    border-color: rgba(255,255,255,0.4) !important;
                }
                .history-item:hover img {
                    opacity: 1 !important;
                }
                .history-item:hover .history-overlay {
                    opacity: 1;
                }
                .history-item.active {
                    box-shadow: 0 0 0 2px var(--color-accent-primary); /* Use box-shadow for border to avoid layout shift if border width changes, though we handled that */
                }
                
                /* Custom Scrollbar */
                .no-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .no-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .no-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                }
                .no-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}</style>
        </div>
    );
}
