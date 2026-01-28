
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Send, Sparkles, Loader2, Info, MessageCircle, AlertCircle, RefreshCw, Zap, Maximize, Minimize, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOptimizedImageUrl } from '../../utils';
import { getHypeMetadata } from '../../utils/twitchHelpers';
import SEO from '../../components/SEO';
import toast from 'react-hot-toast';
import Pusher from 'pusher-js';
import { listAudioFiles } from '../../b2';
import { ZAP_COSTS } from '../../constants/zapCosts';
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
    }, [text, onUpdate]); // Added onUpdate to satisfy linter, though we use it with care

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
    const { currentUser } = useAuth();

    const [imageItem, setImageItem] = useState(location.state?.imageItem || null);
    const [persona, setPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [viewerCount, setViewerCount] = useState(1);
    const [activeTab, setActiveTab] = useState('Home');
    const [alerts, setAlerts] = useState([]);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [pinnedMessage, setPinnedMessage] = useState(null);
    const [topSupporters, setTopSupporters] = useState([]);
    const [latestZap, setLatestZap] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const [showEmotes, setShowEmotes] = useState(false);
    const [showBitsModal, setShowBitsModal] = useState(false);
    const [showZapActions, setShowZapActions] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('initialized'); // 'initialized', 'connecting', 'connected', 'disconnected', 'unavailable'
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isPersonaTyping, setIsPersonaTyping] = useState(false);
    const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
    const audioVoiceRef = useRef(null);

    // Audio State
    const [queueIndex, setQueueIndex] = useState(0);
    const [audioQueue, setAudioQueue] = useState([]);
    const [voiceQueue, setVoiceQueue] = useState([]);
    const [volume, setVolume] = useState(30);
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
            const apiFn = httpsCallable(functions, 'api');
            await apiFn({ action: 'triggerAction', imageId: id, actionId, cost });
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
            const apiFn = httpsCallable(functions, 'api');
            await apiFn({ action: 'votePoll', imageId: id, optionId });
        } catch (e) {
            console.error(e);
        }
    };

    const scrollRef = useRef(null);
    const isMounted = useRef(true);
    const functions = getFunctions();

    // Reset state when switching characters
    useEffect(() => {
        if (!id) return;
        setImageItem(location.state?.imageItem || null);
        setPersona(null);
        setMessages([]);
        setAlerts([]);
        setFloatingReactions([]);
        setVoiceQueue([]);
        setIsAiSpeaking(false);
        setIsPersonaTyping(false);
        setError(null);

        // If we have state, we can skip initial loading for UI smoothness
        if (!location.state?.imageItem) {
            setIsLoading(true);
        }
    }, [id, location.state]);

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

    useEffect(() => {
        if (!id || !currentUser?.uid || !import.meta.env.VITE_SOKETI_APP_KEY) return;

        const initPusher = async () => {
            const token = await currentUser.getIdToken();
            const authEndpoint = import.meta.env.VITE_SOKETI_AUTH_ENDPOINT || '/api/pusher/auth';

            const pusher = new Pusher(import.meta.env.VITE_SOKETI_APP_KEY, {
                wsHost: import.meta.env.VITE_SOKETI_HOST || "127.0.0.1",
                wsPort: parseInt(import.meta.env.VITE_SOKETI_PORT || "6001"),
                forceTLS: import.meta.env.VITE_SOKETI_USE_TLS === 'true',
                disableStats: true,
                enabledTransports: ['ws', 'wss'],
                cluster: 'mt1',
                activityTimeout: 30000,
                pongTimeout: 10000,
                authEndpoint: authEndpoint,
                authorizer: (channel, options) => {
                    return {
                        authorize: async (socketId, callback) => {
                            try {
                                const freshToken = await currentUser.getIdToken(true);
                                const response = await fetch(authEndpoint, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${freshToken}`
                                    },
                                    body: JSON.stringify({
                                        socket_id: socketId,
                                        channel_name: channel.name
                                    })
                                });
                                if (!response.ok) throw new Error('Auth failed');
                                const data = await response.json();
                                callback(null, data);
                            } catch (error) {
                                console.error('[PusherAuth] Custom authorizer failed:', error);
                                callback(error);
                            }
                        }
                    };
                }
            });

            pusher.connection.bind('state_change', (states) => {
                if (!isMounted.current) return;
                setConnectionStatus(states.current);
                if (states.current === 'unavailable') {
                    toast.error("Stream connection lost. Retrying...", { id: 'pusher-reconnect' });
                } else if (states.current === 'connected') {
                    toast.success("Connected to live stream!", { id: 'pusher-reconnect' });
                }
            });

            pusher.connection.bind('error', (err) => {
                console.error('[Soketi] Connection error:', err);
                if (isMounted.current) {
                    // toast.error("Live connection issue. Attempting to recover...");
                }
            });

            const channelName = `presence-chat-${id}`;
            const channel = pusher.subscribe(channelName);

            channel.bind('pusher:subscription_succeeded', (members) => {
                if (isMounted.current) setViewerCount(members.count);
            });

            channel.bind('pusher:member_added', (member) => {
                if (!isMounted.current) return;
                setViewerCount(prev => prev + 1);
                const newAlert = {
                    id: Date.now(),
                    text: `${member.info?.displayName || 'A new viewer'} has joined!`,
                    type: 'join'
                };
                setAlerts(prev => [...prev, newAlert]);
                setTimeout(() => {
                    if (isMounted.current) {
                        setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                    }
                }, 5000);
            });

            channel.bind('pusher:member_removed', (member) => {
                if (isMounted.current) setViewerCount(prev => Math.max(0, prev - 1));
            });

            channel.bind('celebration', (data) => {
                if (!isMounted.current) return;
                triggerShake();
                const newAlert = {
                    id: Date.now(),
                    text: data.message || `${data.from} gifted ZAPs!`,
                    type: data.type || 'gift'
                };
                setLatestZap(newAlert.text);
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => {
                    if (isMounted.current) {
                        setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                    }
                }, 5000);
            });

            channel.bind('state-change', (data) => {
                if (!isMounted.current) return;
                const newAlert = {
                    id: Date.now(),
                    text: `COMMUNITY ACTION: ${data.from} triggered [${data.actionId}]!`,
                    type: 'action'
                };
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => {
                    if (isMounted.current) {
                        setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                    }
                }, 5000);
            });

            channel.bind('poll-started', (data) => {
                if (!isMounted.current) return;
                const newAlert = {
                    id: Date.now(),
                    text: `📊 NEW POLL: ${data.question}`,
                    type: 'poll'
                };
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => {
                    if (isMounted.current) {
                        setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                    }
                }, 5000);
            });

            channel.bind('pusher:member_removed', () => {
                if (isMounted.current) setViewerCount(prev => Math.max(1, prev - 1));
            });

            // Site-Wide Notifications
            const globalChannel = pusher.subscribe('global-notifications');
            globalChannel.bind('big-zap', (data) => {
                if (!isMounted.current) return;
                if (data.personaId !== id) {
                    toast(`${data.message}`, {
                        icon: '🚀',
                        style: { background: '#1f1f23', color: '#a970ff', border: '1px solid #a970ff' },
                        duration: 6000,
                        onClick: () => navigate(`/channel/${data.personaId}`)
                    });
                    setLatestZap(data.message);
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

                        if (isDuplicate && data.role === 'user' && data.uid === currentUser.uid) return prev;

                        return [...prev, { ...data, id: data.id || Date.now().toString() }];
                    });
                }
            });

            channel.bind('audio-update', (data) => {
                if (data.audioUrl) {
                    console.log("[AI Voice] Received audio update:", data);
                    setVoiceQueue(prev => {
                        // Limit queue size to 5 to prevent massive backlog if user is away
                        const newQueue = [...prev, data.audioUrl];
                        return newQueue.slice(-5);
                    });
                }
            });

            channel.bind('typing', (data) => {
                if (isMounted.current) {
                    setIsPersonaTyping(data.isTyping);
                }
            });

            return () => {
                console.log("[Soketi] Cleaning up connection...");
                channel.unbind_all();
                pusher.unsubscribe(channelName);
                pusher.disconnect();
            };
        };

        const cleanupPromise = initPusher();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isMounted.current) {
                console.log("[Soketi] Tab focused - ensuring connection...");
                // Pusher handles internal reconnection, but we can nudge it if needed
                // or just let it do its thing. Checking state is helpful.
            }
        };

        const handleOnline = () => {
            if (isMounted.current) {
                console.log("[Soketi] Network back online - ensuring connection...");
                toast.success("Network restored.");
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);

        return () => {
            cleanupPromise.then(cleanup => cleanup?.());
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
        };
    }, [id, currentUser?.uid, navigate]);

    const handleManualReconnect = () => {
        window.location.reload();
    };

    const handleAwakenPersona = async () => {
        if (!id || !imageItem || isSending) return;
        setIsLoading(true);
        try {
            const apiFn = httpsCallable(functions, 'api');
            const result = await apiFn({ action: 'createPersona', imageId: id, imageUrl: imageItem.imageUrl });
            if (result.data.success) {
                setPersona(result.data.persona);
                toast.success(`${result.data.persona.name} has been awakened!`);
            }
        } catch (err) {
            console.error("Awaken Error:", err);
            toast.error("Failed to awaken character.");
        } finally {
            setIsLoading(false);
        }
    };

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

                if (!docSnap.exists()) {
                    docRef = doc(db, 'personas', id);
                    docSnap = await getDoc(docRef);
                }

                if (docSnap.exists() && isMounted.current) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    // Handle inconsistencies in property naming
                    if (!data.imageUrl && data.url) data.imageUrl = data.url;
                    setImageItem(data);

                    // If we fetched from persona collection, we can also sync persona state
                    if (docSnap.ref.path.startsWith('personas/')) {
                        setPersona(prev => ({ ...prev, ...data }));
                    }
                } else if (isMounted.current) {
                    setError("Character not found. They may have returned to the spirit world.");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Error fetching image/persona:", err);
                if (isMounted.current) {
                    setError("Failed to load character data.");
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

                }
            } catch (error) {
                console.error("Persona Init Error:", error);
                if (isMounted.current) {
                    if (error.code === 'functions/resource-exhausted') {
                        setError("The oracle is overextended. Too many characters are currently awake. Please wait for one to return to slumber.");
                        toast.error("Channel limit reached. Try again later.");
                    } else {
                        toast.error("Could not awaken character. Please try again.");
                        setError("Failed to generate persona. The oracle is silent.");
                    }
                }
            } finally {
                if (isMounted.current) setIsLoading(false);
            }
        };

        if (imageItem) {
            initPersona();
        }
    }, [id, imageItem, functions, persona]);



    useEffect(() => {
        // Force scroll on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading, isSending]);

    // AI Voice Playback & Ducking Logic
    useEffect(() => {
        if (voiceQueue.length > 0 && !isAiSpeaking) {
            const nextUrl = voiceQueue[0];
            setVoiceQueue(prev => prev.slice(1));
            setIsAiSpeaking(true);

            if (audioVoiceRef.current) {
                audioVoiceRef.current.src = nextUrl;
                audioVoiceRef.current.play().then(() => {
                    setIsAutoplayBlocked(false);
                }).catch(e => {
                    console.error("Audio playback error (likely autoplay block):", e);
                    setIsAutoplayBlocked(true);
                    setIsAiSpeaking(false); // Reset so the queue doesn't get stuck
                });
            }
        }
    }, [voiceQueue, isAiSpeaking]);

    // Background Music Ducking (Smooth Fade)
    useEffect(() => {
        if (!audioRef.current) return;

        const targetVolume = isAiSpeaking ? (volume / 100) * 0.2 : (volume / 100);
        const currentVolume = audioRef.current.volume;

        if (Math.abs(currentVolume - targetVolume) < 0.01) return;

        // Smooth transition over 500ms
        const step = (targetVolume - currentVolume) / 10;
        const interval = setInterval(() => {
            if (!audioRef.current) {
                clearInterval(interval);
                return;
            }
            const nextVolume = audioRef.current.volume + step;
            if ((step > 0 && nextVolume >= targetVolume) || (step < 0 && nextVolume <= targetVolume)) {
                audioRef.current.volume = targetVolume;
                clearInterval(interval);
            } else {
                audioRef.current.volume = Math.max(0, Math.min(1, nextVolume));
            }
        }, 50);

        return () => clearInterval(interval);
    }, [isAiSpeaking, volume]);

    const handleAiAudioEnded = () => {
        setIsAiSpeaking(false);
    };

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

    const handleGift = async (amountInput = 100) => {
        if (isSending) return;
        const amount = Number(amountInput);
        if (isNaN(amount) || amount <= 0) return toast.error("Invalid gift amount.");
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
                    author: currentUser.displayName || 'You',
                    text: `gifted ${amount} ZAPs for a Priestess' blessing!`
                });
            }
        } catch (error) {
            console.error("Gift Error:", error);
            toast.error(error.message || "Failed to send ZAPs.");
        }
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
                                <span className="ticker-item">LATEST ZAP: {latestZap || 'No recent Zaps'}</span>
                                <span className="ticker-spacer">•</span>
                                <span className="ticker-item">TOP SUPPORTER: {topSupporters[0]?.displayName || (isLoading ? 'Searching...' : 'No supporters yet')}</span>
                                <span className="ticker-spacer">•</span>
                                <span className="ticker-item">HYPE LEVEL: {persona?.hypeLevel || 1} ({getHypeMetadata(persona?.hypeLevel || 1).label})</span>
                                <span className="ticker-spacer">•</span>
                                <span className="ticker-item">LATEST ZAP: {latestZap || 'No recent Zaps'}</span>
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
                                <span className={`view-dot ${connectionStatus === 'connected' ? 'online' : (connectionStatus === 'connecting' ? 'connecting' : 'offline')}`}></span>
                                {connectionStatus === 'connected' ? `${viewerCount} viewers` : (
                                    <span className="connection-retry" onClick={handleManualReconnect}>
                                        {connectionStatus.toUpperCase()} - RETRY?
                                    </span>
                                )}
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

                            {/* Autoplay Recovery Button */}
                            {isAutoplayBlocked && (
                                <div className="autoplay-recovery-overlay">
                                    <button
                                        className="unmute-stream-btn"
                                        onClick={() => {
                                            if (audioVoiceRef.current) audioVoiceRef.current.play();
                                            if (audioRef.current) audioRef.current.play();
                                            setIsAutoplayBlocked(false);
                                        }}
                                    >
                                        <VolumeX size={24} />
                                        <span>Join Audio</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="video-controls-overlay">
                            <div className="left-controls">
                                <button
                                    className="player-control-btn"
                                    title="Awaken Character (Force Re-initialize)"
                                    onClick={handleAwakenPersona}
                                    disabled={isLoading}
                                >
                                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                                </button>
                                <button className="player-control-btn" title="Refresh Feed" onClick={() => window.location.reload()}>
                                    <Send size={18} fill="white" />
                                </button>
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
                        {(isPersonaTyping || isSending) && (
                            <div className="twitch-message ai-typing-msg">
                                <span className="message-author ai-author">
                                    <span className="chat-badge ai-badge">AI</span>
                                    {persona?.name || 'Persona'}:
                                </span>
                                <span className="message-body thinking-dots">is thinking...</span>
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
                                <div className="zaps-info" title={`Standard chat costs ${ZAP_COSTS.PERSONA_CHAT} Zaps`}>
                                    <Sparkles size={12} color="#8b5cf6" />
                                    <span>Chat: {ZAP_COSTS.PERSONA_CHAT} ZAPs</span>
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
            <audio
                ref={audioVoiceRef}
                onEnded={handleAiAudioEnded}
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default PersonaChat;
