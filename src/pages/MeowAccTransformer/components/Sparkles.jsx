
import React from 'react';
import { Star } from 'lucide-react';

export const Sparkles = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
            <Star className="absolute top-10 left-[10%] text-yellow-300 w-8 h-8 animate-spin-slow opacity-60" fill="currentColor" />
            <Star className="absolute top-40 right-[15%] text-pink-300 w-6 h-6 animate-pulse-slow opacity-60" fill="currentColor" />
            <Star className="absolute bottom-20 left-[20%] text-blue-300 w-10 h-10 animate-bounce-slow opacity-50" fill="currentColor" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-pink-200/20 via-purple-200/20 to-blue-200/20 blur-3xl rounded-full mix-blend-multiply" />
        </div>
    );
};
