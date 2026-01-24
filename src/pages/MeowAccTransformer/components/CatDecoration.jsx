
import React from 'react';

export const CatDecoration = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            {/* --- Existing Ears (Top) --- */}
            <div className="hidden md:block absolute -top-8 left-10 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-white transform -rotate-12 filter drop-shadow-md z-10"></div>
            <div className="hidden md:block absolute -top-4 left-14 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-pink-200 transform -rotate-12 z-20"></div>

            <div className="hidden md:block absolute -top-8 right-10 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-white transform rotate-12 filter drop-shadow-md z-10"></div>
            <div className="hidden md:block absolute -top-4 right-14 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-pink-200 transform rotate-12 z-20"></div>

            {/* --- New Abstract Elements --- */}

            {/* Abstract Paw Print (Bottom Left - Background) */}
            <div className="absolute -bottom-16 -left-16 opacity-20 transform -rotate-12 hidden lg:block mix-blend-multiply transition-opacity hover:opacity-30 duration-700">
                {/* Main Pad */}
                <div className="w-40 h-36 bg-pink-200 rounded-[50%] blur-2xl"></div>
                {/* Toe Beans */}
                <div className="absolute -top-4 left-4 w-14 h-16 bg-pink-300 rounded-full blur-xl"></div>
                <div className="absolute -top-12 left-16 w-16 h-20 bg-pink-300 rounded-full blur-xl"></div>
                <div className="absolute -top-6 left-32 w-14 h-16 bg-pink-300 rounded-full blur-xl"></div>
            </div>

            {/* Abstract Whiskers (Right Side) */}
            <div className="absolute top-1/3 -right-12 flex flex-col gap-6 opacity-10 rotate-12 hidden xl:flex">
                <div className="w-48 h-2 bg-indigo-300 rounded-full blur-sm"></div>
                <div className="w-56 h-2 bg-indigo-300 rounded-full blur-sm"></div>
                <div className="w-48 h-2 bg-indigo-300 rounded-full blur-sm"></div>
            </div>

            {/* Stylized Cat Eye Geometric Shape (Left Side) */}
            <div className="absolute top-1/4 -left-20 opacity-15 hidden xl:block transform -rotate-6">
                <div className="relative w-32 h-48">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-[100%] blur-2xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-32 bg-white/60 rounded-full blur-lg"></div>
                </div>
            </div>

            {/* Floating Bubbles/Particles */}
            <div className="absolute bottom-1/4 -right-4 w-8 h-8 bg-yellow-100 rounded-full blur-md opacity-40 animate-pulse-slow"></div>
            <div className="absolute top-1/2 -left-4 w-6 h-6 bg-purple-100 rounded-full blur-md opacity-40 animate-bounce-slow"></div>

        </div>
    );
};
