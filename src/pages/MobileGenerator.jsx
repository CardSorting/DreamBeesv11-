import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useGenerationLogic } from '../hooks/generator/useGenerationLogic';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Send, Sparkles, Bot, Download, RefreshCw, Copy, X, ChevronDown, Check } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

// Format elapsed time helper
const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
};

export default function MobileGenerator() {
    const { currentUser } = useAuth();
    const { selectedModel, availableModels, setSelectedModel } = useModel();

    // Remote state
    const [messages, setMessages] = useState([]);
    // Local optimistic state
    const [localMessages, setLocalMessages] = useState([]);

    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const { isLiked: _isLiked, toggleLike: _toggleLike, isHidden: _isHidden, hidePost: _hidePost } = useUserInteractions();
    // UX State
    const [expandedImage, setExpandedImage] = useState(null);
    const [showModelSelector, setShowModelSelector] = useState(false);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [_generatedImage, setGeneratedImage] = useState(null);
    const [_currentJobId, setCurrentJobId] = useState(null);
    const [_activeJob, setActiveJob] = useState(null);

    // Progressive Status with elapsed timer
    const [loadingStatus, setLoadingStatus] = useState("Dreaming...");
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Elapsed timer effect
    useEffect(() => {
        if (!generating) {
            setElapsedSeconds(0);
            return;
        }

        const timer = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [generating]);

    // Loading status rotation
    useEffect(() => {
        if (!generating) return;

        const statusMessages = [
            "Dreaming up your vision...",
            "Mixing pixels and imagination...",
            "Applying artistic styles...",
            "Refining details and lighting...",
            "Polishing your masterpiece..."
        ];

        const graceMessages = [
            "Taking a bit longer for perfection...",
            "Complex prompts need more time...",
            "Almost there..."
        ];

        let i = 0;
        setLoadingStatus(statusMessages[0]);

        const interval = setInterval(() => {
            i++;
            if (i < statusMessages.length) {
                setLoadingStatus(statusMessages[i]);
            } else {
                const graceIndex = (i - statusMessages.length) % graceMessages.length;
                setLoadingStatus(graceMessages[graceIndex]);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [generating]);

    // History Fetching
    const fetchMessages = async () => {
        if (!currentUser) return;
        try {
            const q = query(
                collection(db, 'generation_queue'),
                where('userId', '==', currentUser.uid),
                orderBy('createdAt', 'desc'),
                limit(20)
            );

            const snapshot = await getDocs(q);
            const jobs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).reverse();

            const chatMessages = jobs.flatMap(job => {
                const msgs = [];
                if (job.prompt) {
                    msgs.push({
                        id: job.id + '_prompt',
                        role: 'user',
                        content: job.prompt,
                        createdAt: job.createdAt
                    });
                }
                if (job.status === 'completed' && job.imageUrl) {
                    msgs.push({
                        id: job.id + '_image',
                        role: 'assistant',
                        type: 'image',
                        content: job.imageUrl,
                        createdAt: job.createdAt,
                        jobId: job.id,
                        model: job.modelId,
                        prompt: job.prompt
                    });
                } else if (job.status === 'failed') {
                    msgs.push({
                        id: job.id + '_error',
                        role: 'assistant',
                        type: 'error',
                        content: 'Generation failed.',
                        createdAt: job.createdAt
                    });
                }
                return msgs;
            });

            setMessages(chatMessages);
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    };

    // Logic Hook
    const { handleGenerate, cancelGeneration } = useGenerationLogic({
        prompt: inputValue,
        selectedModel: selectedModel || availableModels?.[0],
        generationMode: 'image',
        negPrompt: '',
        aspectRatio: '1:1',
        steps: 30,
        cfg: 7.0,
        seed: -1,
        useTurbo: false,
        zaps: 999,
        reels: 0,
        subscriptionStatus: 'active',
        setGenerating,
        setGeneratedImage: (img) => {
            setGeneratedImage(img);
            setLocalMessages(prev => prev.filter(m => m.type !== 'generating'));
            fetchMessages();
            setTimeout(scrollToBottom, 100);
            // Haptic feedback on completion
            if (navigator.vibrate) navigator.vibrate(50);
        },
        setCurrentJobType: () => { },
        setCurrentJobId,
        setActiveJob
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const displayMessages = [
        ...messages,
        ...localMessages.filter(local =>
            !messages.some(remote =>
                remote.role === 'user' && remote.content === local.content && Math.abs(remote.createdAt?.seconds - local.createdAt?.seconds) < 5
            )
        )
    ];

    useEffect(() => {
        scrollToBottom();
    }, [displayMessages.length, loadingStatus, generating]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || generating) return;

        const prompt = inputValue;
        setInputValue('');
        if (inputRef.current) inputRef.current.style.height = 'auto';

        // Haptic feedback on submit
        if (navigator.vibrate) navigator.vibrate(30);

        const optimisticMsg = {
            id: 'optimistic_' + Date.now(),
            role: 'user',
            content: prompt,
            createdAt: { seconds: Date.now() / 1000 }
        };
        setLocalMessages(prev => [...prev, optimisticMsg]);

        await handleGenerate(prompt);
    };

    const starterPrompts = [
        "A futuristic city with neon lights and flying cars",
        "A cute robot gardening in a sunlit greenhouse",
        "An ancient library floating in the clouds",
        "A magical forest with glowing mushrooms"
    ];

    const handleStarterClick = (prompt) => {
        setInputValue(prompt);
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.focus();
            setTimeout(() => {
                if (inputRef.current) inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
            }, 10);
        }
    };

    const handleInput = (e) => {
        setInputValue(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    const handleDownload = async (imageUrl, id) => {
        if (!imageUrl) return;

        const elementId = `msg-image-${id}`;
        const element = document.getElementById(elementId);

        if (!element) {
            toast.error('Could not find image to download');
            return;
        }

        const toastId = toast.loading('Preparing download...');

        try {
            const canvas = await html2canvas(element, {
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: null,
                scale: 2
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `dreambees-${id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Image downloaded', { id: toastId });
        } catch (err) {
            console.error("Screenshot download failed:", err);
            toast.error('Download failed. Opening externally...', { id: toastId });
            window.open(imageUrl, '_blank');
        }
    };

    const handleCopyPrompt = (prompt) => {
        navigator.clipboard.writeText(prompt);
        toast.success('Prompt copied');
    };

    const handleRegenerate = async (prompt) => {
        if (!prompt) return;
        setInputValue(prompt);
        if (inputRef.current) inputRef.current.focus();
    }


    return (
        <div style={{
            height: '100dvh', // Mobile viewport fix
            display: 'flex',
            flexDirection: 'column',
            background: '#000000',
            color: 'white',
            fontFamily: '"Outfit", sans-serif',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

            {/* Header - Glassmorphism & Model Selector with Safe Area */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: 'calc(12px + env(safe-area-inset-top, 0px)) 16px 12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                zIndex: 10,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                transition: 'transform 0.3s ease',
            }}>
                <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'transparent', border: 'none', color: 'white',
                        padding: '4px 8px', borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '28px', height: '28px',
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                    }}>
                        <Sparkles size={16} color="white" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', letterSpacing: '-0.02em', lineHeight: 1 }}>DreamBees AI</div>
                        <div style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {selectedModel?.name || "Model"} <ChevronDown size={10} />
                        </div>
                    </div>
                </button>
            </div>

            {/* Model Selector Overlay/Dropdown */}
            {showModelSelector && (
                <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: 0, right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 50,
                    padding: '16px',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease'
                }} onClick={() => setShowModelSelector(false)}>
                    <div style={{
                        background: '#18181b',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '8px',
                        maxWidth: '400px',
                        margin: '0 auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        maxHeight: '70vh',
                        overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Select Model
                        </div>
                        {(availableModels || [])
                            .filter(m => m.isActive !== false && m.hideFromGenerator !== true)
                            .filter(m => currentUser ? true : m.id === 'galmix')
                            .map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        setSelectedModel(model);
                                        setShowModelSelector(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px',
                                        background: selectedModel?.id === model.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        marginBottom: '4px',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontWeight: '500' }}>{model.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{model.description?.substring(0, 50)}...</span>
                                    </div>
                                    {selectedModel?.id === model.id && <Check size={16} className="text-purple-500" />}
                                </button>
                            ))}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {expandedImage && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'black',
                    zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease'
                }} onClick={() => setExpandedImage(null)}>
                    <button style={{
                        position: 'absolute', top: '20px', right: '20px',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px', height: '40px',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                    }}>
                        <X size={24} />
                    </button>
                    <img
                        src={expandedImage}
                        alt="Full View"
                        style={{
                            maxWidth: '100%', maxHeight: '100%',
                            objectFit: 'contain',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                        }}
                        crossOrigin="anonymous"
                    />
                </div>
            )}


            {/* Chat Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '70px 16px 110px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                scrollBehavior: 'smooth'
            }}>
                {displayMessages.length === 0 && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 1,
                        gap: '24px',
                        marginTop: '10vh'
                    }}>
                        <div style={{
                            width: '80px', height: '80px',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Sparkles size={40} className="text-purple-400" />
                        </div>
                        <div style={{ textAlign: 'center', maxWidth: '280px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>What will you create?</h3>
                            <p style={{ fontSize: '0.95rem', color: '#a1a1aa', lineHeight: '1.5' }}>Type a prompt below or choose a starter to generate distinctive AI art.</p>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '340px' }}>
                            {starterPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleStarterClick(prompt)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '20px',
                                        padding: '8px 16px',
                                        color: '#e4e4e7',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {displayMessages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const showAvatar = !isUser && (index === 0 || displayMessages[index - 1]?.role === 'user');

                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isUser ? 'flex-end' : 'flex-start',
                                width: '100%',
                                gap: '4px'
                            }}
                        >
                            {/* Avatar (Assistant) */}
                            {!isUser && showAvatar && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', paddingLeft: '4px' }}>
                                    <div style={{
                                        width: '24px', height: '24px',
                                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                        borderRadius: '6px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Bot size={14} color="white" />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a1a1aa' }}>DreamBees</span>
                                </div>
                            )}

                            <div style={{
                                maxWidth: '88%',
                                padding: msg.type === 'image' ? '0' : '14px 18px',
                                borderRadius: isUser ? '24px 24px 4px 24px' : '4px 24px 24px 24px',
                                background: isUser ? '#2563eb' : (msg.type === 'image' ? 'transparent' : '#18181b'),
                                color: 'white',
                                fontSize: '1rem',
                                lineHeight: '1.5',
                                overflow: 'hidden',
                                boxShadow: msg.type === 'image' ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
                                border: !isUser && msg.type !== 'image' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                            }}>
                                {msg.type === 'image' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div
                                            id={`msg-image-${msg.id}`} // Target for screenshot
                                            style={{ position: 'relative', borderRadius: '20px 20px 0 0', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                            onClick={() => setExpandedImage(msg.content)}
                                        >
                                            <img
                                                src={msg.content}
                                                alt="Generated"
                                                style={{
                                                    width: '100%',
                                                    display: 'block',
                                                    maxHeight: '400px',
                                                    objectFit: 'cover',
                                                    background: '#111'
                                                }}
                                                loading="lazy"
                                                crossOrigin="anonymous" // Important for html2canvas
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/600x600/333/999?text=Image+Load+Error';
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '4px 8px',
                                                fontSize: '0.7rem', backdropFilter: 'blur(4px)', color: 'white'
                                            }}>
                                                Tap to view
                                            </div>
                                        </div>
                                        {/* Actions Toolbar */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', background: '#1c1c1f',
                                            borderRadius: '0 0 24px 24px'
                                        }}>
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <button onClick={() => handleDownload(msg.content, msg.id)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                    <Download size={18} />
                                                </button>
                                                <button onClick={() => handleCopyPrompt(msg.prompt)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                    <Copy size={18} />
                                                </button>
                                            </div>
                                            <button onClick={() => handleRegenerate(msg.prompt)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <RefreshCw size={16} />
                                                <span style={{ fontSize: '0.8rem' }}>Regenerate</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : msg.type === 'loading' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Sparkles size={18} className="animate-spin text-purple-400" />
                                        <span className="text-gray-300">{msg.content}</span>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Active Generation State - Enhanced */}
                <AnimatePresence>
                    {generating && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', gap: '4px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                                <div style={{
                                    width: '24px', height: '24px',
                                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                    borderRadius: '6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Bot size={14} color="white" />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a1a1aa' }}>DreamBees</span>
                            </div>

                            {/* Glassmorphism Loading Card */}
                            <motion.div
                                style={{
                                    padding: '20px',
                                    borderRadius: '4px 24px 24px 24px',
                                    background: 'rgba(24, 24, 27, 0.85)',
                                    backdropFilter: 'blur(16px)',
                                    color: '#fff',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    display: 'flex', flexDirection: 'column', gap: '16px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                                    minWidth: '240px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Ambient Glow */}
                                <motion.div
                                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute',
                                        top: '-50%', left: '-50%',
                                        width: '200%', height: '200%',
                                        background: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                                        pointerEvents: 'none'
                                    }}
                                />

                                {/* Timer and Status Row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                    {/* Elapsed Timer */}
                                    <motion.div
                                        key={elapsedSeconds}
                                        initial={{ opacity: 0.5, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            fontFamily: 'monospace',
                                            fontSize: '2rem',
                                            fontWeight: '300',
                                            color: 'white',
                                            letterSpacing: '-0.02em',
                                            lineHeight: 1
                                        }}
                                    >
                                        {formatElapsedTime(elapsedSeconds)}
                                    </motion.div>

                                    {/* Animated Sparkle */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Sparkles size={20} style={{ color: '#8b5cf6' }} />
                                    </motion.div>
                                </div>

                                {/* Status Message with Animated Transition */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={loadingStatus}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            fontSize: '0.9rem',
                                            color: 'rgba(255,255,255,0.7)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                    >
                                        {loadingStatus}
                                        <motion.span
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.2, repeat: Infinity }}
                                            style={{ color: 'rgba(255,255,255,0.4)' }}
                                        >
                                            ...
                                        </motion.span>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Progress Bar */}
                                <div style={{
                                    width: '100%',
                                    height: '3px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{
                                            duration: 1.8,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                        style={{
                                            width: '40%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, #8b5cf6, #ec4899, transparent)',
                                            borderRadius: '2px'
                                        }}
                                    />
                                </div>

                                {/* Cancel Button */}
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={cancelGeneration}
                                    style={{
                                        alignSelf: 'flex-start',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '8px',
                                        padding: '8px 14px',
                                        fontSize: '0.8rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        position: 'relative',
                                        zIndex: 1,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <X size={14} /> Cancel
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area with Safe Area */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 'calc(16px) 16px calc(16px + env(safe-area-inset-bottom, 16px)) 16px',
                background: 'linear-gradient(to top, #000 90%, rgba(0,0,0,0) 100%)',
                zIndex: 20
            }}>
                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px',
                    background: '#18181b',
                    borderRadius: '28px',
                    padding: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                }}>
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={handleInput}
                        placeholder="Message DreamBees..."
                        disabled={generating}
                        rows={1}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.05rem',
                            outline: 'none',
                            minHeight: '24px',
                            maxHeight: '120px',
                            resize: 'none',
                            padding: '12px 0 12px 16px',
                            lineHeight: '1.4',
                            fontFamily: 'inherit'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || generating}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: !inputValue.trim() || generating ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                            color: !inputValue.trim() || generating ? 'rgba(255,255,255,0.3)' : 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (!inputValue.trim() || generating) ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                            marginBottom: '0px',
                            boxShadow: !inputValue.trim() || generating ? 'none' : '0 4px 12px rgba(236, 72, 153, 0.4)'
                        }}
                    >
                        {generating ? (
                            <Sparkles size={22} className="animate-spin" />
                        ) : (
                            <Send size={22} fill="currentColor" />
                        )}
                    </button>
                </form>
                <style>{`
                    .typing-indicator { display: flex; gap: 4px; align-items: center; }
                    .typing-indicator span {
                        width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%;
                        animation: bounce 1.4s infinite ease-in-out both;
                    }
                    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

                    @keyframes bounce {
                        0%, 80%, 100% { transform: scale(0); }
                        40% { transform: scale(1); }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `}</style>
            </div>
        </div>
    );
}
