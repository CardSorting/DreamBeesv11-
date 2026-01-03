import React, { useState, useEffect } from 'react';
import { useModel } from '../contexts/ModelContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles, Image as ImageIcon, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Generator() {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const { currentUser } = useAuth();
    const { selectedModel } = useModel();

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


    useEffect(() => {
        if (!currentJobId) return;

        const unsub = onSnapshot(doc(db, "generation_queue", currentJobId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === 'completed') {
                    setGeneratedImage(data.imageUrl);
                    setGenerating(false);
                    setCurrentJobId(null);
                } else if (data.status === 'failed') {
                    alert(`Generation failed: ${data.error || 'Unknown error'}`);
                    setGenerating(false);
                    setCurrentJobId(null);
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
                negative_prompt: "worst quality, bad quality, low quality, lowres, scan artifacts, jpeg artifacts, sketch, light particles, watermark, multiple views, 2koma, 3koma, 4koma, heart-shaped pupils,",
                modelId: selectedModel.id,
                status: 'pending',
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

                <div className="glass-panel" style={{ padding: '24px', marginBottom: '40px' }}>
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
                            minHeight: '400px',
                            justifyContent: 'center'
                        }}>
                            <div className="skeleton" style={{
                                width: '100%',
                                maxWidth: '500px',
                                height: '300px',
                                marginBottom: '24px',
                                borderRadius: 'var(--radius-md)'
                            }} />

                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--color-primary)' }}>
                                    {statusMessage}
                                </h3>
                                <p style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                    Time elapsed: {elapsedTime}s
                                </p>
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
