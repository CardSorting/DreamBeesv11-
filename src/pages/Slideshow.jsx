import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Button } from '../components/Slideshow/Button';
import { ImageUploader } from '../components/Slideshow/ImageUploader';
import { Sparkles, Download, Languages, Presentation, Image as ImageIcon, Loader2, ArrowLeft, Wand2, FileImage, Gem, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { compressImage } from '../utils';
import './Slideshow.css';

const LOADING_MESSAGES = [
    "Summoning Nekomimi guides...",
    "Analyzing image structure...",
    "Designing kawaii layout...",
    "Simplifying concepts for kids...",
    "Drawing cute diagrams...",
    "Mixing pastel colors...",
    "Adding educational sparkles...",
    "Polishing vector lines...",
    "Finalizing the magic..."
];

export default function Slideshow() {
    const { currentUser } = useAuth();

    // Steps: 'upload' | 'processing' | 'result'
    const [currentStep, setCurrentStep] = useState('upload');

    // State
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [requestId, setRequestId] = useState(null);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    // history state removed

    // Settings
    const [language, setLanguage] = useState('English');
    const [mode, setMode] = useState('poster');

    const handleImageSelect = (file, url) => {
        setSelectedFile(file);
        setPreviewUrl(url);
    };

    const handleClear = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    // Cycle loading messages

    // Cycle loading messages
    useEffect(() => {
        if (currentStep !== 'processing') return;
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % LOADING_MESSAGES.length;
            setLoadingMessage(LOADING_MESSAGES[index]);
        }, 2000);
        return () => clearInterval(interval);
    }, [currentStep]);

    const handleGenerate = async () => {
        if (!selectedFile) return toast.error("Please select an image first");
        if (!currentUser) return toast.error("Please sign in to generate");

        setCurrentStep('processing');
        setProgress(5);
        setResults([]);
        setActiveSlideIndex(0);

        try {
            let imageBase64 = null;
            if (previewUrl) {
                // Compress client-side
                imageBase64 = await compressImage(previewUrl, 1536, 0.85);
            }

            const api = httpsCallable(functions, 'api', { timeout: 540000 });

            const { data } = await api({
                action: 'createSlideshowGeneration',
                image: imageBase64,
                mode: mode,
                language: language
            });

            setRequestId(data.requestId);

        } catch (error) {
            console.error("Generation failed:", error);
            toast.error(`Generation failed: ${error.message}`);
            setCurrentStep('upload');
        }
    };

    // Poll for results
    useEffect(() => {
        if (!requestId) return;

        const unsubscribe = onSnapshot(doc(db, 'generation_queue', requestId), (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.data();

            if (data.status === 'processing') {
                const total = mode === 'slideshow' ? 8 : 1;
                const completed = data.results ? data.results.length : 0;

                // Sync results if changed
                if (data.results && JSON.stringify(data.results) !== JSON.stringify(results)) {
                    setResults(data.results);
                }

                // Live Streaming: Switch to result view if we have at least one result
                if (completed > 0 && currentStep === 'processing') {
                    setCurrentStep('result');
                }

                if (completed > 0) {
                    setLoadingMessage(`Generating Slide ${completed + 1} of ${total}...`);
                }

            } else if (data.status === 'completed') {
                setResults(data.results || []);
                setProgress(100);

                // Ensure we are on result step
                if (currentStep !== 'result') {
                    setCurrentStep('result');
                }

                // Only stop listening when fully completed
                setTimeout(() => {
                    setRequestId(null);
                }, 1000);

            } else if (data.status === 'failed') {
                toast.error(`Failed: ${data.error}`);
                setCurrentStep('upload');
                setRequestId(null);
            }
        });

        return () => unsubscribe();
    }, [requestId, mode, currentStep]);

    // Zeno's Progress Simulation
    useEffect(() => {
        if (currentStep !== 'processing') return;

        const interval = setInterval(() => {
            setProgress(prev => {
                const total = mode === 'slideshow' ? 8 : 1;
                const completed = results.length;
                const segmentSize = 80 / total;
                const base = 10;

                // Target: Start of current segment + 90% of that segment
                const currentTarget = base + (completed * segmentSize) + (segmentSize * 0.9);
                const actualTarget = Math.min(currentTarget, 95);

                if (prev >= actualTarget) return prev;

                const distance = actualTarget - prev;
                // Move 10% of the remaining distance or min 0.1
                const step = Math.max(0.05, distance * 0.05);

                return Math.min(prev + step, 98);
            });
        }, 100);

        return () => clearInterval(interval);
    }, [currentStep, results.length, mode]);

    const handleDownloadCurrent = async () => {
        if (results.length === 0) return;
        const current = results[activeSlideIndex];
        downloadImage(current.imageUrl, activeSlideIndex);
    };

    const handleDownloadAll = async () => {
        results.forEach((res, idx) => {
            downloadImage(res.imageUrl, idx);
        });
    };

    const downloadImage = async (url, index) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `nekomimi-${mode}-${index + 1}.webp`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Download error:", e);
            toast.error("Download failed due to network error");
        }
    };

    return (
        <div className="slideshow-page">
            <div className="slideshow-container">

                {/* Steps */}
                <div className="step-indicator">
                    <span className={`step-pill ${currentStep === 'upload' ? 'active' : ''}`}>1. Source</span>
                    <span className="step-arrow">→</span>
                    <span className={`step-pill ${currentStep === 'processing' ? 'active' : ''}`}>2. Magic</span>
                    <span className="step-arrow">→</span>
                    <span className={`step-pill ${currentStep === 'result' ? 'active' : ''}`}>3. Result</span>
                </div>

                {/* STEP 1: UPLOAD */}
                {currentStep === 'upload' && (
                    <>
                        <div className="hero-text">
                            <div className="powered-badge">
                                <Gem size={12} /> POWERED BY GEMINI 3 PRO
                            </div>
                            <h1 className="hero-title">
                                Turn ideas into <br />
                                <span className="gradient-text">Kawaii Educational Art</span>
                            </h1>
                            <p className="hero-description">
                                Upload an image to transform it into a professional Nekomimi children's educational poster or slideshow.
                            </p>
                        </div>

                        <div className="main-card">
                            <div className="card-padding">
                                <ImageUploader
                                    selectedImage={previewUrl}
                                    onImageSelect={handleImageSelect}
                                />

                                <div className="input-grid">
                                    <div className="input-field">
                                        <label className="input-label">Format</label>
                                        <div className="segment-control">
                                            <button
                                                className={`segment-btn ${mode === 'poster' ? 'active' : ''}`}
                                                onClick={() => setMode('poster')}
                                            >
                                                <FileImage size={16} /> Poster
                                            </button>
                                            <button
                                                className={`segment-btn ${mode === 'slideshow' ? 'active' : ''}`}
                                                onClick={() => setMode('slideshow')}
                                            >
                                                <Presentation size={16} /> Slideshow
                                            </button>
                                        </div>
                                    </div>

                                    <div className="input-field">
                                        <label className="input-label">Language</label>
                                        <div className="select-wrapper">
                                            <Languages size={16} className="text-zinc-500 mr-2" />
                                            <select
                                                value={language}
                                                onChange={(e) => setLanguage(e.target.value)}
                                                className="native-select"
                                            >
                                                {['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese'].map(lang => (
                                                    <option key={lang} value={lang} style={{ background: '#27272a' }}>{lang}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={!selectedFile}
                                    className="w-full"
                                    icon={Wand2}
                                >
                                    {mode === 'poster' ? 'Transform with Magic (5 Credits)' : 'Generate Slideshow (15 Credits)'}
                                </Button>
                            </div>
                        </div>


                    </>
                )}

                {/* STEP 2: PROCESSING */}
                {currentStep === 'processing' && (
                    <div className="processing-view">
                        <div className="magic-portal">
                            <div className="portal-ring-1" />
                            <div className="portal-ring-2" />
                            <div className="portal-pulse" />
                            <div className="portal-icon">
                                <Sparkles size={48} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">Creating Magic...</h2>
                        <div className="progress-bar-container">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-zinc-400 font-medium animate-pulse">
                            {loadingMessage}
                        </p>
                    </div>
                )}

                {/* STEP 3: RESULT */}
                {currentStep === 'result' && results.length > 0 && (
                    <div className="main-card">
                        <div className="card-padding">
                            <div className="result-header">
                                <div className="flex items-center gap-4">
                                    <Button variant="secondary" onClick={() => setCurrentStep('upload')} icon={ArrowLeft} className="!w-auto">
                                        Create New
                                    </Button>
                                    {requestId && (
                                        <div className="flex items-center gap-2 text-brand-400 text-sm font-medium animate-pulse">
                                            <Loader2 size={16} className="animate-spin" />
                                            Generating...
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {mode === 'slideshow' ? (
                                        <Button onClick={handleDownloadAll} icon={Download} className="!w-auto">
                                            Download All
                                        </Button>
                                    ) : (
                                        <Button onClick={handleDownloadCurrent} icon={Download} className="!w-auto">
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="primary-result-box">
                                {results[activeSlideIndex].imageUrl ? (
                                    <img
                                        src={results[activeSlideIndex].imageUrl}
                                        alt="Result"
                                        className="main-image"
                                    />
                                ) : (
                                    <div className="main-image placeholder-slide">
                                        <div className="placeholder-content">
                                            <Loader2 size={48} className="animate-spin text-brand-400 mb-4" />
                                            <h3 className="text-xl font-bold text-white mb-2">Painting Slide {activeSlideIndex + 1}...</h3>
                                            <p className="text-zinc-400 text-center max-w-md">
                                                {results[activeSlideIndex].prompt || "Mixing magic colors..."}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {results.length > 1 && (
                                    <>
                                        <button
                                            className="nav-btn nav-prev"
                                            disabled={activeSlideIndex === 0}
                                            onClick={() => setActiveSlideIndex(i => Math.max(0, i - 1))}
                                        >
                                            <ChevronLeft />
                                        </button>
                                        <button
                                            className="nav-btn nav-next"
                                            disabled={activeSlideIndex === results.length - 1}
                                            onClick={() => setActiveSlideIndex(i => Math.min(results.length - 1, i + 1))}
                                        >
                                            <ChevronRight />
                                        </button>
                                    </>
                                )}
                            </div>

                            {results.length > 1 && (
                                <div className="thumbnails-track">
                                    {results.map((res, idx) => (
                                        <div
                                            key={idx}
                                            className={`thumbnail-btn ${activeSlideIndex === idx ? 'active' : ''}`}
                                            onClick={() => setActiveSlideIndex(idx)}
                                        >
                                            {res.imageUrl ? (
                                                <img src={res.imageUrl} className="thumbnail-img" />
                                            ) : (
                                                <div className="thumbnail-img placeholder-thumbnail">
                                                    <Loader2 size={16} className="animate-spin text-zinc-500" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
