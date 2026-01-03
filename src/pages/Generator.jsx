import React, { useState, useEffect } from 'react';
import { useModel } from '../contexts/ModelContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles, Image as ImageIcon, Cpu, Settings2, Trash2, ChevronDown, ChevronUp, Mic, MicOff, Zap, AlertCircle } from 'lucide-react';
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
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState(0);

    // Advanced Settings
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(searchParams.get('aspectRatio') || '1:1');
    const [steps, setSteps] = useState(parseInt(searchParams.get('steps')) || 30);
    const [cfg, setCfg] = useState(parseFloat(searchParams.get('cfg')) || 7.0);
    const [negPrompt, setNegPrompt] = useState(searchParams.get('negPrompt') || "ugly, blurry, low quality, distorted, watermark");

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
        if (searchParams.get('aspectRatio') || searchParams.get('steps') || searchParams.get('cfg')) {
            setShowAdvanced(true);
        }
    }, [searchParams]);

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
                // Simulate progress purely for UI feedback
                setProgress(prev => prev + (100 - prev) * 0.05);
            }, 1000);
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
        <div className="container" style={{ maxWidth: '1000px', paddingTop: '120px', paddingBottom: '80px', minHeight: '100vh' }}>

            {/* Header / Monitor */}
            <div className="flex-center" style={{ flexDirection: 'column', marginBottom: '60px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '16px', color: 'var(--color-primary)',
                    fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase'
                }}>
                    <Zap size={14} />
                    <span>Creative Studio</span>
                </div>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'white', fontWeight: '800', letterSpacing: '-0.03em' }}>
                    What will you create?
                </h1>
            </div>

            {/* Main Interface */}
            <div className="glass-panel" style={{ padding: '4px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>

                    {/* Input Area */}
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your imagination in detail..."
                            className="input-field"
                            disabled={generating}
                            style={{
                                height: '120px',
                                resize: 'none',
                                fontSize: '1.2rem',
                                padding: '20px',
                                background: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                lineHeight: '1.5',
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !generating) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                        />
                        {/* Mic & Interim */}
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {interimTrans && (
                                <span className="fade-in" style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                    {interimTrans}...
                                </span>
                            )}
                            <button onClick={toggleListening} style={{
                                color: isListening ? '#ef4444' : 'var(--color-text-muted)',
                                padding: '8px',
                                borderRadius: '50%',
                                background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                transition: 'all 0.2s'
                            }}>
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '20px', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {/* Aspect Ratio Pill */}
                            <div className="flex-center" style={{ gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>ASPECT</span>
                                <div style={{ display: 'flex', background: 'var(--color-surface)', borderRadius: '6px', padding: '2px' }}>
                                    {['1:1', '16:9', '9:16'].map(r => (
                                        <button key={r} onClick={() => setAspectRatio(r)} style={{
                                            padding: '4px 8px', fontSize: '0.75rem', fontWeight: '600',
                                            borderRadius: '4px',
                                            color: aspectRatio === r ? 'black' : 'var(--color-text-muted)',
                                            background: aspectRatio === r ? 'white' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>{r}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} />

                            {/* Advanced Toggle */}
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex-center btn-ghost"
                                style={{ gap: '6px', fontSize: '0.85rem', color: showAdvanced ? 'white' : 'var(--color-text-muted)' }}
                            >
                                <Settings2 size={16} />
                                <span>Settings</span>
                                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        {/* Action Area */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Credits */}
                            {subscriptionStatus !== 'active' && (
                                <div style={{ fontSize: '0.85rem', color: credits > 0 ? 'var(--color-text-muted)' : '#ef4444' }}>
                                    {credits} Credits
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={generating || !prompt || (credits <= 0 && subscriptionStatus !== 'active')}
                                className="btn btn-primary"
                                style={{ padding: '0 32px', height: '48px', minWidth: '160px' }}
                            >
                                {generating ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} style={{ marginRight: '8px' }} /> Generate</>}
                            </button>
                        </div>
                    </div>

                    {/* Advanced Dropdown */}
                    {showAdvanced && (
                        <div className="fade-in" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                                        STEPS: {steps}
                                    </label>
                                    <input type="range" min="10" max="50" value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                                        GUIDANCE: {cfg}
                                    </label>
                                    <input type="range" min="1" max="20" step="0.5" value={cfg} onChange={(e) => setCfg(Number(e.target.value))} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                                        NEGATIVE PROMPT
                                    </label>
                                    <input
                                        type="text"
                                        value={negPrompt}
                                        onChange={(e) => setNegPrompt(e.target.value)}
                                        className="input-field"
                                        style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress / Result Area */}
            {(generating || generatedImage) && (
                <div className="fade-in" style={{ marginTop: '40px' }}>
                    {generating ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                                <div style={{ height: '2px', width: '100%', background: 'var(--color-surface-active)', marginBottom: '16px', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${progress}%`, background: 'white', transition: 'width 0.2s' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <span className="animate-pulse-slow">Dreaming...</span>
                                    <span>{elapsedTime}s</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img
                                src={generatedImage}
                                alt={prompt}
                                className="fade-in"
                                style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', maxHeight: '70vh', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)' }}
                            />
                            <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                                <Link to="/gallery" className="btn btn-outline">Save to Gallery</Link>
                                <button className="btn btn-primary" onClick={() => { setGeneratedImage(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                    Generate Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
