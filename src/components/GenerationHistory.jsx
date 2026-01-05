import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getOptimizedImageUrl } from '../utils';
import { Loader2, Trash2, Calendar, Clock } from 'lucide-react';

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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Loader2 className="animate-spin" size={20} color="var(--color-text-muted)" />
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
                {history.map((job) => (
                    <div
                        key={job.id}
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
                            transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        }}
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

                        <div className="history-overlay" style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={(e) => handleDelete(e, job.id)}
                                className="btn-icon-danger"
                                style={{
                                    padding: '4px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.8)',
                                    color: '#ef4444',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .history-item:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,0.4) !important;
                }
                .history-item:hover img {
                    opacity: 1 !important;
                }
                .history-item:hover .history-overlay {
                    opacity: 1;
                }
                .history-item.active {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    z-index: 2;
                }
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
