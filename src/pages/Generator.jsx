import React, { useState, useEffect, useRef } from 'react';
import SEO from '../components/SEO';
import ModelSelectorModal from '../components/ModelSelectorModal';
import ImagePickerModal from '../components/ImagePickerModal';
import GenerationHistory from '../components/GenerationHistory';
import { useModel } from '../contexts/ModelContext';
import { db, functions } from '../firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';

import { Loader2, Sparkles, Image as ImageIcon, Sliders, Settings2, Trash2, ChevronDown, ChevronUp, Mic, MicOff, Zap, AlertCircle, Share2, Maximize2, X, Wand2, Monitor, Smartphone, LayoutTemplate, Square, RectangleHorizontal, RectangleVertical, HelpCircle, ThumbsUp, ThumbsDown, Film, Video, Paperclip, Upload, Type } from 'lucide-react';

import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl } from '../utils';

const api = httpsCallable(functions, 'api');


export default function Generator() {
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const { selectedModel, setSelectedModel, availableModels, loading, getShowcaseImages, rateGeneration } = useModel();

    // Modal State
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeTab, setActiveTab] = useState('simple');
    const [showcaseImages, setShowcaseImages] = useState([]);

    const [prompt, setPrompt] = useState(searchParams.get('prompt') || '');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [activeJob, setActiveJob] = useState(null); // Full job object for rating
    const [elapsedTime, setElapsedTime] = useState(0);
    const [progress, setProgress] = useState(0);

    // Advanced Settings
    const [aspectRatio, setAspectRatio] = useState(searchParams.get('aspectRatio') || '1:1');
    const [steps, setSteps] = useState(parseInt(searchParams.get('steps')) || 30);
    const [cfg, setCfg] = useState(parseFloat(searchParams.get('cfg')) || 7.0);
    const [negPrompt, setNegPrompt] = useState(searchParams.get('negPrompt') || "");
    const [seed, setSeed] = useState(parseInt(searchParams.get('seed')) || -1);

    // Monetization
    // Monetization
    const [credits, setCredits] = useState(null);
    const [reels, setReels] = useState(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);

    // Video State
    const [generationMode, setGenerationMode] = useState('image'); // 'image' | 'video'
    const [videoDuration, setVideoDuration] = useState(6);
    const [videoResolution, setVideoResolution] = useState('1080p');
    const [currentJobType, setCurrentJobType] = useState('image');

    // Microphone
    const [isListening, setIsListening] = useState(false);
    const speechRecognitionRef = useRef(null);

    // Video Gallery State
    const [recentImages, setRecentImages] = useState([]);
    const [analyzingImageId, setAnalyzingImageId] = useState(null);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleMagicEnhance = async () => {
        if (!prompt || isEnhancing) return;
        setIsEnhancing(true);

        // Cleanup listener ref if exists (though usually handled by closure/useEffect, but here we do ad-hoc)
        // For simplicity in this component structure, we'll just set up a one-off listener.

        try {
            const result = await api({ action: 'createEnhanceRequest', prompt });
            const requestId = result.data.requestId;

            const unsubscribe = onSnapshot(doc(db, 'enhance_queue', requestId), (snapshot) => {
                if (!snapshot.exists()) return;
                const data = snapshot.data();

                if (data.status === 'completed') {
                    setPrompt(data.prompt);
                    toast.success("Magic enhanced!");
                    setIsEnhancing(false);
                    unsubscribe();
                } else if (data.status === 'failed') {
                    console.error("Enhance failed:", data.error);
                    toast.error("Failed to enhance prompt: " + (data.error || "Unknown error"));
                    setIsEnhancing(false);
                    unsubscribe();
                }
                // If 'queued' or 'processing', keeps loading
            });

        } catch (error) {
            console.error(error);
            toast.error("Failed to start enhancement");
            setIsEnhancing(false);
        }
    };

    useEffect(() => {
        if (generationMode === 'video') {
            setActiveTab('advanced');
        }
    }, [generationMode]);

    useEffect(() => {
        if (currentUser && generationMode === 'video') {
            const q = query(
                collection(db, 'generation_queue'),
                where('userId', '==', currentUser.uid),
                where('status', '==', 'completed'),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setRecentImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribe();
        }
    }, [currentUser, generationMode]);

    const triggerVideoAnimation = async (imageUrl, imageId = null, imgAspectRatio = null) => {
        // Immediate UI feedback & Race Condition Prevention (Client-side)
        if (generating) return;

        if (imageId) setAnalyzingImageId(imageId);
        setGenerating(true);
        setGeneratedImage(null);
        setCurrentJobType('video');
        setReferenceImage(imageUrl);
        setPrompt("Analyzing image..."); // Temporary placeholder

        const MAX_RETRIES = 3;
        let retries = 0;
        let success = false;

        try {
            const api = httpsCallable(functions, 'api');

            while (retries < MAX_RETRIES && !success) {
                try {
                    const videoResult = await api({
                        action: 'createVideoGenerationRequest',
                        autoPrompt: true,
                        image: imageUrl,
                        duration: videoDuration,
                        resolution: videoResolution,
                        aspectRatio: imgAspectRatio || aspectRatio
                    });

                    setCurrentJobId(videoResult.data.requestId);
                    success = true; // Exit loop on success
                } catch (innerError) {
                    console.error(`Video generation attempt ${retries + 1} failed:`, innerError);

                    // Check if we should retry (internal error or generic failure)
                    const isRetryable = innerError.message?.includes('internal') || innerError.code === 'internal';

                    if (isRetryable && retries < MAX_RETRIES - 1) {
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retries))); // Exponential backoff (2s, 4s...)
                        console.log(`Retrying video generation (Attempt ${retries + 1})...`);
                    } else {
                        throw innerError; // Rethrow to outer catch if not retryable or max retries reached
                    }
                }
            }

        } catch (error) {
            console.error("Video generation error final", error);

            let errorMessage = "Failed to animate image. Please try again.";

            if (error.message?.includes('concurrency') || error.message?.includes('progress')) {
                errorMessage = "You already have a video generation in progress.";
            } else if (error.code === 'resource-exhausted') {
                errorMessage = "Insufficient Reels balance.";
            } else if (error.message?.includes('internal')) {
                errorMessage = "Server error. Please try again later.";
            }

            toast.error(errorMessage);
            setGenerating(false);
            setPrompt("");
            setReferenceImage(null);
        } finally {
            setAnalyzingImageId(null);
        }
    };

    const handleVideoAutoAnimate = (image) => triggerVideoAnimation(image.imageUrl, image.id, image.aspectRatio);

    // Auto-Prompt / Image Reference
    const [referenceImage, setReferenceImage] = useState(null); // URL or Base64
    const [isAutoPrompting, setIsAutoPrompting] = useState(false);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

    // Renamed local function to avoid conflict/confusion, we'll use ImagePickerModal exclusively
    const handlePickerSelect = (result) => {
        // result: { type: 'gallery'|'upload', data: url|base64 }
        if (generationMode === 'video') {
            triggerVideoAnimation(result.data);
        } else {
            setReferenceImage(result.data);
        }
    };

    const handleAutoPrompt = async () => {
        if (!referenceImage) return toast.error("Please attach an image first");

        setIsAutoPrompting(true);
        try {
            const api = httpsCallable(functions, 'api');
            const payload = { action: 'createAnalysisRequest' };
            if (referenceImage.startsWith('data:')) {
                payload.image = referenceImage;
            } else {
                payload.imageUrl = referenceImage;
            }
            const { data } = await api(payload);
            const requestId = data.requestId;

            // Subscribe to results
            const unsub = onSnapshot(doc(db, "analysis_queue", requestId), (snapshot) => {
                if (snapshot.exists()) {
                    const status = snapshot.data().status;
                    if (status === 'completed') {
                        setPrompt(snapshot.data().prompt);
                        toast.success("Prompt generated!");
                        // Clear image after successful prompt generation to avoid confusion
                        if (generationMode === 'image') {
                            setReferenceImage(null);
                        }
                        setIsAutoPrompting(false);
                        unsub();
                    } else if (status === 'failed') {
                        toast.error("Analysis failed: " + snapshot.data().error);
                        setIsAutoPrompting(false);
                        unsub();
                    }
                }
            });

            // Auto-cleanup subscriber if it takes too long
            setTimeout(() => {
                unsub();
                if (isAutoPrompting) {
                    setIsAutoPrompting(false);
                    toast.error("Analysis timeout. Please try again.");
                }
            }, 60000); // 1 minute timeout

        } catch (error) {
            console.error("Auto prompt request error", error);
            toast.error("Failed to start analysis");
            setIsAutoPrompting(false);
        }
    };

    const clearReferenceImage = () => {
        setReferenceImage(null);
    };

    // --- Effects & Logic ---

    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCredits(data.credits !== undefined ? data.credits : 5);
                setReels(data.reels !== undefined ? data.reels : 0);
                setSubscriptionStatus(data.subscriptionStatus);
            } else {
                setCredits(5);
                setSubscriptionStatus('inactive');
            }
        });
        return () => unsub();
    }, [currentUser]);

    // Fetch Showcase Images
    useEffect(() => {
        if (selectedModel) {
            getShowcaseImages(selectedModel.id).then(imgs => setShowcaseImages(imgs));
        }
        // getShowcaseImages is stable from ModelContext, safe to exclude from deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedModel]);


    // Fullscreen Escape Key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setPrompt(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
                }
            };

            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
            speechRecognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (!speechRecognitionRef.current) return toast.error("Browser not supported");
        if (isListening) {
            speechRecognitionRef.current.stop();
            setIsListening(false);
        } else {
            speechRecognitionRef.current.start();
            setIsListening(true);
            toast.success("Listening...", { icon: '🎙️' });
        }
    };

    // Timer & Status Simulation
    useEffect(() => {
        if (!generating) {
            // Reset when not generating
            setElapsedTime(0);
            setProgress(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
            // Asymptotic progress 
            setProgress(prev => prev + (99 - prev) * 0.02);
        }, 100); // Faster updates for smoother feel

        return () => clearInterval(interval);
    }, [generating]);

    // Auto-Switch Model on Mode Change
    useEffect(() => {
        if (!selectedModel || availableModels.length === 0) return;

        if (generationMode === 'video' && selectedModel.type !== 'Video') {
            const videoModel = availableModels.find(m => m.type === 'Video');
            if (videoModel) setSelectedModel(videoModel);
        } else if (generationMode === 'image' && selectedModel.type === 'Video') {
            const imageModel = availableModels.find(m => m.type !== 'Video' && m.id === 'zit-model') || availableModels.find(m => m.type !== 'Video');
            if (imageModel) setSelectedModel(imageModel);
        }
    }, [generationMode, availableModels, selectedModel, setSelectedModel]);

    // Firestore Job Listener
    useEffect(() => {
        if (!currentJobId) return;

        const collectionName = currentJobType === 'video' ? 'video_queue' : 'generation_queue';
        const unsub = onSnapshot(doc(db, collectionName, currentJobId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setActiveJob({ id: docSnap.id, ...data }); // Keep active job synced

                if (data.status === 'completed') {
                    setProgress(100);
                    setTimeout(() => {
                        // For video, imageUrl might be videoUrl
                        setGeneratedImage(currentJobType === 'video' ? data.videoUrl : data.imageUrl);
                        setGenerating(false);
                        setCurrentJobId(null);
                    }, 500);
                } else if (data.status === 'failed') {
                    toast.error(`Failed: ${data.error}`);
                    setGenerating(false);
                    setCurrentJobId(null);
                }
            }
        });
        return () => unsub();
    }, [currentJobId, currentJobType]);

    const handleGenerate = async () => {
        if (!prompt || !selectedModel) return;

        // Mode Specific Checks
        if (generationMode === 'video') {
            // Calculate estimated cost (simple client-side check)
            let rate = 18;
            if (videoResolution === '2k') rate = 36;
            if (videoResolution === '4k') rate = 72;
            const estCost = rate * videoDuration;

            if (reels < estCost) {
                toast.error(`Insufficient Reels. Need ~${estCost}, have ${reels}.`);
                return;
            }
        } else {
            if (credits <= 0 && subscriptionStatus !== 'active') {
                toast.error("Insufficient Credits");
                return;
            }
        }

        setGenerating(true);
        setGeneratedImage(null);
        setCurrentJobType(generationMode);

        try {
            if (generationMode === 'video') {
                const api = httpsCallable(functions, 'api');
                const result = await api({
                    action: 'createVideoGenerationRequest',
                    prompt: prompt,
                    image: referenceImage, // Use attached image for Image-to-Video
                    duration: videoDuration,
                    resolution: videoResolution,
                    aspectRatio: aspectRatio // Optional
                });
                setCurrentJobId(result.data.requestId);
            } else {
                const api = httpsCallable(functions, 'api');
                const result = await api({
                    action: 'createGenerationRequest',
                    prompt: prompt,
                    negative_prompt: negPrompt,
                    modelId: selectedModel.id,
                    aspectRatio: aspectRatio,
                    steps: steps,
                    cfg: cfg,
                    seed: seed
                });
                setCurrentJobId(result.data.requestId);
            }
        } catch (error) {
            console.error("Queue error", error);
            setGenerating(false);
            const errorMessage = error.message || error.code || "Failed to create generation request";
            toast.error(errorMessage);
        }
    };



    const handleHistorySelect = (job) => {
        setGeneratedImage(job.imageUrl);
        setActiveJob(job); // Set for rating
        setPrompt(job.prompt);
        if (job.negative_prompt) setNegPrompt(job.negative_prompt);

        // Restore parameters
        if (job.aspectRatio) setAspectRatio(job.aspectRatio);
        if (job.steps) setSteps(job.steps);
        if (job.cfg) setCfg(job.cfg);
        if (job.seed) setSeed(job.seed);

        // Restore Model
        if (job.modelId && availableModels.length > 0) {
            const restoredModel = availableModels.find(m => m.id === job.modelId);
            if (restoredModel) {
                setSelectedModel(restoredModel);
            }
        }

        toast.success("Settings restored", { icon: '↺', duration: 2000 });
    };

    if (loading) {
        return (
            <div style={{ paddingTop: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'white' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '140px', paddingBottom: '40px', display: 'flex', flexDirection: 'column' }}>
            <SEO
                title="Studio"
                description="Professional AI Image Generation Studio. Create art with SDXL and Flux models using our high-performance inference engine."
                keywords="AI studio, image generator, stable diffusion online, art creation tool"
            />
            <div className="container" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 340px', gap: '32px' }}>

                {/* Left: Canvas / Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>

                    {/* Header Info (Mobile only mostly, or subtle) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'white' }}>Studio</h1>
                            {/* Mode Toggle */}
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '2px' }}>
                                <button
                                    onClick={() => setGenerationMode('image')}
                                    style={{ padding: '4px 8px', borderRadius: '6px', background: generationMode === 'image' ? 'var(--color-accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.8rem' }}
                                >
                                    <ImageIcon size={14} /> Image
                                </button>
                                <button
                                    onClick={() => setGenerationMode('video')}
                                    style={{ padding: '4px 8px', borderRadius: '6px', background: generationMode === 'video' ? 'var(--color-accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.8rem' }}
                                >
                                    <Film size={14} /> Video
                                </button>
                            </div>
                        </div>

                        {(generationMode === 'image' && subscriptionStatus !== 'active') && (
                            <div style={{ fontSize: '0.85rem', color: credits > 0 ? 'var(--color-text-muted)' : '#ef4444', fontWeight: '600', fontFamily: 'monospace' }}>
                                {credits} CREDITS
                            </div>
                        )}
                        {(generationMode === 'video') && (
                            <div style={{ fontSize: '0.85rem', color: reels > 0 ? 'var(--color-text-muted)' : '#ef4444', fontWeight: '600', fontFamily: 'monospace' }}>
                                {reels} REELS
                            </div>
                        )}
                    </div>

                    {/* Main Workspace */}
                    <div className="glass-panel" style={{ flex: 1, minHeight: '700px', display: 'flex', flexDirection: 'column', padding: '4px', overflow: 'hidden' }}>

                        {/* Result View or Placeholder */}
                        <div style={{ flex: 1, background: '#050505', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {generating ? (
                                <div style={{ textAlign: 'center', width: '100%' }}>
                                    <div style={{ fontSize: '3rem', fontWeight: '800', color: 'rgba(255,255,255,0.1)', letterSpacing: '-0.05em' }} className="animate-pulse-slow">
                                        RENDERING
                                    </div>
                                    <div style={{ height: '1px', width: '200px', background: 'rgba(255,255,255,0.1)', margin: '20px auto', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: 'var(--color-accent-primary)' }} />
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {(elapsedTime / 10).toFixed(1)}s / JOB-{currentJobId ? currentJobId.slice(0, 4).toUpperCase() : 'INIT'}
                                    </div>
                                </div>
                            ) : generatedImage ? (
                                <div className="fade-in" style={{ position: 'absolute', inset: 0, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {generatedImage.endsWith('.mp4') ? (
                                        <video
                                            src={generatedImage}
                                            controls
                                            autoPlay
                                            loop
                                            style={{ width: '100%', height: '100%', boxShadow: '0 0 50px rgba(0,0,0,0.5)', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <img src={getOptimizedImageUrl(generatedImage)} alt={`Generated artwork for prompt: ${prompt}`} style={{ width: '100%', height: '100%', boxShadow: '0 0 50px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
                                    )}
                                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '12px' }}>
                                        {/* Ranking Actions */}
                                        <div style={{ display: 'flex', gap: '8px', marginRight: '16px', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                            <button
                                                onClick={() => {
                                                    if (activeJob) {
                                                        rateGeneration(activeJob, 1);
                                                        toast.success("Rated: Positive");
                                                    }
                                                }}
                                                className="btn-icon-hover"
                                                style={{ padding: '6px', borderRadius: '6px', color: 'white', cursor: 'pointer', background: 'transparent', border: 'none' }}
                                                title="I like this"
                                            >
                                                <ThumbsUp size={18} />
                                            </button>
                                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '4px 0' }} />
                                            <button
                                                onClick={() => {
                                                    if (activeJob) {
                                                        rateGeneration(activeJob, -1);
                                                        setGeneratedImage(null); // Optimistic remove
                                                        setActiveJob(null);
                                                        toast.success("Rated: Negative (Hidden)");
                                                    }
                                                }}
                                                className="btn-icon-hover"
                                                style={{ padding: '6px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', background: 'transparent', border: 'none' }}
                                                title="I dislike this (Hide)"
                                            >
                                                <ThumbsDown size={18} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setIsFullscreen(true)}
                                            className="btn-icon"
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '8px',
                                                background: 'rgba(0,0,0,0.6)', color: 'white',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                            title="Fullscreen"
                                        >
                                            <Maximize2 size={18} />
                                        </button>
                                        <Link to="/gallery" className="btn btn-outline" style={{ padding: '0 16px', height: '36px', fontSize: '0.8rem' }}>
                                            Gallery
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', opacity: 0.3 }}>
                                    {generationMode === 'video' ? <Film size={64} style={{ marginBottom: '16px' }} /> : <ImageIcon size={64} style={{ marginBottom: '16px' }} />}
                                    <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>Ready to Dream</div>
                                </div>
                            )}
                        </div>

                        {/* Prompt Input Bar OR Video Gallery */}
                        {/* Prompt Input / Video Carousel Switch */}
                        {generationMode === 'video' ? (
                            /* Video Mode: Recent Images Carousel (Replaces Prompt Form) */
                            <div style={{
                                padding: '24px',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Sparkles size={14} className="text-purple-400" />
                                        Bring to Life (Recent)
                                    </div>
                                    <Link to="/gallery" style={{ fontSize: '0.8rem', color: 'var(--color-accent-primary)', textDecoration: 'none' }}>
                                        View All
                                    </Link>
                                </div>

                                {recentImages.length > 0 ? (
                                    <div className="custom-scrollbar" style={{
                                        display: 'flex',
                                        gap: '12px',
                                        overflowX: 'auto',
                                        paddingBottom: '12px',
                                        scrollBehavior: 'smooth'
                                    }}>
                                        {recentImages.map(img => (
                                            <button
                                                key={img.id}
                                                onClick={() => handleVideoAutoAnimate(img)}
                                                disabled={!!analyzingImageId}
                                                className="carousel-item"
                                                style={{
                                                    flexShrink: 0,
                                                    width: '140px',
                                                    aspectRatio: '1',
                                                    borderRadius: '16px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    position: 'relative',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    background: '#000',
                                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                                }}
                                            >
                                                <img
                                                    src={getOptimizedImageUrl(img.imageUrl)}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: analyzingImageId === img.id ? 0.5 : 1 }}
                                                />
                                                <div className="hover-overlay" style={{
                                                    position: 'absolute', inset: 0,
                                                    background: 'rgba(0,0,0,0.4)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    opacity: 0, transition: 'opacity 0.2s',
                                                    backdropFilter: 'blur(2px)'
                                                }}>
                                                    <div style={{
                                                        background: 'white', color: 'black',
                                                        borderRadius: '50%', padding: '10px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <Video size={18} fill="currentColor" />
                                                    </div>
                                                </div>
                                                {analyzingImageId === img.id && (
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                                                        <Loader2 size={24} className="animate-spin" color="white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: 'var(--color-text-muted)',
                                        border: '1px dashed rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.02)'
                                    }}>
                                        <ImageIcon size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                        <div style={{ fontSize: '0.9rem' }}>No recent images found.</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Generate or upload an image to animate it.</div>
                                    </div>
                                )}
                                <style>{`
                                    .carousel-item:hover .hover-overlay { opacity: 1; }
                                    .carousel-item:hover { transform: translateY(-4px) scale(1.02); border-color: var(--color-accent-primary) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10; }
                                `}</style>
                            </div>
                        ) : (
                            /* Image Mode: Standard Prompt Form */
                            <div style={{ padding: '0', background: 'transparent', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="glass-panel" style={{
                                    margin: '20px',
                                    padding: '6px', // Inner padding for the border effect
                                    borderRadius: '16px',
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{
                                        background: 'rgba(0,0,0,0.4)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        {referenceImage && (
                                            <div style={{ position: 'relative', width: 'fit-content', marginBottom: '8px' }}>
                                                <img
                                                    src={referenceImage.startsWith('data:') ? referenceImage : getOptimizedImageUrl(referenceImage)}
                                                    alt="Reference"
                                                    style={{ height: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
                                                />
                                                <button
                                                    onClick={clearReferenceImage}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-6px',
                                                        right: '-6px',
                                                        background: '#ef4444',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: '18px',
                                                        height: '18px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={referenceImage ? "Click the Sparkles icon above to analyze this image..." : "Describe your vision..."}
                                            className="custom-scrollbar"
                                            style={{
                                                width: '100%',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'white',
                                                fontSize: '1.1rem',
                                                fontWeight: '400',
                                                resize: 'none',
                                                minHeight: '160px',
                                                outline: 'none',
                                                lineHeight: '1.6',
                                                fontFamily: '"Outfit", sans-serif', // Ensure premium font
                                                letterSpacing: '0.01em'
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey && !generating) {
                                                    e.preventDefault();
                                                    handleGenerate();
                                                }
                                            }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={toggleListening}
                                                    className={`btn-ghost ${isListening ? 'listening-pulse' : ''}`}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        color: isListening ? '#ef4444' : 'var(--color-text-muted)',
                                                        background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                                    {isListening && <span>Listening...</span>}
                                                </button>

                                                <button
                                                    onClick={() => setIsImagePickerOpen(true)}
                                                    className="btn-ghost"
                                                    title={generationMode === 'video' ? "Attach Image to Animate" : "Upload Reference Image for Prompt Analysis"}
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        color: referenceImage ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <Paperclip size={16} />
                                                </button>
                                                {referenceImage && (
                                                    <button
                                                        onClick={handleAutoPrompt}
                                                        className={`btn-ghost ${isAutoPrompting ? 'animate-pulse' : ''}`}
                                                        title="Analyze image with Gemini to auto-generate a detailed prompt"
                                                        disabled={isAutoPrompting}
                                                        style={{
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            color: 'var(--color-accent-primary)',
                                                            transition: 'all 0.2s',
                                                            background: 'rgba(var(--color-accent-rgb), 0.1)'
                                                        }}
                                                    >
                                                        {isAutoPrompting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleMagicEnhance}
                                                    className={`btn-ghost ${isEnhancing ? 'animate-pulse' : ''}`}
                                                    title="Magic Enhance with Gemini"
                                                    disabled={isEnhancing}
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        color: 'var(--color-accent-primary)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {isEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        const url = new URL(window.location);
                                                        url.searchParams.set('prompt', prompt);
                                                        if (seed !== -1) url.searchParams.set('seed', seed);
                                                        if (aspectRatio !== '1:1') url.searchParams.set('aspectRatio', aspectRatio);
                                                        if (steps !== 30) url.searchParams.set('steps', steps);
                                                        if (cfg !== 7.0) url.searchParams.set('cfg', cfg);
                                                        if (negPrompt) url.searchParams.set('negPrompt', negPrompt);

                                                        navigator.clipboard.writeText(url.toString());
                                                        toast.success('Link copied to clipboard');
                                                    }}
                                                    className="btn-ghost"
                                                    title="Share Configuration"
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        color: 'var(--color-text-muted)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setPrompt('')}
                                                    className="btn-ghost"
                                                    title="Clear Prompt"
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        color: 'var(--color-text-muted)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleGenerate}
                                                disabled={generating || !prompt || (generationMode === 'image' ? credits <= 0 && subscriptionStatus !== 'active' : reels <= 0)}
                                                className="btn btn-primary generate-btn"
                                                style={{
                                                    height: '42px',
                                                    padding: '0 32px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.95rem',
                                                    fontWeight: '600',
                                                    letterSpacing: '0.02em',
                                                    boxShadow: '0 0 20px rgba(var(--color-accent-rgb), 0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                {generating ? <Loader2 className="animate-spin" size={18} /> : (
                                                    <>
                                                        <Sparkles size={18} style={{ fill: 'currentColor' }} />
                                                        Generate
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Generation History (Internal) - Hidden in Video Mode */}
                    {generationMode !== 'video' && (
                        <GenerationHistory
                            onSelect={handleHistorySelect}
                            selectedJobId={null}
                            onUsePrompt={(job) => {
                                console.log("Using prompt from job:", job);
                                setPrompt(job.prompt);
                                if (job.modelId && availableModels.length > 0) {
                                    console.log("Attempting to restore model:", job.modelId);
                                    const restoredModel = availableModels.find(m => m.id === job.modelId);
                                    console.log("Found model:", restoredModel);
                                    if (restoredModel) {
                                        setSelectedModel(restoredModel);
                                    } else {
                                        console.warn("Could not find model with ID:", job.modelId);
                                    }
                                } else {
                                    console.warn("No modelId in job or availableModels empty", { modelId: job.modelId, modelsCount: availableModels.length });
                                }
                            }}
                        />
                    )}
                </div>



                {/* Right: Property View (Sidebar) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>

                    <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                            <Sliders size={16} /> PARAMETERS
                        </div>

                        {/* Tabs - Hidden in Video Mode */}
                        {generationMode !== 'video' && (
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
                                {['simple', 'advanced'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '8px',
                                            background: activeTab === tab ? 'var(--color-accent-primary)' : 'transparent',
                                            color: activeTab === tab ? 'white' : 'var(--color-text-muted)',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textTransform: 'capitalize',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Model Selector Trigger */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <label className="setting-label" style={{ marginBottom: 0 }}>MODEL ENGINE</label>
                                        <div className="tooltip-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <HelpCircle size={12} color="var(--color-text-muted)" style={{ cursor: 'help' }} />
                                            <div className="tooltip-content">
                                                The Model Engine determines the artistic style and capability of your generation.
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                        {selectedModel.id.toUpperCase()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsModelModalOpen(true)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                    }}
                                    className="hover-glow-border"
                                >
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '12px',
                                        background: '#000',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        position: 'relative',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {selectedModel.image ? (
                                            <img src={getOptimizedImageUrl(selectedModel.image)} alt={selectedModel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                                                <ImageIcon size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', letterSpacing: '-0.02em', marginBottom: '2px' }}>{selectedModel.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {selectedModel.description || "High quality image generation model."}
                                        </div>
                                    </div>
                                    <div style={{ opacity: 0.5, paddingRight: '4px' }}>
                                        <ChevronDown size={18} />
                                    </div>
                                </button>
                            </div>

                            {/* Aspect Ratio Grid */}
                            {/* Visualization / Simple Mode Content */}
                            {activeTab === 'simple' && (
                                <div className="fade-in">

                                    {/* Aspect Ratio - Moved to Simple */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="setting-label">ASPECT RATIO</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                                            {[
                                                { label: '1:1', value: '1:1', icon: <Square size={16} /> },
                                                { label: '16:9', value: '16:9', icon: <Monitor size={16} /> },
                                                { label: '9:16', value: '9:16', icon: <Smartphone size={16} /> },
                                                { label: '3:2', value: '3:2', icon: <RectangleHorizontal size={16} /> },
                                                { label: '2:3', value: '2:3', icon: <RectangleVertical size={16} /> }
                                            ].map(r => (
                                                <button
                                                    key={r.value}
                                                    onClick={() => setAspectRatio(r.value)}
                                                    title={r.label}
                                                    style={{
                                                        padding: '10px 4px',
                                                        borderRadius: '10px',
                                                        border: aspectRatio === r.value ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                                        background: aspectRatio === r.value ? 'rgba(var(--color-accent-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                                                        color: aspectRatio === r.value ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    className="hover:bg-white/5"
                                                >
                                                    <div style={{ opacity: aspectRatio === r.value ? 1 : 0.7 }}>{r.icon}</div>
                                                    <span style={{ fontSize: '0.6rem', fontWeight: '600' }}>{r.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>


                                    {/* Image Mode: Styles */}
                                    {generationMode === 'image' && (
                                        <div>
                                            <label className="setting-label" style={{ marginBottom: '12px' }}>TRY A STYLE</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                {showcaseImages.slice(0, 9).map((img) => (
                                                    <button
                                                        key={img.id}
                                                        onClick={() => {
                                                            setPrompt(img.prompt);
                                                            setGeneratedImage(img.imageUrl);
                                                        }}
                                                        className="hover-card"
                                                        style={{
                                                            aspectRatio: '1',
                                                            borderRadius: '12px',
                                                            overflow: 'hidden',
                                                            border: '1px solid var(--color-border)',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            position: 'relative'
                                                        }}
                                                        title={img.prompt}
                                                    >
                                                        <img
                                                            src={getOptimizedImageUrl(img.imageUrl)}
                                                            alt="Style"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                            {showcaseImages.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                    Select a model to see examples via showcase
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                    {/* Video Settings (Moved to Advanced) */}
                                    {generationMode === 'video' && (
                                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
                                            <div className="alert-box" style={{ padding: '12px', background: 'rgba(var(--color-accent-rgb), 0.1)', borderRadius: '8px', border: '1px solid var(--color-accent-primary)', color: 'white', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <AlertCircle size={16} />
                                                <span>Video generation consumes usage-based <b>Reels</b> currency.</span>
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <label className="setting-label">DURATION (SECONDS)</label>
                                                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'white' }}>{videoDuration}s</span>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                    {[6, 8, 10].map((dur) => (
                                                        <button
                                                            key={dur}
                                                            onClick={() => setVideoDuration(dur)}
                                                            style={{
                                                                padding: '10px',
                                                                borderRadius: '8px',
                                                                border: videoDuration === dur ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                                                background: videoDuration === dur ? 'rgba(var(--color-accent-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                                                                color: videoDuration === dur ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                                                cursor: 'pointer',
                                                                fontSize: '0.9rem',
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {dur}s
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <label className="setting-label">RESOLUTION</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div className="tooltip-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                            <HelpCircle size={12} color="var(--color-text-muted)" style={{ cursor: 'help' }} />
                                                            <div className="tooltip-content">
                                                                Higher resolutions consume more reels and take longer to generate.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                                                    {['1080p', '2k', '4k'].map(res => (
                                                        <button
                                                            key={res}
                                                            onClick={() => setVideoResolution(res)}
                                                            style={{
                                                                padding: '10px',
                                                                borderRadius: '8px',
                                                                border: videoResolution === res ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                                                background: videoResolution === res ? 'rgba(var(--color-accent-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                                                                color: videoResolution === res ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            {res}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Bring to Life (Moved to Advanced for Video) */}
                                            <div style={{ marginTop: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <label className="setting-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 0 }}>
                                                        <Sparkles size={12} /> BRING TO LIFE
                                                    </label>
                                                    {referenceImage && (
                                                        <button
                                                            onClick={clearReferenceImage}
                                                            style={{ fontSize: '0.7rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Trash2 size={12} /> Clear
                                                        </button>
                                                    )}
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                    <button
                                                        onClick={() => setIsImagePickerOpen(true)}
                                                        className="carousel-item"
                                                        style={{
                                                            aspectRatio: '1',
                                                            borderRadius: '12px',
                                                            border: '1px dashed var(--color-border)',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            color: 'var(--color-text-muted)',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            gap: '4px', cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            position: 'relative',
                                                            padding: 0
                                                        }}
                                                    >
                                                        <Upload size={18} />
                                                        <span style={{ fontSize: '0.65rem' }}>Upload</span>
                                                    </button>
                                                    {recentImages.slice(0, 8).map((img) => {
                                                        const isSelected = referenceImage === img.imageUrl;
                                                        const isAnalyzing = analyzingImageId === img.id;
                                                        return (
                                                            <button
                                                                key={img.id}
                                                                onClick={() => handleVideoAutoAnimate(img)}
                                                                disabled={!!analyzingImageId}
                                                                className="carousel-item"
                                                                style={{
                                                                    aspectRatio: '1',
                                                                    borderRadius: '12px',
                                                                    overflow: 'hidden',
                                                                    border: isSelected ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                                                    cursor: 'pointer',
                                                                    padding: 0,
                                                                    position: 'relative',
                                                                    transition: 'all 0.2s',
                                                                    background: '#000'
                                                                }}
                                                            >
                                                                <img src={getOptimizedImageUrl(img.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: (isSelected || isAnalyzing) ? 1 : 0.7 }} />
                                                                {isAnalyzing && (
                                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                                                                        <Loader2 size={16} className="animate-spin" color="white" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {generationMode !== 'video' && (
                                        <>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <label className="setting-label">SEED</label>
                                                    <button
                                                        onClick={() => setSeed(seed === -1 ? Math.floor(Math.random() * 1000000000) : -1)}
                                                        style={{ fontSize: '0.7rem', color: 'var(--color-accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        {seed === -1 ? 'RANDOM' : 'CUSTOM'}
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="number"
                                                        value={seed === -1 ? '' : seed}
                                                        onChange={(e) => setSeed(parseInt(e.target.value) || -1)}
                                                        placeholder="Random (-1)"
                                                        style={{
                                                            width: '100%',
                                                            background: 'rgba(0,0,0,0.3)',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: '8px',
                                                            padding: '8px 12px',
                                                            color: 'white',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => setSeed(Math.floor(Math.random() * 1000000000))}
                                                        className="btn-ghost"
                                                        title="Roll Seed"
                                                        style={{ padding: '8px', borderRadius: '8px', color: 'white', border: '1px solid var(--color-border)' }}
                                                    >
                                                        <Dices size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sliders */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <label className="setting-label">STEPS</label>
                                                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'white' }}>{steps}</span>
                                                </div>
                                                <input type="range" min="10" max="50" value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <label className="setting-label">GUIDANCE SCALE</label>
                                                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'white' }}>{cfg}</span>
                                                </div>
                                                <input type="range" min="1" max="20" step="0.5" value={cfg} onChange={(e) => setCfg(Number(e.target.value))} />
                                            </div>

                                            {/* Negative Prompt */}
                                            <div>
                                                <label className="setting-label">NEGATIVE PROMPT</label>
                                                <textarea
                                                    value={negPrompt}
                                                    onChange={(e) => setNegPrompt(e.target.value)}
                                                    placeholder="blur, watermark, low quality..."
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(0,0,0,0.3)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '8px',
                                                        padding: '12px',
                                                        color: 'var(--color-text-main)',
                                                        fontSize: '0.85rem',
                                                        resize: 'vertical',
                                                        minHeight: '80px',
                                                        fontFamily: 'inherit'
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Modals */}
            <ModelSelectorModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                models={availableModels.filter(m => {
                    if (generationMode === 'video') return m.type === 'Video';
                    return m.type !== 'Video';
                })}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
            />

            <ImagePickerModal
                isOpen={isImagePickerOpen}
                onClose={() => setIsImagePickerOpen(false)}
                onSelect={handlePickerSelect}
            />

            {/* Fullscreen Modal */}
            {isFullscreen && generatedImage && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setIsFullscreen(false)}>
                    <button
                        onClick={() => setIsFullscreen(false)}
                        style={{
                            position: 'absolute', top: '24px', right: '24px',
                            background: 'transparent', border: 'none', color: 'white', cursor: 'pointer'
                        }}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={generatedImage}
                        alt="Full Preview"
                        style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', boxShadow: '0 0 100px rgba(0,0,0,0.8)' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <style>{`
                .setting-label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: var(--color-text-muted);
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }
                @media (max-width: 900px) {
                    .container {
                        grid-template-columns: 1fr !important;
                    }
                }
                .hover-scale { transition: transform 0.4s ease; }
                .hover-card:hover .hover-scale { transform: scale(1.05); }
                .hover-card:hover { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.06) !important; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }

                .hover-glow-border:hover {
                    border-color: rgba(255,255,255,0.3) !important;
                    box-shadow: 0 0 20px rgba(255,255,255,0.05) !important;
                    background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%) !important;
                }

                .tooltip-container:hover .tooltip-content {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(-50%) translateY(0);
                }
                .tooltip-content {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(5px);
                    background: rgba(0,0,0,0.9);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    width: max-content;
                    max-width: 200px;
                    text-align: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s;
                    pointer-events: none;
                    z-index: 10;
                    margin-bottom: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    text-transform: none;
                    font-weight: 400;
                    line-height: 1.4;
                }
            `}</style>
        </div >
    );
}

