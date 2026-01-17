
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Send, Sparkles, Loader2, Info, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOptimizedImageUrl } from '../utils';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';
import './PersonaChat.css';

const Typewriter = ({ text, onUpdate }) => {
    const [display, setDisplay] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const timeoutRef = useRef(null);

    useEffect(() => {
        let currentIndex = 0;
        setDisplay('');
        setIsTyping(true);

        const type = () => {
            if (currentIndex < text.length) {
                const char = text.charAt(currentIndex);
                setDisplay(prev => prev + char);
                currentIndex++;

                // Throttled scroll update (every 3rd character or punctuation)
                if (currentIndex % 3 === 0 || ['.', '!', '?', '\n'].includes(char)) {
                    onUpdate?.();
                }

                // Natural typing rhythm
                let delay = Math.random() * 15 + 10; // Faster base 10-25ms

                // Pause for punctuation
                if (['.', '!', '?', '\n'].includes(char)) delay += 300;
                else if ([',', ';', ':'].includes(char)) delay += 100;

                timeoutRef.current = setTimeout(type, delay);
            } else {
                setIsTyping(false);
                onUpdate?.(); // Final scroll update
            }
        };

        timeoutRef.current = setTimeout(type, 50);

        return () => clearTimeout(timeoutRef.current);
    }, [text]); // Removed onUpdate from dependency to prevent re-renders reset

    return (
        <span>
            {display}
            {isTyping && <span className="typing-cursor"></span>}
        </span>
    );
};

