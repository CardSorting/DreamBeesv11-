import React, { useState, useRef, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Sparkles, Upload, X, Zap, ChevronRight, Image as ImageIcon, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const INSPIRATIONS = [
    "Cyberpunk Samurai with Neon Katanas",
    "Ethereal Fae in Bioluminescent Forest",
    "Steampunk Inventor with Brass Goggles",
    "Retro Astronaut in Vaporwave Space",
    "Noir Detective in Rainy Metropolis",
    "Pixel Art Warrior with Glitch Effects"
];

export default function AvatarForgeRequest() {
    const { call: apiCall } = useApi();
    const [prompt, setPrompt] = useState('');
    const [referenceImage, setReferenceImage] = useState(null);
    const [showRefUpload, setShowRefUpload] = useState(false);
    const [generating, setGenerating] = useState(false);
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [prompt]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setReferenceImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handleForgeRequest = async () => {
        if (!prompt) return toast.error("The forge needs a vision (prompt)!");

        setGenerating(true);
        const toastId = toast.loading("Forging your collection...");

        try {
            await apiCall('api', {
                action: 'generateAvatarCollection',
                theme: prompt,
                style: 'Matching established aesthetic',
                referenceImage
            });
            toast.success("Request sent to the forge! 30 avatars incoming.", { id: toastId });
            setPrompt('');
            setReferenceImage(null);
            setShowRefUpload(false);
        } catch (error) {
            console.error("Forge failed:", error);
            toast.error(error.message || "Forge failed", { id: toastId });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <section className="forge-immersive-container">
            {/* Background Atmosphere handled by Layout */}

            <div className="forge-content-centered">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="forge-hero-interface"
                >
                    <div className="input-header">
                        <Wand2 size={24} className="text-purple-400" />
                        <span className="text-zinc-400 font-medium tracking-wide">WHAT WILL YOU CREATE?</span>
                    </div>

                    <div className="hero-input-wrapper">
                        <textarea
                            ref={textareaRef}
                            className="forge-hero-input"
                            placeholder="Describe your legend..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={1}
                            disabled={generating}
                        />
                    </div>

                    {/* Tools / Actions Bar */}
                    <div className="forge-tools-bar">
                        <button
                            className={`tool-btn ${showRefUpload || referenceImage ? 'active' : ''}`}
                            onClick={() => setShowRefUpload(!showRefUpload)}
                        >
                            <ImageIcon size={18} />
                            <span>{referenceImage ? 'Image Set' : 'Reference'}</span>
                        </button>

                        <div className="tools-divider" />

                        <div className="inspirations-scroll">
                            {INSPIRATIONS.map((insp, i) => (
                                <button
                                    key={i}
                                    className="inspiration-chip"
                                    onClick={() => setPrompt(insp)}
                                >
                                    {insp}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reference Upload Slide-out */}
                    <AnimatePresence>
                        {(showRefUpload || referenceImage) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="reference-panel"
                            >
                                {referenceImage ? (
                                    <div className="preview-compact">
                                        <img src={referenceImage} alt="Ref" />
                                        <button className="remove-ref" onClick={() => setReferenceImage(null)}>
                                            <X size={14} />
                                        </button>
                                        <span className="ref-label">Reference Loaded</span>
                                    </div>
                                ) : (
                                    <label className="upload-compact-zone">
                                        <Upload size={20} />
                                        <span>Upload Reference Image</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <div className="submit-area">
                        <button
                            className="forge-launch-btn"
                            onClick={handleForgeRequest}
                            disabled={generating || !prompt}
                        >
                            {generating ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="animate-spin" size={20} /> Forging...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Forge Collection <ChevronRight size={20} />
                                </span>
                            )}
                        </button>
                        <p className="cost-label">Cost: 5 Zaps • Generates 30 Avatars to Pool</p>
                    </div>

                </motion.div>
            </div>
        </section>
    );
}
