
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Send, Sparkles, Loader2, Info, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOptimizedImageUrl } from '../utils';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';
import Pusher from 'pusher-js';
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

const PersonaChat = () => {
    const { id } = useParams(); // imageId
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser: _currentUser } = useAuth();

    const [imageItem, setImageItem] = useState(location.state?.imageItem || null);
    const [persona, setPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [viewerCount, setViewerCount] = useState(1);
    const [suggestedPersonas, setSuggestedPersonas] = useState([]);
    const [followedPersonas, setFollowedPersonas] = useState([]);
    const [activeTab, setActiveTab] = useState('Home');
    const [alerts, setAlerts] = useState([]);
    const [showEmotes, setShowEmotes] = useState(false);
    const [error, setError] = useState(null);

    const scrollRef = useRef(null);
    const isMounted = useRef(true);
    const functions = getFunctions();

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Pusher / Soketi Subscription
    useEffect(() => {
        if (!id || !_currentUser?.uid || !import.meta.env.VITE_SOKETI_APP_KEY) return;

        const initPusher = async () => {
            const token = await _currentUser.getIdToken();
            const authEndpoint = import.meta.env.VITE_SOKETI_AUTH_ENDPOINT || '/api/pusher/auth';

            const pusher = new Pusher(import.meta.env.VITE_SOKETI_APP_KEY, {
                wsHost: import.meta.env.VITE_SOKETI_HOST || "127.0.0.1",
                wsPort: parseInt(import.meta.env.VITE_SOKETI_PORT || "6001"),
                forceTLS: import.meta.env.VITE_SOKETI_USE_TLS === 'true',
                disableStats: true,
                enabledTransports: ['ws', 'wss'],
                cluster: 'mt1',
                authEndpoint: authEndpoint,
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });

            const channelName = `presence-chat-${id}`;
            const channel = pusher.subscribe(channelName);

            channel.bind('pusher:subscription_succeeded', (members) => {
                setViewerCount(members.count);
            });

            channel.bind('pusher:member_added', (member) => {
                setViewerCount(prev => prev + 1);
                const newAlert = {
                    id: Date.now(),
                    text: `${member.info?.displayName || 'A new viewer'} has joined!`,
                    type: 'join'
                };
                setAlerts(prev => [...prev, newAlert]);
                setTimeout(() => {
                    setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                }, 5000);
            });

            channel.bind('pusher:member_removed', () => {
                setViewerCount(prev => Math.max(1, prev - 1));
            });

            channel.bind('celebration', (data) => {
                if (isMounted.current) {
                    const newAlert = {
                        id: Date.now(),
                        text: data.message,
                        type: 'celebration'
                    };
                    setAlerts(prev => [...prev, newAlert]);
                    setTimeout(() => {
                        setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                    }, 8000);

                    // Trigger "Celebration" confetti if we want (Mocked as alert for now)
                    toast.success(data.message, { icon: '🎁', duration: 5000 });
                }
            });

            channel.bind('new-message', (data) => {
                if (isMounted.current) {
                    setMessages(prev => {
                        const isDuplicate = prev.some(m =>
                            m.text === data.text &&
                            m.uid === data.uid &&
                            (Math.abs(Date.now() - (data.timestamp || Date.now())) < 5000)
                        );

                        if (isDuplicate && data.role === 'user' && data.uid === _currentUser.uid) return prev;

                        return [...prev, { ...data, id: data.id || Date.now().toString() }];
                    });
                }
            });

            return () => {
                pusher.unsubscribe(channelName);
                pusher.disconnect();
            };
        };

        const cleanupPromise = initPusher();
        return () => {
            cleanupPromise.then(cleanup => cleanup?.());
        };
    }, [id, _currentUser]);

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
        if (!id) return;
        const unsub = onSnapshot(doc(db, 'personas', id), (snapshot) => {
            if (snapshot.exists()) {
                setPersona(prev => ({ ...prev, ...snapshot.data() }));
            }
        });
        return () => unsub();
    }, [id]);

    useEffect(() => {
        const initPersona = async () => {
            if (!id || !imageItem || persona) return;

            try {
                if (isMounted.current && !persona) setIsLoading(true);

                const apiFn = httpsCallable(functions, 'api');
                const result = await apiFn({ action: 'createPersona', imageId: id, imageUrl: imageItem.imageUrl });

                const data = result.data;
                if (data.success && isMounted.current) {
                    setPersona(data.persona);

                    // Fetch Global History from shared_messages subcollection
                    const { collection, query, orderBy, limit, getDocs } = await import("firebase/firestore");
                    const historyQuery = query(
                        collection(db, 'personas', id, 'shared_messages'),
                        orderBy('timestamp', 'desc'),
                        limit(50)
                    );
                    const historySnap = await getDocs(historyQuery);
                    const historicalMessages = historySnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

                    if (historicalMessages.length > 0) {
                        setMessages(historicalMessages);
                    } else if (data.persona.greeting) {
                        setMessages([{
                            id: 'greeting-' + Date.now(),
                            role: 'model',
                            text: data.persona.greeting,
                            displayName: data.persona.name,
                            timestamp: Date.now()
                        }]);
                    }

                    // Fetch Suggested Personas
                    const suggestedQuery = query(
                        collection(db, 'personas'),
                        orderBy('createdAt', 'desc'),
                        limit(12)
                    );
                    const suggestedSnap = await getDocs(suggestedQuery);
                    const allPersonas = suggestedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    setSuggestedPersonas(allPersonas.filter(p => p.id !== id).slice(0, 6));
                    setFollowedPersonas(allPersonas.filter(p => p.id !== id).sort(() => 0.5 - Math.random()).slice(0, 3));
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

            // We don't need to manually push to messages here because Pusher will echo it back to us
            // but for instant feedback, we can push a "sending" state message if we want.
            // However, Pusher handles the shared experience better.

            await apiFn({
                action: 'chatPersona',
                imageId: id,
                message: userText,
                chatHistory: messages.slice(-10).map(m => ({ role: m.role, text: m.text }))
            });

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

    const handleGift = async (amount = 10) => {
        if (isSending) return;
        try {
            const apiFn = httpsCallable(functions, 'api');
            await apiFn({
                action: 'giftPersona',
                imageId: id,
                amount: amount,
                type: 'bits'
            });
            toast.success(`You gifted ${amount} Bits!`);
        } catch (error) {
            console.error("Gift Error:", error);
            toast.error(error.message || "Failed to send gift.");
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

    const ChannelTabs = () => (
        <div className="channel-tabs-bar">
            {['Home', 'About', 'Schedule', 'Videos'].map(tab => (
                <button
                    key={tab}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );

    const emotes = ['🐝', '🔥', '✨', '💜', '🎮', '🤖', '👑', '🙌', '👀', '🚀'];

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
        <div className="channel-page-content">
            <SEO title={persona ? `Live: ${persona.name}` : 'Awakening Character...'} />

            <div className="twitch-stream-split">
                {/* Main Video Section */}
                <div className="video-section">
                    <div className="video-player-mock">
                        {imageItem && (
                            <img
                                src={getOptimizedImageUrl(imageItem.imageUrl)}
                                alt="Character"
                                className="stream-video"
                            />
                        )}
                        <div className="stream-ui-overlay">
                            <div className="live-badge">LIVE</div>
                            <div className="viewer-count">
                                <span className="view-dot"></span> {viewerCount} viewers
                            </div>

                            {/* Stream Alerts Overlay */}
                            <div className="alerts-container-twitch">
                                {alerts.map(alert => (
                                    <div key={alert.id} className="twitch-alert-bubble">
                                        <Sparkles size={14} /> {alert.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="video-controls-overlay">
                            <div className="left-controls">
                                <Send size={18} fill="white" />
                                <RefreshCw size={18} />
                            </div>
                            <div className="right-controls">
                                <Info size={18} />
                            </div>
                        </div>

                        <button onClick={() => navigate(-1)} className="twitch-back-btn" aria-label="Go back">
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    <div className="video-info-bar">
                        <div className="streamer-info">
                            <div className="streamer-avatar-large">
                                <img src={imageItem?.imageUrl} alt="" />
                                <div className="live-badge-avatar">LIVE</div>
                            </div>
                            <div className="streamer-details">
                                <h1 className="stream-title">{persona?.streamTitle || (persona ? `Chillin with ${persona.name}` : 'Initializing...')}</h1>
                                <p className="streamer-name-purple">{persona?.name || 'Character'}</p>
                                <div className="stream-tags">
                                    <span className="twitch-tag">AI</span>
                                    <span className="twitch-tag">Interactive</span>
                                    {persona?.personality?.split(',')[0] && (
                                        <span className="twitch-tag">{persona.personality.split(',')[0].trim()}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="stream-actions">
                            <button className="follow-btn-glitch">Follow</button>
                            <button className="subscribe-btn-glitch">
                                <Sparkles size={16} /> Subscribe
                            </button>
                        </div>
                    </div>

                    <ChannelTabs />

                    <div className="video-content-area">
                        {activeTab === 'Home' && (
                            <div className="video-description">
                                <h3>Welcome to the stream!</h3>
                                <p>I am {persona?.name}, an AI-powered host. Feel free to chat with me in the sidebar! Zaps are used to power my responses.</p>
                                <div className="about-stats">
                                    <div className="stat"><span className="val">2.3M</span> followers</div>
                                    <div className="stat"><span className="val">AI</span> Genre</div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'About' && (
                            <div className="video-description">
                                <h3>About {persona?.name}</h3>
                                <p>{persona?.backstory}</p>
                                <h3>Vibes</h3>
                                <p>{persona?.personality}</p>
                            </div>
                        )}
                        {activeTab !== 'Home' && activeTab !== 'About' && (
                            <div className="empty-tab-msg">
                                <Loader2 className="animate-spin" size={32} />
                                <p>Checking {activeTab}...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Chat Section */}
                <div className="chat-sidebar">
                    <div className="chat-header-twitch">
                        STREAM CHAT
                    </div>

                    <div className="chat-messages-twitch" ref={scrollRef}>
                        <div className="chat-welcome-msg">
                            Welcome to the chat room!
                        </div>
                        {messages.map((msg, idx) => (
                            <div key={msg.id || idx} className="twitch-message">
                                {msg.role === 'model' && (
                                    <span className="chat-badge broadcaster-badge" title="Broadcaster">
                                        <div className="badge-icon">🎥</div>
                                    </span>
                                )}
                                <span className={`message-author ${msg.role === 'model' ? 'ai-author' : ''}`}>
                                    {msg.displayName || (msg.role === 'model' ? persona?.name : 'User')}:
                                </span>
                                <span className="message-text">
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                        {isSending && (
                            <div className="twitch-message typing-indicator">
                                <span className="message-author">AI Persona:</span>
                                <span className="message-text">typing...</span>
                            </div>
                        )}
                    </div>

                    <div className="chat-input-twitch">
                        {showEmotes && (
                            <div className="emotes-picker">
                                {emotes.map(e => (
                                    <button key={e} onClick={() => { setInputValue(prev => prev + e); setShowEmotes(false); }}>{e}</button>
                                ))}
                            </div>
                        )}
                        <div className="twitch-input-wrapper">
                            <div className="input-row">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Send a message"
                                    disabled={isLoading || isSending}
                                />
                                <button className="emote-btn" onClick={() => setShowEmotes(!showEmotes)}>
                                    😀
                                </button>
                            </div>
                            <div className="twitch-input-footer">
                                <div className="zaps-info">
                                    <Sparkles size={12} color="#8b5cf6" />
                                    <span>0.25 Zaps</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="bits-btn" onClick={() => handleGift(100)}>Bits</button>
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim() || isLoading || isSending}
                                        className="twitch-chat-btn"
                                    >
                                        Chat
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonaChat;
