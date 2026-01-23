import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Sparkles, TrendingUp, Trophy, X } from 'lucide-react';

export default function SessionSummary({ sessionCount, karmaEarned, consensusMatches, onShare, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl max-w-sm w-full p-8 text-center relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-500/20 blur-3xl -z-10" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="w-20 h-20 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                    <Trophy size={40} className="text-yellow-500" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
                <p className="text-zinc-400 text-sm mb-8">You made the community safer today.</p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="text-2xl font-bold text-white mb-1">{sessionCount}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Reviews</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="text-2xl font-bold text-yellow-500 mb-1">+{karmaEarned}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Karma</div>
                    </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-8 flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                        <TrendingUp size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <div className="text-white text-sm font-bold">{consensusMatches} Consensus Matches</div>
                        <div className="text-[11px] text-zinc-400">You're seeing what the community sees.</div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={onShare}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Sparkles size={18} />
                        Share My Impact
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors"
                    >
                        Keep Reviewing
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
