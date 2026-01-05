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
        <div className="history-filmstrip-container" style={{ marginTop: '24px' }}>
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
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                    {history.length} ITEMS
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '12px', // More breathing room
                overflowX: 'auto',
                padding: '4px',
                paddingBottom: '12px',
                width: '100%',
                scrollBehavior: 'smooth'
            }} className="no-scrollbar">
                <AnimatePresence mode="popLayout" initial={false}>
                    {history.map((job) => (
                        <motion.div
                            key={job.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                            className={`history-item ${selectedJobId === job.id ? 'active' : ''}`}
                            onClick={() => onSelect(job)} // Default action: load
                            style={{
                                minWidth: '100px', // Fixed larger size
                                width: '100px',
                                height: '100px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                border: selectedJobId === job.id ? '2px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.08)',
                                background: '#111',
                                flexShrink: 0
                            }}
                            whileHover={{ y: -2 }} // Subtle lift instead of expansion
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
                                <div style={{ flex: 1 }} /> {/* Spacer */}

                                {/* Quick Stats */}
                                <div style={{
                                    fontSize: '0.6rem',
                                    color: 'rgba(255,255,255,0.8)',
                                    marginBottom: '6px',
                                    fontFamily: 'monospace',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>{job.aspectRatio || '1:1'}</span>
                                    <span>steps:{job.steps}</span>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => handleDelete(e, job.id)}
                                        className="btn-mini-action danger"
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>

                                    {/* Copy Prompt (using Clipboard API directly for simplicity here or could trigger parent) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(job.prompt);
                                            // You might want a toast here, but we don't have toast imported directly easily unless we pass it or import it. 
                                            // Assuming toast is available or silent copy. 
                                            // Ideally we should import toast if we want feedback, but let's stick to the minimal set for now.
                                        }}
                                        className="btn-mini-action"
                                        title="Copy Prompt"
                                    >
                                        <span style={{ fontSize: '0.6rem', fontWeight: '700' }}>TXT</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <style>{`
                .history-item img {
                    transform: scale(1.05);
                }
                .history-item:hover img {
                    transform: scale(1.15); /* Zoom effect */
                    filter: brightness(0.6);
                }
                .history-overlay {
                    position: absolute;
                    inset: 0;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    opacity: 0;
                    transition: all 0.2s ease;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
                }
                .history-item:hover .history-overlay {
                    opacity: 1;
                }
                .history-item.active {
                    box-shadow: 0 0 15px rgba(var(--color-accent-rgb), 0.3);
                }
                
                .btn-mini-action {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    border: none;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-mini-action:hover {
                    background: white;
                    color: black;
                }
                .btn-mini-action.danger:hover {
                    background: #ef4444;
                    color: white;
                }

                /* Custom Scrollbar */
                .no-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .no-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.02);
                    border-radius: 3px;
                }
                .no-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                }
                .no-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}</style>
        </div>
    );
}
