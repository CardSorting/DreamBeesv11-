
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
                onUpdate?.();

                // Natural typing rhythm
                let delay = Math.random() * 20 + 15; // Base 15-35ms

                // Pause for punctuation
                if (['.', '!', '?', '\n'].includes(char)) delay += 400;
                else if ([',', ';', ':'].includes(char)) delay += 150;

                timeoutRef.current = setTimeout(type, delay);
            } else {
                setIsTyping(false);
            }
        };

        timeoutRef.current = setTimeout(type, 50);

        return () => clearTimeout(timeoutRef.current);
    }, [text, onUpdate]);

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
    const [creationStep, setCreationStep] = useState('Analyzing visual data...');
    const [error, setError] = useState(null);

    const scrollRef = useRef(null);
    const functions = getFunctions();

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

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    if (!data.imageUrl && data.url) data.imageUrl = data.url;
                    setImageItem(data);
                } else {
                    setError("Image not found. It may have been deleted.");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Error fetching image:", err);
                setError("Failed to load image data.");
                setIsLoading(false);
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
                if (mounted && !persona) setIsLoading(true);

                setCreationStep('Reading latent personality...');

                const createPersona = httpsCallable(functions, 'createImagePersona');
                const result = await createPersona({ imageId: id, imageUrl: imageItem.imageUrl });

                const data = result.data;
                if (data.success && mounted) {
                    setPersona(data.persona);

                    if (messages.length === 0 && data.persona.greeting) {
                        setMessages([{
                            id: 'greeting',
                            role: 'model',
                            text: data.persona.greeting,
                            timestamp: Date.now()
                        }]);
                    }
                }
            } catch (error) {
                console.error("Persona Init Error:", error);
                if (mounted) {
                    toast.error("Could not awaken character. Please try again.");
                    setError("Failed to generate persona. The oracle is silent.");
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        if (imageItem) {
            initPersona();
        }

        return () => { mounted = false; };
    }, [id, imageItem, functions, persona]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
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
            const chatFn = httpsCallable(functions, 'chatWithPersona');
            const history = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));

            const result = await chatFn({
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

            setMessages(prev => [...prev, replyMsg]);

        } catch (error) {
            console.error("Chat Error:", error);
            toast.error("Connection interrupted.");
        } finally {
            setIsSending(false);
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
                <button onClick={() => navigate(-1)} className="back-btn-simple">Go Back</button>
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

                    <button onClick={() => navigate(-1)} className="back-btn-floating">
                        <ArrowLeft size={24} color="white" />
                    </button>
                </div>

                <div className="chat-panel">
                    <header className="chat-header">
                        {isLoading ? (
                            <div className="loading-header">
                                <Loader2 className="animate-spin" size={18} style={{ color: 'var(--color-accent-primary)' }} />
                                <span className="loading-text">{creationStep}</span>
                            </div>
                        ) : (
                            <div className="persona-info">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="header-avatar-mobile">
                                        <img src={getOptimizedImageUrl(imageItem?.imageUrl)} alt="" />
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
                            >
                                <Info size={20} />
                            </button>
                        </div>
                    </header>

                    <div className="messages-area" ref={scrollRef}>
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

                    <div className="input-area">
                        <div className="input-wrapper">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isLoading ? "Waking up character..." : `Message ${persona?.name || 'character'}...`}
                                disabled={isLoading || isSending}
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading || isSending}
                                className="send-btn"
                            >
                                <Send size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
