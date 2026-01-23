import React, { useEffect, useState, useRef } from 'react';
import SEO from '../components/SEO';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Loader2, Shield, CheckCircle, XCircle, AlertTriangle, Keyboard, Trophy, Inbox } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { getOptimizedImageUrl } from '../utils';
import canvasConfetti from 'canvas-confetti';

export default function CommunitySafety() {
    const [reportedPosts, setReportedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { voteOnSafety } = useUserInteractions();

    // Impact Session Stats
    const [sessionCount, setSessionCount] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const fetchReported = async () => {
            try {
                // Query posts with positive net unsafe score (reportCount often proxies this in legacy, 
                // but moderationScore is better. Let's use reportCount/moderationScore > 0)
                // Assuming we want to review anything controversial.
                // Or just pending queue.
                const q = query(
                    collection(db, 'generation_queue'),
                    where('reportCount', '>', 0), // Simple heuristic for controversial content
                    orderBy('reportCount', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                // Filter out fully hidden ones? Or review them to restore?
                // Let's show everything with a score > 0 so users can restore hidden ones too.
                const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReportedPosts(posts);
            } catch (error) {
                console.error("Error fetching reported posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReported();
    }, []);

    const handleVote = (post, verdict) => {
        voteOnSafety(post, verdict);

        // Gamification
        setSessionCount(prev => prev + 1);

        // UI Removal
        setReportedPosts(prev => {
            const next = prev.filter(p => p.id !== post.id);
            if (next.length === 0 && prev.length > 0) {
                triggerConfetti();
            }
            return next;
        });
    };

    const triggerConfetti = () => {
        setShowConfetti(true);
        canvasConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (reportedPosts.length === 0) return;
            const currentPost = reportedPosts[0]; // Always review top card

            if (e.key === 'ArrowLeft') {
                handleVote(currentPost, 'safe');
            } else if (e.key === 'ArrowRight') {
                handleVote(currentPost, 'unsafe');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [reportedPosts]); // Dependency on list ensures we grab correct current item

    const currentCard = reportedPosts[0];

    return (
        <div className="feed-layout-wrapper">
            <SEO title="Safety Center - Review Mode" />
            <Sidebar activeId="/safety" />

            <main className="feed-main-content flex flex-col items-center justify-center min-h-[80vh] px-4">

                {/* Header / HUD */}
                <div className="w-full max-w-2xl flex items-center justify-between mb-8 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-white">Review Queue</h1>
                            <p className="text-xs text-zinc-400">Protect the community</p>
                        </div>
                    </div>
                    {sessionCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 animate-pulse">
                            <Trophy size={16} className="text-yellow-400" />
                            <span className="font-mono font-bold text-white">{sessionCount} reviewed</span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <Loader2 size={40} className="animate-spin text-purple-500 opacity-50" />
                ) : !currentCard ? (
                    // Empty State
                    <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                            <Inbox size={48} />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-4">
                            Queue Cleared!
                        </h2>
                        <p className="text-zinc-500 max-w-md mx-auto">
                            Great job! The community is safer thanks to you.
                        </p>
                    </div>
                ) : (
                    // Review Card (Flashcard Style)
                    <div className="relative w-full max-w-md aspect-[3/4] bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                        {/* Image Layer */}
                        <div className="absolute inset-0 group">
                            <img
                                src={getOptimizedImageUrl(currentCard.imageUrl || currentCard.url)}
                                alt="Content to review"
                                className="w-full h-full object-cover blur-md group-hover:blur-none transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

                            {/* Hover Hint */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                                <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                                    <AlertTriangle size={16} className="text-yellow-500" />
                                    <span className="text-sm font-medium text-white/90">Hover to Reveal</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Content Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col text-left">
                            {/* Reason Context Badge */}
                            {currentCard.lastReason && (
                                <div className="self-start mb-3 px-3 py-1 bg-red-500/20 text-red-200 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                                    <AlertTriangle size={12} />
                                    Reported for: {currentCard.lastReason}
                                </div>
                            )}

                            <div className="mb-6">
                                <p className="text-white/90 text-sm line-clamp-3 leading-relaxed font-light italic">
                                    "{currentCard.prompt}"
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleVote(currentCard, 'safe')}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-800/80 backdrop-blur hover:bg-green-500/20 border border-white/5 hover:border-green-500/50 transition-all group active:scale-95"
                                >
                                    <CheckCircle size={28} className="text-white/50 group-hover:text-green-400 mb-1 transition-colors" />
                                    <span className="text-xs font-bold text-white/50 group-hover:text-green-400 uppercase tracking-widest">Keep</span>
                                    <span className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 table-cell"><Keyboard size={10} /> LEFT</span>
                                </button>

                                <button
                                    onClick={() => handleVote(currentCard, 'unsafe')}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-800/80 backdrop-blur hover:bg-red-500/20 border border-white/5 hover:border-red-500/50 transition-all group active:scale-95"
                                >
                                    <XCircle size={28} className="text-white/50 group-hover:text-red-400 mb-1 transition-colors" />
                                    <span className="text-xs font-bold text-white/50 group-hover:text-red-400 uppercase tracking-widest">Remove</span>
                                    <span className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 table-cell"><Keyboard size={10} /> RIGHT</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Keyboard Hint Footer */}
                {currentCard && (
                    <div className="mt-8 flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-white/70">←</span>
                            <span>Safe</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-zinc-700" />
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-white/70">→</span>
                            <span>Unsafe</span>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
