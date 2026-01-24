
import React, { useState } from 'react';
import { Cat, Wand2, Loader2, Info, IdCard, Trophy, Sparkles as SparklesIcon, Award, Users, Layout, Moon, Play, MessageSquareQuote, Zap, Gem } from 'lucide-react';
import { ImageUpload } from './components/ImageUpload';
import { ResultView } from './components/ResultView';
import { Sparkles } from './components/Sparkles';
import { CatDecoration } from './components/CatDecoration';
import { fileToBase64 } from './utils/imageUtils';
import { generateFullDeck } from './utils/pokerUtils';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import './MeowAccTransformer.css';

const AppState = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

const TAROT_CARDS = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"
];

const MeowAccTransformer = () => {
    const [appState, setAppState] = useState(AppState.IDLE);
    const [singleResult, setSingleResult] = useState(null);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('standard');

    const handleImageSelect = async (file) => {
        try {
            setError(null);
            const base64 = await fileToBase64(file);

            setAppState(AppState.LOADING);
            const originalUrl = URL.createObjectURL(file);

            let extraData = null;
            if (mode === 'poker_single') {
                const deck = generateFullDeck();
                extraData = deck[Math.floor(Math.random() * deck.length)];
            } else if (mode === 'tarot') {
                extraData = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
            }

            const functions = getFunctions();
            const meowaccTransform = httpsCallable(functions, 'api');

            const response = await meowaccTransform({
                action: 'meowaccTransform',
                imageBase64: base64,
                mimeType: file.type,
                mode: mode,
                extraData: extraData
            });

            if (response.data.imageBase64) {
                setSingleResult({
                    originalUrl,
                    generatedUrl: `data:image/png;base64,${response.data.imageBase64}`,
                    timestamp: Date.now()
                });
                setAppState(AppState.SUCCESS);
            } else {
                throw new Error("Transformation failed");
            }

        } catch (err) {
            console.error(err);
            const msg = err.message || "Something went wrong while reimagining your image.";
            setError(msg);
            setAppState(AppState.ERROR);
            toast.error(msg);
        }
    };

    const resetApp = () => {
        setAppState(AppState.IDLE);
        setSingleResult(null);
        setError(null);
    };

    const getLoadingTitle = () => {
        switch (mode) {
            case 'card': return 'Forging Rare Card...';
            case 'sports': return 'Drafting Rookie MVP...';
            case 'sports_pro': return 'Engineering Pro Card...';
            case 'fifa': return 'Scouting Elite Talent...';
            case 'poster': return 'Designing Senior Poster...';
            case 'ensemble': return 'Assembling the Squad...';
            case 'comic': return 'Inking Comic Panels...';
            case 'tarot': return 'Consulting the Arcana...';
            case 'meowd': return 'Starting the Invasion...';
            case 'poker_single': return 'Dealing your Card...';
            default: return 'Creating Digital Art...';
        }
    };

    const getLoadingSubtitle = () => {
        switch (mode) {
            case 'card': return 'Inventing funny stats and holographic foil...';
            case 'sports': return 'Applying jersey, sweatbands, and winning spirit...';
            case 'sports_pro': return 'Breaking the frame with elite layered plaque design...';
            case 'fifa': return 'Polishing candy-resin crystals and calculating 99 stats...';
            case 'poster': return 'Adding dramatic spotlights and senior text...';
            case 'ensemble': return 'Cloning your subject into a heroic power pyramid...';
            case 'comic': return 'Mixing 2D lines with 3D renders for a unique story...';
            case 'tarot': return 'Reading your destiny in pastel and gold...';
            case 'meowd': return 'Turning your furniture into words and everyone into smiles...';
            case 'poker_single': return 'Assigning a random suit and rank...';
            default: return 'Redrawing your image with maximum neko energy.';
        }
    };

    const getFeatureTitle = () => {
        if (mode === 'card') return 'RPG Stats';
        if (mode === 'poker_single') return 'Poker Suit';
        if (mode === 'sports') return 'MVP Status';
        if (mode === 'sports_pro') return 'Pro Tier';
        if (mode === 'fifa') return 'Elite Futbol';
        if (mode === 'poster') return 'Senior Night';
        if (mode === 'ensemble') return 'Hero Montage';
        if (mode === 'comic') return 'Comic Strip';
        if (mode === 'tarot') return 'Daily Arcana';
        if (mode === 'meowd') return 'MEOW Invasion';
        return 'Neko Charm';
    };

    const getFeatureDesc = () => {
        if (mode === 'card') return 'Auto-generated abilities & HP.';
        if (mode === 'poker_single') return 'One random playing card.';
        if (mode === 'sports') return 'Team jerseys & athletic poses.';
        if (mode === 'sports_pro') return 'Premium frame-breaking depth.';
        if (mode === 'fifa') return 'Ultra-premium crystal geometry.';
        if (mode === 'poster') return 'Dramatic lighting & varsity text.';
        if (mode === 'ensemble') return 'Epic multi-pose composition.';
        if (mode === 'comic') return 'Mixed 2D/3D action sequences.';
        if (mode === 'tarot') return 'Random Major Arcana reading.';
        if (mode === 'meowd') return 'Typographic object transformations.';
        return 'Subtle cat ears & whimsy.';
    };

    return (
        <div className="meowacc-page min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden font-sans selection:bg-pink-200 selection:text-pink-600 py-12 px-4">
            <Sparkles />

            <main className="container mx-auto relative z-10 max-w-6xl">

                {/* Header */}
                <div className="text-center mb-10 relative">
                    <div className="inline-block relative">
                        <div className="absolute -top-6 -right-8 animate-bounce-slow">
                            <span className="text-4xl">✨</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 drop-shadow-sm mb-2">
                            MEOWACC
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-meow-text/80 font-medium mt-2 flex items-center justify-center gap-2">
                        <Cat className="text-pink-300" />
                        <span>Reimagine reality, but cuter.</span>
                        <Cat className="text-blue-300" />
                    </p>
                </div>

                {/* Tab Selection */}
                {appState === AppState.IDLE && (
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/60 p-1.5 rounded-full flex gap-1 shadow-sm backdrop-blur-sm border border-white/50 overflow-x-auto max-w-full no-scrollbar pb-2">
                            {[
                                { id: 'standard', icon: Wand2, label: 'Standard', color: 'from-pink-300 to-purple-300' },
                                { id: 'meowd', icon: MessageSquareQuote, label: "Meow'd", color: 'from-pink-400 to-orange-400' },
                                { id: 'fifa', icon: Gem, label: 'Elite Futbol', color: 'from-yellow-400 to-amber-400' },
                                { id: 'sports_pro', icon: Zap, label: 'Sports Pro', color: 'from-indigo-500 to-blue-500' },
                                { id: 'card', icon: IdCard, label: 'Trading Card', color: 'from-purple-300 to-blue-300' },
                                { id: 'sports', icon: Trophy, label: 'Sports Card', color: 'from-teal-300 to-blue-300' },
                                { id: 'poster', icon: Award, label: 'Poster', color: 'from-yellow-300 to-orange-300' },
                                { id: 'ensemble', icon: Users, label: 'Ensemble', color: 'from-red-300 to-pink-300' },
                                { id: 'comic', icon: Layout, label: 'Comic Strip', color: 'from-emerald-300 to-teal-300' },
                                { id: 'tarot', icon: Moon, label: 'Tarot Card', color: 'from-indigo-300 to-purple-300' },
                                { id: 'poker_single', icon: Play, label: 'Solo Poker', color: 'from-blue-300 to-cyan-300' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all duration-300 whitespace-nowrap ${mode === m.id
                                            ? `bg-gradient-to-r ${m.color} text-white shadow-md`
                                            : 'text-meow-text/60 hover:bg-white/50 hover:text-meow-text'
                                        }`}
                                >
                                    <m.icon size={18} />
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Card */}
                <div className="relative mx-auto max-w-4xl">
                    <CatDecoration />

                    <div className="glass-panel rounded-[3rem] p-8 md:p-12 shadow-xl shadow-purple-100/50 relative overflow-hidden transition-all duration-500 min-h-[400px]">

                        {/* Loading State Overlay */}
                        {appState === AppState.LOADING && (
                            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-200 to-blue-200 flex items-center justify-center mb-6 animate-spin-slow">
                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                </div>
                                <h3 className="text-2xl font-bold text-meow-text mb-2 animate-pulse">
                                    {getLoadingTitle()}
                                </h3>
                                <p className="text-meow-text/60">
                                    {getLoadingSubtitle()}
                                </p>
                            </div>
                        )}

                        {/* Error State */}
                        {appState === AppState.ERROR && (
                            <div className="text-center py-10 animate-fade-in">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-400 mb-4">
                                    <Info size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-red-400 mb-2">Oopsies!</h3>
                                <p className="text-meow-text/70 mb-6 max-w-md mx-auto">{error}</p>
                                <button
                                    onClick={resetApp}
                                    className="px-6 py-2 rounded-full bg-pink-100 text-pink-500 font-bold hover:bg-pink-200 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Content Views */}
                        {appState === AppState.IDLE && (
                            <div className="flex flex-col items-center animate-fade-in">
                                <div className="w-full max-w-xl">
                                    <ImageUpload onImageSelect={handleImageSelect} isLoading={false} />
                                </div>

                                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                    <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 transition-all hover:-translate-y-1">
                                        <div className="text-2xl mb-2">🌸</div>
                                        <h4 className="font-bold text-meow-text mb-1">Pastel Palette</h4>
                                        <p className="text-sm text-meow-text/70">Soft pinks, blues & creams.</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 transition-all hover:-translate-y-1">
                                        <div className="text-2xl mb-2">🐱</div>
                                        <h4 className="font-bold text-meow-text mb-1">
                                            {getFeatureTitle()}
                                        </h4>
                                        <p className="text-sm text-meow-text/70">
                                            {getFeatureDesc()}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 transition-all hover:-translate-y-1">
                                        <div className="text-2xl mb-2">✨</div>
                                        <h4 className="font-bold text-meow-text mb-1">Y2K Soft</h4>
                                        <p className="text-sm text-meow-text/70">Nostalgic digital warmth.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {appState === AppState.SUCCESS && singleResult && (
                            <ResultView result={singleResult} onReset={resetApp} />
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12 text-meow-text/40 text-sm font-medium">
                    <p>Powered by Gemini 2.5 • Made with 💖 and 🐾</p>
                </div>

            </main>
        </div>
    );
};

export default MeowAccTransformer;
