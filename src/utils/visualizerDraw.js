export const drawVisualizerFrame = (ctx, options) => {
    const {
        width,
        height,
        time, // Current audio time in seconds
        lyrics, // Array of lyric objects {time, text}
        frequencyData, // Uint8Array of frequency data (0-255)
        particles, // Array of particle objects
        bassScale = 1.0 // Pre-calculated bass scale
    } = options;

    const w = width;
    const h = height;

    // --- 1. Background Rendering ---
    // Dynamic dark gradient based on time and bass
    const hue = (time * 2) % 360;
    const lightness = 5 + (bassScale - 1) * 15;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, `hsl(${hue}, 40%, ${lightness}%)`);
    bgGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // --- 2. Particles ---
    if (particles) {
        ctx.globalCompositeOperation = 'screen';
        particles.forEach(p => {
            // Logic for UPDATING particles should happen outside pure draw, 
            // but for offline render we might just simulate 'frozen' or deterministic movement?
            // Ideally, the caller updates physics, this just draws.
            // But to match current logic where update happens in draw loop:

            // NOTE: For pure drawing statelessly, we shouldn't mutate particles here.
            // But typically 'draw' functions in games often do 'update & draw'.
            // For offline export, we'll need to update them step-by-step.

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (bassScale * 0.8 + 0.2), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 220, 150, ${p.alpha})`;
            ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
    }

    // --- 3. Vignette ---
    const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // --- 4. Spectrum ---
    if (frequencyData) {
        const bufferLength = frequencyData.length;
        const barCount = 120;
        // In offline mode, frequencyData might be different size or mapped differently.
        // Assuming frequencyData is 128 or 256 size array.

        const step = Math.floor(bufferLength / barCount) || 1;
        const barWidth = w / barCount;

        for (let i = 0; i < barCount; i++) {
            let value = 0;
            const startIndex = i * step;
            if (startIndex < bufferLength) {
                // Average the bin values
                let sum = 0;
                let count = 0;
                for (let j = 0; j < step && (startIndex + j) < bufferLength; j++) {
                    sum += frequencyData[startIndex + j];
                    count++;
                }
                value = count > 0 ? sum / count : 0;
            }

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

    // --- 5. Lyrics ---
    if (lyrics && lyrics.length > 0) {
        const activeLyricIdx = lyrics.findIndex((l, i, arr) => {
            const next = arr[i + 1];
            return time >= l.time && (!next || time < next.time);
        });

        const centerY = h / 2;
        const lineHeight = 65;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = activeLyricIdx - 2; i <= activeLyricIdx + 2; i++) {
            if (i < 0 || i >= lyrics.length) continue;
            const line = lyrics[i];
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
    }
};
