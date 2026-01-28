import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield, Loader2, ArrowRight, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { isValidBirthDate, isOver18 } from '../utils/age';
import toast from 'react-hot-toast';

// Utility for creating arrays
const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Custom Scroll Picker Component
 */
function ScrollPicker({ items, value, onChange, label, width = 'w-20' }) {
    const scrollRef = useRef(null);
    const itemHeight = 48; // px

    const scrollToValue = (val) => {
        const index = items.indexOf(val);
        if (index !== -1 && scrollRef.current) {
            scrollRef.current.scrollTo({
                top: index * itemHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const index = items.indexOf(value);
        if (index !== -1 && scrollRef.current) {
            scrollRef.current.scrollTop = index * itemHeight;
        }
    }, [items, value, itemHeight]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollTop = scrollRef.current.scrollTop;
        const index = Math.round(scrollTop / itemHeight);
        if (items[index] !== undefined && items[index] !== value) {
            onChange(items[index]);
        }
    };

    const scrollAdjust = (direction) => {
        const currentIndex = items.indexOf(value);
        const newIndex = direction === 'up'
            ? Math.max(0, currentIndex - 1)
            : Math.min(items.length - 1, currentIndex + 1);

        onChange(items[newIndex]);
        scrollToValue(items[newIndex]);
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            scrollAdjust('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            scrollAdjust('down');
        }
    };

    // Precise wheel support
    const handleWheel = (e) => {
        if (Math.abs(e.deltaY) > 10) {
            e.preventDefault();
            scrollAdjust(e.deltaY > 0 ? 'down' : 'up');
        }
    };

    return (
        <div className={`flex flex-col items-center ${width} group/picker`}>
            <div
                className="relative h-[220px] w-full flex flex-col items-center focus:outline-none"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onWheel={handleWheel}
                aria-label={`Select ${label}`}
            >
                {/* Desktop Controls - Up */}
                <button
                    type="button"
                    onClick={() => scrollAdjust('up')}
                    className="hidden md:flex mb-2 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover/picker:opacity-100"
                >
                    <ChevronUp size={24} />
                </button>

                <div className="relative h-[144px] w-full overflow-hidden bg-white/10 border border-white/20 rounded-3xl group transition-all group-hover/picker:border-white/30 group-focus/picker:ring-2 group-focus/picker:ring-white/20">
                    {/* Selection Highlight */}
                    <div className="absolute top-1/2 left-0 w-full h-12 -translate-y-1/2 bg-white/20 pointer-events-none border-y border-white/10" />

                    {/* Fading Overlays */}
                    <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-zinc-900 to-transparent z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-zinc-900 to-transparent z-10 pointer-events-none" />

                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory py-12"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {items.map((item, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    onChange(item);
                                    scrollToValue(item);
                                }}
                                className={`h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-300 ${item === value
                                    ? 'text-white text-xl font-bold'
                                    : 'text-zinc-500 hover:text-zinc-300 text-sm'
                                    }`}
                            >
                                {typeof item === 'number' && item < 10 ? `0${item}` : item}
                            </div>
                        ))}
                        {/* Padding for scroll */}
                        <div className="h-12" />
                    </div>
                </div>

                {/* Desktop Controls - Down */}
                <button
                    type="button"
                    onClick={() => scrollAdjust('down')}
                    className="hidden md:flex mt-2 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover/picker:opacity-100"
                >
                    <ChevronDown size={24} />
                </button>
            </div>
            <span className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest font-bold">{label}</span>
        </div>
    );
}

