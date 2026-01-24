import React from 'react';
import { Palette, Sparkles, PlusSquare } from 'lucide-react';

const Header = ({ onImportClick }) => {
    return (
        <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Palette className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
                        ColorCraft <span className="text-indigo-600">AI</span>
                    </h1>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight sm:hidden">
                        ColorCraft
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onImportClick}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200"
                    >
                        <PlusSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Batch Create</span>
                        <span className="sm:hidden">Batch</span>
                    </button>
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 font-medium border-l border-slate-200 pl-4">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span>Gemini 2.5 Flash</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
