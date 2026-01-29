import React from 'react';
import { BookOpen, Layers } from 'lucide-react';
 
import { motion } from 'framer-motion';

const BookCard = ({ book, onClick, index }) => {
    const { theme, style, coverUrl, pageCount, userDisplayName } = book;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative group cursor-pointer break-inside-avoid mb-6"
            onClick={() => onClick(book)}
        >
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 shadow-xl transition-all duration-300 group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/20">

                {/* Cover Image */}
                <div className="aspect-[3/4] w-full relative bg-zinc-800">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={theme}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                            <BookOpen className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-xs font-mono">Generating Cover...</span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold text-white shadow-lg">
                        <Layers className="w-3 h-3 text-indigo-400" />
                        {pageCount} Pages
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 relative z-10 -mt-12">
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md mb-1">
                        {theme}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>By {userDisplayName}</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded text-zinc-300">{style}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default BookCard;
