import React, { useState, useEffect } from 'react';
import ModelSelectorModal from '../components/ModelSelectorModal';
import GenerationHistory from '../components/GenerationHistory';
import { useModel } from '../contexts/ModelContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles, Image as ImageIcon, Sliders, Settings2, Trash2, ChevronDown, ChevronUp, Mic, MicOff, Zap, AlertCircle, Share2, Maximize2, Dices, X, Wand2, Monitor, Smartphone, LayoutTemplate, Square, RectangleHorizontal, RectangleVertical, HelpCircle } from 'lucide-react';

import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl, getRandomPrompt, getEnhancedPrompt } from '../utils';


export default function Generator() {
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const { selectedModel, setSelectedModel, availableModels, loading, getShowcaseImages } = useModel();

    // Modal State
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeTab, setActiveTab] = useState('simple');
    const [showcaseImages, setShowcaseImages] = useState([]);

    const [prompt, setPrompt] = useState(searchParams.get('prompt') || '');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState('pending');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [progress, setProgress] = useState(0);

    // Advanced Settings
    const [aspectRatio, setAspectRatio] = useState(searchParams.get('aspectRatio') || '1:1');
    const [steps, setSteps] = useState(parseInt(searchParams.get('steps')) || 30);
    const [cfg, setCfg] = useState(parseFloat(searchParams.get('cfg')) || 7.0);
    const [negPrompt, setNegPrompt] = useState(searchParams.get('negPrompt') || "");
    const [seed, setSeed] = useState(parseInt(searchParams.get('seed')) || -1);

    // Monetization
    const [credits, setCredits] = useState(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);

    // Microphone
    const [isListening, setIsListening] = useState(false);
    const [speechRecognition, setSpeechRecognition] = useState(null);
    const [interimTrans, setInterimTrans] = useState('');

    // --- Effects & Logic ---

    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCredits(data.credits !== undefined ? data.credits : 5);
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
                let interimHelper = '';
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimHelper += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setPrompt(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
                    setInterimTrans('');
                } else {
                    setInterimTrans(interimHelper);
                }
            };

            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
            setSpeechRecognition(recognition);
        }
    }, []);

    const toggleListening = () => {
        if (!speechRecognition) return toast.error("Browser not supported");
        if (isListening) {
            speechRecognition.stop();
            setIsListening(false);
        } else {
            speechRecognition.start();
            setIsListening(true);
            toast.success("Listening...", { icon: '🎙️' });
        }
    };

    // Timer & Status Simulation
    useEffect(() => {
        let interval;
        if (generating) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
                // Asymptotic progress 
                setProgress(prev => prev + (99 - prev) * 0.02);
            }, 100); // Faster updates for smoother feel
        } else {
            setElapsedTime(0);
            setProgress(0);
        }
        return () => clearInterval(interval);
    }, [generating]);

    // Firestore Job Listener
    useEffect(() => {
        if (!currentJobId) return;
        const unsub = onSnapshot(doc(db, "generation_queue", currentJobId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setJobStatus(data.status);
                if (data.status === 'completed') {
                    setProgress(100);
                    setTimeout(() => {
                        setGeneratedImage(data.imageUrl);
                        setGenerating(false);
                        setCurrentJobId(null);
                        setJobStatus('pending');
                    }, 500);
                } else if (data.status === 'failed') {
                    toast.error(`Failed: ${data.error}`);
                    setGenerating(false);
                    setCurrentJobId(null);
                }
            }
        });
        return () => unsub();
    }, [currentJobId]);

    const handleGenerate = async () => {
        if (!prompt || !selectedModel) return;
        setGenerating(true);
        setGeneratedImage(null);

        try {
            const docRef = await addDoc(collection(db, "generation_queue"), {
                userId: currentUser.uid,
                prompt: prompt,
                negative_prompt: negPrompt,
                modelId: selectedModel.id,
                status: 'pending',
                aspectRatio: aspectRatio,
                steps: steps,
                cfg: cfg,
                seed: seed,
                createdAt: serverTimestamp()
            });
            setCurrentJobId(docRef.id);
        } catch (error) {
            console.error("Queue error", error);
            setGenerating(false);
            toast.error(error.message);
        }
    };



    const handleHistorySelect = (job) => {
        setGeneratedImage(job.imageUrl);
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
            <div className="container" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 340px', gap: '32px' }}>

                {/* Left: Canvas / Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>

                    {/* Header Info (Mobile only mostly, or subtle) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'white' }}>Studio</h1>
                        {subscriptionStatus !== 'active' && (
                            <div style={{ fontSize: '0.85rem', color: credits > 0 ? 'var(--color-text-muted)' : '#ef4444', fontWeight: '600' }}>
                                {credits} CREDITS REMAINING
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
                                    <img src={getOptimizedImageUrl(generatedImage)} alt="Generated" style={{ width: '100%', height: '100%', boxShadow: '0 0 50px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
                                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '12px' }}>
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
                                    <ImageIcon size={64} style={{ marginBottom: '16px' }} />
                                    <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>Ready to Dream</div>
                                </div>
                            )}
                        </div>

                        {/* Prompt Input Bar - Chat Style */}
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
                                            disabled={generating || !prompt || (credits <= 0 && subscriptionStatus !== 'active')}
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
                    </div>

                    {/* Generation History (Internal) */}
                    <GenerationHistory
                        onSelect={handleHistorySelect}
                        selectedJobId={null}
                    />
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

                            {activeTab === 'advanced' && (
                                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                    {/* Aspect Ratio (Now in Advanced) */}
                                    <div>
                                        <label className="setting-label">ASPECT RATIO</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            {[
                                                { label: 'Square', value: '1:1', icon: <Square size={18} />, desc: '1:1' },
                                                { label: 'Landscape', value: '16:9', icon: <Monitor size={18} />, desc: '16:9' },
                                                { label: 'Portrait', value: '9:16', icon: <Smartphone size={18} />, desc: '9:16' },
                                                { label: 'Classic L', value: '3:2', icon: <RectangleHorizontal size={18} />, desc: '3:2' },
                                                { label: 'Classic P', value: '2:3', icon: <RectangleVertical size={18} />, desc: '2:3' }
                                            ].map(r => (
                                                <button
                                                    key={r.value}
                                                    onClick={() => setAspectRatio(r.value)}
                                                    title={r.label}
                                                    style={{
                                                        padding: '12px 8px',
                                                        borderRadius: '12px',
                                                        border: aspectRatio === r.value ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                                        background: aspectRatio === r.value ? 'rgba(var(--color-accent-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                                                        color: aspectRatio === r.value ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    className="hover:bg-white/5"
                                                >
                                                    <div style={{
                                                        opacity: aspectRatio === r.value ? 1 : 0.7
                                                    }}>
                                                        {r.icon}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>{r.label}</span>
                                                        <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{r.desc}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

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

            {/* Model Selection Modal */}
            <ModelSelectorModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                models={availableModels}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
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

