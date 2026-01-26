import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, Download } from 'lucide-react';

const BookReaderModal = ({ book, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!book || !book.pages || book.pages.length === 0) return null;

    const totalPages = book.pages.length;
    const currentPage = book.pages[currentIndex];

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % totalPages);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + totalPages) % totalPages);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-lg"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col md:flex-row bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Viewer Area */}
                    <div className="flex-grow relative bg-black flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-between px-4 z-10 pointer-events-none">
                            <button
                                onClick={handlePrev}
                                className="pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentIndex}
                                src={currentPage.imageUrl || currentPage.url}
                                alt={currentPage.prompt}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="max-h-full max-w-full object-contain p-4 sm:p-8"
                            />
                        </AnimatePresence>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white text-sm font-mono border border-white/10">
                            Page {currentIndex + 1} of {totalPages}
                        </div>
                    </div>

                    {/* Sidebar info (Desktop) */}
                    <div className="w-full md:w-80 bg-zinc-900 border-t md:border-t-0 md:border-l border-white/10 flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white mb-2 leading-tight">{book.theme}</h2>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">{book.style}</span>
                                <span>by {book.userDisplayName}</span>
                            </div>
                        </div>

                        <div className="p-6 flex-grow overflow-y-auto">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Current Page Prompt</h4>
                            <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                                {currentPage.prompt.replace('[COLORCRAFT]', '').trim()}
                            </p>

                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Pages Overview</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {book.pages.map((p, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`aspect-[3/4] rounded-lg overflow-hidden border transition-all
                                    ${idx === currentIndex ? 'border-indigo-500 ring-2 ring-indigo-500/20 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}
                                `}
                                    >
                                        <img src={p.thumbnailUrl || p.url} className="w-full h-full object-cover" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BookReaderModal;
