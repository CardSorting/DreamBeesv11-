import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';
import { useGenerationLogic } from '../hooks/generator/useGenerationLogic';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Send, Sparkles, Bot, User as UserIcon, Image as ImageIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

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
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [activeJob, setActiveJob] = useState(null);

    // Progressive Status
    const [loadingStatus, setLoadingStatus] = useState("Dreaming...");

    useEffect(() => {
        if (!generating) return;

        const statuses = ["Dreaming...", "Sketching...", "Painting...", "Adding details...", "Polishing..."];
        let i = 0;

        const interval = setInterval(() => {
            i = (i + 1) % statuses.length;
            setLoadingStatus(statuses[i]);
        }, 1500);

        return () => clearInterval(interval);
    }, [generating]);

    // Logic Hook
    const { handleGenerate } = useGenerationLogic({
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
            // Clear local optimistic messages once specific generation is done if needed,
            // but effectively the remote message will replace it.
            // We'll clear local "generating" message types.
            setLocalMessages(prev => prev.filter(m => m.type !== 'generating'));
        },
        setCurrentJobId,
        setActiveJob
    });

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Combine local and remote messages
    // Remove local messages if a remote message with same content/ID exists (deduplication)
    // For simplicity, we filter out local prompts if we find a remote prompt with same text created recently,
    // but here we just rely on "pending" state.
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

    // History Listener
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'generation_queue'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).reverse();

            const chatMessages = jobs.flatMap(job => {
                const msgs = [];
                // User Prompt
                if (job.prompt) {
                    msgs.push({
                        id: job.id + '_prompt',
                        role: 'user',
                        content: job.prompt,
                        createdAt: job.createdAt
                    });
                }
                // Assistant Response
                if (job.status === 'completed' && job.imageUrl) {
                    msgs.push({
                        id: job.id + '_image',
                        role: 'assistant',
                        type: 'image',
                        content: job.imageUrl,
                        createdAt: job.createdAt,
                        jobId: job.id,
                        model: job.modelId
                    });
                } else if (job.status === 'processing' || job.status === 'queued') {
                    msgs.push({
                        id: job.id + '_loading',
                        role: 'assistant',
                        type: 'loading',
                        content: 'Generating...',
                        createdAt: job.createdAt
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
                // Note: We don't push "processing" states from firestore here to avoid refreshing it oddly,
                // we rely on local 'generating' state for the active/latest one.
                // Or we can, but simpler to just show completed ones + local 'generating' for current.
                return msgs;
            });

            setMessages(chatMessages);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || generating) return;

        const prompt = inputValue;
        setInputValue('');

        // Optimistic Update
        const optimisticMsg = {
            id: 'optimistic_' + Date.now(),
            role: 'user',
            content: prompt,
            createdAt: { seconds: Date.now() / 1000 } // Simulate firestore timestamp
        };
        setLocalMessages(prev => [...prev, optimisticMsg]);

        await handleGenerate(prompt);
    };

    return (
        <div style={{
            height: '100vh',
            height: '100dvh', // Mobile viewport fix
            display: 'flex',
            flexDirection: 'column',
            background: '#000000',
            color: 'white',
            fontFamily: '"Outfit", sans-serif',
            overflow: 'hidden'
        }}>
            <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

            {/* Header - Glassmorphism */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                zIndex: 10,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                transition: 'transform 0.3s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '24px', height: '24px',
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sparkles size={14} color="white" />
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', letterSpacing: '-0.02em' }}>DreamBees AI</div>
                </div>
            </div>

            {/* Chat Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '70px 16px 100px 16px',
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
                        opacity: 0.7,
                        gap: '16px',
                        marginTop: '20vh'
                    }}>
                        <div style={{
                            width: '64px', height: '64px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Sparkles size={32} className="text-purple-500" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>What will you create?</h3>
                            <p style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Type a prompt to generate distinctive AI art.</p>
                        </div>
                    </div>
                )}

                {displayMessages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const showAvatar = !isUser && (index === 0 || displayMessages[index - 1]?.role === 'user');

                    return (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isUser ? 'flex-end' : 'flex-start',
                            width: '100%',
                            gap: '4px'
                        }}>
                            {/* Avatar (Assistant) */}
                            {!isUser && showAvatar && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', paddingLeft: '4px' }}>
                                    <div style={{
                                        width: '20px', height: '20px',
                                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                        borderRadius: '4px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Bot size={12} color="white" />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#a1a1aa' }}>DreamBees</span>
                                </div>
                            )}

                            {/* Avatar (User - Optional, just name for now to keep clean or avatar if requested, plan said avatar but minimal is better for user side usually, lets adding subtle avatar for symmetry if needed, but per previous code keeping right aligned bubble is standard) */}


                            <div style={{
                                maxWidth: '88%',
                                padding: msg.type === 'image' ? '0' : '12px 16px',
                                borderRadius: isUser ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                                background: isUser ? '#2563eb' : (msg.type === 'image' ? 'transparent' : '#18181b'),
                                color: 'white',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                overflow: 'hidden',
                                boxShadow: msg.type === 'image' ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
                                border: !isUser && msg.type !== 'image' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                            }}>
                                {msg.type === 'image' ? (
                                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
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
                                        />
                                    </div>
                                ) : msg.type === 'loading' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Sparkles size={16} className="animate-spin text-purple-400" />
                                        <span className="text-gray-300">{msg.content}</span>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Active Generation State (Progressive/Optimistic) */}
                {generating && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                            <div style={{
                                width: '20px', height: '20px',
                                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                borderRadius: '4px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Bot size={12} color="white" />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#a1a1aa' }}>DreamBees</span>
                        </div>
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '4px 20px 20px 20px',
                            background: '#18181b',
                            color: '#fff',
                            fontSize: '0.95rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{loadingStatus}</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Glassmorphism */}
            <div style={{
                position: 'fixed',
                bottom: 60,
                left: 0,
                right: 0,
                padding: '12px 16px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0) 100%)',
                zIndex: 20
            }}>
                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(30,30,30,0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '8px 8px 8px 16px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Message DreamBees..."
                        disabled={generating}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none',
                            minHeight: '24px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || generating}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: !inputValue.trim() || generating ? 'rgba(255,255,255,0.1)' : 'white',
                            color: !inputValue.trim() || generating ? 'rgba(255,255,255,0.3)' : 'black',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (!inputValue.trim() || generating) ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                    >
                        {generating ? (
                            <Sparkles size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </form>
                <style>{`
                    .typing-indicator { display: flex; gap: 4px; align-items: center; }
                    .typing-indicator span {
                        width: 5px; height: 5px; background: #a1a1aa; border-radius: 50%;
                        animation: bounce 1.4s infinite ease-in-out both;
                    }
                    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

                    @keyframes bounce {
                        0%, 80%, 100% { transform: scale(0); }
                        40% { transform: scale(1); }
                    }
                `}</style>
            </div>
        </div>
    );
}
