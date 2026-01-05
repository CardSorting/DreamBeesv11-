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
        <div style={{ marginTop: '32px' }}>
            <div style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                marginBottom: '16px',
                textTransform: 'uppercase'
            }}>
                Recent History
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '12px'
            }}>
                {history.map((job) => (
                    <div
                        key={job.id}
                        onClick={() => onSelect(job)}
                        className={`history-item ${selectedJobId === job.id ? 'active' : ''}`}
                        style={{
                            aspectRatio: '1',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            border: selectedJobId === job.id ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                            background: '#111'
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
                                transition: 'transform 0.3s ease'
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
                                    padding: '6px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)',
                                    color: '#ef4444',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .history-item:hover .history-overlay {
                    opacity: 1;
                }
                .history-item:hover img {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
}
