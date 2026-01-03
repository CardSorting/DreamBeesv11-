import React, { useState, useEffect } from 'react';
import { useModel } from '../contexts/ModelContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles, Image as ImageIcon, Cpu, Settings, Trash2, ChevronDown, ChevronUp, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

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

    // Open advanced if any settings are pre-filled
    useEffect(() => {
        if (searchParams.get('aspectRatio') || searchParams.get('steps') || searchParams.get('cfg') || searchParams.get('negPrompt')) {
            setShowAdvanced(true);
        }
    }, [searchParams]);

    const LOADING_MESSAGES = [
        "Warming up the AI engines...",
        "Dreaming up your concept...",
        "Adding details and textures...",
        "Polishing the pixels...",
        "Almost there...",
        "Applying final touches..."
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
            // Change message every 3 seconds
            interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
                setStatusMessage(LOADING_MESSAGES[randomIndex]);
            }, 3000);
            // Set initial message
            setStatusMessage(LOADING_MESSAGES[0]);
        }
        return () => clearInterval(interval);
    }, [generating]);

    // Progress simulation
    useEffect(() => {
        let interval;
        if (generating) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (jobStatus === 'pending') {
                        // Slowly move to 20% while pending
                        return prev < 20 ? prev + 0.5 : prev;
                    } else if (jobStatus === 'processing') {
                        // Move to 90% while processing
                        if (prev < 20) return 20; // Jump to 20 if just started processing
                        return prev < 90 ? prev + 0.2 : prev;
                    }
                    return prev;
                });
            }, 100);
        } else {
            setProgress(0);
        }
        return () => clearInterval(interval);
    }, [generating, jobStatus]);


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
                    alert(`Generation failed: ${data.error || 'Unknown error'}`);
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
            alert(`Error: ${error.message}`);
            setGenerating(false);
        }
    }

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        marginBottom: '16px',
                        background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1px'
                    }}>
                        Dream it. Generate it.
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
                        Turn your text descriptions into stunning AI art in seconds.
                    </p>
                </header>

                <div className="glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <input
                            type="text"
                            placeholder="A futuristic cyberpunk city with neon lights..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={generating}
                            style={{
                                flex: 1,
                                padding: '16px',
                                borderRadius: 'var(--radius-md)',
                                background: generating ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--color-border)',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                opacity: generating ? 0.7 : 1,
                                cursor: generating ? 'not-allowed' : 'text'
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !generating && handleGenerate()}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleGenerate}
                            disabled={generating || !prompt}
                            style={{ minWidth: '160px' }}
                        >
                            {generating ? <><Loader2 className="animate-spin" size={20} style={{ marginRight: '8px' }} /> Generating</> : <><Sparkles size={20} style={{ marginRight: '8px' }} /> Generate</>}
                        </button>
                    </div>
                </div>

                {/* Advanced Settings Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <button
                        onClick={() => !generating && setShowAdvanced(!showAdvanced)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: showAdvanced ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            background: showAdvanced ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                            transition: 'all 0.2s',
                            cursor: generating ? 'not-allowed' : 'pointer',
                            opacity: generating ? 0.5 : 1
                        }}
                    >
                        <Settings size={16} />
                        Advanced Settings
                        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {showAdvanced && (
                    <div className="fade-in" style={{ marginBottom: '40px' }}>
                        <div className="glass-panel" style={{ padding: '32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

                                {/* Section 1: Output Format */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px' }}></div>
                                        <h4 style={{ color: 'white', fontSize: '1.1rem', margin: 0 }}>Output Format</h4>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>Aspect Ratio</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                            {[
                                                { id: '1:1', icon: <Square size={16} /> },
                                                { id: '16:9', icon: <RectangleHorizontal size={16} /> },
                                                { id: '9:16', icon: <RectangleVertical size={16} /> },
                                                { id: '3:2', icon: <RectangleHorizontal size={14} /> },
                                                { id: '2:3', icon: <RectangleVertical size={14} /> }
                                            ].map((ratio) => (
                                                <button
                                                    key={ratio.id}
                                                    onClick={() => setAspectRatio(ratio.id)}
                                                    title={ratio.id}
                                                    style={{
                                                        padding: '12px 4px',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: aspectRatio === ratio.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                        background: aspectRatio === ratio.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                                        color: aspectRatio === ratio.id ? 'white' : 'var(--color-text-muted)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {ratio.icon}
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>{ratio.id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Generation Parameters */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px' }}></div>
                                        <h4 style={{ color: 'white', fontSize: '1.1rem', margin: 0 }}>Generation Parameters</h4>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Inference Steps</label>
                                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', background: 'rgba(139, 92, 246, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>{steps}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="20" max="50" step="1"
                                                value={steps}
                                                onChange={(e) => setSteps(parseInt(e.target.value))}
                                                style={{ width: '100%', height: '6px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <span>Faster</span>
                                                <span>Higher Quality</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Guidance (CFG)</label>
                                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', background: 'rgba(139, 92, 246, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>{cfg}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1" max="10" step="0.5"
                                                value={cfg}
                                                onChange={(e) => setCfg(parseFloat(e.target.value))}
                                                style={{ width: '100%', height: '6px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <span>Creative</span>
                                                <span>Precise</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Content Constraints */}
                            <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '4px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px' }}></div>
                                        <h4 style={{ color: 'white', fontSize: '1.1rem', margin: 0 }}>Content Constraints</h4>
                                    </div>
                                    <button
                                        onClick={() => setNegPrompt('')}
                                        style={{
                                            color: '#ef4444',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        <Trash2 size={12} /> Clear Negative Prompt
                                    </button>
                                </div>
                                <textarea
                                    value={negPrompt}
                                    onChange={(e) => setNegPrompt(e.target.value)}
                                    placeholder="Describe elements to exclude (e.g., blurry, distorted, low quality)..."
                                    style={{
                                        width: '100%',
                                        height: '90px',
                                        padding: '16px',
                                        borderRadius: 'var(--radius-md)',
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

                            <div className="skeleton" style={{
                                width: '100%',
                                maxWidth: '500px',
                                height: '250px',
                                marginBottom: '32px',
                                borderRadius: 'var(--radius-md)',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Loader2 className="animate-spin" size={48} color="var(--color-primary)" style={{ opacity: 0.5 }} />
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
                            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                                <Link to="/gallery" className="btn btn-outline"><ImageIcon size={18} style={{ marginRight: '8px' }} /> View Gallery</Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
