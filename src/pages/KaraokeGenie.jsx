import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play, Pause, Music, AlertCircle, CheckCircle2,
    Loader2, Sparkles, ChevronRight, Upload, RefreshCw,
    Edit3, ArrowLeft, Smartphone, Monitor
} from 'lucide-react';
import VisualizerCanvas from '../components/VisualizerCanvas';
import { parseLrc, formatTime } from '../utils/lrcParser';
import { generateLrcFromAudio } from '../services/geminiService';

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// Recorder State Enums since we don't have TS enums
const RecorderState = {
    IDLE: 'idle',
    RECORDING: 'recording',
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
    const [errorMsg, setErrorMsg] = useState(null);

    // Audio Graph
    const [analyser, setAnalyser] = useState(null);

    // Refs
    const audioRef = useRef(null);
    const visualizerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
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
            if (recorderState === RecorderState.RECORDING) finishRecording();
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, [recorderState]);

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

        // Check if source already exists to avoid reconnection errors if re-initializing
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

    const startRecording = async () => {
        if (!audioRef.current || !visualizerRef.current) return;
        setRecorderState(RecorderState.RECORDING);

        try {
            const canvas = visualizerRef.current.getCanvas();
            if (!canvas) throw new Error("Canvas missing");
            if (!audioContextRef.current) initAudioSystem();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const dest = ctx.createMediaStreamDestination();
            if (sourceNodeRef.current) sourceNodeRef.current.connect(dest);

            const canvasStream = canvas.captureStream(30);
            const audioTrack = dest.stream.getAudioTracks()[0];
            if (audioTrack) canvasStream.addTrack(audioTrack);

            const recorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm;codecs=vp9' });
            const chunks = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `karaoke_genie_${Date.now()}.webm`;
                a.click();
                setRecorderState(RecorderState.COMPLETED);
                setTimeout(() => setRecorderState(RecorderState.IDLE), 3000);
            };

            mediaRecorderRef.current = recorder;
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
            recorder.start();
            audioRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            setErrorMsg("Recording Error: " + err.message);
            setRecorderState(RecorderState.IDLE);
        }
    };

    const finishRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            audioRef.current?.pause();
            setIsPlaying(false);
        }
    };

    // --- Render Steps ---

    const renderUpload = () => (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center mb-10 relative">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]" />
                <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-200 tracking-tighter mb-4">
                    KaraokeGenie
                </h1>
                <p className="text-slate-400 text-lg font-light tracking-wide">
                    AI-POWERED LYRIC VISUALIZER
                </p>
            </div>

            <label className="group relative cursor-pointer w-full max-w-2xl aspect-[4/1]">
                <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                <div className="absolute inset-0 bg-slate-900 border border-slate-700 group-hover:border-indigo-500/50 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300">
                    <Upload className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                        <span className="text-slate-200 font-medium text-lg">Drop your audio file</span>
                        <p className="text-slate-500 text-sm mt-1">WAV, MP3, OGG up to 25MB</p>
                    </div>
                </div>
            </label>

            {errorMsg && (
                <div className="mt-8 text-red-400 bg-red-950/30 px-4 py-2 rounded border border-red-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {errorMsg}
                </div>
            )}
        </div>
    );

    const renderProcessing = () => (
        <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto animate-in fade-in duration-500">
            <div className="w-16 h-16 mb-8 relative">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto text-indigo-400 w-6 h-6 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-8">Analyzing Track...</h2>

            <div className="w-full space-y-3">
                <StatusRow
                    icon={Music}
                    label="Transcribing Lyrics"
                    status={processingStatus.lyrics}
                />
            </div>

            {errorMsg && (
                <div className="mt-8 w-full text-red-400 bg-red-950/30 px-4 py-3 rounded border border-red-900 flex items-center justify-between gap-2">
                    <span className="text-sm">{errorMsg}</span>
                    <button onClick={() => setCurrentStep('upload')} className="text-xs bg-red-900/50 hover:bg-red-800 px-2 py-1 rounded">Try Again</button>
                </div>
            )}
        </div>
    );

    const renderStudio = () => {
        // Determine container size based on aspect ratio
        const containerClass = aspectRatio === '16:9'
            ? "aspect-video w-full max-h-full"
            : "aspect-[9/16] h-full max-h-full";

        const canvasWidth = aspectRatio === '16:9' ? 1920 : 1080;
        const canvasHeight = aspectRatio === '16:9' ? 1080 : 1920;

        return (
            <div className="flex h-screen overflow-hidden bg-slate-950">
                {/* CENTER: STAGE */}
                <div className="flex-1 flex flex-col relative z-10">
                    {/* Header */}
                    <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/30 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setCurrentStep('upload')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
                                <ArrowLeft className="w-4 h-4" /> Start Over
                            </button>
                            <div className="h-4 w-px bg-slate-800"></div>
                            <div className="flex bg-slate-800/50 rounded-lg p-0.5">
                                <button
                                    onClick={() => setAspectRatio('16:9')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${aspectRatio === '16:9' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <Monitor className="w-3 h-3" /> 16:9
                                </button>
                                <button
                                    onClick={() => setAspectRatio('9:16')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <Smartphone className="w-3 h-3" /> 9:16
                                </button>
                            </div>
                        </div>

                        <div className="font-semibold text-slate-200 text-sm tracking-wide flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            STUDIO MODE
                        </div>

                        <button
                            onClick={() => setCurrentStep('export')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-2"
                        >
                            Export <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden p-8">
                        <div className={`${containerClass} shadow-2xl ring-1 ring-slate-800 relative bg-slate-900 rounded-lg overflow-hidden transition-all duration-500`}>
                            <VisualizerCanvas
                                ref={visualizerRef}
                                lyrics={parsedLyrics}
                                currentTime={currentTime}
                                width={canvasWidth}
                                height={canvasHeight}
                                isPlaying={isPlaying}
                                analyser={analyser}
                            />
                        </div>
                    </div>

                    {/* Bottom Transport Bar */}
                    <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center px-6 gap-6">
                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 flex items-center justify-center bg-white text-black hover:scale-105 rounded-full transition-all shadow-lg shadow-white/10"
                        >
                            {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
                        </button>

                        <div className="flex-1 flex flex-col gap-2">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            <div className="relative group h-2 bg-slate-800 rounded-full cursor-pointer">
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full group-hover:bg-indigo-400 transition-colors"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
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
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="w-32 flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Volume</span>
                            <input
                                type="range" min="0" max="1" step="0.05"
                                value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="h-1 bg-slate-700 rounded-full accent-slate-300 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: LYRICS */}
                <div className="w-80 bg-slate-900/50 border-l border-slate-800 flex flex-col backdrop-blur-xl z-20">
                    <div className="p-4 border-b border-slate-800 font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Edit3 className="w-3 h-3" /> Lyrics Editor
                    </div>
                    <textarea
                        className="flex-1 bg-transparent p-4 text-sm font-mono text-slate-300 resize-none outline-none focus:bg-slate-800/50 transition-colors"
                        value={lrcContent}
                        onChange={(e) => setLrcContent(e.target.value)}
                        spellCheck={false}
                    />
                    <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                        <button
                            onClick={() => {
                                if (audioFile) startProcessing(audioFile);
                            }}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded border border-slate-700 flex items-center justify-center gap-2 transition-all"
                        >
                            <RefreshCw className="w-3 h-3" /> Regenerate Analysis
                        </button>
                    </div>
                </div>
            </div>
        )
    };

    const renderExport = () => {
        // Export logic also needs to respect Aspect Ratio for display
        const containerClass = aspectRatio === '16:9'
            ? "relative w-[80vw] aspect-video"
            : "relative h-[80vh] aspect-[9/16]";

        const canvasWidth = aspectRatio === '16:9' ? 1920 : 1080;
        const canvasHeight = aspectRatio === '16:9' ? 1080 : 1920;

        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black relative">
                <div className="absolute top-8 left-8 z-50">
                    <button onClick={() => setCurrentStep('studio')} className="text-white/50 hover:text-white flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Back to Studio
                    </button>
                </div>

                <div className={`${containerClass} bg-black shadow-2xl ring-1 ring-slate-800 rounded-lg overflow-hidden group transition-all duration-500`}>
                    <VisualizerCanvas
                        ref={visualizerRef}
                        lyrics={parsedLyrics}
                        currentTime={currentTime}
                        width={canvasWidth}
                        height={canvasHeight}
                        isPlaying={isPlaying}
                        analyser={analyser}
                    />

                    {/* Overlay Controls for Export */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-sm">
                        {recorderState === RecorderState.IDLE || recorderState === RecorderState.COMPLETED ? (
                            <button
                                onClick={startRecording}
                                className="bg-white text-black px-10 py-5 rounded-full font-bold text-xl hover:scale-110 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.3)] flex items-center gap-4"
                            >
                                <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                                START RECORDING
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 border-4 border-white/20 border-t-red-500 rounded-full animate-spin" />
                                <span className="text-white font-mono tracking-widest uppercase">Recording in progress</span>
                            </div>
                        )}
                    </div>

                    {recorderState === RecorderState.RECORDING && (
                        <div className="absolute top-8 right-8 flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded font-bold animate-pulse z-20">
                            REC
                        </div>
                    )}
                </div>

                {recorderState === RecorderState.COMPLETED && (
                    <div className="mt-8 flex items-center gap-2 text-green-400 animate-in slide-in-from-bottom-4">
                        <CheckCircle2 className="w-5 h-5" />
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
                <div className="fixed top-4 right-4 z-[100] bg-red-500 text-white px-6 py-4 rounded shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-4">
                    <AlertCircle className="w-5 h-5" />
                    {errorMsg}
                    <button onClick={() => setErrorMsg(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
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
    <div className="bg-slate-900 border border-slate-800 p-4 rounded flex items-center justify-between w-full">
        <div className="flex items-center gap-4 text-slate-300">
            <Icon className="w-5 h-5 text-indigo-400" />
            <span className="font-medium">{label}</span>
        </div>
        {status === 'loading' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
        {status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
        {status === 'idle' && <div className="w-2 h-2 bg-slate-700 rounded-full" />}
    </div>
);

export default KaraokeGenie;
