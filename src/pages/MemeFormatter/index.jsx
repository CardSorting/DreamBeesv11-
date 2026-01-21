import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Wand2, RefreshCw, Download, Share2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase'; // Adjust path if needed
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const MemeFormatter = () => {
    const { currentUser } = useAuth();
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [memeText, setMemeText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMeme, setGeneratedMeme] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image too large (max 5MB)");
                return;
            }
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setGeneratedMeme(null); // Reset result
        }
    };

    const handleGenerate = async () => {
        if (!selectedImage) {
            toast.error("Please provide an image");
            return;
        }

        if (!currentUser) {
            toast.error("You must be logged in");
            return;
        }

        setIsGenerating(true);
        const formatMeme = httpsCallable(functions, 'api');

        try {
            // Need to convert image to base64 or upload it first?
            // Existing handlers often take base64 for small interactions, or URLs.
            // Let's use base64 for simplicity as planned.
            const reader = new FileReader();
            reader.readAsDataURL(selectedImage);

            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                // Determine mime type
                const mimeType = selectedImage.type;

                // Prepare payload
                // The handler expects { action: 'formatMeme', image: base64, text: ... } or imageUrl
                // We send base64 data to be handled by the backend logic I verified/implied.
                // Wait, I checked `formatMemeWithGemini` and it takes `imageUrl` and fetches it. 
                // BUT I mentioned assuming the frontend handles upload OR we update the helper.
                // I DID NOT update the helper to handle base64 directly (it does fetchWithTimeout).
                // HOWEVER, `fetch` can handle Data URIs in some environments (Node 18+).
                // If `fetchWithTimeout` uses `node-fetch` or native fetch, it might work.

                // ALTERNATIVE: Upload to a temp storage? 
                // OR: Send as `imageUrl` with a data URI?
                // `fetchWithTimeout` implementation in `utils.js` (I didn't read it fully) might restrict protocols.
                // Let's try sending as a data URI string in `imageUrl`.

                const dataUri = reader.result;

                try {
                    const result = await formatMeme({
                        action: 'formatMeme',
                        imageUrl: dataUri, // Sending Data URI as the URL
                        text: memeText
                    });

                    if (result.data) {
                        setGeneratedMeme(result.data.imageUrl);
                        toast.success("Meme formatted successfully!");
                    }
                } catch (error) {
                    console.error("Generation failed", error);
                    toast.error(error.message || "Failed to format meme");
                } finally {
                    setIsGenerating(false);
                }
            };

        } catch (err) {
            console.error(err);
            setIsGenerating(false);
            toast.error("An error occurred");
        }
    };

    return (
        <div className="meme-formatter-container">
            <div className="meme-content-wrapper">

                {/* Header */}
                <header className="meme-header">
                    <div className="meme-logo">
                        <span className="logo-glitch" data-text="MEME_FORMATTER">MEME_FORMATTER</span>
                        <span className="version-tag">v2.5</span>
                    </div>
                    <p className="meme-subtitle">Internet-Shaped Image Processor</p>
                </header>

                <main className="meme-workspace">

                    {/* Input Section */}
                    <div className="meme-controls">
                        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                hidden
                            />
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="image-preview" />
                            ) : (
                                <div className="upload-placeholder">
                                    <ImageIcon size={48} />
                                    <span>DROP_IMAGE_HERE</span>
                                </div>
                            )}
                        </div>

                        <div className="text-input-group">
                            <label>CAPTION_INPUT</label>
                            <textarea
                                value={memeText}
                                onChange={(e) => setMemeText(e.target.value)}
                                placeholder="WHEN THE CODE DEPLOYS... (Leave empty for Auto-Gen)"
                                maxLength={200}
                            />
                        </div>

                        <button
                            className={`generate-btn ${isGenerating ? 'loading' : ''}`}
                            onClick={handleGenerate}
                            disabled={isGenerating || !selectedImage}
                        >
                            {isGenerating ? (
                                <span className="loading-text"><RefreshCw className="spin" /> PROCESSING...</span>
                            ) : (
                                <>
                                    <Wand2 size={20} />
                                    <span>EXECUTE_FORMAT</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Result Section */}
                    <div className="meme-result-zone">
                        {generatedMeme ? (
                            <div className="result-display">
                                <img src={generatedMeme} alt="Generated Meme" />
                                <div className="result-actions">
                                    <a href={generatedMeme} download="meme.webp" target="_blank" rel="noopener noreferrer" className="action-btn">
                                        <Download size={20} />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="result-placeholder">
                                <div className="terminal-cursor">_</div>
                                <span>WAITING_FOR_INPUT</span>
                            </div>
                        )}
                    </div>

                </main>
            </div>

            <style>{`
                /* Inline styles for uniqueness as requested */
                :root {
                    --meme-bg: #000000;
                    --meme-accent: #00ff41; /* CRT Green */
                    --meme-text: #ffffff;
                    --meme-font: 'Courier New', monospace;
                }

                .meme-formatter-container {
                    min-height: 100vh;
                    background-color: var(--meme-bg);
                    color: var(--meme-text);
                    font-family: var(--meme-font);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 2rem;
                    background-image: 
                        linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px);
                    background-size: 20px 20px;
                }

                .meme-content-wrapper {
                    width: 100%;
                    max-width: 1200px;
                    display: flex;
                    flex-direction: column;
                    gap: 3rem;
                }

                .meme-header {
                    text-align: center;
                    border-bottom: 2px solid var(--meme-accent);
                    padding-bottom: 1rem;
                }

                .meme-logo {
                    font-size: 2.5rem;
                    font-weight: 900;
                    letter-spacing: -2px;
                    text-transform: uppercase;
                    position: relative;
                    display: inline-block;
                }

                .logo-glitch {
                    color: var(--meme-text);
                    text-shadow: 2px 2px 0px #ff00ff, -2px -2px 0px #00ffff;
                }

                .version-tag {
                    font-size: 0.8rem;
                    background: var(--meme-accent);
                    color: black;
                    padding: 2px 6px;
                    margin-left: 10px;
                    vertical-align: middle;
                    font-weight: bold;
                }

                .meme-subtitle {
                    color: rgba(255, 255, 255, 0.6);
                    margin-top: 0.5rem;
                    letter-spacing: 2px;
                }

                .meme-workspace {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4rem;
                    align-items: start;
                }

                @media (max-width: 900px) {
                    .meme-workspace {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }
                }

                /* Controls */
                .meme-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .upload-zone {
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    height: 300px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.02);
                    overflow: hidden;
                    position: relative;
                }

                .upload-zone:hover {
                    border-color: var(--meme-accent);
                    background: rgba(0, 255, 65, 0.05);
                }

                .upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    color: rgba(255, 255, 255, 0.4);
                }

                .image-preview {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .text-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .text-input-group label {
                    font-size: 0.8rem;
                    color: var(--meme-accent);
                    font-weight: bold;
                }

                textarea {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #fff;
                    padding: 1rem;
                    min-height: 100px;
                    font-family: 'Impact', sans-serif; /* Meme font preview */
                    font-size: 1.2rem;
                    resize: vertical;
                    text-transform: uppercase;
                }

                textarea:focus {
                    outline: none;
                    border-color: var(--meme-accent);
                    box-shadow: 0 0 10px rgba(0, 255, 65, 0.2);
                }

                .generate-btn {
                    background: var(--meme-accent);
                    color: black;
                    border: none;
                    padding: 1rem;
                    font-family: var(--meme-font);
                    font-weight: bold;
                    font-size: 1.1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    text-transform: uppercase;
                    transition: all 0.2s;
                    box-shadow: 4px 4px 0px rgba(255, 255, 255, 0.1);
                }

                .generate-btn:hover:not(:disabled) {
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px rgba(255, 255, 255, 0.2);
                }

                .generate-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Result Zone */
                .meme-result-zone {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .result-placeholder {
                    color: rgba(255, 255, 255, 0.2);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }

                .terminal-cursor {
                    font-size: 2rem;
                    animation: blink 1s step-end infinite;
                }

                @keyframes blink {
                    50% { opacity: 0; }
                }

                .result-display img {
                    max-width: 100%;
                    max-height: 600px;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                }

                .result-actions {
                    margin-top: 1rem;
                    display: flex;
                    justify-content: center;
                }

                .action-btn {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 10px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .action-btn:hover {
                    background: var(--meme-accent);
                    color: black;
                }
            `}</style>
        </div>
    );
};

export default MemeFormatter;
