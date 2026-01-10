import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play, Pause, Music, AlertCircle, CheckCircle2,
    Loader2, Sparkles, ChevronRight, Upload, RefreshCw,
    Edit3, ArrowLeft, Smartphone, Monitor, Download, XCircle
} from 'lucide-react';
import VideoExporter from '../components/VideoExporter';
import VisualizerCanvas from '../components/VisualizerCanvas';
import { parseLrc, formatTime } from '../utils/lrcParser';
import { generateLrcFromAudio } from '../services/geminiService';
import './KaraokeGenie.css'; // Re-enabled custom CSS

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

const RecorderState = {
    IDLE: 'idle',
    EXPORTING: 'exporting',
    COMPLETED: 'completed'
};

const KaraokeGenie = () => {
    // Global Flow
    const [currentStep, setCurrentStep] = useState('upload'); // 'upload' | 'processing' | 'studio' | 'export'

    // Settings
    const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' | '9:16'

    // Audio
    const [audioSrc, setAudioSrc] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    // Data
    const [lrcContent, setLrcContent] = useState("");
    const [parsedLyrics, setParsedLyrics] = useState([]);

    // Status
    const [processingStatus, setProcessingStatus] = useState({ lyrics: 'idle' });
    const [recorderState, setRecorderState] = useState(RecorderState.IDLE);
    const [exportProgress, setExportProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);

    // Audio Graph
    const [analyser, setAnalyser] = useState(null);

    // Refs
    const audioRef = useRef(null);
    const visualizerRef = useRef(null);
    const exporterRef = useRef(null);
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);

    // --- Effects ---

    useEffect(() => {
        setParsedLyrics(parseLrc(lrcContent));
    }, [lrcContent]);

    // Sync Audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => {
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    // Volume
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);


    // --- Logic ---

    const initAudioSystem = useCallback(() => {
        if (audioContextRef.current || !audioRef.current) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;

        // Check if source already exists (handling React Strict Mode double invoke potentially)
        if (!sourceNodeRef.current) {
            const source = ctx.createMediaElementSource(audioRef.current);
            source.connect(analyserNode);
            sourceNodeRef.current = source;
        } else {
            sourceNodeRef.current.connect(analyserNode);
        }

        analyserNode.connect(ctx.destination);
        audioContextRef.current = ctx;
        setAnalyser(analyserNode);
    }, []);

    const handleAudioUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAudioFile(file);
        setAudioSrc(URL.createObjectURL(file));
        setCurrentTime(0);
        setLrcContent("");
        setCurrentStep('processing');

        await startProcessing(file);
    };

    const startProcessing = async (file) => {
        try {
            if (file.size > 25 * 1024 * 1024) {
                throw new Error("File is too large (max 25MB).");
            }

            const base64Full = await fileToBase64(file);
            const base64Data = base64Full.split(',')[1];

            // 1. Reset Status
            setProcessingStatus({ lyrics: 'loading' });

            // 2. Generate Lyrics
            const lyricsPromise = generateLrcFromAudio(base64Data, file.type);
            const [lyricsResult] = await Promise.allSettled([lyricsPromise]);

            // 3. Handle Results
            if (lyricsResult.status === 'fulfilled') {
                setLrcContent(lyricsResult.value);
                setProcessingStatus({ lyrics: 'success' });
                // Proceed to studio after short delay to show success state
                setTimeout(() => setCurrentStep('studio'), 800);
            } else {
                console.error("Lyrics failed", lyricsResult.reason);
                setLrcContent("[00:00.00] (Lyrics generation failed - please edit manually)");
                setProcessingStatus({ lyrics: 'error' });
            }

        } catch (err) {
            console.error(err);
            setErrorMsg("Processing failed: " + err.message);
            setProcessingStatus({ lyrics: 'error' });
        }
    };

    const togglePlay = async () => {
        if (!audioRef.current) return;
        if (!audioContextRef.current) initAudioSystem();
        if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();

        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const startExport = async () => {
        if (!audioFile) return;
        setRecorderState(RecorderState.EXPORTING);
        setExportProgress(0);

        try {
            const exporter = new VideoExporter(
                audioFile,
                parsedLyrics,
                aspectRatio,
                (progress) => setExportProgress(Math.round(progress))
            );

            exporterRef.current = exporter;

            const blob = await exporter.start();

            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `karaoke_genie_${Date.now()}.mp4`;
            a.click();

            setRecorderState(RecorderState.COMPLETED);
        } catch (err) {
            if (err.message === 'Cancelled') {
                setRecorderState(RecorderState.IDLE);
            } else {
                console.error(err);
                setErrorMsg("Export Failed: " + err.message);
                setRecorderState(RecorderState.IDLE);
            }
        }
    };

    const cancelExport = () => {
        if (exporterRef.current) {
            exporterRef.current.cancel();
            exporterRef.current = null;
        }
        setRecorderState(RecorderState.IDLE);
    };

    // --- Render Steps ---

    const renderUpload = () => (
        <div className="kg-layout kg-animate-zoom">
            <div className="kg-upload-header">
                <div className="kg-glow-bg" />
                <h1 className="kg-title">
                    KaraokeGenie
                </h1>
                <p className="kg-subtitle">
                    AI-POWERED LYRIC VISUALIZER
                </p>
            </div>

            <label className="kg-dropzone">
                <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" style={{ display: 'none' }} />
                <div className="kg-dropzone-bg">
                    <Upload className="kg-drop-icon" />
                    <div className="text-center">
                        <span className="kg-drop-text">Drop your audio file</span>
                        <p className="kg-drop-subtext">WAV, MP3, OGG up to 25MB</p>
                    </div>
                </div>
            </label>

            {errorMsg && (
                <div className="kg-error-toast" style={{ position: 'relative', marginTop: '2rem', top: 'auto', right: 'auto' }}>
                    <AlertCircle className="kg-icon-sm" /> {errorMsg}
                </div>
            )}
        </div>
    );

    const renderProcessing = () => (
        <div className="kg-layout kg-animate-fade">
            <div className="kg-spinner-container">
                <div className="kg-spinner-bg" />
                <div className="kg-spinner-active" />
                <Sparkles className="kg-spinner-icon" />
            </div>

            <h2 className="text-2xl font-bold mb-8" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Analyzing Track...</h2>

            <div className="kg-status-list" style={{ maxWidth: '400px' }}>
                <StatusRow
                    icon={Music}
                    label="Transcribing Lyrics"
                    status={processingStatus.lyrics}
                />
            </div>

            {errorMsg && (
                <div className="kg-status-row" style={{ marginTop: '2rem', borderColor: 'var(--kg-danger)' }}>
                    <div style={{ color: 'var(--kg-danger)', fontSize: '0.875rem' }}>{errorMsg}</div>
                    <button onClick={() => setCurrentStep('upload')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--kg-danger)', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Try Again</button>
                </div>
            )}
        </div>
    );

    const renderStudio = () => {
        return (
            <div className="kg-studio-container">
                {/* CENTER: STAGE */}
                <div className="kg-main-stage">
                    {/* Header */}
                    <div className="kg-toolbar">
                        <div className="kg-toolbar-left">
                            <button onClick={() => setCurrentStep('upload')} className="kg-btn-text">
                                <ArrowLeft className="kg-icon-sm" /> Start Over
                            </button>
                            <div style={{ height: '1rem', width: '1px', background: 'var(--kg-border)' }}></div>
                            <div className="kg-toggle-group">
                                <button
                                    onClick={() => setAspectRatio('16:9')}
                                    className={`kg-toggle-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                                >
                                    <Monitor className="kg-icon-sm" /> 16:9
                                </button>
                                <button
                                    onClick={() => setAspectRatio('9:16')}
                                    className={`kg-toggle-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
                                >
                                    <Smartphone className="kg-icon-sm" /> 9:16
                                </button>
                            </div>
                        </div>

                        <div className="kg-mode-badge">
                            <span className="kg-dot"></span>
                            STUDIO MODE
                        </div>

                        <button
                            onClick={() => setCurrentStep('export')}
                            className="kg-btn-primary"
                        >
                            Export <ChevronRight className="kg-icon-sm" />
                        </button>
                    </div>

                    {/* Canvas Area */}
                    <div className="kg-canvas-wrapper">
                        <div className={`kg-canvas-container ${aspectRatio === '16:9' ? 'aspect-16-9' : 'aspect-9-16'}`}>
                            <VisualizerCanvas
                                ref={visualizerRef}
                                lyrics={parsedLyrics}
                                currentTime={currentTime}
                                width={aspectRatio === '16:9' ? 1920 : 1080}
                                height={aspectRatio === '16:9' ? 1080 : 1920}
                                isPlaying={isPlaying}
                                analyser={analyser}
                            />
                        </div>
                    </div>

                    {/* Bottom Transport Bar */}
                    <div className="kg-transport">
                        <button
                            onClick={togglePlay}
                            className="kg-play-btn"
                        >
                            {isPlaying ? <Pause className="kg-icon" /> : <Play className="kg-icon" style={{ marginLeft: '2px' }} />}
                        </button>

                        <div className="kg-timeline-control">
                            <div className="kg-time-labels">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            <div className="kg-slider-track">
                                <div
                                    className="kg-slider-fill"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={(e) => {
                                        const t = parseFloat(e.target.value);
                                        if (audioRef.current) audioRef.current.currentTime = t;
                                        setCurrentTime(t);
                                    }}
                                    className="kg-slider-input"
                                />
                            </div>
                        </div>

                        <div className="kg-volume-control">
                            <span className="kg-label-mini">Volume</span>
                            <input
                                type="range" min="0" max="1" step="0.05"
                                value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="kg-range-mini"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: LYRICS */}
                <div className="kg-sidebar">
                    <div className="kg-sidebar-header">
                        <Edit3 className="kg-icon-sm" /> Lyrics Editor
                    </div>
                    <textarea
                        className="kg-lyrics-area"
                        value={lrcContent}
                        onChange={(e) => setLrcContent(e.target.value)}
                        spellCheck={false}
                    />
                    <div className="kg-sidebar-footer">
                        <button
                            onClick={() => {
                                if (audioFile) startProcessing(audioFile);
                            }}
                            className="kg-btn-secondary"
                        >
                            <RefreshCw className="kg-icon-sm" /> Regenerate Analysis
                        </button>
                    </div>
                </div>
            </div>
        )
    };

    const renderExport = () => {
        return (
            <div className="kg-full-screen" style={{ justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <button onClick={() => setCurrentStep('studio')} className="kg-back-btn-float">
                    <ArrowLeft className="kg-icon" /> Back to Studio
                </button>

                <div className={`kg-canvas-container ${aspectRatio === '16:9' ? 'aspect-16-9' : 'aspect-9-16'}`} style={aspectRatio === '9:16' ? { maxHeight: '80vh' } : { maxWidth: '80vw' }}>
                    <VisualizerCanvas
                        ref={visualizerRef}
                        lyrics={parsedLyrics}
                        currentTime={currentTime}
                        width={aspectRatio === '16:9' ? 1920 : 1080}
                        height={aspectRatio === '16:9' ? 1080 : 1920}
                        isPlaying={isPlaying}
                        analyser={analyser}
                    />

                    {/* Overlay Controls for Export */}
                    <div className="kg-export-overlay" style={{ padding: '2rem' }}>
                        {recorderState === RecorderState.IDLE || recorderState === RecorderState.COMPLETED ? (
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={startExport}
                                    className="kg-btn-record"
                                    style={{ background: 'var(--kg-primary)', color: 'white' }}
                                >
                                    <Download className="kg-icon-sm" />
                                    EXPORT MP4 VIDEO
                                </button>
                                {recorderState === RecorderState.COMPLETED && (
                                    <button
                                        onClick={() => setRecorderState(RecorderState.IDLE)}
                                        className="kg-btn-text"
                                        style={{ marginTop: '1rem', color: '#94a3b8' }}
                                    >
                                        Create New Export
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '300px' }}>
                                <div className="kg-spinner-container">
                                    <div className="kg-spinner-active" style={{ borderColor: 'white', borderTopColor: 'var(--kg-primary)' }} />
                                </div>
                                <span style={{ color: 'white', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Rendering Video... {exportProgress}%
                                </span>
                                {/* Progress Bar */}
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginTop: '0.5rem' }}>
                                    <div style={{ width: `${exportProgress}%`, height: '100%', background: 'var(--kg-primary)', borderRadius: '2px', transition: 'width 0.2s' }} />
                                </div>

                                <button
                                    onClick={cancelExport}
                                    style={{
                                        marginTop: '1rem',
                                        background: 'rgba(239,68,68,0.2)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <XCircle size={16} /> Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {recorderState === RecorderState.COMPLETED && (
                    <div className="kg-success-msg">
                        <CheckCircle2 className="kg-icon" />
                        <span>Video saved successfully</span>
                    </div>
                )}
            </div>
        )
    };

    return (
        <>
            <audio ref={audioRef} src={audioSrc || undefined} crossOrigin="anonymous" />

            {errorMsg && currentStep !== 'processing' && currentStep !== 'upload' && (
                <div className="kg-error-toast">
                    <AlertCircle className="kg-icon" />
                    {errorMsg}
                    <button onClick={() => setErrorMsg(null)} style={{ marginLeft: '0.5rem', background: 'transparent', border: 'none', color: 'white', opacity: 0.7, cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {currentStep === 'upload' && renderUpload()}
            {currentStep === 'processing' && renderProcessing()}
            {currentStep === 'studio' && renderStudio()}
            {currentStep === 'export' && renderExport()}
        </>
    );
};

// Sub-component for Processing UI
const StatusRow = ({ icon: Icon, label, status }) => (
    <div className="kg-status-row">
        <div className="kg-status-label">
            <Icon className="kg-icon kg-icon-primary" />
            <span>{label}</span>
        </div>
        {status === 'loading' && <Loader2 className="kg-icon kg-icon-primary" style={{ animation: 'kg-spin 1s linear infinite' }} />}
        {status === 'success' && <CheckCircle2 className="kg-icon" style={{ color: 'var(--kg-success)' }} />}
        {status === 'error' && <AlertCircle className="kg-icon" style={{ color: 'var(--kg-danger)' }} />}
        {status === 'idle' && <div style={{ width: '0.5rem', height: '0.5rem', background: '#334155', borderRadius: '50%' }} />}
    </div>
);

export default KaraokeGenie;
