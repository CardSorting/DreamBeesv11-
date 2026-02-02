import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useAudioPlayback = (isMounted = { current: true }) => {
    const audioVoiceRef = useRef(null);
    const [messageAudioMap, setMessageAudioMap] = useState({});
    const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState(null);
    const [loadingAudioMsgId, setLoadingAudioMsgId] = useState(null);
    const [audioErrorMsgId, setAudioErrorMsgId] = useState(null);
    const pendingAudioUpdates = useRef({});

    // Stop audio on unmount
    useEffect(() => {
        const currentAudio = audioVoiceRef.current;
        return () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.src = '';
            }
        };
    }, []);

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
        setCurrentlyPlayingMsgId(null);
        setLoadingAudioMsgId(null);
    };

    const registerAudioUpdate = (msgId, audioUrl, messagesRef) => {
        const hasMessage = messagesRef.current.some(msg => msg.id === msgId);
        if (!hasMessage) {
            pendingAudioUpdates.current[msgId] = audioUrl;
            return;
        }
        setMessageAudioMap(prev => ({
            ...prev,
            [msgId]: audioUrl
        }));
    };

    const consumePendingAudio = (msgId) => {
        if (pendingAudioUpdates.current[msgId]) {
            const url = pendingAudioUpdates.current[msgId];
            delete pendingAudioUpdates.current[msgId];
            return url;
        }
        return null;
    };

    const resetAudioState = () => {
        if (audioVoiceRef.current) {
            audioVoiceRef.current.pause();
            audioVoiceRef.current.src = '';
        }
        setMessageAudioMap({});
        setCurrentlyPlayingMsgId(null);
        setLoadingAudioMsgId(null);
        setAudioErrorMsgId(null);
        pendingAudioUpdates.current = {};
    };

    return {
        audioVoiceRef,
        messageAudioMap,
        setMessageAudioMap,
        currentlyPlayingMsgId,
        loadingAudioMsgId,
        audioErrorMsgId,
        handlePlayAudio,
        handleAiAudioEnded,
        registerAudioUpdate,
        consumePendingAudio,
        resetAudioState
    };
};
