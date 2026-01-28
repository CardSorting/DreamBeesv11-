import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
// import { httpsCallable } from 'firebase/functions'; // Removed
import { useApi } from '../hooks/useApi';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Button } from '../components/Slideshow/Button';
import { ImageUploader } from '../components/Slideshow/ImageUploader';
import { Sparkles, Download, Languages, Presentation, Image as ImageIcon, Loader2, ArrowLeft, Wand2, FileImage, Gem, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { compressImage } from '../utils';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { calculateZapCost } from '../constants/zapCosts';
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
    const { userProfile, deductZapsOptimistically, rollbackZaps } = useUserInteractions();
    const zaps = userProfile?.zaps || 0;

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

    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleImageSelect = (file, url) => {
        setSelectedFile(file);
        setPreviewUrl(url);
    };

    const _handleClear = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    // Cleanup preview blob
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

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

    const { call: apiCall } = useApi();

    const handleGenerate = async () => {
        if (!selectedFile) return toast.error("Please select an image first");
        if (!currentUser) return toast.error("Please sign in to generate");

        const cost = mode === 'slideshow' ? 3 : 0.5;
        if (zaps < cost) {
            toast.error(`Insufficient Zaps ⚡ (Need ${cost})`);
            return;
        }

        deductZapsOptimistically(cost);
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

            // const api = httpsCallable(functions, 'api', { timeout: 540000 });
            const { data } = await apiCall('api', {
                action: 'createSlideshowGeneration',
                image: imageBase64,
                mode: mode,
                language: language
            }, {
                timeout: 540000,
                toastErrors: true
            });

            if (isMounted.current) {
                setRequestId(data.requestId);
                localStorage.setItem('slideshowState', JSON.stringify({ requestId: data.requestId, mode }));
            }

        } catch (error) {
            console.error("Generation failed:", error);
            const cost = mode === 'slideshow' ? 3 : 0.5;
            rollbackZaps(cost);
            if (isMounted.current) {
                // toast handled by useApi
                setCurrentStep('upload');
            }
        }
    };

    // Restore state on mount
    useEffect(() => {
        const saved = localStorage.getItem('slideshowState');
        if (saved) {
            try {
                const { requestId: savedId, mode: savedMode } = JSON.parse(saved);
                if (savedId) {
                    console.log("Restoring slideshow session:", savedId);
                    setRequestId(savedId);
                    setMode(savedMode || 'poster'); // Restore mode if saved
                    setCurrentStep('processing');
                }
            } catch (err) {
                console.warn("Failed to parse saved slideshow session:", err);
                localStorage.removeItem('slideshowState'); // Clean up bad data
            }
        }
    }, []);

    // Poll for results
    useEffect(() => {
        if (!requestId) return;

        console.log("[Slideshow] Starting listener for ID:", requestId);

        const unsubscribe = onSnapshot(doc(db, 'generation_queue', requestId), (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.data();

            // Safety check for unmounted
            if (!isMounted.current) return;

            if (data.status === 'processing') {
                // Use functional update to avoid dependency on results
                // AND use refs for mode if needed, but here simple calculation is fine
                setResults(prevResults => {
                    // Only update if actually different to save renders
                    if (JSON.stringify(prevResults) !== JSON.stringify(data.results)) {
                        return data.results || [];
                    }
                    return prevResults;
                });

                // Live Streaming: Switch to result view if we have at least one result
                // Use functional update for step to avoid dependency
                setCurrentStep(prevStep => {
                    if ((data.results?.length || 0) > 0 && prevStep === 'processing') {
                        return 'result';
                    }
                    return prevStep;
                });

                const completed = data.results ? data.results.length : 0;
                if (completed > 0) {
                    // We can't easily access 'mode' here without a ref if we want to be pure,
                    // but 'total' is just for display.
                    // A cleaner way is to just set it based on what we know or just generic text.
                    // But actually, we can use a ref for 'mode' if we really need it,
                    // or just omit it from deps and accept it might be stale if it changed (which it shouldn't during gen).
                    // However, to be safe and clean:
                    setLoadingMessage(`Generating images... (${completed} completed)`);
                }

            } else if (data.status === 'completed') {
                setResults(data.results || []);
                setProgress(100);
                setCurrentStep('result');

                // Only stop listening when fully completed
                setTimeout(() => {
                    if (isMounted.current) {
                        setRequestId(null);
                        localStorage.removeItem('slideshowState');
                    }
                }, 1000);

            } else if (data.status === 'failed') {
                toast.error(`Failed: ${data.error}`);
                setCurrentStep('upload');
                setRequestId(null);
                localStorage.removeItem('slideshowState');
            }
        }, (error) => {
            console.error("Slideshow listener error:", error);
        });

        return () => {
            console.log("[Slideshow] Unsubscribing listener for ID:", requestId);
            unsubscribe();
        };
    }, [requestId]); // Only depend on requestId


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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for download
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
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
            <SEO
                title="Slideshow Magic - AI Educational Art Creator"
                description="Transform your images into professional Nekomimi educational posters or interactive slideshows using advanced AI."
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Service",
                            "name": "DreamBeesAI Slideshow Magic",
                            "description": "Educational AI art transformation service.",
                            "provider": {
                                "@type": "Organization",
                                "name": "DreamBeesAI"
                            },
                            "offers": {
                                "@type": "Offer",
                                "price": "0.50",
                                "priceCurrency": "USD",
                                "description": "0.5 Zaps per poster transformation."
                            }
                        },
                        {
                            "@type": "SoftwareApplication",
                            "name": "DreamBeesAI Slideshow Magic",
                            "applicationCategory": "EducationalApplication",
                            "operatingSystem": "Web",
                            "offers": {
                                "@type": "Offer",
                                "price": "0.00",
                                "priceCurrency": "USD"
                            }
                        }
                    ]
                }}
            />
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
                                    disabled={!selectedFile || zaps < (mode === 'slideshow' ? 3 : 0.5)}
                                    title={zaps < (mode === 'slideshow' ? 3 : 0.5) ? "Insufficient Zaps ⚡" : ""}
                                    className="w-full"
                                    icon={Wand2}
                                >
                                    {mode === 'poster' ? 'Transform with Magic (0.5 Credits)' : 'Generate Slideshow (3 Credits)'}
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
