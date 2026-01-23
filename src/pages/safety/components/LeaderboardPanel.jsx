import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Users, Loader2 } from 'lucide-react';

export default function LeaderboardPanel({ reviewers, loading }) {
    if (loading) return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-purple-500/50" size={20} />
        </div>
    );

    return (
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 w-full">
            <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-yellow-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Reviewers</h3>
            </div>

            <div className="space-y-3">
                {reviewers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'border border-yellow-500/50 text-yellow-500' :
                                        index === 1 ? 'border border-zinc-400/50 text-zinc-400' :
                                            index === 2 ? 'border border-amber-600/50 text-amber-600' : 'text-zinc-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                {index < 3 && (
                                    <div className="absolute -top-1 -right-1">
                                        <Medal size={12} className={
                                            index === 0 ? 'text-yellow-500' : index === 1 ? 'text-zinc-400' : 'text-amber-600'
                                        } />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-white/90 font-medium truncate max-w-[80px]">
                                    {user.username}
                                </span>
                                <span className="text-[9px] text-zinc-500">{user.reviews} reviews</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-yellow-500/80">+{user.karma}</div>
                            <div className="text-[8px] text-zinc-600 uppercase">Karma</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Global Rank</span>
                <span className="text-[10px] text-white font-bold">#142</span>
            </div>
        </div>
    );
}
