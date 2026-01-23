import React from 'react';
import { Shield, Flame, Zap, Users, Rocket, Gavel, TrendingUp, Clock, Shuffle, Filter } from 'lucide-react';
import { getTrustTier } from '../constants';

export default function StatsHUD({
    votePower,
    streak,
    sessionCount,
    dailyCount,
    communityStats,
    queueLength,
    voteHistory,
    quickVoteMode,
    onToggleQuickVote,
    sortMode,
    onSortChange,
    showAppealsOnly,
    onToggleAppealsOnly,
    karma
}) {
    const trustTier = getTrustTier(karma || 0);

    return (
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
                            {/* Trust Tier Badge */}
                            <div className={`flex items-center gap-1 text-[10px] ${trustTier.bg} px-1.5 py-0.5 rounded border border-white/10 ${trustTier.color}`}>
                                {trustTier.label}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleQuickVote}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${quickVoteMode
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-white/5 text-zinc-400 border border-white/10'
                            }`}
                        title="Quick Vote Mode"
                    >
                        <Rocket size={12} />
                        <span className="hidden sm:inline">Quick</span>
                    </button>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Power</span>
                        <div className="flex items-center gap-1.5 text-yellow-500">
                            <Zap size={14} />
                            <span className="font-bold text-lg">{votePower}x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid + Vote History */}
            <div className="flex items-center gap-2 mb-3">
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
                        <div className="text-lg font-bold text-purple-400">{queueLength}</div>
                        <div className="text-[9px] text-zinc-500 uppercase">Queue</div>
                    </div>
                </div>

                {voteHistory.length > 0 && (
                    <div className="flex items-center gap-1 px-2">
                        {voteHistory.map((v, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${v.verdict === 'safe' ? 'bg-green-500' :
                                        v.verdict === 'unsafe' ? 'bg-red-500' : 'bg-zinc-500'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
                {[
                    { mode: 'appeals', icon: Gavel, label: 'Appeals' },
                    { mode: 'most-flagged', icon: TrendingUp, label: 'Flagged' },
                    { mode: 'oldest', icon: Clock, label: 'Oldest' },
                    { mode: 'random', icon: Shuffle, label: 'Random' }
                ].map(({ mode, icon: Icon, label }) => (
                    <button
                        key={mode}
                        onClick={() => onSortChange(mode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${sortMode === mode
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                    >
                        <Icon size={12} />
                        {label}
                    </button>
                ))}
                <div className="flex-1" />
                <button
                    onClick={onToggleAppealsOnly}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${showAppealsOnly
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                >
                    <Filter size={12} />
                    Only Appeals
                </button>
            </div>
        </div>
    );
}
