import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, X, RotateCcw, Sparkles, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../utils';
import './DressUp.css';

const WARDROBE_CATEGORIES = {
    'Costumes 🦸': ['Super Hero ⚡', 'Space Explorer 🚀', 'Fairy Princess 🧚‍♀️', 'Pirate Captain 🏴‍☠️', 'Dinosaur Suit 🦖', 'Magician 🎩', 'Robot 🤖'],
    'Vibes ✨': ['Rainbow Power 🌈', 'Underwater 🐠', 'Outer Space 🌌', 'Candy Land 🍭', 'Spooky House 👻', 'Sunshine Day ☀️', 'Winter Wonderland ❄️'],
    'Roles 🕵️': ['Doctor 🩺', 'Firefighter 🚒', 'Chef 🍳', 'Artist 🎨', 'Rock Star 🎸', 'Detective 🔍'],
    'Backgrounds 🏰': ['Treehouse 🌳', 'Toy Store 🧸', 'Magic Castle 🏰', 'Playground 🛝', 'Moon Surface 🌕']
};

const LOADING_MSG = "MAKING MAGIC...";

export default function DressUp() {
    const { currentUser } = useAuth();
    const [currentImage, setCurrentImage] = useState(null); // base64
    const [activeTab, setActiveTab] = useState('Costumes 🦸');
    const [page, setPage] = useState(0);
    const [generating, setGenerating] = useState(false);

    // Reset page when tab changes
    useEffect(() => {
        setPage(0);
    }, [activeTab]);


    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            try {
                const compressed = await compressImage(base64, 1024, 0.8);
                setCurrentImage(compressed);
            } catch (err) {
                toast.error('Oops! Could not open that picture.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDefaultPick = async (type) => {
        setGenerating(true);
        try {
            const api = httpsCallable(functions, 'api');
            const result = await api({
                action: 'dressUp',
                prompt: `A cute, friendly photo of a ${type}, bright studio lighting, colorful background, high quality.`
            });

            if (result.data.image) {
                setCurrentImage(`data:image/png;base64,${result.data.image}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Oops! Something went wrong.");
        }
        setGenerating(false);
    };

    const handleDressUp = async (item) => {
        if (!currentImage) return toast.error("Pick a friend to dress up first!");

        setGenerating(true);

        try {
            const api = httpsCallable(functions, 'api');
            let prompt = "";
            if (activeTab.includes('Costumes')) prompt = `A fun, colorful photo of the subject wearing a ${item} costume. Friendly, cute, high quality.`;
            else if (activeTab.includes('Vibes')) prompt = `Make the image look like ${item}. Bright colors, fun atmosphere, kid-friendly.`;
            else if (activeTab.includes('Roles')) prompt = `Dress the subject as a ${item}. Cute uniform, props, friendly style.`;
            else if (activeTab.includes('Backgrounds')) prompt = `Change the background to a ${item}. Colorful, illustrated style but photorealistic lighting.`;

            const result = await api({
                action: 'dressUp',
                image: currentImage,
                prompt: prompt
            });

            if (result.data.image) {
                setCurrentImage(`data:image/png;base64,${result.data.image}`);
                toast.success("Ta-da! Look at that!", {
                    icon: '🎉',
                    style: { background: '#FFD700', color: '#000', fontWeight: 'bold' }
                });
            } else {
                throw new Error("No image generated");
            }
        } catch (error) {
            console.error(error);
            toast.error("Oh no! The magic failed. Try again!", { icon: '🪄' });
        }
        setGenerating(false);
    };

    return (
        <div className="playroom-layout">

            {/* LEFT: THE STAGE */}
            <div className="playroom-stage">

                {generating && (
                    <div className="magic-overlay">
                        <div className="magic-content">
                            {/* Wand icon instead of sparkles for "Creating" vibe */}
                            <Sparkles className="spinning-sparkle" size={80} strokeWidth={3} />
                            <h3 className="magic-text">
                                {LOADING_MSG}
                            </h3>
                        </div>
                    </div>
                )}

                {currentImage ? (
                    <div className="stage-content animate-pop">
                        <div className="paper-frame">
                            <img src={currentImage} alt="Subject" className="paper-doll-image" />
                        </div>

                        <button
                            onClick={() => setCurrentImage(null)}
                            className="btn-reset"
                            title="Start Over"
                        >
                            <RotateCcw size={24} />
                            <span>Start Over</span>
                        </button>
                    </div>
                ) : (
                    <div className="stage-empty animate-slide-up">
                        <div className="empty-title-container">
                            <h1 className="playful-title">
                                Magic Dress Up
                            </h1>
                            <p className="playful-subtitle">
                                Pick a friend to start playing!
                            </p>
                        </div>

                        <div className="action-buttons">
                            <label className="btn-big btn-primary">
                                <Camera size={24} />
                                <span>Upload Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>

                            <button onClick={() => handleDefaultPick('cute cat')} className="btn-big btn-secondary">
                                <Sparkles size={24} />
                                <span>Use a Cat</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: TOY CHEST */}
            <div className="toy-chest">
                <div className="chest-header">
                    <h2>Toy Box</h2>
                </div>

                <div className="tab-container">
                    {Object.keys(WARDROBE_CATEGORIES).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="items-grid">
                    {WARDROBE_CATEGORIES[activeTab]
                        .slice(page * 6, (page + 1) * 6)
                        .map((item, index) => (
                            <button
                                key={item}
                                className="grid-item-btn"
                                onClick={() => !generating && handleDressUp(item)}
                                disabled={generating}
                            >
                                <span className="item-label">{item}</span>
                            </button>
                        ))}
                </div>

                {/* Pagination Controls */}
                {/* Pagination Controls - Always Visible (Placeholder if 1 page) */}
                <div className="pagination-controls">
                    <button
                        className="btn-arrow"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <div className="page-dots">
                        {Array.from({ length: Math.max(1, Math.ceil(WARDROBE_CATEGORIES[activeTab].length / 6)) }).map((_, i) => (
                            <div key={i} className={`page-dot ${i === page ? 'active' : ''}`} />
                        ))}
                    </div>

                    <button
                        className="btn-arrow"
                        onClick={() => setPage(p => Math.min(Math.ceil(WARDROBE_CATEGORIES[activeTab].length / 6) - 1, p + 1))}
                        disabled={page >= Math.ceil(WARDROBE_CATEGORIES[activeTab].length / 6) - 1}
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>

        </div>
    );
}
