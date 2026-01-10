import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { drawVisualizerFrame } from '../utils/visualizerDraw';

const VisualizerCanvas = forwardRef(({
    lyrics,
    currentTime,
    width,
    height,
    isPlaying,
    analyser,
}, ref) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);

    // Refs for animation loop
    const currentTimeRef = useRef(currentTime);
    const lyricsRef = useRef(lyrics);
    const analyserRef = useRef(analyser);

    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
        // We might not need to expose much else if we use the util for export
    }));

    // Sync refs
    useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
    useEffect(() => { lyricsRef.current = lyrics; }, [lyrics]);
    useEffect(() => { analyserRef.current = analyser; }, [analyser]);

    // Initialize particles
    useEffect(() => {
        if (particlesRef.current.length === 0) {
            for (let i = 0; i < 150; i++) {
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -(Math.random() * 0.5 + 0.2),
                    size: Math.random() * 2 + 0.5,
                    alpha: Math.random() * 0.5 + 0.1,
                    life: Math.random() * 100
                });
            }
        }
    }, [width, height]);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;

        const render = () => {
            const t = currentTimeRef.current;

            // Update Physics (Keep this local to the component/canvas instance for real-time)
            const w = width;
            const h = height;

            // --- Audio Analysis ---
            let bassScale = 1.0;
            let frequencyData = null;

            if (analyserRef.current) {
                const activeAnalyser = analyserRef.current;
                const bufferLength = activeAnalyser.frequencyBinCount;
                frequencyData = new Uint8Array(bufferLength);
                activeAnalyser.getByteFrequencyData(frequencyData);

                let bassEnergy = 0;
                for (let i = 0; i < 8; i++) bassEnergy += frequencyData[i];
                bassEnergy /= 8;
                bassScale = 1.0 + (bassEnergy / 255) * 0.15;
            }

            // Update Particles
            particlesRef.current.forEach(p => {
                p.y += p.vy * bassScale;
                p.x += p.vx;
                p.life -= 0.1;
                if (p.y < -10) {
                    p.y = h + 10;
                    p.x = Math.random() * w;
                }
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
            });

            // Draw Frame
            drawVisualizerFrame(ctx, {
                width: w,
                height: h,
                time: t,
                lyrics: lyricsRef.current,
                frequencyData: frequencyData,
                particles: particlesRef.current,
                bassScale: bassScale
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
        />
    );
});

VisualizerCanvas.displayName = 'VisualizerCanvas';

export default VisualizerCanvas;
