import React, { useState } from 'react';
import { ArtStyle } from '../constants';
import {
    Wand2,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Smile,
    Feather,
    Snowflake,
    Zap,
    CheckCircle,
    BookOpen,
    AlertCircle
} from 'lucide-react';

const STYLE_OPTIONS = [
    {
        id: ArtStyle.SIMPLE,
        label: 'Simple',
        description: 'Thick lines, easy to color. Perfect for kids.',
        icon: Smile
    },
    {
        id: ArtStyle.DETAILED,
        label: 'Realistic',
        description: 'Intricate details and textures for adults.',
        icon: Feather
    },
    {
        id: ArtStyle.MANDALA,
        label: 'Mandala',
        description: 'Geometric patterns for relaxation.',
        icon: Snowflake
    },
    {
        id: ArtStyle.ANIME,
        label: 'Anime',
        description: 'Dynamic manga-style line art.',
        icon: Zap
    },
];

const PromptInput = ({ onCreateBook, isGeneratingConcepts, error }) => {
    const [step, setStep] = useState(1);
    const [theme, setTheme] = useState('');
    const [style, setStyle] = useState(ArtStyle.SIMPLE);

    const handleNext = () => {
        if (step === 1 && !theme.trim()) return;
        setStep((prev) => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setStep((prev) => Math.max(prev - 1, 1));
    };

    const handleCreateClick = () => {
        onCreateBook(theme, style);
        // We stay on step 3 to show loading state via button props
    };

    // --- Step Content Renderers ---

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">1. Choose a Theme</h3>
                <p className="text-slate-500 text-sm">What should your coloring book be about?</p>
            </div>
            <div className="relative">
                <textarea
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g., A magical forest adventure with cute animals, mushrooms, and fairies..."
                    className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none text-lg text-slate-800 placeholder:text-slate-400"
                    autoFocus
                />
                <div className="absolute bottom-3 right-3">
                    <BookOpen className="w-5 h-5 text-slate-300" />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">2. Pick an Art Style</h3>
                <p className="text-slate-500 text-sm">Consistent style for all 30 pages.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STYLE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = style === option.id;
                    return (
                        <button
                            key={option.id}
                            onClick={() => setStyle(option.id)}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
                ${isSelected
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-600/20'
                                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-indigo-600'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                        {option.label}
                                    </div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                                        {option.description}
                                    </div>
                                </div>
                            </div>
                            {isSelected && (
                                <div className="absolute top-4 right-4 text-indigo-600">
                                    <CheckCircle className="w-5 h-5 fill-indigo-600 text-white" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
            <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">Ready to Create?</h3>
                <p className="text-slate-500">We will brainstorm 30 unique pages and start generating them.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left max-w-sm mx-auto space-y-4 shadow-sm">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Book Theme</span>
                    <p className="font-medium text-slate-800 mt-1 line-clamp-3">{theme}</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                    <div className="p-2 bg-white border border-slate-200 rounded-lg">
                        {(() => {
                            const opt = STYLE_OPTIONS.find(o => o.id === style);
                            const Icon = opt?.icon || Smile;
                            return <Icon className="w-5 h-5 text-indigo-600" />;
                        })()}
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Art Style</span>
                        <p className="font-medium text-slate-800">
                            {STYLE_OPTIONS.find(o => o.id === style)?.label}
                        </p>
                    </div>
                </div>
                <div className="pt-2">
                    <div className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded inline-block">
                        30 Pages Total
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">

            {/* Loading Overlay for Step 2 (Concept Generation) */}
            {isGeneratingConcepts && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Wand2 className="w-8 h-8 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-800">Dreaming up ideas...</h3>
                    <p className="text-slate-500 mt-2">Brainstorming 30 unique page concepts for your book.</p>
                </div>
            )}

            {/* Step Progress Indicator */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between max-w-xs mx-auto relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>

                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${step >= s
                                    ? 'bg-indigo-600 text-white ring-4 ring-white'
                                    : 'bg-white border-2 border-slate-200 text-slate-400'
                                }
                ${step === s ? 'scale-110 shadow-lg shadow-indigo-500/30' : ''}
                `}
                        >
                            {s}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between max-w-xs mx-auto mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <span className={step >= 1 ? 'text-indigo-600' : ''}>Theme</span>
                    <span className={step >= 2 ? 'text-indigo-600' : ''}>Style</span>
                    <span className={step >= 3 ? 'text-indigo-600' : ''}>Create</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 md:p-10 min-h-[350px] flex flex-col">
                <div className="flex-grow flex flex-col justify-center">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-slate-500 font-medium hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                            disabled={isGeneratingConcepts}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>
                    ) : (
                        <div></div> // Spacer
                    )}

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!theme.trim()}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all
                ${!theme.trim()
                                    ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                                }`}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreateClick}
                            disabled={isGeneratingConcepts}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all w-full sm:w-auto justify-center
                ${isGeneratingConcepts
                                    ? 'bg-slate-300 cursor-wait'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                                }`}
                        >
                            {isGeneratingConcepts ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Wait...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    Generate 30-Page Book
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptInput;
