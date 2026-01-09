import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

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
            const w = canvas.width;
            const h = canvas.height;
            const t = currentTimeRef.current;

            // --- 1. Audio Analysis ---
            let bassScale = 1.0;
            let frequencyData = null;
            let bufferLength = 0;

            if (analyserRef.current) {
                const activeAnalyser = analyserRef.current;
                bufferLength = activeAnalyser.frequencyBinCount;
                frequencyData = new Uint8Array(bufferLength);
                activeAnalyser.getByteFrequencyData(frequencyData);

                let bassEnergy = 0;
                // Focus on sub-bass/bass frequencies (bins 0-10 approx for fft 256)
                for (let i = 0; i < 8; i++) bassEnergy += frequencyData[i];
                bassEnergy /= 8;
                bassScale = 1.0 + (bassEnergy / 255) * 0.15;
            }

            // --- 2. Background Rendering ---
            // Dynamic dark gradient based on time and bass
            const hue = (t * 2) % 360;
            const lightness = 5 + (bassScale - 1) * 15;

            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
            bgGrad.addColorStop(0, `hsl(${hue}, 40%, ${lightness}%)`);
            bgGrad.addColorStop(1, '#0f172a');

            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // --- 3. Particles ---
            ctx.globalCompositeOperation = 'screen';
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

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (bassScale * 0.8 + 0.2), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 220, 150, ${p.alpha})`;
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over';

            // --- 4. Vignette ---
            const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // --- 5. Spectrum ---
            if (frequencyData) {
                const barCount = 120;
                const step = Math.floor(bufferLength / barCount);
                const barWidth = w / barCount;

                for (let i = 0; i < barCount; i++) {
                    let value = 0;
                    for (let j = 0; j < step; j++) value += frequencyData[i * step + j];
                    value /= step;

                    const barHeight = Math.pow((value / 255), 1.5) * (h * 0.25);

                    if (barHeight > 1) {
                        const x = i * barWidth;
                        const y = h - barHeight;

                        ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
                        ctx.fillRect(x, y, barWidth - 1, barHeight);
                        ctx.fillStyle = `rgba(255, 255, 255, 0.05)`;
                        ctx.fillRect(x, h, barWidth - 1, barHeight * 0.5);
                    }
                }
            }

            // --- 6. Lyrics ---
            const activeLyricIdx = lyricsRef.current.findIndex((l, i, arr) => {
                const next = arr[i + 1];
                return t >= l.time && (!next || t < next.time);
            });

            const centerY = h / 2;
            const lineHeight = 65;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let i = activeLyricIdx - 2; i <= activeLyricIdx + 2; i++) {
                if (i < 0 || i >= lyricsRef.current.length) continue;
                const line = lyricsRef.current[i];
                const offset = i - activeLyricIdx;
                const y = centerY + (offset * lineHeight * 1.5);

                if (i === activeLyricIdx) {
                    const scale = 1.0 + (bassScale - 1) * 0.15;
                    ctx.save();
                    ctx.translate(w / 2, y);
                    ctx.scale(scale, scale);

                    ctx.shadowColor = 'rgba(255, 200, 50, 0.8)';
                    ctx.shadowBlur = 30 * bassScale;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;

                    const textGrad = ctx.createLinearGradient(0, -30, 0, 30);
                    textGrad.addColorStop(0, '#ffffff');
                    textGrad.addColorStop(1, '#ffeb3b');

                    ctx.fillStyle = textGrad;
                    ctx.font = '900 56px Inter, system-ui, sans-serif';
                    ctx.fillText(line.text, 0, 0);

                    ctx.shadowBlur = 0;
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.strokeText(line.text, 0, 0);
                    ctx.restore();
                } else {
                    ctx.save();
                    ctx.translate(w / 2, y);
                    const dist = Math.abs(offset);
                    const opacity = Math.max(0, 0.5 - dist * 0.15);
                    const blur = dist * 2;

                    ctx.filter = `blur(${blur}px)`;
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.font = '700 40px Inter, system-ui, sans-serif';
                    ctx.fillText(line.text, 0, 0);
                    ctx.restore();
                }
            }

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
            className="w-full h-full object-cover"
        />
    );
});

VisualizerCanvas.displayName = 'VisualizerCanvas';

export default VisualizerCanvas;
