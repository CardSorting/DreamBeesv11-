import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserInteractions } from '../../contexts/UserInteractionsContext';
import { getOptimizedImageUrl } from '../../utils';
import { getHypeMetadata, formatTwitchCount } from '../../utils/twitchHelpers';
import SEO from '../../components/SEO';
import { ArrowLeft, Send, Sparkles, Loader2, Info, MessageCircle, AlertCircle, RefreshCw, Zap, VolumeX, Volume2 } from 'lucide-react';

import { ZAP_COSTS } from '../../constants/zapCosts';
import './PersonaChat.css';

// Hooks
import { useStreamPlayer } from './hooks/useStreamPlayer';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { usePersonaChat } from './hooks/usePersonaChat';

class PersonaErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error) {
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

const PersonaChat = () => {
    const { id } = useParams();
    // We add a key here to force a complete remount of the content (and hooks) when the persona ID changes.
    // This solves the state reset issues without complex useEffects.
    return (
        <PersonaErrorBoundary>
            <PersonaChatContent key={id} />
        </PersonaErrorBoundary>
    );
};

const PersonaChatContent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { userProfile } = useUserInteractions();

    const [imageItem, setImageItem] = useState(() => location.state?.imageItem || null);
    const [showEmotes, setShowEmotes] = useState(false);

    // Audio Hook
    const audioPlayback = useAudioPlayback();
    const {
        audioVoiceRef,
        messageAudioMap,
        currentlyPlayingMsgId,
        loadingAudioMsgId,
        audioErrorMsgId,
        handlePlayAudio,
        handleAiAudioEnded
    } = audioPlayback;

    // Chat Logic Hook
    const {
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
        error,
        handleSend,
        handleVote,
        handleGift,
        handleAwakenPersona,
        scrollRef
    } = usePersonaChat(id, imageItem, setImageItem, audioPlayback);

    // Stream Player Hook
    const {
        videoRef,
        videoLoaded,
        setVideoLoaded,
        posterUrl,
    } = useStreamPlayer(persona, imageItem);

    // Populate imageItem if possible (hook handles logic, but this local state is for immediate render if passed)
    // Actually usePersonaChat fetches and can sync `persona` which might have image data, 
    // but `imageItem` is often passed from navigation state.
    // We already passed location.state.imageItem to useState above. 
    // If not passed, usePersonaChat fetches it. 
    // Let's rely on usePersonaChat to fetch persona, and update local imageItem if needed?
    // In original code, there was a fetchImage effect that updated `imageItem` and `persona`.
    // My hook mimics that. But `imageItem` state is local here.
    // To enable "Character not found" handling properly, we might need to sync back.
    // For now, let's assume `persona` from hook is enough for most things or `imageItem` state updates if we want to add that logic back to hook exports.
    // The hook has the fetch logic.

    // The original `fetchImage` set `imageItem` state. 
    // In my hook, I only set `persona`. I should probably ensure `usePersonaChat` can return the `imageItem` or let hooks manage it.
    // Actually, `usePersonaChat` logic (lines 114-117 in artifact) attempts to fetch.
    // Wait, in my `usePersonaChat` implementation, `setPersona` is done. `setImageItem` is NOT done because `imageItem` is not in the hook state.
    // I should fix `usePersonaChat` to handle image fetching correctly or expose it?
    // OR, I can keep `imageItem` separate since it's mostly for the "poster" and "initial state".

    // Let's assume for now `persona` will eventually populate and we can use that.
    // But `useStreamPlayer` needs `imageItem` for poster. 
    // Provide persona to useStreamPlayer is handled.

    const emotes = ['🐝', '🔥', '✨', '💜', '🎮', '🤖', '👑', '🙌', '👀', '🚀'];

