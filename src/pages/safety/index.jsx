import React, { useState, useEffect, useCallback } from 'react';
import SEO from '../../components/SEO';
import Sidebar from '../../components/Sidebar';
import { useUserInteractions } from '../../contexts/UserInteractionsContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Loader2, Inbox, CheckCircle, Shield, Sparkles, Clock, Gavel, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils';

// Hooks
import { useVoting } from './hooks/useVoting';
import { useSafetyQueue } from './hooks/useSafetyQueue';
import { useSafetyStats } from './hooks/useSafetyStats';

// Components
import StatsHUD from './components/StatsHUD';
import ScoreBar from './components/ScoreBar';
import VoteButtons from './components/VoteButtons';
import OnboardingModal from './components/OnboardingModal';
import KarmaToast from './components/KarmaToast';

// Constants
import { getReasonInfo, timeAgo } from './constants';

export default function CommunitySafety() {
    const { userProfile } = useUserInteractions();

    // Hooks
    const queue = useSafetyQueue();
    const stats = useSafetyStats(queue.queueLength);
    const voting = useVoting();

    // UI State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [expandedDetails, setExpandedDetails] = useState(false);
    const [hoveredButton, setHoveredButton] = useState(null);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Onboarding check
    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('safetyOnboardingComplete');
        if (!hasSeenOnboarding && (userProfile.totalReviews || 0) === 0) {
            setShowOnboarding(true);
        }
    }, [userProfile.totalReviews]);

    const completeOnboarding = useCallback(() => {
        setShowOnboarding(false);
        localStorage.setItem('safetyOnboardingComplete', 'true');
    }, []);

    // Vote handler
    const onVote = useCallback((verdict) => {
        if (!queue.currentCard) return;
        voting.handleVote(queue.currentCard, verdict, (postId) => {
            queue.removeFromQueue(postId);
            stats.incrementDailyCount();
            if (queue.queueLength === 1) {
                voting.triggerConfetti('big');
            }
        });
    }, [queue, voting, stats]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showOnboarding || !queue.currentCard) return;
            if (voting.pendingVote && !voting.quickVoteMode) return;

            switch (e.key) {
                case 'ArrowLeft': onVote('safe'); break;
                case 'ArrowRight': onVote('unsafe'); break;
                case 'ArrowDown':
                case ' ': e.preventDefault(); onVote('skip'); break;
                case 'z': if ((e.metaKey || e.ctrlKey) && !voting.quickVoteMode) voting.handleUndo(); break;
                case '?': setShowShortcuts(s => !s); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [queue.currentCard, voting, onVote, showOnboarding]);

    // Swipe
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => onVote('unsafe'),
        onSwipedRight: () => onVote('safe'),
        onSwipedUp: () => onVote('skip'),
        preventScrollOnSwipe: true,
        trackMouse: true
    });

    const currentCard = queue.currentCard;
    const currentScore = currentCard?.moderationScore || 0;

    return (
        <div className="feed-layout-wrapper">
            <SEO title="Safety Center - Community Review" />
            <Sidebar activeId="/safety" />

            <main className="feed-main-content flex flex-col items-center justify-start min-h-screen px-4 pt-4 pb-20 relative overflow-hidden">

                {/* Onboarding */}
                <AnimatePresence>
                    {showOnboarding && <OnboardingModal onComplete={completeOnboarding} />}
                </AnimatePresence>

                {/* Karma Toast */}
                <AnimatePresence>
                    {voting.karmaToast && <KarmaToast {...voting.karmaToast} />}
                </AnimatePresence>

                {/* Vote Flash */}
                <AnimatePresence>
                    {voting.lastVoteFlash && (
                        <motion.div
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`fixed inset-0 pointer-events-none z-30 ${voting.lastVoteFlash === 'safe' ? 'bg-green-500/20' :
                                    voting.lastVoteFlash === 'unsafe' ? 'bg-red-500/20' : 'bg-zinc-500/20'
                                }`}
                        />
                    )}
                </AnimatePresence>

                {/* Consensus Overlay */}
                <AnimatePresence>
                    {voting.lastVoteResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                                {voting.lastVoteResult.consensus === 'safe' ? (
                                    <CheckCircle size={64} className="text-green-500" />
                                ) : (
                                    <Shield size={64} className="text-red-500" />
                                )}
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white">
                                        {voting.lastVoteResult.consensus === 'safe' ? 'Kept Safe!' : 'Community Removed!'}
                                    </h3>
                                    <p className="text-zinc-400">Consensus Reached</p>
                                    <div className="mt-3 px-4 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-bold border border-yellow-500/20 flex items-center gap-2">
                                        <Sparkles size={14} /> +5 Karma Bonus!
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats HUD */}
                <StatsHUD
                    votePower={voting.votePower}
                    streak={stats.streak}
                    sessionCount={voting.sessionCount}
                    dailyCount={stats.dailyCount}
                    communityStats={stats.communityStats}
                    queueLength={queue.queueLength}
                    voteHistory={voting.voteHistory}
                    quickVoteMode={voting.quickVoteMode}
                    onToggleQuickVote={voting.toggleQuickVote}
                    sortMode={queue.sortMode}
                    onSortChange={queue.setSortMode}
                    showAppealsOnly={queue.showAppealsOnly}
                    onToggleAppealsOnly={() => queue.setShowAppealsOnly(!queue.showAppealsOnly)}
                    karma={userProfile.karma}
                />

                {/* Main Content */}
                {queue.loading ? (
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
                            Amazing! You reviewed {stats.dailyCount} posts today.
                        </p>
                    </div>
                ) : (
                    <div className="relative w-full max-w-md h-[60vh]" {...swipeHandlers}>
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={currentCard.id}
                                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, x: 200 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute inset-0 bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing select-none"
                            >
                                {/* Image */}
                                <div className="absolute inset-0">
                                    <img
                                        src={getOptimizedImageUrl(currentCard.imageUrl || currentCard.url)}
                                        alt="Content to review"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/95" />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col z-10">
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {currentCard.isAppeal && (
                                            <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                                                <Gavel size={12} /> Appeal
                                            </div>
                                        )}
                                        {(() => {
                                            const reason = getReasonInfo(currentCard.lastReason);
                                            return (
                                                <div className={`px-3 py-1 bg-zinc-700/50 ${reason.color} rounded-full text-xs font-bold flex items-center gap-1.5`}>
                                                    <span>{reason.icon}</span> {reason.label}
                                                </div>
                                            );
                                        })()}
                                        <div className="px-2 py-1 bg-zinc-800/50 text-zinc-400 rounded-full text-[10px] flex items-center gap-1">
                                            <Clock size={10} />
                                            {timeAgo(currentCard.lastReportedAt || currentCard.createdAt)}
                                        </div>
                                    </div>

                                    {/* Score Bar */}
                                    <ScoreBar score={currentScore} votePower={voting.votePower} hoveredButton={hoveredButton} />

                                    {/* Details Toggle */}
                                    <button
                                        onClick={() => setExpandedDetails(!expandedDetails)}
                                        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-3 text-xs"
                                    >
                                        <Info size={12} /> Why flagged?
                                        {expandedDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedDetails && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-black/40 rounded-xl p-3 mb-3 text-xs space-y-2"
                                            >
                                                <div className="flex justify-between"><span className="text-zinc-500">Reports:</span><span className="text-white font-bold">{currentCard.reportCount || 1}</span></div>
                                                <div className="flex justify-between"><span className="text-zinc-500">Score:</span><span className={`font-bold ${currentScore < 0 ? 'text-red-400' : 'text-green-400'}`}>{currentScore}</span></div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Prompt */}
                                    {currentCard.prompt && (
                                        <p className="text-white/80 text-sm line-clamp-2 italic mb-4">"{currentCard.prompt}"</p>
                                    )}

                                    {/* Vote Buttons */}
                                    <VoteButtons
                                        onVote={onVote}
                                        disabled={!!voting.pendingVote && !voting.quickVoteMode}
                                        onHover={setHoveredButton}
                                    />

                                    <div className="flex justify-between text-[10px] text-zinc-500 px-2 mt-2 font-mono opacity-60">
                                        <span>← KEEP</span><span>SPACE</span><span>REMOVE →</span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
