import { useState, useEffect, useRef, useMemo } from 'react';
import { getOptimizedImageUrl } from '../../../utils';

/**
 * Hook to manage a native <video> element with HLS.js for Cloudflare Stream.
 * This is the most standardized and native way to handle streaming in the browser.
 */
export const useStreamPlayer = (persona, imageItem) => {
    const { videoId } = persona || {};
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [hlsReady, setHlsReady] = useState(() => typeof window !== 'undefined' && !!window.Hls);

    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    // 1. Poster URL calculation
    const posterUrl = useMemo(() => {
        if (!imageItem?.imageUrl) return '';
        const optimized = getOptimizedImageUrl(imageItem.imageUrl);
        return optimized && optimized.startsWith('http')
            ? optimized
            : (optimized ? `${window.location.origin}${optimized}` : '');
    }, [imageItem]);

    // 2. Manifest URL
    const manifestUrl = useMemo(() => {
        if (!videoId) return '';
        return `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
    }, [videoId]);

    // 3. Inject HLS.js script
    useEffect(() => {
        if (typeof window === 'undefined' || hlsReady) return;

        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
        script.async = true;
        script.onload = () => setHlsReady(true);
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [hlsReady]);

    // 4. Initialize HLS on the video element
    useEffect(() => {
        if (!hlsReady || !manifestUrl || !videoRef.current) return;

        const video = videoRef.current;

        // Clean up previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // Native HLS support (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = manifestUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.warn('[useStreamPlayer] Native autoplay failed:', e));
            });
        }
        // HLS.js support (Chrome, Firefox, etc.)
        else if (window.Hls.isSupported()) {
            const hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true,
                liveDurationInfinity: true, // Force "Live" semantics (no scrubber)
            });
            hlsRef.current = hls;
            hls.loadSource(manifestUrl);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.warn('[useStreamPlayer] HLS.js autoplay failed:', e));
            });

            hls.on(window.Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case window.Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case window.Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [hlsReady, manifestUrl]);

    return {
        videoRef,
        videoLoaded,
        setVideoLoaded,
        manifestUrl,
        posterUrl,
        hlsReady,
    };
};
