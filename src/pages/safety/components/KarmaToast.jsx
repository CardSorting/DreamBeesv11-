import React from 'react';
import { Sparkles } from 'lucide-react';

export default function KarmaToast({ karma, streak, consensus }) {
    return (
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
                        +{karma} Karma
                        {streak > 0 && (
                            <span className="text-orange-400 text-xs">(+{streak} streak)</span>
                        )}
                    </div>
                    <div className="text-zinc-400 text-xs">
                        {consensus !== 'pending' ? '🎯 Matched consensus!' : 'Thank you for voting'}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
