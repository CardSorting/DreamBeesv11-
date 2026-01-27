import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { scoreToPercent, HIDE_THRESHOLD, SAFE_THRESHOLD } from '../constants';

export default function ScoreBar({ score, votePower, hoveredButton }) {
    return (
        <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                <span>Remove</span>
                <span className="text-zinc-400">Score: {score}</span>
                <span>Keep</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all"
                    style={{ width: `${scoreToPercent(score)}%` }}
                />
                {hoveredButton && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        className={`absolute inset-y-0 ${hoveredButton === 'safe' ? 'bg-green-500' : 'bg-red-500'} rounded-full`}
                        style={{
                            left: `${scoreToPercent(score)}%`,
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
    );
}
