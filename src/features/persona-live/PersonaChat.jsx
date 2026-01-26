
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Send, Sparkles, Loader2, Info, MessageCircle, AlertCircle, RefreshCw, Zap, Maximize, Minimize, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOptimizedImageUrl } from '../../utils';
import { formatTwitchCount, getHypeMetadata } from '../../utils/twitchHelpers';
import SEO from '../../components/SEO';
import toast from 'react-hot-toast';
import Pusher from 'pusher-js';
import { listAudioFiles } from '../../b2';
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
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [pinnedMessage, setPinnedMessage] = useState(null);
    const [topSupporters, setTopSupporters] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [showZapActions, setShowZapActions] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    // Audio State
    const [audioQueue, setAudioQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const audioRef = useRef(null);

    const [error, setError] = useState(null);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const triggerZapAction = async (actionId, cost) => {
        if (!currentUser) return toast.error("Please log in to use ZAPs!");
        triggerShake();

        try {
            const triggerActionFn = httpsCallable(functions, 'triggerAction');
            await triggerActionFn({ imageId: id, actionId, cost });
            setShowZapActions(false);
            toast.success(`Action ${actionId} triggered!`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to trigger action.");
        }
    };

    const handleVote = async (optionId) => {
        if (!currentUser) return toast.error("Please log in to vote!");
        try {
            const votePollFn = httpsCallable(functions, 'votePoll');
            await votePollFn({ imageId: id, optionId });
            setActivePoll(null); // Local hide for instant feedback
        } catch (e) {
            console.error(e);
        }
    };

    const scrollRef = useRef(null);
    const isMounted = useRef(true);
    const functions = getFunctions();

    useEffect(() => {
        isMounted.current = true;

        // Initial Volume Set
        if (audioRef.current) {
            audioRef.current.volume = 0.3;
        }

        const fetchAudio = async () => {
            const tracks = await listAudioFiles();
            if (isMounted.current && tracks.length > 0) {
                // Shuffle Array (Fisher-Yates)
                for (let i = tracks.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
                }
                setAudioQueue(tracks);
                setQueueIndex(0);
            }
        };

        fetchAudio();

        return () => { isMounted.current = false; };
    }, []);

    // Handle Metadata load to set volume persistence
    const handleAudioMetadata = () => {
        if (audioRef.current) {
            audioRef.current.volume = 0.3; // Cap at 30%
        }
    };

    const handleTrackEnded = () => {
        if (audioQueue.length === 0) return;

        let nextIndex = queueIndex + 1;

        // Reshuffle if end of queue
        if (nextIndex >= audioQueue.length) {
            const shuffled = [...audioQueue];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setAudioQueue(shuffled);
            setQueueIndex(0);
        } else {
            setQueueIndex(nextIndex);
        }
    };

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

            channel.bind('celebration', (data) => {
                triggerShake();
                const newAlert = {
                    id: Date.now(),
                    text: data.message || `${data.from} gifted ZAPs!`,
                    type: data.type || 'gift'
                };
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlert.id)), 5000);
            });

            channel.bind('state-change', (data) => {
                const newAlert = {
                    id: Date.now(),
                    text: `COMMUNITY ACTION: ${data.from} triggered [${data.actionId}]!`,
                    type: 'action'
                };
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlert.id)), 5000);
            });

            channel.bind('poll-started', (data) => {
                const newAlert = {
                    id: Date.now(),
                    text: `📊 NEW POLL: ${data.question}`,
                    type: 'poll'
                };
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlert.id)), 5000);
            });

            channel.bind('pusher:member_removed', () => {
                setViewerCount(prev => Math.max(1, prev - 1));
            });

            // Site-Wide Notifications
            const globalChannel = pusher.subscribe('global-notifications');
            globalChannel.bind('big-zap', (data) => {
                if (data.personaId !== id) {
                    toast(`${data.message}`, {
                        icon: '🚀',
                        style: { background: '#1f1f23', color: '#a970ff', border: '1px solid #a970ff' },
                        duration: 6000,
                        onClick: () => navigate(`/channel/${data.personaId}`)
                    });
                }
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

            channel.bind('reaction', (data) => {
                if (isMounted.current) {
                    const id = Date.now() + Math.random();
                    setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, x: 20 + Math.random() * 60 }]);
                    setTimeout(() => {
                        setFloatingReactions(prev => prev.filter(r => r.id !== id));
                    }, 3000);
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
        if (!id) return;
        const supporterQuery = query(
            collection(db, 'personas', id, 'top_supporters'),
            orderBy('totalZaps', 'desc'),
            limit(5)
        );
        const unsub = onSnapshot(supporterQuery, (snapshot) => {
            const supporters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTopSupporters(supporters);
        });
        return () => unsub();
    }, [id]);

    const getSupporterBadge = (userUid) => {
        const supporter = topSupporters.find(s => s.id === userUid);
        if (!supporter) return null;
        const total = supporter.totalZaps || 0;
        if (total >= 5000) return <span className="badge-legend" title="Legendary Supporter">👑</span>;
        if (total >= 1000) return <span className="badge-blaze" title="Mega Supporter">🔥</span>;
        if (total >= 100) return <span className="badge-spark" title="Supporter">⚡</span>;
        return null;
    };

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

    const handleGift = async (amount = 100) => {
        if (isSending) return;
        try {
            const apiFn = httpsCallable(functions, 'api');
            await apiFn({
                action: 'giftPersona',
                imageId: id,
                amount: amount,
                type: 'zaps'
            });
            toast.success(`You gifted ${amount} ZAPs!`, { icon: '⚡' });

            if (amount >= 500) {
                setPinnedMessage({
                    id: Date.now(),
                    author: user.displayName || 'You',
                    text: `gifted ${amount} ZAPs for a Priestess' blessing!`
                });
            }
        } catch (error) {
            console.error("Gift Error:", error);
            toast.error(error.message || "Failed to send ZAPs.");
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
        <div className={`persona-chat-container ${isTheaterMode ? 'mode-theater' : ''}`}>
            <SEO title={persona ? `${persona.name} - AI Live Stream` : "AI Live Stream"} />

            <div className="twitch-stream-split">
                {/* Main Video Section */}
                <div className="video-section">
                    <div className={`video-player-mock ${persona?.hypeLevel >= 5 ? 'hype-level-5' : ''} ${isShaking ? 'screen-shake' : ''}`}>
                        {imageItem && (
                            <img
                                src={getOptimizedImageUrl(imageItem.imageUrl)}
                                alt={persona?.name || 'Persona'}
                                className={`main-stream-image hype-level-${persona?.hypeLevel || 1}`}
                                style={{
                                    filter: `
                                        contrast(${100 + (persona?.hypeLevel || 1) * 5}%) 
                                        brightness(${100 + (persona?.hypeLevel || 1) * 2}%)
                                        ${(persona?.hypeLevel || 1) >= 4 ? 'saturate(120%)' : ''}
                                    `,
                                    transition: 'filter 0.5s ease'
                                }}
                            />
                        )}

                        {/* Stream Ticker (Marquee) */}
                        <div className="stream-ticker">
                            <div className="ticker-scroll">
                                <span className="ticker-item">LATEST ZAP: {alerts[0]?.message || 'No recent Zaps'}</span>
                                <span className="ticker-spacer">•</span>
                                <span className="ticker-item">TOP SUPPORTER: {topSupporters[0]?.displayName || 'Searching...'}</span>
                                <span className="ticker-spacer">•</span>
                                <span className="ticker-item">HYPE LEVEL: {persona?.hypeLevel || 1} ({getHypeMetadata(persona?.hypeLevel || 1).label})</span>
                                <span className="ticker-spacer">•</span>
                                <span className="ticker-item">LATEST ZAP: {alerts[0]?.message || 'No recent Zaps'}</span>
                            </div>
                        </div>

                        {/* Live Poll Overlay (Real State) */}
                        {persona?.activePoll && (
                            <div className="live-poll-overlay">
                                <div className="poll-header">LIVE POLL</div>
                                <div className="poll-question">{persona.activePoll.question}</div>
                                <div className="poll-options">
                                    {persona.activePoll.options?.map(opt => (
                                        <button
                                            key={opt.id}
                                            className="poll-option-btn"
                                            onClick={() => handleVote(opt.id)}
                                        >
                                            <span className="opt-label">{opt.label}</span>
                                            <span className="opt-votes">{opt.votes || 0}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Floating Reactions Layer */}
                        <div className="stream-ui-overlay">
                            <div className="live-badge">LIVE</div>
                            <div className="viewer-count">
                                <span className="view-dot"></span> {viewerCount} viewers
                            </div>

                            {/* Floating Reactions Overlay */}
                            <div className="floating-reactions-container">
                                {floatingReactions.map(reaction => (
                                    <div
                                        key={reaction.id}
                                        className="floating-emoji"
                                        style={{ left: `${reaction.x}%` }}
                                    >
                                        {reaction.emoji}
                                    </div>
                                ))}
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
                                <button
                                    className="player-control-btn"
                                    title="Theater Mode"
                                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                                >
                                    {isTheaterMode ? <Minimize size={18} /> : <Maximize size={18} />}
                                </button>
                                <Info size={18} />
                            </div>
                        </div>

                        <button onClick={() => navigate(-1)} className="twitch-back-btn" aria-label="Go back">
                            <ArrowLeft size={20} />
                        </button>

                        {/* Hidden Background Audio Player */}
                        {audioQueue.length > 0 && (
                            <audio
                                ref={audioRef}
                                src={audioQueue[queueIndex]?.url}
                                autoPlay
                                loop={false}
                                onEnded={handleTrackEnded}
                                onLoadedMetadata={handleAudioMetadata}
                                style={{ display: 'none' }}
                            />
                        )}
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

                {/* Chat Section */}
                <div className="chat-section">
                    <div className="hype-meter-wrapper">
                        <div className="hype-meter-header">
                            <span className="hype-label">HYPE LEVEL {persona?.hypeLevel || 1}</span>
                            <Zap size={12} className="hype-icon" />
                        </div>
                        <div className="hype-bar-container">
                            <div
                                className="hype-bar-fill"
                                style={{ width: `${persona?.hypeScore || 10}%` }}
                            ></div>
                        </div>

                        {/* Community Zap Goal */}
                        <div className="community-goal-wrapper">
                            <div className="goal-header">
                                <span className="goal-label">COMMUNITY GOAL: SPECIAL GREETING</span>
                                <span className="goal-stats">{persona?.zapCurrent || 0}/{persona?.zapGoal || 1000}</span>
                            </div>
                            <div className="goal-bar-container">
                                <div
                                    className="goal-bar-fill"
                                    style={{ width: `${Math.min(100, ((persona?.zapCurrent || 0) / (persona?.zapGoal || 1000)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Top Supporters Widget */}
                    {topSupporters.length > 0 && (
                        <div className="top-supporters-widget">
                            <div className="supporters-label">TOP SUPPORTERS</div>
                            <div className="supporters-list-mini">
                                {topSupporters.map((s, i) => (
                                    <div key={s.id} className="mini-supporter-item" title={`${s.displayName}: ${s.totalZaps} ZAPs`}>
                                        <div className="mini-avatar-wrap">
                                            {s.photoURL ? <img src={s.photoURL} alt="" /> : <div className="avatar-placeholder">{s.displayName[0]}</div>}
                                            <span className="rank-idx">{i + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="chat-header">
                        STREAM CHAT
                    </div>

                    {/* Pinned Priority Message */}
                    {pinnedMessage && (
                        <div className="pinned-message-bar">
                            <div className="pinned-header">
                                <Zap size={10} fill="#ffd700" /> PRIORITY MESSAGE
                                <button className="clear-pin" onClick={() => setPinnedMessage(null)}>×</button>
                            </div>
                            <div className="pinned-content">
                                <strong>{pinnedMessage.author}:</strong> {pinnedMessage.text}
                            </div>
                        </div>
                    )}

                    <div className="chat-messages-twitch" ref={scrollRef}>
                        <div className="chat-welcome-msg">
                            Welcome to the chat room!
                        </div>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`twitch-message ${msg.role === 'model' ? 'ai-msg' : ''}`}>
                                {msg.role === 'system' ? (
                                    <span className="system-msg">{msg.text}</span>
                                ) : (
                                    <>
                                        <span className="message-author">
                                            {getSupporterBadge(msg.uid)}
                                            {msg.role === 'model' && <span className="chat-badge ai-badge">AI</span>}
                                            {msg.displayName}:
                                        </span>
                                        <span className="message-body"> {msg.text}</span>
                                    </>
                                )}
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
                                {showZapActions && (
                                    <div className="zap-actions-overlay">
                                        <div className="zap-actions-header">ZAP ACTIONS</div>
                                        <div className="zap-action-item" onClick={() => triggerZapAction('pose', 300)}>
                                            <div className="action-info">
                                                <span className="action-title">Pose Shift</span>
                                                <span className="action-desc">Change character's pose/mood</span>
                                            </div>
                                            <div className="action-cost"><Zap size={10} /> 300</div>
                                        </div>
                                        <div className="zap-action-item" onClick={() => triggerZapAction('background', 500)}>
                                            <div className="action-info">
                                                <span className="action-title">Re-imagine World</span>
                                                <span className="action-desc">Change the stream background</span>
                                            </div>
                                            <div className="action-cost"><Zap size={10} /> 500</div>
                                        </div>
                                    </div>
                                )}
                                <button className="bits-btn zap-action-btn" onClick={() => setShowZapActions(!showZapActions)}>
                                    <Sparkles size={16} /> Actions
                                </button>
                                <button className="bits-btn" onClick={() => setShowBitsModal(!showBitsModal)}>
                                    <Zap size={16} /> Get ZAPs
                                </button>
                            </div>
                            <div className="twitch-input-footer">
                                <div className="zaps-info">
                                    <Sparkles size={12} color="#8b5cf6" />
                                    <span>0.25 Zaps</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="bits-btn zap-btn-pulse" onClick={() => handleGift(100)}>
                                        <Zap size={14} fill="#ffd700" /> ZAPs
                                    </button>
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
