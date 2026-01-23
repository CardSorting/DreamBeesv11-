import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, getDocs, where, startAt, endAt } from 'firebase/firestore';

export function useLeaderboard() {
    const [topReviewers, setTopReviewers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // In a real app, you might have a dedicated 'leaderboards' collection
                // or query users by totalReviews within a timeframe.
                // For this demo, let's query top users by karma as a proxy for moderation activity.
                const q = query(
                    collection(db, 'users'),
                    orderBy('karma', 'desc'),
                    limit(5)
                );

                const snapshot = await getDocs(q);
                const users = snapshot.docs.map(doc => ({
                    id: doc.id,
                    username: doc.data().username || 'Anonymous',
                    karma: doc.data().karma || 0,
                    reviews: doc.data().totalReviews || 0
                }));

                setTopReviewers(users);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    return {
        topReviewers,
        loading
    };
}
