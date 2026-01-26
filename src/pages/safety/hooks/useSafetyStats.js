import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useSafetyStats(queueLength) {
    // Load streak/stats from localStorage using lazy state initializers
    const [dailyCount, setDailyCount] = useState(() => {
        const today = new Date().toDateString();
        const saved = JSON.parse(localStorage.getItem('safetyStreak') || '{}');
        return saved.date === today ? (saved.count || 0) : 0;
    });

    const [streak, _setStreak] = useState(() => {
        const today = new Date().toDateString();
        const saved = JSON.parse(localStorage.getItem('safetyStreak') || '{}');
        if (saved.date === today) {
            return saved.streak || 0;
        } else if (saved.date) {
            const lastDate = new Date(saved.date);
            const daysDiff = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            return daysDiff === 1 ? (saved.streak || 0) : 0;
        }
        return 0;
    });

    const [communityStats, setCommunityStats] = useState({
        activeReviewers: 0,
        clearedToday: 0,
        pendingCount: 0
    });

    // Save streak
    useEffect(() => {
        if (dailyCount > 0) {
            const today = new Date().toDateString();
            localStorage.setItem('safetyStreak', JSON.stringify({
                date: today,
                count: dailyCount,
                streak: streak
            }));
        }
    }, [dailyCount, streak]);

    // Live community stats
    useEffect(() => {
        const statsRef = doc(db, 'app_stats', 'moderation');
        const unsub = onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCommunityStats({
                    activeReviewers: data.activeReviewers || 0,
                    clearedToday: data.clearedToday || 0,
                    pendingCount: data.pendingCount || queueLength
                });
            }
        }, () => {
            setCommunityStats(prev => ({ ...prev, pendingCount: queueLength }));
        });
        return () => unsub();
    }, [queueLength]);

    const incrementDailyCount = () => setDailyCount(prev => prev + 1);

    return {
        dailyCount,
        streak,
        communityStats,
        incrementDailyCount
    };
}
