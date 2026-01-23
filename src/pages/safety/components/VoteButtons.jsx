import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VoteButtons({ onVote, disabled, onHover }) {
    return (
        <div className="grid grid-cols-3 gap-3">
            <button
                onClick={() => onVote('safe')}
                onMouseEnter={() => onHover?.('safe')}
                onMouseLeave={() => onHover?.(null)}
                disabled={disabled}
                className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/80 backdrop-blur hover:bg-green-500/20 border border-white/5 hover:border-green-500/50 transition-all active:scale-95 disabled:opacity-50 group/btn"
            >
                <CheckCircle size={24} className="text-green-500 mb-1" />
                <span className="text-[10px] font-bold text-white/70">KEEP</span>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                    Restore for everyone
                </div>
            </button>

            <button
                onClick={() => onVote('skip')}
                onMouseEnter={() => onHover?.(null)}
                disabled={disabled}
                className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/80 backdrop-blur hover:bg-zinc-700 border border-white/5 hover:border-white/20 transition-all active:scale-95 disabled:opacity-50 group/btn"
            >
                <span className="text-2xl mb-1 grayscale">🤷</span>
                <span className="text-[10px] font-bold text-white/70">SKIP</span>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                    Not sure, skip it
                </div>
            </button>

            <button
                onClick={() => onVote('unsafe')}
                onMouseEnter={() => onHover?.('unsafe')}
                onMouseLeave={() => onHover?.(null)}
                disabled={disabled}
                className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/80 backdrop-blur hover:bg-red-500/20 border border-white/5 hover:border-red-500/50 transition-all active:scale-95 disabled:opacity-50 group/btn"
            >
                <XCircle size={24} className="text-red-500 mb-1" />
                <span className="text-[10px] font-bold text-white/70">REMOVE</span>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                    Hide from everyone
                </div>
            </button>
        </div>
    );
}
