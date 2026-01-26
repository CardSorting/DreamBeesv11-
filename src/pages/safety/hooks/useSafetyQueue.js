import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export function useSafetyQueue() {
    const [reportedPosts, setReportedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortMode, setSortMode] = useState('appeals');
    const [showAppealsOnly, setShowAppealsOnly] = useState(false);

    // Sort posts helper
    const sortPosts = useCallback((posts, mode) => {
        switch (mode) {
            case 'appeals':
                return [...posts].sort((a, b) => (b.isAppeal ? 1 : 0) - (a.isAppeal ? 1 : 0));
            case 'most-flagged':
                return [...posts].sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0));
            case 'oldest':
                return [...posts].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
            case 'random':
                return [...posts].sort(() => Math.random() - 0.5);
            default:
                return posts;
        }
    }, []);

    // Fetch posts
    useEffect(() => {
        const fetchReported = async () => {
            try {
                const q = query(
                    collection(db, 'generation_queue'),
                    where('reportCount', '>', 0),
                    orderBy('reportCount', 'desc'),
                    limit(50)
                );
                const snapshot = await getDocs(q);
                const now = Date.now();
                let posts = snapshot.docs.map(doc => {
                    const data = doc.id ? doc.data() : {};
                    const reportCount = data.reportCount || 0;
                    const lastReported = data.lastReportedAt?.seconds * 1000;
                    const ageHours = lastReported ? (now - lastReported) / 3600000 : 0;

                    let urgency = null;
                    if (reportCount >= 10) urgency = 'hot';
                    else if (ageHours >= 24) urgency = 'aging';

                    return {
                        id: doc.id,
                        ...data,
                        _urgency: urgency
                    };
                });
                posts = sortPosts(posts, sortMode);
                if (showAppealsOnly) {
                    posts = posts.filter(p => p.isAppeal);
                }
                setReportedPosts(posts);
            } catch (error) {
                console.error("Error fetching reported posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReported();
    }, [sortMode, showAppealsOnly, sortPosts]);

    // Remove post from queue
    const removeFromQueue = useCallback((postId) => {
        setReportedPosts(prev => prev.filter(p => p.id !== postId));
    }, []);

    return {
        reportedPosts,
        loading,
        sortMode,
        setSortMode,
        showAppealsOnly,
        setShowAppealsOnly,
        removeFromQueue,
        currentCard: reportedPosts[0] || null,
        queueLength: reportedPosts.length
    };
}
