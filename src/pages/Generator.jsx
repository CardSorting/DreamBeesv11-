import React, { useState, useEffect } from 'react';
import { useModel } from '../contexts/ModelContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles, Image as ImageIcon, Cpu, Settings, Trash2, ChevronDown, ChevronUp, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Generator() {
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const { selectedModel } = useModel();

    const [prompt, setPrompt] = useState(searchParams.get('prompt') || '');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState('pending'); // pending, processing, completed, failed
    const [elapsedTime, setElapsedTime] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState(0);

    // Advanced Settings State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(searchParams.get('aspectRatio') || '1:1');
    const [steps, setSteps] = useState(parseInt(searchParams.get('steps')) || 30);
    const [cfg, setCfg] = useState(parseFloat(searchParams.get('cfg')) || 5.0);
    const [negPrompt, setNegPrompt] = useState(searchParams.get('negPrompt') || "worst quality, bad quality, low quality, lowres, scan artifacts, jpeg artifacts, sketch, light particles, watermark, multiple views, 2koma, 3koma, 4koma, heart-shaped pupils,");

    // Monetization State
    const [credits, setCredits] = useState(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);

    // Listen to User Credits
    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCredits(data.credits !== undefined ? data.credits : 5); // Default to 5 if not set
                setSubscriptionStatus(data.subscriptionStatus);
            } else {
                // User doc might not exist yet, default to free tier values
                setCredits(5);
                setSubscriptionStatus('inactive');
            }
        });
        return () => unsub();
    }, [currentUser]);

    // Open advanced if any settings are pre-filled
    useEffect(() => {
        if (searchParams.get('aspectRatio') || searchParams.get('steps') || searchParams.get('cfg') || searchParams.get('negPrompt')) {
            setShowAdvanced(true);
        }
    }, [searchParams]);

    const GENERATION_STAGES = [
        { id: 'queue', label: 'Warming up the AI engines...', progress: 15 },
        { id: 'worker', label: 'Worker found! Preparing model...', progress: 35 },
        { id: 'dream', label: 'AI Dreaming: Shaping your vision...', progress: 65 },
        { id: 'detail', label: 'Adding fine details and textures...', progress: 85 },
        { id: 'polish', label: 'Polishing pixels and finishing up...', progress: 95 }
    ];

    useEffect(() => {
        let interval;
        if (generating) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [generating]);

    useEffect(() => {
        let interval;
        if (generating) {
            // Find current stage based on status and elapsed time
            interval = setInterval(() => {
                let stageIndex = 0;
                if (jobStatus === 'pending') {
                    stageIndex = elapsedTime < 5 ? 0 : 1;
                } else if (jobStatus === 'processing') {
                    if (elapsedTime < 15) stageIndex = 2;
                    else if (elapsedTime < 30) stageIndex = 3;
                    else stageIndex = 4;
                }
                const stage = GENERATION_STAGES[stageIndex];
                setStatusMessage(stage.label);

                // Also update progress more intelligently
                setProgress(prev => {
                    const target = stage.progress;
                    if (prev < target) {
                        return prev + (target - prev) * 0.1;
                    }
                    return prev + 0.1; // Slow creep
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [generating, jobStatus, elapsedTime]);

    // Simplified progress logic handled by status message effect
    useEffect(() => {
        if (!generating) {
            setProgress(0);
        }
    }, [generating]);


    useEffect(() => {
        if (!currentJobId) return;

        const unsub = onSnapshot(doc(db, "generation_queue", currentJobId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setJobStatus(data.status);

                if (data.status === 'completed') {
                    setProgress(100);
                    // Slightly longer delay to show 100%
                    setTimeout(() => {
                        setGeneratedImage(data.imageUrl);
                        setGenerating(false);
                        setCurrentJobId(null);
                        setJobStatus('pending');
                    }, 800);
                } else if (data.status === 'failed') {
                    toast.error(`Generation failed: ${data.error || 'Unknown error'}`);
                    setGenerating(false);
                    setCurrentJobId(null);
                    setJobStatus('pending');
                }
            }
        });

        return () => unsub();
    }, [currentJobId]);

    async function handleGenerate() {
        if (!prompt) return;

        setGenerating(true);
        setGeneratedImage(null);
        setElapsedTime(0);
        setShowAdvanced(false); // Auto-collapse for focus

        // Scroll to generator area
        setTimeout(() => {
            const el = document.getElementById('generation-area');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        try {
            // Submit job to Firestore Queue
            const docRef = await addDoc(collection(db, "generation_queue"), {
                userId: currentUser.uid,
                prompt: prompt,
                negative_prompt: negPrompt,
                modelId: selectedModel.id,
                status: 'pending',
                aspectRatio: aspectRatio,
                steps: steps,
                cfg: cfg,
                createdAt: serverTimestamp()
            });
            setCurrentJobId(docRef.id);

        } catch (error) {
            console.error("Error queueing job:", error);
            toast.error(`Error: ${error.message}`);
            setGenerating(false);
        }
    }

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '50px', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                        fontWeight: '800',
                        marginBottom: '8px',
                        background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-2px',
                        lineHeight: '1.1'
                    }}>
                        Dream it. Generate it.
                    </h1>
                    <p style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: 'var(--color-text-muted)' }}>
                        Turn your words into stunning visuals with AI.
                    </p>
                </header>

                <div className="generator-input-wrapper" style={{ padding: '8px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0 8px' }}>
                            {/* Floating Credit Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '0',
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <div className="pill-badge">
                                    <Sparkles size={14} color={credits > 0 || subscriptionStatus === 'active' ? "#fbbf24" : "#ef4444"} />
                                    <span>{subscriptionStatus === 'active' ? "Unlimited" : `${credits} credits`}</span>
                                    {subscriptionStatus !== 'active' && (
                                        <Link to="/pricing" style={{ marginLeft: '4px', opacity: 0.8, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>Get Pro</Link>
                                    )}
                                </div>
                            </div>

                            <textarea
                                placeholder="A futuristic cyberpunk city with neon lights, realistic, 8k..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={generating}
                                className="generator-input"
                                style={{
                                    resize: 'none',
                                    height: '80px',
                                    fontFamily: 'inherit'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (!generating) handleGenerate();
                                    }
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {/* Quick Model Badge */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-muted)',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}>
                                    <Cpu size={12} />
                                    {selectedModel.name}
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleGenerate}
                                disabled={generating || !prompt || (credits <= 0 && subscriptionStatus !== 'active')}
                                style={{
                                    minWidth: '140px',
                                    padding: '10px 24px',
                                    opacity: (credits <= 0 && subscriptionStatus !== 'active') ? 0.5 : 1
                                }}
                            >
                                {generating ? <><Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} /> Generating</> : <><Sparkles size={18} style={{ marginRight: '8px' }} /> Generate Art</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Advanced Settings Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <button
                        onClick={() => !generating && setShowAdvanced(!showAdvanced)}
                        className={`toggle-advanced ${showAdvanced ? 'active' : ''}`}
                        disabled={generating}
                        style={{ cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.5 : 1 }}
                    >
                        <Settings size={16} />
                        Advanced Settings
                        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {showAdvanced && (
                    <div className="fade-in" style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                            {/* Section 1: Output Format */}
                            <div className="section-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                    <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px' }}></div>
                                    <h4 style={{ color: 'white', fontSize: '1.1rem', margin: 0, fontWeight: '600' }}>Output Format</h4>
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '500' }}>Aspect Ratio</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                                        {[
                                            { id: '1:1', w: 24, h: 24, label: 'Square' },
                                            { id: '16:9', w: 32, h: 18, label: 'Landscape' },
                                            { id: '9:16', w: 18, h: 32, label: 'Portrait' },
                                            { id: '3:2', w: 30, h: 20, label: 'Classic' },
                                            { id: '2:3', w: 20, h: 30, label: 'Tall' }
                                        ].map((ratio) => (
                                            <button
                                                key={ratio.id}
                                                onClick={() => setAspectRatio(ratio.id)}
                                                className="ar-btn"
                                                title={ratio.label}
                                                style={{
                                                    padding: '12px 4px',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: aspectRatio === ratio.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                    background: aspectRatio === ratio.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                                    color: aspectRatio === ratio.id ? 'white' : 'var(--color-text-muted)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    height: '80px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div
                                                    className="ar-preview"
                                                    style={{
                                                        width: `${ratio.w}px`,
                                                        height: `${ratio.h}px`,
                                                        background: aspectRatio === ratio.id ? 'currentColor' : 'transparent'
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>{ratio.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Generation Parameters */}
                            <div className="section-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                    <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px' }}></div>
                                    <h4 style={{ color: 'white', fontSize: '1.1rem', margin: 0, fontWeight: '600' }}>Parameters</h4>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>Inference Steps</label>
                                            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', minWidth: '32px', textAlign: 'center' }}>{steps}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="20" max="50" step="1"
                                            value={steps}
                                            onChange={(e) => setSteps(parseInt(e.target.value))}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                            <span>Speed</span>
                                            <span>Quality</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>Guidance Scale (CFG)</label>
                                            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', minWidth: '32px', textAlign: 'center' }}>{cfg}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="15" step="0.5"
                                            value={cfg}
                                            onChange={(e) => setCfg(parseFloat(e.target.value))}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                            <span>Creative</span>
                                            <span>Strict</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Negative Prompt (Full Width) */}
                            <div className="section-card" style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '4px', height: '16px', background: 'var(--color-secondary)', borderRadius: '2px' }}></div>
                                        <h4 style={{ color: 'white', fontSize: '1.1rem', margin: 0, fontWeight: '600' }}>Negative Prompt</h4>
                                    </div>
                                    <button
                                        onClick={() => setNegPrompt('')}
                                        style={{
                                            color: '#ef4444',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            transition: 'all 0.2s',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        <Trash2 size={12} /> Clear
                                    </button>
                                </div>
                                <textarea
                                    value={negPrompt}
                                    onChange={(e) => setNegPrompt(e.target.value)}
                                    placeholder="Describe what you want to avoid (e.g., blurry, low quality, distorted)..."
                                    style={{
                                        width: '100%',
                                        height: '70px',
                                        padding: '16px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--color-border)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5',
                                        resize: 'none',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                                />
                            </div>

                        </div>
                    </div>
                )}

                {/* Selected Model Horizontal Card */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                    <Link to="/models" style={{ textDecoration: 'none', width: '100%', maxWidth: '600px', pointerEvents: generating ? 'none' : 'auto', opacity: generating ? 0.8 : 1 }}>
                        <div className="glass-panel" style={{
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            cursor: generating ? 'default' : 'pointer',
                            transition: 'transform 0.2s',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            background: 'rgba(139, 92, 246, 0.05)'
                        }}
                            onMouseEnter={(e) => !generating && (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={(e) => !generating && (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            <div style={{
                                width: '80px',
                                height: '60px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}>
                                <img src={selectedModel.image} alt={selectedModel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <Cpu size={14} color="var(--color-primary)" />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Model</span>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{selectedModel.name}</h3>
                            </div>
                            {!generating && (
                                <div style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.85rem',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Change
                                </div>
                            )}
                        </div>
                    </Link>
                </div>

                {generating && (
                    <div className="fade-in" style={{ marginBottom: '40px' }}>
                        <div className="glass-panel" style={{
                            padding: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minHeight: '450px',
                            justifyContent: 'center'
                        }}>
                            {/* Visual Progress Header */}
                            <div style={{ width: '100%', maxWidth: '500px', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                    <span>{jobStatus === 'pending' ? 'Waiting in Queue...' : 'AI is Thinking...'}</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                                        transition: 'width 0.3s ease-out',
                                        boxShadow: '0 0 10px var(--color-primary-glow)'
                                    }} />
                                </div>
                            </div>

                            <div id="generation-area" className="skeleton" style={{
                                width: '100%',
                                maxWidth: '500px',
                                height: '250px',
                                marginBottom: '32px',
                                borderRadius: 'var(--radius-md)',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                <Loader2 className="animate-spin" size={48} color="var(--color-primary)" style={{ opacity: 0.5, zIndex: 2 }} />
                                {/* AI Dreaming Visualization */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'radial-gradient(circle at center, var(--color-primary-glow) 0%, transparent 70%)',
                                    opacity: (progress / 100) * 0.5,
                                    animation: 'pulseFast 2s ease-in-out infinite'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: 'linear-gradient(to right, transparent, var(--color-primary), transparent)',
                                    animation: 'fadeIn 1s ease-in-out infinite',
                                    opacity: jobStatus === 'processing' ? 0.8 : 0
                                }} />
                            </div>

                            <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <div className={jobStatus === 'pending' ? 'pulse-fast' : ''} style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: jobStatus === 'pending' ? 'var(--color-primary)' : '#4ade80'
                                    }} />
                                    <h3 style={{ fontSize: '1.4rem', color: 'white', margin: 0 }}>
                                        {jobStatus === 'pending' ? "In Queue" : "Generating"}
                                    </h3>
                                </div>

                                <p style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--color-text-muted)', minHeight: '1.5em' }}>
                                    {jobStatus === 'pending' ? "Finding an available worker for you..." : statusMessage}
                                </p>

                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    color: 'var(--color-primary)'
                                }}>
                                    <Loader2 className="animate-spin" size={14} />
                                    Elapsed: {elapsedTime}s
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {generatedImage && !generating && (
                    <div className="fade-in">
                        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img
                                src={generatedImage}
                                alt={prompt}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '600px',
                                    borderRadius: 'var(--radius-sm)',
                                    boxShadow: 'var(--shadow-glow)'
                                }}
                            />
                            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                                <Link to="/gallery" className="btn btn-primary" style={{ flex: 1, maxWidth: '240px' }}><ImageIcon size={18} style={{ marginRight: '8px' }} /> View in Gallery</Link>
                                <button className="btn btn-outline" style={{ flex: 1, maxWidth: '240px' }} onClick={() => setGeneratedImage(null)}><Sparkles size={18} style={{ marginRight: '8px' }} /> Generate Another</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