    const getSupporterBadge = (userUid) => {
        const supporter = topSupporters.find(s => s.id === userUid);
        if (!supporter) return null;
        const total = supporter.totalZaps || 0;
        if (total >= 5000) return <span className="badge-legend" title="Legendary Supporter">👑</span>;
        if (total >= 1000) return <span className="badge-blaze" title="Mega Supporter">🔥</span>;
        if (total >= 100) return <span className="badge-spark" title="Supporter">⚡</span>;
        return null;
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRetryMessage = (msg) => {
        setInputValue(msg.text);
        // We can't really remove it from the hook's state easily without an exposed method
        // But re-inputting is main feat. 
    };

    // Effect to scroll on messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading, isSending, scrollRef]); // Scroll trigger

    if (error) {
        return (
            <div className="error-screen">
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                <h2>Connection Failed</h2>
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

    const isChatDisabled = isSending || !persona;

    return (
        <div className="persona-chat-container">
            <SEO title={persona ? `${persona.name} - AI Live Stream` : "AI Live Stream"} />

            <div className="twitch-stream-split">
                {/* Main Video Section */}
                <div className="video-section">
                    <div className={`video-player-mock ${persona?.hypeLevel >= 5 ? 'hype-level-5' : ''} ${isShaking ? 'screen-shake' : ''}`}>
                        {persona?.videoId ? (
                            <>
                                <video
                                    ref={videoRef}
                                    poster={posterUrl}
                                    autoPlay
                                    muted
                                    playsInline
                                    disablePictureInPicture
                                    controls
                                    className="native-stream-player"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        height: '100%',
                                        width: '100%',
                                        objectFit: 'cover',
                                        background: '#000',
                                        opacity: videoLoaded ? 1 : 0,
                                        transition: 'opacity 0.8s ease-in-out',
                                        filter: `
                                            contrast(${100 + (persona?.hypeLevel || 1) * 5}%) 
                                            brightness(${100 + (persona?.hypeLevel || 1) * 2}%)
                                            ${(persona?.hypeLevel || 1) >= 4 ? 'saturate(120%)' : ''}
                                        `
                                    }}
                                    onLoadedData={() => setVideoLoaded(true)}
                                />

                                {/* Live Stream Overlays */}
                                {videoLoaded && (
                                    <>
                                        <div className="live-badge">
                                            <div className="live-indicator"></div>
                                            <span>LIVE</span>
                                        </div>
                                        <div className="stream-viewer-count">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                                            {formatTwitchCount(viewerCount)} Viewers
                                        </div>
                                    </>
                                )}



                                {imageItem && (
                                    <img
                                        src={getOptimizedImageUrl(imageItem.imageUrl)}
                                        alt={persona?.name || 'Persona'}
                                        className={`main-stream-image hype-level-${persona?.hypeLevel || 1}`}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            zIndex: -1, // Keep behind iframe
                                            filter: `
                                                contrast(${100 + (persona?.hypeLevel || 1) * 5}%) 
                                                brightness(${100 + (persona?.hypeLevel || 1) * 2}%)
                                                ${(persona?.hypeLevel || 1) >= 4 ? 'saturate(120%)' : ''}
                                            `,
                                            transition: 'filter 0.5s ease'
                                        }}
                                    />
                                )}
                            </>
                        ) : (
                            imageItem && (
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
                            )
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
                                    <span className="connection-retry" onClick={() => window.location.reload()}>
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
                                <img src={imageItem?.imageUrl || persona?.imageUrl} alt="" />
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
                            <div key={msg.id || `msg-${idx}`} className={`twitch-message ${msg.role === 'model' ? 'ai-msg' : ''} ${msg.status || ''}`}>
                                {msg.role === 'system' ? (
                                    <span className="system-msg">{msg.text}</span>
                                ) : (
                                    <>
                                        <span className="message-author">
                                            {getSupporterBadge(msg.uid)}
                                            {msg.role === 'model' && <span className="chat-badge ai-badge">AI</span>}
                                            {msg.displayName || (msg.role === 'user' ? (
                                                (userProfile?.displayPreference === 'username' && userProfile?.username)
                                                    ? `@${userProfile.username}`
                                                    : (currentUser?.displayName || 'You')
                                            ) : 'System')}:
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
                        {((isPersonaTyping || isSending) && !messages.some(msg => msg.status === 'pending_ai')) && (
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
                                    disabled={isChatDisabled}
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
                                        disabled={!inputValue.trim() || isChatDisabled}
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
