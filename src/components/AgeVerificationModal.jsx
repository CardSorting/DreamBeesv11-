import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield, Loader2, ArrowRight } from 'lucide-react';
import { isValidBirthDate } from '../utils/age';
import toast from 'react-hot-toast';

export default function AgeVerificationModal() {
    const { currentUser } = useAuth();
    const { userProfile, isProfileLoaded } = useUserInteractions();
    const [birthday, setBirthday] = useState('');
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show modal if user is logged in, profile is loaded, but birthday is missing
        if (currentUser && isProfileLoaded && !userProfile.birthday) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [currentUser, isProfileLoaded, userProfile.birthday]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!birthday) return;

        if (!isValidBirthDate(birthday)) {
            toast.error("Please enter a valid birth date.");
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                birthday: birthday
            });
            toast.success("Age verified successfully!");
            setIsVisible(false);
        } catch (error) {
            console.error("Failed to update birthday:", error);
            toast.error("Failed to save birth date. Please try again.");
        }
        setLoading(false);
    }

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl overflow-hidden relative"
                >
                    {/* Background decoration */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Shield size={32} className="text-purple-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white text-center mb-2">Age Verification</h2>
                        <p className="text-zinc-400 text-center text-sm mb-8">
                            DreamBees requires your birth date to ensure a safe and age-appropriate experience for our community.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 ml-4">
                                    Your Date of Birth
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </div>

                            <button
                                disabled={loading || !birthday}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Verify & Continue
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-[10px] text-zinc-600 text-center mt-6">
                            This is a one-time verification. Your date of birth is used solely for age gating and compliance.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
