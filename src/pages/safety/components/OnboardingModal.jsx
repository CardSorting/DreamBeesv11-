import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Zap, Rocket, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

export default function OnboardingModal({ onComplete }) {
    return (
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
                    You're joining a decentralized jury. <strong className="text-white">No admins here</strong> — every voice has equal weight.
                </p>

                <div className="space-y-3 text-left mb-6">
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-white font-medium text-sm">KEEP = Restore Content</div>
                            <div className="text-zinc-500 text-xs">Vote to keep this visible</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-white font-medium text-sm">REMOVE = Hide Content</div>
                            <div className="text-zinc-500 text-xs">Vote to hide from community</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <Zap size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-white font-medium text-sm">Earn Karma</div>
                            <div className="text-zinc-500 text-xs">Participation increases vote power</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 mb-6">
                    <div className="flex items-center gap-1"><ArrowLeft size={14} /> Keep</div>
                    <div className="flex items-center gap-1"><ArrowDown size={14} /> Skip</div>
                    <div className="flex items-center gap-1">Remove <ArrowRight size={14} /></div>
                </div>

                <button
                    onClick={onComplete}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <Rocket size={18} />
                    Start Reviewing
                </button>
            </motion.div>
        </motion.div>
    );
}
