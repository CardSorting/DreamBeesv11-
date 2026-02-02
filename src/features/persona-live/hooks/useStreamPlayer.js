import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl } from '../../../utils';

export const useStreamPlayer = (persona, imageItem) => {
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isOverlayVisible, setIsOverlayVisible] = useState(true);

    // Use lazy state initialization for safeStartTime.
    // This maintains purity (no side effects in render) and avoids setState-in-effect.
    // Since the parent component (PersonaChatContent) has a key={id}, this hook 
    // is fully re-initialized when the persona ID changes, so this calculation runs once per persona.
    const [safeStartTime] = useState(() => {
        if (persona?.videoDuration && !isNaN(persona.videoDuration)) {
            return Math.floor((Date.now() / 1000) % persona.videoDuration);
        }
        return 0;
    });

    // Initialize lazily to avoid sync-state-in-effect issues if already present
    const [streamSdkReady, setStreamSdkReady] = useState(() => typeof window !== 'undefined' && !!window.Stream);

    const iframeRef = useRef(null);
    const playerRef = useRef(null);
    const hasAttachedPlayerRef = useRef(false);

    const posterUrl = useMemo(() => {
        if (!imageItem?.imageUrl) return '';
        const optimized = getOptimizedImageUrl(imageItem.imageUrl);
        if (!optimized) return '';
        const absoluteUrl = optimized.startsWith('http')
            ? optimized
            : `${window.location.origin}${optimized}`;

        // Avoid mixed-content in HTTPS iframe (Cloudflare Stream)
        if (absoluteUrl.startsWith('http://')) {
            console.warn('[PersonaChat] Skipping insecure poster URL:', absoluteUrl);
            return '';
        }

        return encodeURIComponent(absoluteUrl);
    }, [imageItem]);

    const iframeSrc = useMemo(() => {
        if (!persona?.videoId) return '';
        const safeStart = isNaN(safeStartTime) ? 0 : safeStartTime;
        const posterParam = posterUrl ? `&poster=${posterUrl}` : '';
        return `https://iframe.videodelivery.net/${persona.videoId}?loop=true&autoplay=true&muted=true&controls=false&startTime=${safeStart}${posterParam}`;
    }, [persona, safeStartTime, posterUrl]);

    // Reset player ref if the iframe source URL changes significantly
    useEffect(() => {
        // If the source changes, the iframe reloads, invalidating the player instance.
        playerRef.current = null;
        hasAttachedPlayerRef.current = false;
    }, [iframeSrc]);

    // Inject Cloudflare Stream SDK
    useEffect(() => {
        if (streamSdkReady) return;



        const script = document.createElement('script');
        script.src = "https://embed.videodelivery.net/embed/r4xu.js";
        script.async = true;
        script.onload = () => {
            console.warn('[PersonaChat] Cloudflare Stream SDK ready');
            setStreamSdkReady(true);
        };
        script.onerror = () => {
            console.error('[PersonaChat] Failed to load Cloudflare Stream SDK');
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [streamSdkReady]);

    const ensurePlayerReady = () => {
        if (hasAttachedPlayerRef.current) return;
        if (playerRef.current) return;
        // Double check if Stream is actually available directly on the element if we missed a ref update
        if (iframeRef.current && iframeRef.current.hasAttribute('data-stream-bridge-attached')) {
            hasAttachedPlayerRef.current = true;
            return;
        }

        if (!iframeRef.current || !window.Stream) return;
        hasAttachedPlayerRef.current = true;
        iframeRef.current.setAttribute('data-stream-bridge-attached', 'true');

        try {
            // Check if we already have a player instance attached properly
            const player = window.Stream(iframeRef.current);
            playerRef.current = player;
            console.warn('[PersonaChat] Stream player attached');

            // Attach event listeners regarding playback state
            player.addEventListener('play', () => {
                if (!player.muted) {
                    setIsMuted(false);
                    setIsOverlayVisible(false);
                }
            });

            player.addEventListener('volumechange', () => {
                if (!player.muted && player.volume > 0) {
                    setIsMuted(false);
                    setIsOverlayVisible(false);
                } else {
                    setIsMuted(true);
                }
            });

            player.addEventListener('ended', () => {
                console.warn('[PersonaChat] Video ended, forcing loop');
                player.currentTime = 0;
                player.play().catch(e => console.warn('Loop retry failed', e));
            });

            player.addEventListener('error', (e) => {
                console.warn('[PersonaChat] Player internal error:', e);
            });

        } catch (error) {
            console.warn('[PersonaChat] Stream player init failed:', error);
        }
    };

    useEffect(() => {
        if (!streamSdkReady || !videoLoaded) return;
        ensurePlayerReady();
    }, [streamSdkReady, videoLoaded]);

    const handleUnmute = async () => {
        const tryUnmute = async (attempts = 0) => {
            ensurePlayerReady();
            const player = playerRef.current;

            if (!player) {
                if (attempts < 5) {
                    setTimeout(() => tryUnmute(attempts + 1), 200);
                    return;
                }
                toast.error("Stream player not ready. Please refresh.");
                return;
            }

            try {
                player.muted = false;
                player.volume = 1;
                await player.play();
                // State updates via event listeners
            } catch (error) {
                console.warn(`[PersonaChat] Unmute attempt ${attempts + 1} failed:`, error);

                if (attempts < 3) {
                    setTimeout(() => tryUnmute(attempts + 1), 300);
                } else {
                    console.error('[PersonaChat] Final unmute failure.');
                    toast.error("Couldn't unmute stream automatically. Please click again.");
                }
            }
        };

        tryUnmute();
    };

    return {
        iframeRef,
        playerRef,
        videoLoaded,
        setVideoLoaded,
        isMuted,
        isOverlayVisible,
        iframeSrc,
        streamSdkReady,
        handleUnmute,
        ensurePlayerReady
    };
};
