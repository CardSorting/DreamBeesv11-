import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ShieldCheck, AlertCircle, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setConsent } from '../utils/analytics';

export default function CommunityConsentModal() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(false);

    useEffect(() => {
        const hasConsented = localStorage.getItem('feedConsentAccepted');
        if (!hasConsented) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        if (checked1 && checked2) {
            localStorage.setItem('feedConsentAccepted', 'true');
            setConsent({ analytics_storage: 'granted', ad_storage: 'granted' });
            setIsVisible(false);
        }
    };

    const handleNotNow = () => {
        navigate('/generate');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden"
                >
                    {/* Brand Indicator */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500" />

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <Info size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">Community Feed</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Read Before Entering</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 text-sm leading-relaxed">
                        <p className="text-zinc-300">
                            This feed is <span className="text-white font-bold">community-moderated</span>, not AI-moderated.
                        </p>
                        <ul className="space-y-3 text-zinc-400">
                            <li className="flex gap-3">
                                <AlertCircle size={16} className="text-zinc-600 shrink-0 mt-0.5" />
                                <span>Posts may include opinions, jokes, experiments, or incomplete ideas.</span>
                            </li>
                            <li className="flex gap-3">
                                <AlertCircle size={16} className="text-zinc-600 shrink-0 mt-0.5" />
                                <span>Content does not represent official views.</span>
                            </li>
                            <li className="flex gap-3">
                                <ShieldCheck size={16} className="text-zinc-600 shrink-0 mt-0.5" />
                                <span>If something feels off, you can mute, hide, or move on.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-3 mb-8">
                        <label className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
                            <input
                                type="checkbox"
                                checked={checked1}
                                onChange={() => setChecked1(!checked1)}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-500/50"
                            />
                            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                I understand this feed is community-moderated
                            </span>
                        </label>

                        <label className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors group">
                            <input
                                type="checkbox"
                                checked={checked2}
                                onChange={() => setChecked2(!checked2)}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-500/50"
                            />
                            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                I understand content may be experimental or unfinished
                            </span>
                        </label>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleAccept}
                            disabled={!checked1 || !checked2}
                            className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:hover:bg-white"
                        >
                            Enter the Feed
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={handleNotNow}
                            className="w-full py-3 text-zinc-500 font-bold hover:text-white transition-colors text-sm"
                        >
                            Not Now
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
