import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserInteractions } from '../../../contexts/UserInteractionsContext';
import { calculateHypeLevel } from '../../../utils/twitchHelpers';
import { OFFICIAL_PERSONAS } from '../../../data/officialPersonas';
import toast from 'react-hot-toast';
import Pusher from 'pusher-js';
import { ZAP_COSTS } from '../../../constants/zapCosts';

export const usePersonaChat = (id, imageItem, setImageItem, audioHelpers) => {
    // Destructure audioHelpers to use in dependencies
    const { registerAudioUpdate, consumePendingAudio, resetAudioState } = audioHelpers;

    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { deductZapsOptimistically, rollbackZaps, userProfile } = useUserInteractions();
    const functions = getFunctions();

    const [persona, setPersona] = useState(null);
    const [messages, setMessages] = useState([]);
    const messagesRef = useRef([]); // Keep ref in focus for sockets
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [viewerCount, setViewerCount] = useState(1);
    const [alerts, setAlerts] = useState([]);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [pinnedMessage, setPinnedMessage] = useState(null);
    const [topSupporters, setTopSupporters] = useState([]);
    const [latestZap, setLatestZap] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('initialized');
    const [isPersonaTyping, setIsPersonaTyping] = useState(false);
    const [activeTab, setActiveTab] = useState('Home');
    const [error, setError] = useState(null);

    const pusherRef = useRef(null);
    const isMounted = useRef(true);
    const lastSendTime = useRef(0);
    const pendingAiMessageIdRef = useRef(null);
    const scrollRef = useRef(null);
    const hasInitializedRef = useRef(false);
    const hasFetchedHistoryRef = useRef(false);

    // Keep messagesRef in sync
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Mount/Unmount tracking
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    // ----- LOGIC: Fetch Persona / Initialize ----- //
    useEffect(() => {
        const fetchImage = async () => {
            if (!id) {
                setError("No image ID provided.");
                setIsLoading(false);
                return;
            }

            if (imageItem) return;

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
                    let data = { id: docSnap.id, ...docSnap.data() };
                    if (!data.imageUrl && data.url) data.imageUrl = data.url;

                    const officialData = OFFICIAL_PERSONAS.find(p => p.id === id);
                    if (officialData) {
                        data = { ...officialData, ...data };
                    }

                    if (docSnap.ref.path.startsWith('personas/')) {
                        setPersona(prev => ({ ...prev, ...data }));
                    }

                    if (!imageItem && setImageItem) {
                        setImageItem(data);
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
    }, [id, imageItem, setImageItem]);

    // Reset when ID changes
    useEffect(() => {
        if (!id) return;

        // Reset Logic
        resetAudioState();
        setPersona(null);
        setMessages([]);
        setAlerts([]);
        setFloatingReactions([]);
        setIsPersonaTyping(false);
        setError(null);
        if (!imageItem) setIsLoading(true);
        hasInitializedRef.current = false;
        hasFetchedHistoryRef.current = false;

    }, [id, resetAudioState]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persona Realtime Listener (Stable deps)
    useEffect(() => {
        if (!id) return;
        const unsub = onSnapshot(doc(db, 'personas', id), (snapshot) => {
            if (snapshot.exists()) {
                const dbData = snapshot.data();
                const officialData = OFFICIAL_PERSONAS.find(p => p.id === id);
                const finalData = officialData ? { ...officialData, ...dbData } : dbData;

                setPersona(prev => {
                    const newData = { ...prev, ...finalData };
                    if (newData.hypeScore !== undefined) {
                        newData.hypeLevel = calculateHypeLevel(newData.hypeScore);
                    }
                    return newData;
                });
            }
        }, (err) => console.error("[PersonaChat] Persona listener error:", err));
        return () => unsub();
    }, [id]);

    // Messages Realtime Listener (Firestore)
    useEffect(() => {
        if (!id) return;

        const historyQuery = query(
            collection(db, 'personas', id, 'shared_messages'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsub = onSnapshot(historyQuery, (snapshot) => {
            const liveMessages = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

            setMessages(prev => {
                const pending = prev.filter(msg => msg.status === 'sending' || msg.status === 'error');
                const hasLiveAi = liveMessages.some(msg => msg.role === 'model' && msg.text);
                const pendingAi = hasLiveAi ? [] : prev.filter(msg => msg.status === 'pending_ai');
                const merged = [...liveMessages, ...pending, ...pendingAi];
                const seen = new Set();
                return merged.filter(msg => {
                    const key = msg.id || `${msg.uid || 'anon'}:${msg.text}:${msg.timestamp?.toMillis?.() || msg.timestamp || ''}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            });

            if (liveMessages.some(msg => msg.role === 'model' && msg.text)) {
                pendingAiMessageIdRef.current = null;
            }

            // Sync audio from firestore messages
            liveMessages.forEach(msg => {
                if (!msg.id) return;
                let url = msg.audioUrl;
                if (!url) {
                    url = consumePendingAudio(msg.id);
                }
                if (url) {
                    registerAudioUpdate(msg.id, url, messagesRef);
                }
            });
        }, (err) => console.error("[PersonaChat] shared_messages listener error:", err));

        return () => unsub();
    }, [id, consumePendingAudio, registerAudioUpdate]);


    // Hype Decay
    useEffect(() => {
        if (!persona?.id) return;
        const decayInterval = setInterval(() => {
            setPersona(prev => {
                if (!prev || typeof prev.hypeScore !== 'number' || prev.hypeScore <= 0) return prev;
                const newScore = Math.max(0, prev.hypeScore - 5);
                return {
                    ...prev,
                    hypeScore: newScore,
                    hypeLevel: calculateHypeLevel(newScore)
                };
            });
        }, 5000);
        return () => clearInterval(decayInterval);
    }, [persona?.id]);

    // Top Supporters
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
        }, (err) => console.error("[PersonaChat] Supporters error:", err));
        return () => unsub();
    }, [id]);

    // Helper: Initial Fetch & "Awaken"
    const fetchHistory = useCallback(async (fallbackPersona = null) => {
        // Re-use top level imports.
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
            historicalMessages.forEach(msg => {
                if (msg.audioUrl && msg.id) {
                    registerAudioUpdate(msg.id, msg.audioUrl, messagesRef);
                }
            });
        } else if (fallbackPersona?.greeting) {
            setMessages([{
                id: 'greeting-' + Date.now(),
                role: 'model',
                text: fallbackPersona.greeting,
                displayName: fallbackPersona.name,
                timestamp: Date.now()
            }]);
        }
    }, [id, registerAudioUpdate]);

    useEffect(() => {
        const initPersona = async () => {
            if (!id || !imageItem) return;
            if (hasInitializedRef.current) return;
            hasInitializedRef.current = true;
            try {
                if (isMounted.current) setIsLoading(true);
                if (!persona) {
                    const apiFn = httpsCallable(functions, 'api');
                    const requestId = `cp_init_${id}`;
                    const result = await apiFn({ action: 'createPersona', imageId: id, imageUrl: imageItem.imageUrl, requestId });
                    const data = result.data;

                    if (data.success && isMounted.current) {
                        setPersona(data.persona);
                    }
                }
            } catch (error) {
                console.error("Persona Init Error:", error);
                if (isMounted.current) {
                    if (error.code === 'functions/resource-exhausted') {
                        setError("The oracle is overextended. Too many characters are currently awake. Please wait for one to return to slumber.");
                        toast.error("Channel limit reached. Try again later.");
                    } else {
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
        if (!persona?.id || hasFetchedHistoryRef.current) return;
        hasFetchedHistoryRef.current = true;
        const runHistory = async () => {
            try {
                await fetchHistory(persona);
            } catch (error) {
                console.error("Persona History Error:", error);
            }
        };
        runHistory();
    }, [persona?.id, persona, fetchHistory]);

    // ----- SOKETI / PUSHER ----- //
    useEffect(() => {
        if (!id || !currentUser?.uid || !import.meta.env.VITE_SOKETI_APP_KEY) return;
        if (pusherRef.current) return;

        let cleanupFn = null;

        const initPusher = async () => {
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
                authorizer: (channel, _options) => {
                    return {
                        authorize: async (socketId, callback) => {
                            try {
                                let token = await currentUser.getIdToken(false);
                                let response = await fetch(authEndpoint, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ socket_id: socketId, channel_name: channel.name })
                                });
                                if (response.status === 401 || response.status === 403) {
                                    token = await currentUser.getIdToken(true);
                                    response = await fetch(authEndpoint, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ socket_id: socketId, channel_name: channel.name })
                                    });
                                }
                                if (!response.ok) throw new Error("Auth failed");
                                const data = await response.json();
                                callback(null, data);
                            } catch (e) { callback(e); }
                        }
                    };
                }
            });

            pusherRef.current = pusher;

            pusher.connection.bind('state_change', (states) => {
                if (isMounted.current) setConnectionStatus(states.current);
            });

            const channelName = `presence-chat-${id}`;
            const channel = pusher.subscribe(channelName);
            const globalChannel = pusher.subscribe('global-notifications');

            channel.bind('pusher:payment_succeeded', (_members) => { /* ... */ });
            channel.bind('pusher:member_added', (_member) => {
                setViewerCount(prev => prev + 1);
            });
            channel.bind('pusher:member_removed', () => setViewerCount(prev => Math.max(0, prev - 1)));

            channel.bind('celebration', (data) => {
                triggerShake();
                setLatestZap(data.message || `${data.from} gifted ZAPs!`);
                toast.success(data.message, { icon: '🎁', duration: 5000 });
            });

            channel.bind('new-message', (data) => {
                if (data.audioUrl && data.id) {
                    registerAudioUpdate(data.id, data.audioUrl, messagesRef);
                } else if (data.id) {
                    // Check if pending audio exists for this message
                    const pending = consumePendingAudio(data.id);
                    if (pending) registerAudioUpdate(data.id, pending, messagesRef);
                }

                setMessages(prev => {
                    const isDuplicate = prev.some(m => m.id === data.id);
                    if (isDuplicate && data.role === 'user' && data.uid === currentUser?.uid) return prev;
                    if (isDuplicate && data.role !== 'user') return prev;

                    const nextMessages = [...prev, { ...data, id: data.id || Date.now().toString() }];
                    if (data.role === 'model') {
                        pendingAiMessageIdRef.current = null;
                        setIsPersonaTyping(false);
                        return nextMessages.filter(m => m.status !== 'pending_ai');
                    }
                    return nextMessages;
                });
            });

            channel.bind('audio-update', (data) => {
                if (data.audioUrl && data.messageId) {
                    registerAudioUpdate(data.messageId, data.audioUrl, messagesRef);
                }
            });

            channel.bind('typing', (data) => setIsPersonaTyping(data.isTyping));

            // Global
            globalChannel.bind('big-zap', (data) => {
                if (data.personaId !== id) {
                    toast(`${data.message}`, { icon: '🚀', duration: 6000, onClick: () => navigate(`/channel/${data.personaId}`) });
                }
            });

            cleanupFn = () => {
                channel.unbind_all();
                globalChannel.unbind_all();
                pusher.unsubscribe(channelName);
                pusher.unsubscribe('global-notifications');
                pusher.disconnect();
            };
        };

        initPusher();

        return () => {
            if (cleanupFn) cleanupFn();
            pusherRef.current = null;
        };

    }, [id, currentUser, navigate, consumePendingAudio, registerAudioUpdate]);

    // ----- ACTIONS ----- //
    const handleSend = async () => {
        if (!inputValue.trim() || isSending) return;
        const now = Date.now();
        if (now - lastSendTime.current < 2000) {
            toast.error("Slow down! You're messaging too fast.");
            return;
        }

        const userText = inputValue.trim();
        const msgId = `temp-${Date.now()}`;
        const userMsg = { id: msgId, role: 'user', text: userText, timestamp: now, status: 'sending', uid: currentUser?.uid };
        const pendingAiId = `pending-ai-${msgId}`;
        const pendingAiMsg = { id: pendingAiId, role: 'model', text: 'Thinking…', displayName: persona?.name || 'Persona', timestamp: now + 1, status: 'pending_ai' };

        pendingAiMessageIdRef.current = pendingAiId;
        setMessages(prev => [...prev, userMsg, pendingAiMsg]);
        setInputValue('');
        setIsSending(true);
        lastSendTime.current = now;

        const cost = ZAP_COSTS.PERSONA_CHAT || 0.5;
        const requestId = `chat_${msgId}`;

        try {
            deductZapsOptimistically(cost, requestId);
            const apiFn = httpsCallable(functions, 'api');
            await apiFn({
                action: 'chatPersona',
                imageId: id,
                message: userText,
                chatHistory: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
                requestId
            });
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'sent' } : m));
            setPersona(prev => {
                const newScore = (prev.hypeScore || 0) + 10;
                return { ...prev, hypeScore: newScore, hypeLevel: calculateHypeLevel(newScore) };
            });
        } catch (error) {
            console.error("Chat Error:", error);
            rollbackZaps(cost, requestId);
            toast.error("Failed to send message.");
            setMessages(prev => prev.map(m => {
                if (m.id === msgId) return { ...m, status: 'error' };
                if (m.id === pendingAiId) return { ...m, text: 'Response failed. Tap retry.', status: 'error' };
                return m;
            }));
        } finally {
            if (isMounted.current) setIsSending(false);
        }
    };

    const handleVote = async (optionId) => {
        if (!currentUser) return toast.error("Please log in to vote!");
        try {
            const apiFn = httpsCallable(functions, 'api');
            await apiFn({ action: 'votePoll', imageId: id, optionId });
        } catch (e) { console.error(e); }
    };

    const handleGift = async (amountInput = 100) => {
        if (isSending) return;
        const amount = Number(amountInput);
        if (isNaN(amount) || amount <= 0) return toast.error("Invalid gift amount.");
        const requestId = `gift_${Date.now()}`;
        try {
            deductZapsOptimistically(amount, requestId);
            const apiFn = httpsCallable(functions, 'api');
            await apiFn({ action: 'giftPersona', imageId: id, amount, type: 'zaps', requestId });
            toast.success(`You gifted ${amount} ZAPs!`, { icon: '⚡' });
            setPersona(prev => {
                const newScore = (prev.hypeScore || 0) + Math.floor(amount / 5);
                return { ...prev, hypeScore: newScore, hypeLevel: calculateHypeLevel(newScore) };
            });
            if (amount >= 500) {
                setPinnedMessage({
                    id: Date.now(),
                    author: (userProfile?.displayPreference === 'username' && userProfile?.username) ? `@${userProfile.username}` : (currentUser.displayName || 'You'),
                    text: `gifted ${amount} ZAPs for a Priestess' blessing!`
                });
            }
        } catch (error) {
            console.error("Gift Error:", error);
            rollbackZaps(amount, requestId);
            toast.error(error.message || "Failed to send ZAPs.");
        }
    };

    const handleAwakenPersona = async () => {
        if (!id || !imageItem || isSending) return;
        setIsLoading(true);
        const cost = ZAP_COSTS.PERSONA_CREATE || 0;
        const requestId = `cp_awaken_${Date.now()}`;

        try {
            if (cost > 0) deductZapsOptimistically(cost, requestId);
            const apiFn = httpsCallable(functions, 'api');
            const result = await apiFn({ action: 'createPersona', imageId: id, imageUrl: imageItem.imageUrl, requestId });
            if (result.data.success) {
                setPersona(result.data.persona);
                toast.success(`${result.data.persona.name} has been awakened!`);
            }
        } catch (err) {
            console.error("Awaken Error:", err);
            if (cost > 0) rollbackZaps(cost, requestId);
            toast.error("Failed to awaken character.");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        persona,
        messages,
        inputValue,
        setInputValue,
        isLoading,
        isSending,
        viewerCount,
        alerts,
        floatingReactions,
        pinnedMessage,
        setPinnedMessage,
        topSupporters,
        latestZap,
        isShaking,
        connectionStatus,
        isPersonaTyping,
        activeTab,
        setActiveTab,
        error,
        handleSend,
        handleVote,
        handleGift,
        handleAwakenPersona,
        scrollRef
    };
};
