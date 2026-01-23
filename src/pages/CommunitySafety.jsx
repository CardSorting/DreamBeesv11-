import React, { useEffect, useState, useCallback, useMemo } from 'react';
import SEO from '../components/SEO';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot, doc } from 'firebase/firestore';
import {
    Loader2, Shield, CheckCircle, XCircle, AlertTriangle,
    Trophy, Inbox, Gavel, Flame, Users, TrendingUp, Clock,
    ChevronDown, ChevronUp, Filter, Shuffle, Eye,
    Sparkles, Zap, Info, Undo2, HelpCircle, Rocket, X,
    ArrowLeft, ArrowRight, ArrowDown, Heart, ThumbsUp, ThumbsDown
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { getOptimizedImageUrl } from '../utils';
import canvasConfetti from 'canvas-confetti';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';

// Reason icons mapping
const REASON_ICONS = {
    nsfw: { icon: '🔞', label: 'NSFW Content', color: 'text-red-400' },
    spam: { icon: '📢', label: 'Spam', color: 'text-yellow-400' },
    harmful: { icon: '🚫', label: 'Harmful', color: 'text-red-500' },
    violence: { icon: '⚔️', label: 'Violence', color: 'text-orange-400' },
    copyright: { icon: '©️', label: 'Copyright', color: 'text-blue-400' },
    user_flagged: { icon: '🚩', label: 'Community Flagged', color: 'text-zinc-400' },
    default: { icon: '⚠️', label: 'Flagged', color: 'text-zinc-400' }
};

// Milestone thresholds for celebrations
const MILESTONES = [5, 10, 25, 50, 100];

// Thresholds for consensus
const HIDE_THRESHOLD = -5;
const SAFE_THRESHOLD = 5;

export default function CommunitySafety() {
    const [reportedPosts, setReportedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { voteOnSafety, userProfile } = useUserInteractions();

    // Queue Controls
    const [sortMode, setSortMode] = useState('appeals');
    const [showAppealsOnly, setShowAppealsOnly] = useState(false);

    // Session Stats & Gamification
    const [sessionCount, setSessionCount] = useState(0);
    const [dailyCount, setDailyCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [lastMilestone, setLastMilestone] = useState(0);

    // Community Stats (Live)
    const [communityStats, setCommunityStats] = useState({
        activeReviewers: 0,
        clearedToday: 0,
        pendingCount: 0
    });

    // UI State
    const [lastVoteResult, setLastVoteResult] = useState(null);
    const [expandedDetails, setExpandedDetails] = useState(false);
    const [pendingVote, setPendingVote] = useState(null);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Pass 2: New State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [quickVoteMode, setQuickVoteMode] = useState(false);
    const [voteHistory, setVoteHistory] = useState([]); // Last 5 votes
    const [karmaToast, setKarmaToast] = useState(null);
    const [hoveredButton, setHoveredButton] = useState(null);
    const [lastVoteFlash, setLastVoteFlash] = useState(null);

    // Vote Power Calculation (Karma-based)
    const votePower = useMemo(() =>
        1 + Math.floor(Math.sqrt(Math.max(0, userProfile.karma || 0)) / 2),
        [userProfile.karma]);

    // Check for first-time user onboarding
    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('safetyOnboardingComplete');
        const totalReviews = userProfile.totalReviews || 0;
        if (!hasSeenOnboarding && totalReviews === 0) {
            setShowOnboarding(true);
        }
    }, [userProfile.totalReviews]);

    // Fetch reported posts with smart sorting
    useEffect(() => {
        const fetchReported = async () => {
            try {
                let q = query(
                    collection(db, 'generation_queue'),
                    where('reportCount', '>', 0),
                    orderBy('reportCount', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                let posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    }, [sortMode, showAppealsOnly]);

    // Live community stats listener
    useEffect(() => {
        const statsRef = doc(db, 'app_stats', 'moderation');
        const unsub = onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCommunityStats({
                    activeReviewers: data.activeReviewers || 0,
                    clearedToday: data.clearedToday || 0,
                    pendingCount: data.pendingCount || reportedPosts.length
                });
            }
        }, () => {
            setCommunityStats(prev => ({ ...prev, pendingCount: reportedPosts.length }));
        });
        return () => unsub();
    }, [reportedPosts.length]);

    // Load streak from localStorage
    useEffect(() => {
        const today = new Date().toDateString();
        const saved = JSON.parse(localStorage.getItem('safetyStreak') || '{}');
        if (saved.date === today) {
            setDailyCount(saved.count || 0);
            setStreak(saved.streak || 0);
        } else if (saved.date) {
            const lastDate = new Date(saved.date);
            const daysDiff = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            setStreak(daysDiff === 1 ? (saved.streak || 0) : 0);
        }
        // Load quick vote preference
        setQuickVoteMode(localStorage.getItem('quickVoteMode') === 'true');
    }, []);

    // Save streak to localStorage
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

    // Sort posts helper
    const sortPosts = (posts, mode) => {
        switch (mode) {
            case 'appeals':
                return [...posts].sort((a, b) => (b.isAppeal ? 1 : 0) - (a.isAppeal ? 1 : 0));
            case 'most-flagged':
                return [...posts].sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0));
            case 'oldest':
                return [...posts].sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return aTime - bTime;
                });
            case 'random':
                return [...posts].sort(() => Math.random() - 0.5);
            default:
                return posts;
        }
    };

    // Trigger haptic feedback (mobile)
    const triggerHaptic = useCallback((type = 'light') => {
        if ('vibrate' in navigator) {
            navigator.vibrate(type === 'heavy' ? [50, 30, 50] : 10);
        }
    }, []);

    // Trigger confetti celebration
    const triggerConfetti = useCallback((intensity = 'normal') => {
        const config = intensity === 'big' ? {
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 }
        } : {
            particleCount: 60,
            spread: 50,
            origin: { y: 0.6 }
        };
        canvasConfetti(config);
    }, []);

    // Check for milestones
    const checkMilestone = useCallback((count) => {
        const milestone = MILESTONES.find(m => m === count);
        if (milestone && milestone > lastMilestone) {
            setLastMilestone(milestone);
            triggerConfetti('big');
            triggerHaptic('heavy');
        }
    }, [lastMilestone, triggerConfetti, triggerHaptic]);

    // Calculate predicted score change
    const predictScoreChange = useCallback((currentScore, verdict) => {
        if (verdict === 'skip') return { newScore: currentScore, change: 0 };
        const change = verdict === 'safe' ? votePower : -votePower;
        return { newScore: currentScore + change, change };
    }, [votePower]);

    // Handle vote with optional undo
    const handleVote = useCallback(async (post, verdict) => {
        if (pendingVote) return;

        triggerHaptic();

        // Show vote flash feedback
        setLastVoteFlash(verdict);
        setTimeout(() => setLastVoteFlash(null), 500);

        // Add to vote history
        setVoteHistory(prev => [...prev.slice(-4), { verdict, id: post.id }]);

        const executeVote = async () => {
            const result = await voteOnSafety(post, verdict);

            // Show karma toast
            if (result && !result.alreadyVoted && verdict !== 'skip') {
                setKarmaToast({
                    karma: result.karmaAwarded || 1,
                    streak: result.streakBonus || 0,
                    consensus: result.consensus
                });
                setTimeout(() => setKarmaToast(null), 2500);
            }

            // Show consensus feedback
            if (result && result.consensus !== 'pending') {
                setLastVoteResult({
                    id: post.id,
                    consensus: result.consensus,
                    score: result.newScore
                });
                setTimeout(() => setLastVoteResult(null), 2000);
            }

            // Update counts
            if (verdict !== 'skip') {
                setSessionCount(prev => prev + 1);
                setDailyCount(prev => {
                    const newCount = prev + 1;
                    checkMilestone(newCount);
                    return newCount;
                });
            }

            // Remove from queue
            setReportedPosts(prev => {
                const next = prev.filter(p => p.id !== post.id);
                if (next.length === 0 && prev.length > 0) {
                    triggerConfetti('big');
                }
                return next;
            });
        };

        if (quickVoteMode) {
            // Immediate vote in quick mode
            await executeVote();
        } else {
            // 3-second undo window
            setPendingVote({ post, verdict, timestamp: Date.now() });
            const timeout = setTimeout(async () => {
                setPendingVote(null);
                await executeVote();
            }, 3000);
            setPendingVote(prev => prev ? { ...prev, timeout } : null);
        }
    }, [pendingVote, voteOnSafety, checkMilestone, triggerConfetti, triggerHaptic, quickVoteMode]);

    // Undo pending vote
    const handleUndo = useCallback(() => {
        if (pendingVote?.timeout) {
            clearTimeout(pendingVote.timeout);
            setPendingVote(null);
            setVoteHistory(prev => prev.slice(0, -1));
            triggerHaptic();
        }
    }, [pendingVote, triggerHaptic]);

    // Toggle quick vote mode
    const toggleQuickVote = useCallback(() => {
        setQuickVoteMode(prev => {
            const newVal = !prev;
            localStorage.setItem('quickVoteMode', newVal.toString());
            return newVal;
        });
    }, []);

    // Complete onboarding
    const completeOnboarding = useCallback(() => {
        setShowOnboarding(false);
        localStorage.setItem('safetyOnboardingComplete', 'true');
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showOnboarding) return;
            if (reportedPosts.length === 0 || (pendingVote && !quickVoteMode)) return;
            const currentPost = reportedPosts[0];

            switch (e.key) {
                case 'ArrowLeft':
                    handleVote(currentPost, 'safe');
                    break;
                case 'ArrowRight':
                    handleVote(currentPost, 'unsafe');
                    break;
                case 'ArrowDown':
                case ' ':
                    e.preventDefault();
                    handleVote(currentPost, 'skip');
                    break;
                case 'z':
                    if ((e.metaKey || e.ctrlKey) && !quickVoteMode) handleUndo();
                    break;
                case '?':
                    setShowShortcuts(s => !s);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [reportedPosts, pendingVote, handleVote, handleUndo, showOnboarding, quickVoteMode]);

    const currentCard = reportedPosts[0];
    const currentScore = currentCard?.moderationScore || 0;

    // Swipe handlers
    const handlers = useSwipeable({
        onSwipedLeft: () => currentCard && !pendingVote && handleVote(currentCard, 'unsafe'),
        onSwipedRight: () => currentCard && !pendingVote && handleVote(currentCard, 'safe'),
        onSwipedUp: () => currentCard && !pendingVote && handleVote(currentCard, 'skip'),
        preventScrollOnSwipe: true,
        trackMouse: true
    });

    // Get reason info
    const getReasonInfo = (reason) => {
        const key = reason?.toLowerCase()?.replace(/[^a-z]/g, '') || 'default';
        return REASON_ICONS[key] || REASON_ICONS.default;
    };

    // Time ago helper
    const timeAgo = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const seconds = Math.floor((Date.now() - timestamp.seconds * 1000) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    // Score bar percentage
    const scoreToPercent = (score) => {
        const normalized = Math.max(HIDE_THRESHOLD, Math.min(SAFE_THRESHOLD, score));
        return ((normalized - HIDE_THRESHOLD) / (SAFE_THRESHOLD - HIDE_THRESHOLD)) * 100;
    };

    return (
        <div className="feed-layout-wrapper">
            <SEO title="Safety Center - Community Review" />
            <Sidebar activeId="/safety" />

            <main className="feed-main-content flex flex-col items-center justify-start min-h-screen px-4 pt-4 pb-20 relative overflow-hidden">

                {/* ===== ONBOARDING MODAL ===== */}
                <AnimatePresence>
                    {showOnboarding && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-zinc-900 rounded-3xl border border-white/10 max-w-md w-full p-6 text-center"
                            >
                                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield size={32} className="text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Community Review</h2>
                                <p className="text-zinc-400 mb-6">
                                    You're joining a decentralized jury. <strong className="text-white">No admins here</strong> — every voice has equal weight. Your votes directly shape what the community sees.
                                </p>

                                <div className="space-y-3 text-left mb-6">
                                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                        <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-white font-medium text-sm">KEEP = Restore Content</div>
                                            <div className="text-zinc-500 text-xs">Vote to keep this visible for everyone</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                        <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-white font-medium text-sm">REMOVE = Hide Content</div>
                                            <div className="text-zinc-500 text-xs">Vote to hide this from the community</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                                        <Zap size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-white font-medium text-sm">Earn Karma</div>
                                            <div className="text-zinc-500 text-xs">Participation increases your vote power</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 mb-6">
                                    <div className="flex items-center gap-1"><ArrowLeft size={14} /> Keep</div>
                                    <div className="flex items-center gap-1"><ArrowDown size={14} /> Skip</div>
                                    <div className="flex items-center gap-1">Remove <ArrowRight size={14} /></div>
                                </div>

                                <button
                                    onClick={completeOnboarding}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Rocket size={18} />
                                    Start Reviewing
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== KARMA TOAST ===== */}
                <AnimatePresence>
                    {karmaToast && (
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
                        >
                            <div className="bg-zinc-800/95 backdrop-blur-xl border border-yellow-500/30 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg">
                                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                    <Sparkles size={20} className="text-yellow-500" />
                                </div>
                                <div>
                                    <div className="text-white font-bold text-sm flex items-center gap-2">
                                        +{karmaToast.karma} Karma
                                        {karmaToast.streak > 0 && (
                                            <span className="text-orange-400 text-xs">(+{karmaToast.streak} streak)</span>
                                        )}
                                    </div>
                                    <div className="text-zinc-400 text-xs">
                                        {karmaToast.consensus !== 'pending' ? '🎯 Matched consensus!' : 'Thank you for voting'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== VOTE FLASH OVERLAY ===== */}
                <AnimatePresence>
                    {lastVoteFlash && (
                        <motion.div
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`fixed inset-0 pointer-events-none z-30 ${lastVoteFlash === 'safe' ? 'bg-green-500/20' :
                                    lastVoteFlash === 'unsafe' ? 'bg-red-500/20' :
                                        'bg-zinc-500/20'
                                }`}
                        />
                    )}
                </AnimatePresence>

                {/* ===== CONSENSUS OVERLAY ===== */}
                <AnimatePresence>
                    {lastVoteResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                                {lastVoteResult.consensus === 'safe' ? (
                                    <CheckCircle size={64} className="text-green-500" />
                                ) : (
                                    <Shield size={64} className="text-red-500" />
                                )}
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white">
                                        {lastVoteResult.consensus === 'safe' ? 'Kept Safe!' : 'Community Removed!'}
                                    </h3>
                                    <p className="text-zinc-400">Consensus Reached</p>
                                    <div className="mt-3 px-4 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-bold border border-yellow-500/20 flex items-center gap-2">
                                        <Sparkles size={14} />
                                        +5 Karma Bonus!
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== UNDO BAR ===== */}
                <AnimatePresence>
                    {pendingVote && !quickVoteMode && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-800 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg"
                        >
                            <span className="text-sm text-zinc-300">
                                {pendingVote.verdict === 'safe' ? '✅ Keeping...' : pendingVote.verdict === 'unsafe' ? '🚫 Removing...' : '⏭️ Skipping...'}
                            </span>
                            <button
                                onClick={handleUndo}
                                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors"
                            >
                                <Undo2 size={14} />
                                Undo
                            </button>
                            <div className="w-12 h-1 bg-zinc-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 3, ease: 'linear' }}
                                    className="h-full bg-yellow-500"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== HEADER HUD ===== */}
                <div className="w-full max-w-2xl mb-4">
                    {/* Main Stats Bar */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h1 className="font-bold text-white text-sm md:text-base">Community Review</h1>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] text-zinc-500">Decentralized Jury</span>
                                    {streak > 0 && (
                                        <div className="flex items-center gap-1 text-[10px] bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 text-orange-400">
                                            <Flame size={10} />
                                            {streak} Day Streak
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Quick Vote Toggle */}
                            <button
                                onClick={toggleQuickVote}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${quickVoteMode
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        : 'bg-white/5 text-zinc-400 border border-white/10'
                                    }`}
                                title="Quick Vote Mode - No undo delay"
                            >
                                <Rocket size={12} />
                                <span className="hidden sm:inline">Quick</span>
                            </button>

                            {/* Vote Power */}
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Power</span>
                                <div className="flex items-center gap-1.5 text-yellow-500">
                                    <Zap size={14} />
                                    <span className="font-bold text-lg">{votePower}x</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Stats + Vote History */}
                    <div className="flex items-center gap-2 mb-3">
                        {/* Stats */}
                        <div className="flex-1 grid grid-cols-4 gap-2">
                            <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                                <div className="text-lg font-bold text-white">{sessionCount}</div>
                                <div className="text-[9px] text-zinc-500 uppercase">Session</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                                <div className="text-lg font-bold text-green-400">{dailyCount}/10</div>
                                <div className="text-[9px] text-zinc-500 uppercase">Daily</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                                <div className="text-lg font-bold text-blue-400 flex items-center justify-center gap-1">
                                    <Users size={12} />
                                    {communityStats.activeReviewers || '—'}
                                </div>
                                <div className="text-[9px] text-zinc-500 uppercase">Active</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                                <div className="text-lg font-bold text-purple-400">{reportedPosts.length}</div>
                                <div className="text-[9px] text-zinc-500 uppercase">Queue</div>
                            </div>
                        </div>

                        {/* Vote History Dots */}
                        {voteHistory.length > 0 && (
                            <div className="flex items-center gap-1 px-2">
                                {voteHistory.map((v, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${v.verdict === 'safe' ? 'bg-green-500' :
                                                v.verdict === 'unsafe' ? 'bg-red-500' :
                                                    'bg-zinc-500'
                                            }`}
                                        title={v.verdict}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort & Filter Controls */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                        <button
                            onClick={() => setSortMode('appeals')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${sortMode === 'appeals' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                            <Gavel size={12} />
                            Appeals
                        </button>
                        <button
                            onClick={() => setSortMode('most-flagged')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${sortMode === 'most-flagged' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                            <TrendingUp size={12} />
                            Flagged
                        </button>
                        <button
                            onClick={() => setSortMode('oldest')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${sortMode === 'oldest' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                            <Clock size={12} />
                            Oldest
                        </button>
                        <button
                            onClick={() => setSortMode('random')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${sortMode === 'random' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                            <Shuffle size={12} />
                            Random
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={() => setShowAppealsOnly(!showAppealsOnly)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${showAppealsOnly ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                            <Filter size={12} />
                            Only Appeals
                        </button>
                    </div>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-purple-500 opacity-50" />
                        <p className="text-zinc-500 mt-4 text-sm">Loading review queue...</p>
                    </div>
                ) : !currentCard ? (
                    <div className="text-center py-20 max-w-md mx-auto">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                            <Inbox size={48} />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-4">
                            Queue Cleared!
                        </h2>
                        <p className="text-zinc-500 mb-6">
                            Amazing work! You reviewed {dailyCount} posts today.
                        </p>

                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <div className="text-sm text-zinc-500 mb-2">Community Health</div>
                            <div className="text-5xl font-bold text-green-500 mb-2">98%</div>
                            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                                <CheckCircle size={12} className="text-green-500" />
                                All flagged content reviewed
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-md h-[60vh] perspective-1000">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={currentCard.id}
                                {...handlers}
                                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, x: 200 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute inset-0 w-full h-full bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing select-none"
                            >
                                {/* Image */}
                                <div className="absolute inset-0 group">
                                    <img
                                        src={getOptimizedImageUrl(currentCard.imageUrl || currentCard.url)}
                                        alt="Content to review"
                                        className="w-full h-full object-cover pointer-events-none"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/95 pointer-events-none" />

                                    {/* Swipe Indicators */}
                                    <div className="absolute top-4 left-4 opacity-0 group-active:opacity-100 transition-opacity bg-green-500/20 border border-green-500 text-green-500 px-4 py-2 rounded-xl font-bold -rotate-12 backdrop-blur-md">
                                        KEEP
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-active:opacity-100 transition-opacity bg-red-500/20 border border-red-500 text-red-500 px-4 py-2 rounded-xl font-bold rotate-12 backdrop-blur-md">
                                        REMOVE
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col text-left z-10">
                                    {/* Tags Row */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {currentCard.isAppeal && (
                                            <div className="px-3 py-1 bg-blue-500 text-white border border-blue-400 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                                                <Gavel size={12} />
                                                Appeal
                                            </div>
                                        )}
                                        {(() => {
                                            const reason = getReasonInfo(currentCard.lastReason);
                                            return (
                                                <div className={`px-3 py-1 bg-zinc-700/50 ${reason.color} border border-white/10 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5`}>
                                                    <span>{reason.icon}</span>
                                                    {reason.label}
                                                </div>
                                            );
                                        })()}
                                        <div className="px-2 py-1 bg-zinc-800/50 text-zinc-400 rounded-full text-[10px] flex items-center gap-1">
                                            <Clock size={10} />
                                            {timeAgo(currentCard.lastReportedAt || currentCard.createdAt)}
                                        </div>
                                    </div>

                                    {/* Live Score Bar */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                                            <span>Remove</span>
                                            <span className="text-zinc-400">Score: {currentScore}</span>
                                            <span>Keep</span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all"
                                                style={{ width: `${scoreToPercent(currentScore)}%` }}
                                            />
                                            {/* Your vote impact preview */}
                                            {hoveredButton && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.5 }}
                                                    className={`absolute inset-y-0 ${hoveredButton === 'safe' ? 'bg-green-500' : 'bg-red-500'
                                                        } rounded-full`}
                                                    style={{
                                                        left: `${scoreToPercent(currentScore)}%`,
                                                        width: `${(votePower / (SAFE_THRESHOLD - HIDE_THRESHOLD)) * 100}%`,
                                                        transform: hoveredButton === 'unsafe' ? 'translateX(-100%)' : undefined
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="text-center text-[9px] text-zinc-600 mt-1">
                                            Your vote: {votePower > 1 ? `±${votePower}` : '±1'} points
                                        </div>
                                    </div>

                                    {/* Expandable Details */}
                                    <button
                                        onClick={() => setExpandedDetails(!expandedDetails)}
                                        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-3 text-xs transition-colors"
                                    >
                                        <Info size={12} />
                                        Why flagged?
                                        {expandedDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedDetails && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-black/40 rounded-xl p-3 mb-3 text-xs space-y-2 overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500">Reports:</span>
                                                    <span className="text-white font-bold">{currentCard.reportCount || 1}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500">Score:</span>
                                                    <span className={`font-bold ${currentScore < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                        {currentScore}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500">Potential Karma:</span>
                                                    <span className="text-yellow-400 font-bold">+1 to +6</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Prompt Preview */}
                                    {currentCard.prompt && (
                                        <p className="text-white/80 text-sm line-clamp-2 leading-relaxed font-light italic mb-4">
                                            "{currentCard.prompt}"
                                        </p>
                                    )}

                                    {/* Vote Buttons with Tooltips */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => handleVote(currentCard, 'safe')}
                                            onMouseEnter={() => setHoveredButton('safe')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            disabled={!!pendingVote && !quickVoteMode}
                                            className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/80 backdrop-blur hover:bg-green-500/20 border border-white/5 hover:border-green-500/50 transition-all active:scale-95 disabled:opacity-50 group/btn"
                                        >
                                            <CheckCircle size={24} className="text-green-500 mb-1" />
                                            <span className="text-[10px] font-bold text-white/70">KEEP</span>
                                            {/* Tooltip */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                                                Restore for everyone
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => handleVote(currentCard, 'skip')}
                                            onMouseEnter={() => setHoveredButton(null)}
                                            disabled={!!pendingVote && !quickVoteMode}
                                            className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/80 backdrop-blur hover:bg-zinc-700 border border-white/5 hover:border-white/20 transition-all active:scale-95 disabled:opacity-50 group/btn"
                                        >
                                            <span className="text-2xl mb-1 grayscale">🤷</span>
                                            <span className="text-[10px] font-bold text-white/70">SKIP</span>
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                                                Not sure, skip it
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => handleVote(currentCard, 'unsafe')}
                                            onMouseEnter={() => setHoveredButton('unsafe')}
                                            onMouseLeave={() => setHoveredButton(null)}
                                            disabled={!!pendingVote && !quickVoteMode}
                                            className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/80 backdrop-blur hover:bg-red-500/20 border border-white/5 hover:border-red-500/50 transition-all active:scale-95 disabled:opacity-50 group/btn"
                                        >
                                            <XCircle size={24} className="text-red-500 mb-1" />
                                            <span className="text-[10px] font-bold text-white/70">REMOVE</span>
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                                                Hide from everyone
                                            </div>
                                        </button>
                                    </div>

                                    {/* Keyboard Shortcuts Hint */}
                                    <div className="flex justify-between text-[10px] text-zinc-500 px-2 mt-2 font-mono opacity-60">
                                        <span>← KEEP</span>
                                        <span>SPACE</span>
                                        <span>REMOVE →</span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Next Card Preview */}
                        {reportedPosts[1] && (
                            <div className="absolute inset-0 flex items-center justify-center z-[-1] opacity-30 scale-95">
                                <div className="w-full h-full bg-zinc-800 rounded-3xl border border-white/5 flex items-center justify-center text-zinc-600 font-bold text-2xl">
                                    NEXT
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Keyboard Shortcuts Modal */}
                <AnimatePresence>
                    {showShortcuts && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowShortcuts(false)}
                        >
                            <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-white/10" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg font-bold text-white mb-4">Keyboard Shortcuts</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Keep Safe</span>
                                        <kbd className="px-2 py-1 bg-zinc-800 rounded text-white text-xs">←</kbd>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Remove</span>
                                        <kbd className="px-2 py-1 bg-zinc-800 rounded text-white text-xs">→</kbd>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Skip</span>
                                        <kbd className="px-2 py-1 bg-zinc-800 rounded text-white text-xs">Space</kbd>
                                    </div>
                                    {!quickVoteMode && (
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">Undo</span>
                                            <kbd className="px-2 py-1 bg-zinc-800 rounded text-white text-xs">⌘Z</kbd>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Toggle Help</span>
                                        <kbd className="px-2 py-1 bg-zinc-800 rounded text-white text-xs">?</kbd>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
