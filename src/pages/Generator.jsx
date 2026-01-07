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

import { Loader2, Sparkles, Image as ImageIcon, Sliders, Settings2, Trash2, ChevronDown, ChevronUp, Mic, MicOff, Zap, AlertCircle, Share2, Maximize2, Dices, X, Wand2, Monitor, Smartphone, LayoutTemplate, Square, RectangleHorizontal, RectangleVertical, HelpCircle, ThumbsUp, ThumbsDown, Film, Video, Paperclip, Upload, Type } from 'lucide-react';

import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl, getRandomPrompt, getEnhancedPrompt } from '../utils';


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
    const [videoDuration, setVideoDuration] = useState(5);
    const [videoResolution, setVideoResolution] = useState('1080p');
    const [currentJobType, setCurrentJobType] = useState('image');

    // Microphone
    const [isListening, setIsListening] = useState(false);
    const speechRecognitionRef = useRef(null);

    // Video Gallery State
    const [recentImages, setRecentImages] = useState([]);
    const [analyzingImageId, setAnalyzingImageId] = useState(null);
    const [isCustomVideoPrompt, setIsCustomVideoPrompt] = useState(false);

    useEffect(() => {
        setIsCustomVideoPrompt(false);
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

    const handleVideoAutoAnimate = async (image) => {
        setAnalyzingImageId(image.id);
        try {
            // 1. Generate Prompt
            const generateVideoPromptFn = httpsCallable(functions, 'generateVideoPrompt');
            const result = await generateVideoPromptFn({ imageUrl: image.imageUrl });

            if (!result.data.prompt) throw new Error("No prompt generated");

            // 2. Start Video Generation
            const createVideoGenerationRequest = httpsCallable(functions, 'createVideoGenerationRequest');

            // Set global loading states
            setGenerating(true);
            setGeneratedImage(null);
            setCurrentJobType('video');

            const videoResult = await createVideoGenerationRequest({
                prompt: result.data.prompt,
                image: image.imageUrl,
                duration: videoDuration,
                resolution: videoResolution,
                aspectRatio: image.aspectRatio || aspectRatio
            });

            setCurrentJobId(videoResult.data.requestId);
            setPrompt(result.data.prompt);
            setReferenceImage(image.imageUrl);

        } catch (error) {
            console.error("Auto animate error", error);
            toast.error("Failed to animate image");
            setGenerating(false);
        } finally {
            setAnalyzingImageId(null);
        }
    };

    // Auto-Prompt / Image Reference
    const [referenceImage, setReferenceImage] = useState(null); // URL or Base64
    const [isAutoPrompting, setIsAutoPrompting] = useState(false);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

    // Renamed local function to avoid conflict/confusion, we'll use ImagePickerModal exclusively
    const handlePickerSelect = (result) => {
        // result: { type: 'gallery'|'upload', data: url|base64 }
        setReferenceImage(result.data);
    };

    const handleAutoPrompt = async () => {
        if (!referenceImage) return toast.error("Please attach an image first");

        setIsAutoPrompting(true);
        try {
            const generateVideoPromptFn = httpsCallable(functions, 'generateVideoPrompt');
            const payload = {};
            if (referenceImage.startsWith('data:')) {
                payload.image = referenceImage;
            } else {
                payload.imageUrl = referenceImage;
            }
            const result = await generateVideoPromptFn(payload);

            if (result.data.prompt) {
                setPrompt(result.data.prompt);
                toast.success("Prompt generated!");
            }
        } catch (error) {
            console.error("Auto prompt error", error);
            toast.error("Failed to auto-prompt");
        } finally {
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
                const createVideoGenerationRequest = httpsCallable(functions, 'createVideoGenerationRequest');
                const result = await createVideoGenerationRequest({
                    prompt: prompt,
                    image: referenceImage, // Use attached image for Image-to-Video
                    duration: videoDuration,
                    resolution: videoResolution,
                    aspectRatio: aspectRatio // Optional
                });
                setCurrentJobId(result.data.requestId);
            } else {
                const createGenerationRequest = httpsCallable(functions, 'createGenerationRequest');
                const result = await createGenerationRequest({
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
                        {(generationMode === 'video' && !isCustomVideoPrompt && !generating && !currentJobId && !prompt && !referenceImage) ? (
                            <div style={{ flex: 1, padding: '32px' }}>

                                <div style={{
                                    width: '100%',
                                    maxWidth: '900px',
                                    margin: '0 auto 32px auto',
                                    aspectRatio: '16/9',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '24px',
                                    border: '1px dashed var(--color-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    padding: '40px'
                                }}>
                                    {/* Header / Instructions */}
                                    <div style={{ marginBottom: '32px', textAlign: 'center', width: '100%' }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                            Create Video
                                        </h2>
                                        <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
                                            Turn any image into a cinematic video. Choose an action below to start.
                                        </div>
                                    </div>

                                    {/* Main Actions Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px', width: '100%' }}>
                                        {/* Upload Card */}
                                        <button
                                            onClick={() => setIsImagePickerOpen(true)}
                                            className="action-card"
                                            style={{
                                                padding: '16px', borderRadius: '16px',
                                                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                cursor: 'pointer', color: 'white', transition: 'all 0.2s ease',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'rgba(var(--color-accent-rgb), 0.2)', color: 'var(--color-accent-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Upload size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Upload Image</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>From local device</div>
                                            </div>
                                        </button>

                                        {/* Custom Prompt Card */}
                                        <button
                                            onClick={() => setIsCustomVideoPrompt(true)}
                                            className="action-card"
                                            style={{
                                                padding: '16px', borderRadius: '16px',
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                cursor: 'pointer', color: 'var(--color-text-muted)', transition: 'all 0.2s ease',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Type size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>Write Prompt</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Describe manually</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Recent History Grid */}
                                {recentImages.length > 0 && (
                                    <>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', flexShrink: 0 }}>
                                            Bring to Life (Recent)
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                                            {recentImages.map(img => (
                                                <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)', transform: 'translateZ(0)' }} className="magic-card">
                                                    <img
                                                        src={getOptimizedImageUrl(img.imageUrl)}
                                                        alt=""
                                                        style={{
                                                            width: '100%', height: '100%', objectFit: 'cover',
                                                            transition: 'transform 0.5s ease',
                                                            opacity: analyzingImageId === img.id ? 0.5 : 1
                                                        }}
                                                    />

                                                    {/* Magic Overlay */}
                                                    <div className="magic-overlay" style={{
                                                        position: 'absolute', inset: 0,
                                                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
                                                        opacity: 0, transition: 'all 0.3s ease',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        backdropFilter: 'blur(2px)'
                                                    }}>
                                                        <button
                                                            onClick={() => handleVideoAutoAnimate(img)}
                                                            disabled={!!analyzingImageId}
                                                            className="btn-magic"
                                                            style={{
                                                                background: 'white', color: 'black', border: 'none',
                                                                borderRadius: '100px', padding: '10px 20px',
                                                                fontSize: '0.8rem', fontWeight: '700',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                boxShadow: '0 4px 15px rgba(255,255,255,0.3)',
                                                                cursor: 'pointer', transform: 'translateY(10px)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {analyzingImageId === img.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-purple-600" fill="currentColor" />}
                                                            {analyzingImageId === img.id ? 'Analyzing...' : 'Magic Animate'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <style>{`
                                    .action-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.2) !important; }
                                    .magic-card:hover img { transform: scale(1.1); }
                                    .magic-card:hover .magic-overlay { opacity: 1; }
                                    .magic-card:hover .btn-magic { transform: translateY(0); }
                                    .btn-magic:hover { transform: scale(1.05) translateY(0) !important; box-shadow: 0 6px 20px rgba(255,255,255,0.5) !important; }
                                `}</style>
                            </div>
                        ) : (
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
                                            placeholder="Describe your vision..."
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

                                                {generationMode === 'video' && (
                                                    <>
                                                        <button
                                                            onClick={() => setIsImagePickerOpen(true)}
                                                            className="btn-ghost"
                                                            title="Attach Image (Gallery/Upload)"
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
                                                                title="Auto-Write Prompt with Gemini"
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
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setPrompt(prev => getEnhancedPrompt(prev))}
                                                    className="btn-ghost"
                                                    title="Magic Enhance"
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        color: 'var(--color-accent-primary)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <Wand2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setPrompt(getRandomPrompt())}
                                                    className="btn-ghost"
                                                    title="Surprise Me"
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        color: 'var(--color-text-muted)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <Dices size={16} />
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

                        {/* Tabs */}
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

                                    {/* Video Mode: Bring to Life */}
                                    {generationMode === 'video' && (
                                        <div style={{ marginBottom: '24px' }}>
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
                                                {/* 1. Upload Tile */}
                                                <button
                                                    onClick={() => setIsImagePickerOpen(true)}
                                                    className="hover:bg-white/5"
                                                    style={{
                                                        aspectRatio: '1',
                                                        borderRadius: '12px',
                                                        border: '1px dashed var(--color-border)',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        color: 'var(--color-text-muted)',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                        gap: '4px', cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Upload / Select Image"
                                                >
                                                    <Upload size={18} />
                                                    <span style={{ fontSize: '0.65rem' }}>Upload</span>
                                                </button>

                                                {/* 2. Recent Images (Max 8) */}
                                                {recentImages.slice(0, 8).map((img) => {
                                                    const isSelected = referenceImage === img.imageUrl;
                                                    return (
                                                        <button
                                                            key={img.id}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    clearReferenceImage();
                                                                } else {
                                                                    setReferenceImage(img.imageUrl);
                                                                }
                                                            }}
                                                            className="hover-card"
                                                            style={{
                                                                aspectRatio: '1',
                                                                borderRadius: '12px',
                                                                overflow: 'hidden',
                                                                border: isSelected ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                                                cursor: 'pointer',
                                                                padding: 0,
                                                                position: 'relative',
                                                                boxShadow: isSelected ? '0 0 10px rgba(var(--color-accent-rgb), 0.3)' : 'none'
                                                            }}
                                                            title={img.prompt || "Recent Generation"}
                                                        >
                                                            <img
                                                                src={getOptimizedImageUrl(img.imageUrl)}
                                                                alt=""
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isSelected ? 1 : 0.8 }}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                                                Select an image from history or upload a new one to animate.
                                            </div>
                                        </div>
                                    )}

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
                                                <input type="range" min="5" max="10" step="1" value={videoDuration} onChange={(e) => setVideoDuration(parseInt(e.target.value))} />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                    <span>5s</span>
                                                    <span>10s</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="setting-label">RESOLUTION</label>
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
                                        </div>
                                    )}

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

