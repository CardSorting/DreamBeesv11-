import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Upload, Sparkles, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../utils';
import './DressUp.css';

const WARDROBE_CATEGORIES = {
    Outfits: ['Casual', 'Formal', 'Space Suit', 'Superhero', 'Bikini', 'Winter Coat', 'Cyber Armor', 'Wizard Robe'],
    Vibes: ['Happy', 'Cyberpunk', 'Gothic', 'Minimalist', 'Retro', 'Dreamy', 'Dark Fantasy'],
    Roles: ['Doctor', 'Firefighter', 'Chef', 'Pilot', 'Artist', 'Warrior', 'Mage'],
    Backgrounds: ['Beach', 'City', 'Forest', 'Space', 'Studio', 'Cyber City', 'Fantasy Castle']
};

export default function DressUp() {
    const { currentUser } = useAuth();
    const [currentImage, setCurrentImage] = useState(null); // base64
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Outfits');

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            // Compress/Resize
            try {
                const compressed = await compressImage(base64, 1024, 0.8);
                setCurrentImage(compressed);
            } catch (err) {
                toast.error('Failed to process image');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDefaultPick = async (type) => {
        setLoading(true);
        const toastId = toast.loading(`Generating a ${type}...`);
        try {
            const api = httpsCallable(functions, 'api');
            const result = await api({
                action: 'dressUp',
                prompt: `A cute ${type}, paper doll style, full body, white background. High quality.`
            });

            if (result.data.image) {
                setCurrentImage(`data:image/png;base64,${result.data.image}`);
                toast.success("Character ready!", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate: " + error.message, { id: toastId });
        }
        setLoading(false);
    };

    const handleDressUp = async (item) => {
        if (!currentImage) {
            toast.error("Please upload or pick a character first");
            return;
        }
        setLoading(true);
        const toastId = toast.loading("Changing style...", { icon: '✨' });

        try {
            const api = httpsCallable(functions, 'api');
            let prompt = "";
            if (activeTab === 'Outfits') prompt = `Change the character's outfit to ${item}. Maintain pose and identity.`;
            else if (activeTab === 'Vibes') prompt = `Apply a ${item} vibe to the image.`;
            else if (activeTab === 'Roles') prompt = `Dress the character as a ${item}.`;
            else if (activeTab === 'Backgrounds') prompt = `Change the background to ${item}. Keep character same.`;

            const result = await api({
                action: 'dressUp',
                image: currentImage,
                prompt: prompt
            });

            if (result.data.image) {
                setCurrentImage(`data:image/png;base64,${result.data.image}`);
                toast.success("Updated!", { id: toastId });
            } else {
                throw new Error("No image returned");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update: " + error.message, { id: toastId });
        }
        setLoading(false);
    };

    return (
        <div className="dressup-container">
            <div className="dressup-grid">
                {/* Left: Image Display */}
                <div className="image-panel group">
                    {loading && (
                        <div className="loading-overlay animate-in">
                            <Loader2 className="loader-icon" />
                            <p className="loading-text">Designing...</p>
                        </div>
                    )}

                    <div className="bg-grid" />

                    {currentImage ? (
                        <div className="character-image-wrapper">
                            <img
                                src={currentImage}
                                alt="Character"
                                className="character-image"
                            />
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="space-y-2 mb-8">
                                <h2 className="title-gradient">
                                    DreamBees Dress Up
                                </h2>
                                <p>Upload a character or pick one to start styling.</p>
                            </div>

                            <div className="flex justify-center mb-6">
                                <label className="upload-label">
                                    <Upload size={20} />
                                    Upload Photo
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                            </div>

                            <div className="divider">
                                <span className="divider-line"></span>
                                OR
                                <span className="divider-line"></span>
                            </div>

                            <div className="pick-buttons">
                                <button
                                    onClick={() => handleDefaultPick('cat')}
                                    className="pick-btn group/btn"
                                >
                                    <span>🐱</span>
                                    <span>Pick a Cat</span>
                                </button>
                                <button
                                    onClick={() => handleDefaultPick('bee')}
                                    className="pick-btn group/btn"
                                >
                                    <span>🐝</span>
                                    <span>Pick a Bee</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Controls */}
                <div className="controls-panel">
                    <div className="wardrobe-card">
                        <div className="tabs">
                            {Object.keys(WARDROBE_CATEGORIES).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`tab-btn ${activeTab === tab ? 'active' : 'inactive'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="items-grid">
                            {WARDROBE_CATEGORIES[activeTab].map(item => (
                                <button
                                    key={item}
                                    onClick={() => handleDressUp(item)}
                                    disabled={!currentImage || loading}
                                    className="item-btn group"
                                >
                                    <span className="item-text">
                                        {item}
                                    </span>
                                    <Wand2 size={16} className="item-icon" />
                                </button>
                            ))}
                        </div>

                        {currentImage && (
                            <div className="reset-container">
                                <button
                                    onClick={() => setCurrentImage(null)}
                                    className="reset-btn"
                                >
                                    Start Over
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