export default function AgeVerificationModal() {
    const { currentUser } = useAuth();
    const { userProfile, isProfileLoaded } = useUserInteractions();

    // Default to a reasonable midpoint (e.g., Year 2000)
    const [day, setDay] = useState(1);
    const [month, setMonth] = useState('Jan');
    const [year, setYear] = useState(2000);

    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Dynamic days based on month/year
    const days = useMemo(() => {
        const monthIndex = MONTH_NAMES.indexOf(month) + 1;
        const daysInMonth = new Date(year, monthIndex, 0).getDate();
        return range(1, daysInMonth);
    }, [month, year]);

    const months = useMemo(() => MONTH_NAMES, []);
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return range(currentYear - 100, currentYear).reverse();
    }, []);

    // Auto-correct day if invalid for new month
    useEffect(() => {
        const monthIndex = MONTH_NAMES.indexOf(month) + 1;
        const maxDays = new Date(year, monthIndex, 0).getDate();
        if (day > maxDays) {
            setDay(maxDays);
        }
    }, [month, year, day]);

    const [dismissed, setDismissed] = useState(false);
    const isVisible = useMemo(() => {
        const needsVerification = !!(currentUser && isProfileLoaded && !userProfile?.birthday);
        const result = (needsVerification || isSuccess) && !dismissed;
        if (result && isProfileLoaded) console.log("[AgeVerification] Modal is active", { needsVerification, isSuccess, dismissed });
        return result;
    }, [currentUser, isProfileLoaded, userProfile?.birthday, dismissed, isSuccess]);

    // Convert month name to number
    const monthNumber = useMemo(() => MONTH_NAMES.indexOf(month) + 1, [month]);

    // Live age calculation
    const calculatedAge = useMemo(() => {
        const birthday = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const birthDate = new Date(birthday);
        if (isNaN(birthDate.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }, [day, monthNumber, year]);

    const isVerified = calculatedAge !== null && calculatedAge >= 18;

    // Mounted ref for async safety
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!currentUser) {
            toast.error("You must be logged in.");
            return;
        }

        const birthday = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (!isValidBirthDate(birthday)) {
            toast.error("Please select a valid birth date.");
            return;
        }

        if (!isOver18(birthday)) {
            toast.error("You must be 18 or older to use DreamBees.");
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                birthday: birthday
            });

            if (isMounted.current) {
                setIsSuccess(true);
                toast.success("Age verified successfully!");

                setTimeout(() => {
                    if (isMounted.current) {
                        setDismissed(true);
                    }
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to update birthday:", error);
            if (isMounted.current) {
                toast.error("Failed to save birth date. Please try again.");
                setLoading(false);
            }
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="age-verification-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-[32rem] h-[32rem] bg-purple-500/10 blur-[150px] rounded-full animate-pulse" />
                        <div className="absolute -bottom-24 -right-24 w-[32rem] h-[32rem] bg-blue-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        className="bg-zinc-950/95 backdrop-blur-3xl border border-white/20 rounded-[4rem] max-w-md md:max-w-2xl w-full p-8 md:p-16 shadow-[0_32px_128px_-16px_rgba(0,0,0,1)] overflow-hidden relative"
                    >
                        <div className="relative z-10">
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-20"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 12 }}
                                            className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mb-8 border border-green-500/30"
                                        >
                                            <CheckCircle2 size={80} className="text-green-400" />
                                        </motion.div>
                                        <h2 className="text-4xl font-black text-white text-center mb-4">Verified!</h2>
                                        <p className="text-zinc-400 text-center text-lg">Your journey begins now.</p>
                                    </motion.div>
                                ) : (
                                    <motion.div key="form" exit={{ opacity: 0, y: -20 }}>
                                        <div className="flex justify-center mb-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center shadow-2xl">
                                                <Shield size={40} className="text-white" />
                                            </div>
                                        </div>

                                        <h2 className="text-4xl font-black text-white text-center mb-4 tracking-tight">Identity Check</h2>
                                        <p className="text-zinc-300 text-center text-lg mb-12 leading-relaxed font-medium max-w-md mx-auto">
                                            Confirm your birth date to enter. We're committed to keeping DreamBees safe for everyone.
                                        </p>

                                        <form onSubmit={handleSubmit} className="space-y-12">
                                            <div className="flex justify-center items-center gap-8 px-4">
                                                <ScrollPicker
                                                    items={days}
                                                    value={day}
                                                    onChange={setDay}
                                                    label="Day"
                                                    width="w-24"
                                                />
                                                <ScrollPicker
                                                    items={months}
                                                    value={month}
                                                    onChange={setMonth}
                                                    label="Month"
                                                    width="w-32"
                                                />
                                                <ScrollPicker
                                                    items={years}
                                                    value={year}
                                                    onChange={setYear}
                                                    label="Year"
                                                    width="w-36"
                                                />
                                            </div>

                                            <div className="text-center pt-8">
                                                <AnimatePresence mode="wait">
                                                    {calculatedAge !== null && (
                                                        <motion.div
                                                            key={calculatedAge}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            className="flex items-center justify-center gap-4 bg-white/5 py-4 px-10 rounded-full border border-white/10 inline-flex shadow-inner"
                                                        >
                                                            <span className={`text-2xl font-black ${isVerified ? 'text-green-400' : 'text-red-400'}`}>
                                                                {calculatedAge} <span className="text-zinc-500 font-bold uppercase text-xs tracking-tighter">Years Old</span>
                                                            </span>
                                                            {isVerified ? (
                                                                <CheckCircle2 size={24} className="text-green-400" />
                                                            ) : (
                                                                <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <button
                                                disabled={loading || !isVerified}
                                                className="
                                                w-full group relative overflow-hidden h-16 rounded-2xl 
                                                bg-white text-black font-bold text-lg 
                                                flex items-center justify-center gap-2 
                                                hover:bg-zinc-100 transition-all active:scale-[0.98]
                                                disabled:opacity-20 disabled:cursor-not-allowed
                                            "
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                {loading ? (
                                                    <Loader2 className="animate-spin" size={24} />
                                                ) : (
                                                    <>
                                                        Verify & Continue
                                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </button>
                                        </form>

                                        <p className="text-[10px] text-zinc-600 text-center mt-10 px-8 leading-relaxed font-bold uppercase tracking-widest opacity-50">
                                            Secure · Private · Compliant
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
