import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource } from 'mediabunny';
import { drawVisualizerFrame } from '../utils/visualizerDraw';

export default class VideoExporter {
    constructor(audioFile, lyrics, aspectRatio, onProgress) {
        this.audioFile = audioFile;
        this.lyrics = lyrics;
        this.aspectRatio = aspectRatio === '16:9' ? { w: 1920, h: 1080 } : { w: 1080, h: 1920 };
        this.onProgress = onProgress || (() => { });
        this.abortController = new AbortController();
    }

    async start() {
        try {
            // 1. Prepare Audio
            const audioData = await this.decodeAudio(this.audioFile);

            // 2. Prepare Offline Analysis
            const frequencyTimeline = await this.generateFrequencyTimeline(audioData);

            // 3. Setup Mediabunny Output
            const output = new Output({
                // Fast Start 'in-memory' places moov atom at beginning for better streamability/compatibility
                format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
                target: new BufferTarget()
            });

            // 4. Setup Tracks
            const fps = 30;
            const duration = audioData.duration;
            const totalFrames = Math.floor(duration * fps);

            // Audio Track
            const audioSource = new AudioBufferSource({
                codec: 'aac',
                bitrate: 128_000,
            });
            output.addAudioTrack(audioSource);

            // Video Track
            const offscreenCanvas = new OffscreenCanvas(this.aspectRatio.w, this.aspectRatio.h);
            const ctx = offscreenCanvas.getContext('2d');

            const videoSource = new CanvasSource(offscreenCanvas, {
                codec: 'avc',
                bitrate: 5_000_000,
            });
            output.addVideoTrack(videoSource);

            // 5. Start Encoding
            await output.start();

            // Add Audio Data (async)
            // AudioBufferSource handles encoding logic for us
            const audioPromise = audioSource.add(audioData);

            // 6. Render Loop (Video)
            const particles = this.initParticles(this.aspectRatio.w, this.aspectRatio.h);

            for (let i = 0; i < totalFrames; i++) {
                if (this.abortController.signal.aborted) {
                    await output.cancel();
                    throw new Error("Cancelled");
                }

                const time = i / fps;

                // Frequency Data
                const dataIndex = Math.min(Math.floor(time * fps), frequencyTimeline.length - 1);
                const freqData = frequencyTimeline[dataIndex];

                // Bass Scale
                let bassScale = 1.0;
                if (freqData) {
                    let bassEnergy = 0;
                    for (let k = 0; k < 8; k++) bassEnergy += freqData[k];
                    bassEnergy /= 8;
                    bassScale = 1.0 + (bassEnergy / 255) * 0.15;
                }

                // Update Physics
                this.updateParticles(particles, this.aspectRatio.w, this.aspectRatio.h, bassScale);

                // Draw
                drawVisualizerFrame(ctx, {
                    width: this.aspectRatio.w,
                    height: this.aspectRatio.h,
                    time,
                    lyrics: this.lyrics,
                    frequencyData: freqData,
                    particles,
                    bassScale
                });

                // Add Frame
                // timestamp, duration, encodeOptions
                await videoSource.add(time, 1 / fps, { keyFrame: i % fps === 0 });

                // Progress
                if (i % 15 === 0) this.onProgress((i / totalFrames) * 100);
            }

            // Ensure audio is finished
            await audioPromise;

            // Finalize
            await output.finalize();

            const { buffer } = output.target;
            return new Blob([buffer], { type: 'video/mp4' });

        } catch (e) {
            console.error("Export Failed", e);
            throw e;
        }
    }

    cancel() {
        this.abortController.abort();
    }

    async decodeAudio(file) {
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        await audioCtx.close();
        return audioBuffer;
    }

    async generateFrequencyTimeline(audioBuffer) {
        const offlineCtx = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = offlineCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;

        source.connect(analyser);
        analyser.connect(offlineCtx.destination);
        source.start(0);

        const fps = 30;
        const totalFrames = Math.floor(audioBuffer.duration * fps);
        const timeline = new Array(totalFrames);
        const suspendInterval = 1 / fps;

        for (let i = 0; i < totalFrames; i++) {
            const time = i * suspendInterval;
            offlineCtx.suspend(time).then(() => {
                const data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);
                timeline[i] = new Uint8Array(data);
            }).then(() => offlineCtx.resume());
        }

        await offlineCtx.startRendering();
        return timeline;
    }

    initParticles(w, h) {
        const particles = [];
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -(Math.random() * 0.5 + 0.2),
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.5 + 0.1,
                life: Math.random() * 100
            });
        }
        return particles;
    }

    updateParticles(particles, w, h, bassScale) {
        particles.forEach(p => {
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
    }
}
