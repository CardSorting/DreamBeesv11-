import React, { useState, useEffect } from 'react';
import { useModel } from '../contexts/ModelContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles, Image as ImageIcon, Sliders, Settings2, Trash2, ChevronDown, ChevronUp, Mic, MicOff, Zap, AlertCircle, Share2, Download, Maximize2 } from 'lucide-react';
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
    const [jobStatus, setJobStatus] = useState('pending');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [progress, setProgress] = useState(0);

    // Advanced Settings
    const [aspectRatio, setAspectRatio] = useState(searchParams.get('aspectRatio') || '1:1');
    const [steps, setSteps] = useState(parseInt(searchParams.get('steps')) || 30);
    const [cfg, setCfg] = useState(parseFloat(searchParams.get('cfg')) || 7.0);
    const [negPrompt, setNegPrompt] = useState(searchParams.get('negPrompt') || "");

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
        if (!prompt) return;
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
                createdAt: serverTimestamp()
            });
            setCurrentJobId(docRef.id);
        } catch (error) {
            console.error("Queue error", error);
            setGenerating(false);
            toast.error(error.message);
        }
    };

    return (
        <div style={{ paddingTop: '140px', paddingBottom: '40px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="container" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 340px', gap: '32px' }}>

                {/* Left: Canvas / Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

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
                    <div className="glass-panel" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', padding: '4px', overflow: 'hidden' }}>

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
                                <div className="fade-in" style={{ width: '100%', height: '100%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={generatedImage} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', boxShadow: '0 0 50px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
                                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '12px' }}>
                                        <a href={generatedImage} download="generated.png" className="btn btn-primary" style={{ padding: '0 16px', height: '36px', fontSize: '0.8rem' }}>
                                            <Download size={14} style={{ marginRight: '8px' }} /> Download
                                        </a>
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
                        <div style={{ padding: '24px', background: 'var(--color-zinc-900)' }}>
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe your vision..."
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '1.2rem',
                                        resize: 'none',
                                        minHeight: '60px',
                                        outline: 'none',
                                        lineHeight: '1.5',
                                        paddingRight: '40px'
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && !generating) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={toggleListening} className={`btn-ghost ${isListening ? 'text-red-500' : ''}`} style={{ padding: '8px' }}>
                                            {isListening ? <MicOff size={18} color="#ef4444" /> : <Mic size={18} />}
                                        </button>
                                        <button onClick={() => setPrompt('')} className="btn-ghost" style={{ padding: '8px' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating || !prompt || (credits <= 0 && subscriptionStatus !== 'active')}
                                        className="btn btn-primary"
                                        style={{ height: '40px', padding: '0 24px' }}
                                    >
                                        {generating ? <Loader2 className="animate-spin" size={18} /> : 'Generate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Property View (Sidebar) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                            <Sliders size={16} /> PARAMETERS
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Aspect Ratio Grid */}
                            <div>
                                <label className="setting-label">ASPECT RATIO</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {['1:1', '16:9', '9:16', '3:2', '2:3'].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setAspectRatio(r)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: aspectRatio === r ? '1px solid white' : '1px solid var(--color-border)',
                                                background: aspectRatio === r ? 'white' : 'transparent',
                                                color: aspectRatio === r ? 'black' : 'var(--color-text-muted)',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {r}
                                        </button>
                                    ))}
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
                    </div>
                </div>

            </div>

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
            `}</style>
        </div>
    );
}