export default function PersonaChat() {
    const { id } = useParams(); // imageId
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    const [imageItem, setImageItem] = useState(location.state?.imageItem || null);
    const [persona, setPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [creationStep, setCreationStep] = useState('Initializing...');
    const [error, setError] = useState(null);

    const scrollRef = useRef(null);
    const isMounted = useRef(true);
    const functions = getFunctions();

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const fetchImage = async () => {
            if (imageItem) return;
            if (!id) {
                setError("No image ID provided.");
                setIsLoading(false);
                return;
            }

            try {
                let docRef = doc(db, 'images', id);
                let docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    docRef = doc(db, 'model_showcase_images', id);
                    docSnap = await getDoc(docRef);
                }

                if (!docSnap.exists()) {
                    docRef = doc(db, 'showcase_images', id);
                    docSnap = await getDoc(docRef);
                }

                if (docSnap.exists() && isMounted.current) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    if (!data.imageUrl && data.url) data.imageUrl = data.url;
                    setImageItem(data);
                } else if (isMounted.current) {
                    setError("Image not found. It may have been deleted.");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Error fetching image:", err);
                if (isMounted.current) {
                    setError("Failed to load image data.");
                    setIsLoading(false);
                }
            }
        };

        fetchImage();
    }, [id, imageItem]);

    useEffect(() => {
        let mounted = true;

        const initPersona = async () => {
            if (!id || !imageItem || persona) return;

            try {
                // If we recently fetched the image, set loading true again just to be safe visually
                // but actually we handle this with isLoading state generally.
                // Reset loading ensures we show the "Analyzing" step if we just got the image.
                if (isMounted.current && !persona) setIsLoading(true);

                const apiFn = httpsCallable(functions, 'api');
                const result = await apiFn({ action: 'createPersona', imageId: id, imageUrl: imageItem.imageUrl });

                const data = result.data;
                if (data.success && isMounted.current) {
                    setPersona(data.persona);

                    if (data.persona.greeting) {
                        setMessages([{
                            id: 'greeting-' + Date.now(),
                            role: 'model',
                            text: data.persona.greeting,
                            timestamp: Date.now()
                        }]);
                    }
                }
            } catch (error) {
                console.error("Persona Init Error:", error);
                if (isMounted.current) {
                    toast.error("Could not awaken character. Please try again.");
                    setError("Failed to generate persona. The oracle is silent.");
                }
            } finally {
                if (isMounted.current) setIsLoading(false);
            }
        };

        if (imageItem) {
            initPersona();
        }
    }, [id, imageItem, functions, persona]);

    const scrollToBottom = (behavior = 'smooth') => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Only auto-scroll if user is near bottom or it's a forced update
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

            if (isNearBottom) {
                scrollRef.current.scrollTo({ top: scrollHeight, behavior });
            }
        }
    };

    useEffect(() => {
        // Force scroll on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading, isSending]);

    const handleSend = async () => {
        if (!inputValue.trim() || isSending) return;

        const userText = inputValue.trim();
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            text: userText,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsSending(true);

        try {
            const apiFn = httpsCallable(functions, 'api');
            const history = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));

            const result = await apiFn({
                action: 'chatPersona',
                imageId: id,
                message: userText,
                chatHistory: history
            });

            const replyMsg = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: result.data.reply,
                timestamp: Date.now()
            };

            if (isMounted.current) {
                setMessages(prev => [...prev, replyMsg]);
            }

        } catch (error) {
            console.error("Chat Error:", error);
            if (isMounted.current) {
                toast.error("Connection interrupted.");
            }
        } finally {
            if (isMounted.current) {
                setIsSending(false);
            }
        }
    };

    const handleReset = () => {
        if (persona?.greeting) {
            setMessages([{
                id: 'greeting-' + Date.now(),
                role: 'model',
                text: persona.greeting,
                timestamp: Date.now()
            }]);
        } else {
            setMessages([]);
        }
        toast.success("Memory wiped.");
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (error) {
        return (
            <div className="error-screen">
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                <h2>Connection Failed</h2>
                <p>{error}</p>
                <p>{error}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button onClick={() => window.location.reload()} className="back-btn-simple" style={{ background: 'white', color: 'black' }}>
                        <RefreshCw size={16} /> Retry
                    </button>
                    <button onClick={() => navigate(-1)} className="back-btn-simple">Go Back</button>
                </div>
            </div>
        );
    }


    return (
        <div className="persona-chat-page">
            <SEO title={persona ? `Chat with ${persona.name}` : 'Awakening Character...'} />

            <div className="chat-layout">
                <div className="visual-panel">
                    {imageItem && (
                        <img
                            src={getOptimizedImageUrl(imageItem.imageUrl)}
                            alt="Character"
                            className="character-image"
                        />
                    )}
                    <div className="visual-overlay"></div>

                    <button onClick={() => navigate(-1)} className="back-btn-floating" aria-label="Go back">
                        <ArrowLeft size={24} color="white" />
                    </button>
                </div>

                <div className="chat-panel">
                    <div className="chat-content-scroll" ref={scrollRef}>
                        <header className="chat-header">
                            {isLoading ? (
                                <div className="loading-header">
                                    <div className="skeleton-avatar-header"></div>
                                    <div className="skeleton-text-header"></div>
                                </div>
                            ) : (
                                <div className="persona-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="header-avatar-mobile">
                                            <img src={getOptimizedImageUrl(imageItem?.imageUrl)} alt={persona?.name || "Character avatar"} />
                                        </div>
                                        <div>
                                            <h1 className="persona-name">{persona?.name}</h1>
                                            <div className="persona-badges">
                                                <span className="badge">AI Persona</span>
                                                {persona?.personality?.split(',')[0] && (
                                                    <span className="badge-outline">{persona.personality.split(',')[0].trim()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="info-btn"
                                    title="Reset Session"
                                    onClick={handleReset}
                                    aria-label="Reset session"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                <button
                                    className="info-btn"
                                    title="Character Backstory"
                                    onClick={() => persona?.backstory && toast(persona.backstory, {
                                        icon: '📖',
                                        style: { background: '#222', color: '#fff' },
                                        duration: 5000
                                    })}
                                    aria-label="View character backstory"
                                >
                                    <Info size={20} />
                                </button>
                            </div>
                        </header>

                        <div className="messages-area">
                            {isLoading && messages.length === 0 && (
                                <div className="skeleton-loader-container">
                                    <div className="message-row model-row">
                                        <div className="skeleton-avatar"></div>
                                        <div className="skeleton-bubble short"></div>
                                    </div>
                                    <div className="message-row model-row">
                                        <div className="skeleton-avatar"></div>
                                        <div className="skeleton-bubble medium"></div>
                                    </div>
                                </div>
                            )}

                            {messages.length === 0 && !isLoading && (
                                <div className="empty-chat-hint">
                                    <MessageCircle size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                    <p>Say hello to start the conversation.</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={msg.id || idx} className={`message-row ${msg.role === 'user' ? 'user-row' : 'model-row'}`}>
                                    {msg.role === 'model' && (
                                        <div className="message-avatar">
                                            <img src={imageItem?.imageUrl} alt="Avatar" />
                                        </div>
                                    )}
                                    <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'model-bubble'}`}>
                                        {msg.role === 'model' && idx === messages.length - 1 ? (
                                            <Typewriter text={msg.text} onUpdate={scrollToBottom} />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isSending && (
                                <div className="message-row model-row">
                                    <div className="message-avatar">
                                        <img src={imageItem?.imageUrl} alt="Avatar" />
                                    </div>
                                    <div className="typing-bubble">
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="input-area">
                        <div className="input-wrapper">
                            <textarea
                                ref={(el) => {
                                    if (el) {
                                        el.style.height = 'auto';
                                        el.style.height = el.scrollHeight + 'px';
                                    }
                                }}
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={isLoading ? "Waking up character..." : `Message ${persona?.name || 'character'}...`}
                                disabled={isLoading || isSending}
                                rows={1}
                                style={{ maxHeight: '150px', overflowY: 'auto' }}
                                aria-label={`Message ${persona?.name || 'character'}`}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading || isSending}
                                className={`send-btn ${isSending ? 'sending' : ''}`}
                                aria-label="Send message"
                            >
                                {isSending ? (
                                    <span className="sending-dot"></span>
                                ) : (
                                    <Send size={20} strokeWidth={2.5} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
