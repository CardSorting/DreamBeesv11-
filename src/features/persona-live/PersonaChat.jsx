import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Send, Sparkles, Loader2, Info, MessageCircle, AlertCircle, RefreshCw, Zap, VolumeX, Volume2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserInteractions } from '../../contexts/UserInteractionsContext';
import { getOptimizedImageUrl } from '../../utils';
import { getHypeMetadata } from '../../utils/twitchHelpers';
import SEO from '../../components/SEO';
import toast from 'react-hot-toast';
import Pusher from 'pusher-js';

import { ZAP_COSTS } from '../../constants/zapCosts';
import './PersonaChat.css';

class PersonaErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("PersonaLive Error Boundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-content">
                    <div className="error-card">
                        <AlertCircle size={48} color="#ff4d4d" />
                        <h2>Oops! Something went wrong.</h2>
                        <p>The spirit world is experiencing some turbulence. We've notified our technicians.</p>
                        <button onClick={() => window.location.reload()}>Refresh Stream</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

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
    return (
        <PersonaErrorBoundary>
            <PersonaChatContent />
        </PersonaErrorBoundary>
    );
};

const PersonaChatContent = () => {
    const { id } = useParams(); // imageId
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { deductZapsOptimistically, rollbackZaps } = useUserInteractions();

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
    const [connectionStatus, setConnectionStatus] = useState('initialized'); // 'initialized', 'connecting', 'connected', 'disconnected', 'unavailable'
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isPersonaTyping, setIsPersonaTyping] = useState(false);
    const audioVoiceRef = useRef(null);

    // Audio stored per message ID (click-to-play)
    const [messageAudioMap, setMessageAudioMap] = useState({});
    const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState(null);
    const [loadingAudioMsgId, setLoadingAudioMsgId] = useState(null); // Track which message's audio is loading
    const [audioErrorMsgId, setAudioErrorMsgId] = useState(null); // Track which message's audio failed
    const pendingAudioUpdates = useRef({}); // Queue audio updates that arrive before message exists

    const [error, setError] = useState(null);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
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
    const pusherRef = useRef(null);
    const isMounted = useRef(true);
    const lastSendTime = useRef(0);
    const functions = getFunctions();

    // Reset state when switching characters
    useEffect(() => {
        if (!id) return;

        // Stop any playing audio when switching characters
        if (audioVoiceRef.current) {
            audioVoiceRef.current.pause();
            audioVoiceRef.current.src = '';
        }

        setImageItem(location.state?.imageItem || null);
        setPersona(null);
        setMessages([]);
        setAlerts([]);
        setFloatingReactions([]);
        setMessageAudioMap({});
        setCurrentlyPlayingMsgId(null);
        setLoadingAudioMsgId(null);
        setAudioErrorMsgId(null);
        pendingAudioUpdates.current = {};
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
        return () => {
            isMounted.current = false;
            // Cleanup audio on unmount
            if (audioVoiceRef.current) {
                audioVoiceRef.current.pause();
                audioVoiceRef.current.src = '';
            }
        };
    }, []);

    // Debugging dependency changes
    const prevDeps = useRef({ id, uid: currentUser?.uid });
    const initializingRef = useRef(false); // Prevent concurrent init attempts
    const cleanupTimeoutRef = useRef(null); // For delayed cleanup (Strict Mode handling)

    useEffect(() => {
        console.log("[Soketi] PersonaChat MOUNTED/UPDATED");
        const changed = [];
        if (prevDeps.current.id !== id) changed.push(`id: ${prevDeps.current.id} -> ${id}`);
        if (prevDeps.current.uid !== currentUser?.uid) changed.push(`uid: ${prevDeps.current.uid} -> ${currentUser?.uid}`);

        if (changed.length > 0) {
            console.log("[Soketi] Dependencies changed:", changed.join(', '));
            prevDeps.current = { id, uid: currentUser?.uid };
        }

        // Cancel any pending cleanup from Strict Mode's immediate re-run
        if (cleanupTimeoutRef.current) {
            console.log("[Soketi] Cancelling pending cleanup (Strict Mode re-run)");
            clearTimeout(cleanupTimeoutRef.current);
            cleanupTimeoutRef.current = null;
        }

        if (!id || !currentUser?.uid || !import.meta.env.VITE_SOKETI_APP_KEY) {
            console.log("[Soketi] Skipping init - missing deps");
            return;
        }

        // SYNCHRONOUS guard - check BEFORE async code
        if (pusherRef.current) {
            console.log("[Soketi] Pusher already initialized, skipping.");
            return;
        }

        if (initializingRef.current) {
            console.log("[Soketi] Initialization already in progress, skipping.");
            return;
        }

        // Mark as initializing immediately (synchronously)
        initializingRef.current = true;

        let isCleanedUp = false;

        const initPusher = async () => {
            console.log("[Soketi] Initializing connection...");

            // Check if we were cleaned up before starting
            if (isCleanedUp) {
                console.log("[Soketi] Aborting init - already cleaned up");
                initializingRef.current = false;
                return null;
            }

            const authEndpoint = import.meta.env.VITE_SOKETI_AUTH_ENDPOINT || '/api/pusher/auth';
            let authRetryCount = 0;
            const MAX_AUTH_RETRIES = 5;

            // Helper for backoff delay
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));


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
                            if (isCleanedUp) return; // Stop if unmounted

                            try {
                                if (authRetryCount >= MAX_AUTH_RETRIES) {
                                    console.warn(`[PusherAuth] Max retries reached for ${channel.name}. Aborting.`);
                                    callback(new Error("Max auth retries reached"));
                                    return;
                                }

                                // Exponential backoff: 0s, 1s, 2s, 4s...
                                if (authRetryCount > 0) {
                                    const delay = Math.pow(2, authRetryCount - 1) * 1000;
                                    console.log(`[PusherAuth] Backing off for ${delay}ms before retry ${authRetryCount}...`);
                                    await sleep(delay);
                                }

                                if (isCleanedUp) return; // Check again after sleep

                                // 1. Try with cached token first (false)
                                let token = await currentUser.getIdToken(false);

                                let response;
                                try {
                                    response = await fetch(authEndpoint, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            socket_id: socketId,
                                            channel_name: channel.name
                                        })
                                    });
                                } catch (fetchErr) {
                                    console.error("[PusherAuth] Network request failed:", fetchErr);
                                    authRetryCount++;
                                    throw fetchErr;
                                }

                                if (isCleanedUp) return; // Check usage

                                // 2. If 401/403, force refresh and retry ONCE
                                if (response.status === 401 || response.status === 403) {
                                    console.log("[PusherAuth] Token expired/invalid. Refreshing...");
                                    token = await currentUser.getIdToken(true);
                                    response = await fetch(authEndpoint, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            socket_id: socketId,
                                            channel_name: channel.name
                                        })
                                    });
                                }

                                if (!response.ok) {
                                    console.error(`[PusherAuth] Auth failed. Status: ${response.status} Text: ${response.statusText}`);
                                    authRetryCount++;
                                    throw new Error(`Auth failed with status: ${response.status}`);
                                }

                                // Reset retry count on success
                                authRetryCount = 0;
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

            pusherRef.current = pusher;

            pusher.connection.bind('state_change', (states) => {
                if (isCleanedUp || !isMounted.current) return;
                setConnectionStatus(states.current);
                if (states.current === 'unavailable') {
                    // Quietly retry, don't spam toast
                    console.log("Stream connection lost. Retrying...", states);
                } else if (states.current === 'connected') {
                    // Only toast on recovery if it was previously disconnected long enough to notice?
                    // For now, keeping it simple or removing to reduce noise
                    // toast.success("Connected to live stream!", { id: 'pusher-reconnect' });
                }
            });

            pusher.connection.bind('error', (err) => {
                if (isCleanedUp) return;
                console.error('[Soketi] Connection error:', err);
                if (err?.error?.data?.code === 4004) {
                    console.warn("[Soketi] Over limit or subscription error. Stopping retries.");
                    pusher.disconnect();
                }
            });

            const channelName = `presence-chat-${id}`;
            const channel = pusher.subscribe(channelName);

            channel.bind('pusher:subscription_succeeded', (members) => {
                if (isCleanedUp || !isMounted.current) return;
                setViewerCount(members.count);
                // Reset auth retries on successful subscription
                authRetryCount = 0;
            });

            // ... (rest of bindings remain the same)

            const bindSafe = (event, callback) => {
                channel.bind(event, (data) => {
                    if (isCleanedUp || !isMounted.current) return;
                    callback(data);
                });
            };

            bindSafe('pusher:member_added', (member) => {
                setViewerCount(prev => prev + 1);
                const newAlert = {
                    id: Date.now(),
                    text: `${member.info?.displayName || 'A new viewer'} has joined!`,
                    type: 'join'
                };
                setAlerts(prev => [...prev, newAlert]);
                setTimeout(() => {
                    if (isMounted.current) setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                }, 5000);
            });

            bindSafe('pusher:member_removed', (member) => {
                setViewerCount(prev => Math.max(0, prev - 1));
            });

            bindSafe('celebration', (data) => {
                triggerShake();
                const newAlert = {
                    id: Date.now(),
                    text: data.message || `${data.from} gifted ZAPs!`,
                    type: data.type || 'gift'
                };
                setLatestZap(newAlert.text);
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => {
                    if (isMounted.current) setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                }, 5000);

                // Second celebration logic from original code
                const celebrationAlert = {
                    id: Date.now(),
                    text: data.message,
                    type: 'celebration'
                };
                setAlerts(prev => [...prev, celebrationAlert]);
                setTimeout(() => {
                    setAlerts(prev => prev.filter(a => a.id !== celebrationAlert.id));
                }, 8000);
                toast.success(data.message, { icon: '🎁', duration: 5000 });
            });

            bindSafe('state-change', (data) => {
                const newAlert = {
                    id: Date.now(),
                    text: `COMMUNITY ACTION: ${data.from} triggered [${data.actionId}]!`,
                    type: 'action'
                };
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => {
                    if (isMounted.current) setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                }, 5000);
            });

            bindSafe('poll-started', (data) => {
                const newAlert = {
                    id: Date.now(),
                    text: `📊 NEW POLL: ${data.question}`,
                    type: 'poll'
                };
                setAlerts(prev => [newAlert, ...prev]);
                setTimeout(() => {
                    if (isMounted.current) setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
                }, 5000);
            });


            // Site-Wide Notifications
            const globalChannel = pusher.subscribe('global-notifications');
            globalChannel.bind('big-zap', (data) => {
                if (isCleanedUp || !isMounted.current) return;
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

            bindSafe('reaction', (data) => {
                const id = Date.now() + Math.random();
                setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, x: 20 + Math.random() * 60 }]);
                setTimeout(() => {
                    setFloatingReactions(prev => prev.filter(r => r.id !== id));
                }, 3000);
            });

            bindSafe('new-message', (data) => {
                console.log("[Chat] Received new-message:", data);
                setMessages(prev => {
                    const isDuplicate = prev.some(m =>
                        m.id === data.id || (
                            m.text === data.text &&
                            m.uid === data.uid &&
                            (Math.abs(Date.now() - (data.timestamp || Date.now())) < 5000)
                        )
                    );

                    // Only skip if it's the CURRENT user's own message that they sent (to avoid double-add)
                    if (isDuplicate && data.role === 'user' && data.uid === currentUser?.uid) {
                        console.log("[Chat] Skipping duplicate user message");
                        return prev;
                    }

                    // If it's a duplicate from someone else or AI, still skip
                    if (isDuplicate && data.role !== 'user') {
                        console.log("[Chat] Skipping duplicate AI/system message");
                        return prev;
                    }

                    console.log("[Chat] Adding message to chat:", data.id || Date.now().toString());
                    return [...prev, { ...data, id: data.id || Date.now().toString() }];
                });
            });

            bindSafe('audio-update', (data) => {
                if (data.audioUrl && data.messageId) {
                    console.log("[AI Voice] Received audio for message:", data.messageId);
                    setMessageAudioMap(prev => ({
                        ...prev,
                        [data.messageId]: data.audioUrl
                    }));
                }
            });

            bindSafe('typing', (data) => {
                setIsPersonaTyping(data.isTyping);
            });

            return () => {
                isCleanedUp = true;
                console.log("[Soketi] Cleaning up connection...");
                channel.unbind_all();
                globalChannel.unbind_all(); // also unbind global
                try {
                    pusher.unsubscribe(channelName);
                    pusher.unsubscribe('global-notifications');
                    pusher.disconnect();
                } catch (e) {
                    console.warn("Disconnect cleanup error:", e);
                }
                pusherRef.current = null;
                initializingRef.current = false; // Reset so next mount can initialize
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
            // Set cleanup flag immediately (synchronously) to stop any pending async operations
            isCleanedUp = true;

            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);

            // Use delayed cleanup to handle React Strict Mode
            // If the effect re-runs immediately (Strict Mode), it will cancel this timeout
            cleanupTimeoutRef.current = setTimeout(() => {
                console.log("[Soketi] Executing delayed cleanup...");
                cleanupPromise.then(cleanup => cleanup?.());
                cleanupTimeoutRef.current = null;
            }, 100); // 100ms delay - enough for Strict Mode re-run to cancel
        };
    }, [id, currentUser?.uid, navigate]);

    const handleManualReconnect = () => {
        window.location.reload();
    };

    const handleAwakenPersona = async () => {
        if (!id || !imageItem || isSending) return;
        setIsLoading(true);
        const cost = ZAP_COSTS.PERSONA_CREATE || 0;
        const requestId = `cp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
                const requestId = `cp_init_${id}`; // Predictable for auto-init
                const result = await apiFn({ action: 'createPersona', imageId: id, imageUrl: imageItem.imageUrl, requestId });

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

                        // Pre-populate audio map from historical messages
                        const audioMap = {};
                        historicalMessages.forEach(msg => {
                            if (msg.audioUrl && msg.id) {
                                audioMap[msg.id] = msg.audioUrl;
                            }
                        });
                        if (Object.keys(audioMap).length > 0) {
                            setMessageAudioMap(prev => ({ ...prev, ...audioMap }));
                        }
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

    // Click-to-play audio handler with loading states and error recovery
    const handlePlayAudio = (msgId, fallbackAudioUrl = null) => {
        // Use map first, fallback to passed URL from message object
        const audioUrl = messageAudioMap[msgId] || fallbackAudioUrl;
        if (!audioUrl) {
            console.warn("[AI Voice] No audio URL found for message:", msgId);
            return;
        }

        // Clear any previous error state for this message
        if (audioErrorMsgId === msgId) {
            setAudioErrorMsgId(null);
        }

        // If already playing this message, stop it
        if (currentlyPlayingMsgId === msgId && audioVoiceRef.current) {
            audioVoiceRef.current.pause();
            audioVoiceRef.current.currentTime = 0;
            setCurrentlyPlayingMsgId(null);
            setLoadingAudioMsgId(null);
            setIsAiSpeaking(false);
            return;
        }

        // Stop any currently playing audio first
        if (audioVoiceRef.current && currentlyPlayingMsgId) {
            audioVoiceRef.current.pause();
            audioVoiceRef.current.currentTime = 0;
        }

        // Play the selected audio with loading state
        if (audioVoiceRef.current) {
            setLoadingAudioMsgId(msgId);
            setAudioErrorMsgId(null);
            audioVoiceRef.current.src = audioUrl;

            audioVoiceRef.current.play().then(() => {
                if (isMounted.current) {
                    setCurrentlyPlayingMsgId(msgId);
                    setLoadingAudioMsgId(null);
                    setIsAiSpeaking(true);
                }
            }).catch(e => {
                console.error("Audio playback error:", e);
                if (isMounted.current) {
                    setLoadingAudioMsgId(null);
                    setAudioErrorMsgId(msgId);
                    toast.error("Audio failed to load. Click to retry.");
                }
            });
        }
    };



    const handleAiAudioEnded = () => {
        setIsAiSpeaking(false);
        setCurrentlyPlayingMsgId(null);
        setLoadingAudioMsgId(null);
    };

    const handleSend = async () => {
        if (!inputValue.trim() || isSending) return;

        // Rate Limiting (2 seconds)
        const now = Date.now();
        if (now - lastSendTime.current < 2000) {
            toast.error("Slow down! You're messaging too fast.");
            return;
        }

        const userText = inputValue.trim();
        const msgId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const userMsg = {
            id: msgId,
            role: 'user',
            text: userText,
            timestamp: now,
            status: 'sending'
        };

        setMessages(prev => [...prev, userMsg]);
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

            // Upon success, keep it as is, Pusher will eventually provide the real one
            // We'll filter out temp messages in the render if we want, OR Pusher replaces it
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'sent' } : m));

        } catch (error) {
            console.error("Chat Error:", error);
            rollbackZaps(cost, requestId);
            if (isMounted.current) {
                toast.error("Failed to send message.");
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'error' } : m));
            }
        } finally {
            if (isMounted.current) {
                setIsSending(false);
            }
        }
    };

    const handleRetryMessage = (msg) => {
        setInputValue(msg.text);
        setMessages(prev => prev.filter(m => m.id !== msg.id));
    };

    const handleGift = async (amountInput = 100) => {
        if (isSending) return;
        const amount = Number(amountInput);
        if (isNaN(amount) || amount <= 0) return toast.error("Invalid gift amount.");
        const requestId = `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        try {
            deductZapsOptimistically(amount, requestId);
            const apiFn = httpsCallable(functions, 'api');
            await apiFn({
                action: 'giftPersona',
                imageId: id,
                amount: amount,
                type: 'zaps',
                requestId
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
            rollbackZaps(amount, requestId);
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
        <div className="persona-chat-container">
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
                                <span className={`view-dot ${connectionStatus === 'connected' ? 'online' : (['connecting', 'unavailable'].includes(connectionStatus) ? 'connecting' : 'offline')}`}></span>
                                {connectionStatus === 'connected' ? `${viewerCount} viewers` : (
                                    <span className="connection-retry" onClick={handleManualReconnect}>
                                        {connectionStatus === 'unavailable' ? 'RECONNECTING...' : (connectionStatus === 'connecting' ? 'CONNECTING...' : `${connectionStatus.toUpperCase()} - RETRY?`)}
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

                    </div>
                </div>

                {/* Chat Section */}
                <div className="chat-section">


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
                            <div key={msg.id || idx} className={`twitch-message ${msg.role === 'model' ? 'ai-msg' : ''} ${msg.status || ''}`}>
                                {msg.role === 'system' ? (
                                    <span className="system-msg">{msg.text}</span>
                                ) : (
                                    <>
                                        <span className="message-author">
                                            {getSupporterBadge(msg.uid)}
                                            {msg.role === 'model' && <span className="chat-badge ai-badge">AI</span>}
                                            {msg.displayName || (msg.role === 'user' ? (currentUser?.displayName || 'You') : 'System')}:
                                        </span>
                                        <span className="message-body">
                                            {msg.text}
                                            {msg.status === 'sending' && <span className="msg-status-tag">...sending</span>}
                                            {msg.status === 'error' && (
                                                <span className="msg-status-tag error" onClick={() => handleRetryMessage(msg)}>
                                                    Error - Retry?
                                                </span>
                                            )}
                                        </span>
                                        {/* Click-to-play audio button for AI messages */}
                                        {msg.role === 'model' && (messageAudioMap[msg.id] || msg.audioUrl) && (
                                            <button
                                                className={`msg-audio-btn ${currentlyPlayingMsgId === msg.id ? 'playing' : ''} ${loadingAudioMsgId === msg.id ? 'loading' : ''} ${audioErrorMsgId === msg.id ? 'error' : ''}`}
                                                onClick={() => handlePlayAudio(msg.id, msg.audioUrl)}
                                                disabled={loadingAudioMsgId === msg.id}
                                                title={
                                                    loadingAudioMsgId === msg.id ? 'Loading audio...' :
                                                        audioErrorMsgId === msg.id ? 'Click to retry' :
                                                            currentlyPlayingMsgId === msg.id ? 'Stop audio' : 'Play voice'
                                                }
                                            >
                                                {loadingAudioMsgId === msg.id ? (
                                                    <Loader2 size={14} className="spin" />
                                                ) : audioErrorMsgId === msg.id ? (
                                                    <AlertCircle size={14} />
                                                ) : currentlyPlayingMsgId === msg.id ? (
                                                    <VolumeX size={14} />
                                                ) : (
                                                    <Volume2 size={14} />
                                                )}
                                            </button>
                                        )}
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
