import { useState, useCallback, useMemo } from 'react';
import { useUserInteractions } from '../../../contexts/UserInteractionsContext';
import { MILESTONES } from '../constants';
import canvasConfetti from 'canvas-confetti';

export function useVoting() {
    const { voteOnSafety, userProfile } = useUserInteractions();

    const [pendingVote, setPendingVote] = useState(null);
    const [quickVoteMode, setQuickVoteMode] = useState(() =>
        localStorage.getItem('quickVoteMode') === 'true'
    );
    const [voteHistory, setVoteHistory] = useState([]);
    const [karmaToast, setKarmaToast] = useState(null);
    const [lastVoteFlash, setLastVoteFlash] = useState(null);
    const [lastVoteResult, setLastVoteResult] = useState(null);
    const [lastMilestone, setLastMilestone] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);

    // Vote Power Calculation
    const votePower = useMemo(() =>
        1 + Math.floor(Math.sqrt(Math.max(0, userProfile.karma || 0)) / 2),
        [userProfile.karma]
    );

    // Haptic feedback
    const triggerHaptic = useCallback((type = 'light') => {
        if ('vibrate' in navigator) {
            navigator.vibrate(type === 'heavy' ? [50, 30, 50] : 10);
        }
    }, []);

    // Confetti
    const triggerConfetti = useCallback((intensity = 'normal') => {
        canvasConfetti(intensity === 'big' ? {
            particleCount: 150, spread: 100, origin: { y: 0.5 }
        } : {
            particleCount: 60, spread: 50, origin: { y: 0.6 }
        });
    }, []);

    // Check milestones
    const checkMilestone = useCallback((count) => {
        const milestone = MILESTONES.find(m => m === count);
        if (milestone && milestone > lastMilestone) {
            setLastMilestone(milestone);
            triggerConfetti('big');
            triggerHaptic('heavy');
        }
    }, [lastMilestone, triggerConfetti, triggerHaptic]);

    // Handle vote
    const handleVote = useCallback(async (post, verdict, onComplete) => {
        if (pendingVote) return;

        triggerHaptic();
        setLastVoteFlash(verdict);
        setTimeout(() => setLastVoteFlash(null), 500);
        setVoteHistory(prev => [...prev.slice(-4), { verdict, id: post.id }]);

        const executeVote = async () => {
            const result = await voteOnSafety(post, verdict);

            if (result && !result.alreadyVoted && verdict !== 'skip') {
                setKarmaToast({
                    karma: result.karmaAwarded || 1,
                    streak: result.streakBonus || 0,
                    consensus: result.consensus
                });
                setTimeout(() => setKarmaToast(null), 2500);
            }

            if (result && result.consensus !== 'pending') {
                setLastVoteResult({
                    id: post.id,
                    consensus: result.consensus,
                    score: result.newScore
                });
                setTimeout(() => setLastVoteResult(null), 2000);
            }

            if (verdict !== 'skip') {
                setSessionCount(prev => {
                    const newCount = prev + 1;
                    checkMilestone(newCount);
                    return newCount;
                });
            }

            onComplete?.(post.id);
        };

        if (quickVoteMode) {
            await executeVote();
        } else {
            setPendingVote({ post, verdict, timestamp: Date.now() });
            const timeout = setTimeout(async () => {
                setPendingVote(null);
                await executeVote();
            }, 3000);
            setPendingVote(prev => prev ? { ...prev, timeout } : null);
        }
    }, [pendingVote, voteOnSafety, checkMilestone, triggerHaptic, quickVoteMode]);

    // Undo
    const handleUndo = useCallback(() => {
        if (pendingVote?.timeout) {
            clearTimeout(pendingVote.timeout);
            setPendingVote(null);
            setVoteHistory(prev => prev.slice(0, -1));
            triggerHaptic();
        }
    }, [pendingVote, triggerHaptic]);

    // Toggle quick mode
    const toggleQuickVote = useCallback(() => {
        setQuickVoteMode(prev => {
            const newVal = !prev;
            localStorage.setItem('quickVoteMode', newVal.toString());
            return newVal;
        });
    }, []);

    return {
        votePower,
        pendingVote,
        quickVoteMode,
        voteHistory,
        karmaToast,
        lastVoteFlash,
        lastVoteResult,
        sessionCount,
        handleVote,
        handleUndo,
        toggleQuickVote,
        triggerConfetti
    };
}
