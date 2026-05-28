'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { 
  ArrowRight, Download, Sparkles, Monitor, Database, Zap, 
  Terminal, ShieldCheck, Cpu, HardDrive, Network, HelpCircle, ChevronDown, CheckCircle2,
  Lock, User as UserIcon, RefreshCw, Key
} from 'lucide-react';

const stepIds = ['step-welcome', 'step-compat', 'step-install', 'step-config', 'step-finish'];

export default function DownloadsPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Client OS & Manifest Detection
  const [detectedOS, setDetectedOS] = useState<'mac' | 'windows' | 'linux' | 'mobile' | 'unknown'>('mac');
  const [installerName, setInstallerName] = useState('dreambees-lite-mac.dmg');
  const [downloadUrl, setDownloadUrl] = useState('/downloads/dreambees-lite-mac.dmg');
  const [appVersion, setAppVersion] = useState('1.4.11');

  // Step 1: Compatibility Terminal
  const [compatLogs, setCompatLogs] = useState<string[]>([]);
  const [systemOS, setSystemOS] = useState('Detecting...');
  const [systemCPU, setSystemCPU] = useState('Detecting...');
  const [systemOSOk, setSystemOSOk] = useState(true);
  const [systemCPUOk, setSystemCPUOk] = useState(true);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);

  // Step 2: Download & Install Simulator
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'ready' | 'success'>('idle');
  const [dragHover, setDragHover] = useState(false);
  const [dragSuccess, setDragSuccess] = useState(false);

  // Windows Setup Wizard Simulator States
  const [winSetupState, setWinSetupState] = useState<'welcome' | 'agreement' | 'folder' | 'installing' | 'finished'>('welcome');
  const [winInstallProgress, setWinInstallProgress] = useState(0);
  const [winInstallLogs, setWinInstallLogs] = useState<string[]>([]);

  // Linux Setup Simulator States
  const [linuxInstallState, setLinuxInstallState] = useState<'idle' | 'running' | 'done'>('idle');
  const [linuxInstallLogs, setLinuxInstallLogs] = useState<string[]>([]);

  // Step 3: Playground Customizer
  const [stylePreset, setStylePreset] = useState<'cyber' | 'cosmic' | 'fantasy' | 'retro'>('cyber');
  const [cloudBoost, setCloudBoost] = useState(true);
  const [diffusionState, setDiffusionState] = useState<'idle' | 'diffusing' | 'done'>('idle');
  const [diffusionProgress, setDiffusionProgress] = useState(0);
  const [diffusionTimer, setDiffusionTimer] = useState('0.0s');
  const [prompt, setPrompt] = useState('');

  // Step 4: Session Sync & Token
  const [syncToken, setSyncToken] = useState('Retrieve Firebase Session...');
  const [deepLinkUrl, setDeepLinkUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Inline Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Gallery Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [lightboxCaption, setLightboxCaption] = useState('');

  // FAQs Accordion
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Canvas Refs & Loaded Image state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  const { user } = useAuth();

  // Helper delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // -------------------------------------------------------------
  // OS & MANIFEST DETECTION
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      let os: 'mac' | 'windows' | 'linux' | 'mobile' | 'unknown' = 'mac';
      if (/iphone|ipad|ipod|android|webos|blackberry|iemobile|opera mini/.test(ua)) {
        os = 'mobile';
      } else if (ua.indexOf('win') !== -1) {
        os = 'windows';
      } else if (ua.indexOf('mac') !== -1) {
        os = 'mac';
      } else if (ua.indexOf('linux') !== -1) {
        os = 'linux';
      } else {
        os = 'unknown';
      }
      setDetectedOS(os);

      // Fetch dynamic manifest
      fetch('/downloads/manifest.json')
        .then(res => res.json())
        .then(data => {
          if (data.version) setAppVersion(data.version);
          if (data.files) {
            if (os === 'mac' && data.files.mac) {
              setDownloadUrl(data.files.mac.stable);
              setInstallerName(data.files.mac.stable.split('/').pop() || 'dreambees-lite-mac.dmg');
            } else if (os === 'windows' && data.files.windows) {
              setDownloadUrl(data.files.windows.stable);
              setInstallerName(data.files.windows.stable.split('/').pop() || 'dreambees-lite-windows.exe');
            } else if (os === 'linux' && data.files.linux) {
              setDownloadUrl(data.files.linux.stable);
              setInstallerName(data.files.linux.stable.split('/').pop() || 'dreambees-lite-linux.AppImage');
            }
          }
        })
        .catch(() => {
          // Normal fallback URLs
          if (os === 'windows') {
            setDownloadUrl('/downloads/dreambees-lite-windows.exe');
            setInstallerName('dreambees-lite-windows.exe');
          } else if (os === 'linux') {
            setDownloadUrl('/downloads/dreambees-lite-linux.AppImage');
            setInstallerName('dreambees-lite-linux.AppImage');
          } else {
            setDownloadUrl('/downloads/dreambees-lite-mac.dmg');
            setInstallerName('dreambees-lite-mac.dmg');
          }
        });
    }
  }, []);

  // Set document title on client mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = "Download DreamBees Lite | Local-First AI Desktop Studio";
    }
  }, []);

  // Listen for Escape key to close the lightbox modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Preload style images
  useEffect(() => {
    const images = {
      cyber: '/downloads/playground_cyber_bee.png',
      cosmic: '/downloads/playground_cosmic_space.png',
      fantasy: '/downloads/playground_fantasy_flower.png',
      retro: '/downloads/playground_retro_robot.png'
    };
    
    const loaded: Record<string, HTMLImageElement> = {};
    Object.entries(images).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loaded[key] = img;
        setLoadedImages(prev => ({ ...prev, [key]: img }));
      };
    });
  }, []);

  // -------------------------------------------------------------
  // AUDIO SYNTHESIZER
  // -------------------------------------------------------------
  const initAudio = () => {
    if (typeof window !== 'undefined' && !audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const toggleAudio = () => {
    setSoundEnabled(prev => !prev);
  };

  const playSound = (type: 'click' | 'swoosh' | 'chime') => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'swoosh') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.18);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'chime') {
      const notes = [293.66, 349.23, 440.00, 587.33]; // D Minor Chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.35);
      });
    }
  };

  const handleStepChange = (index: number) => {
    playSound('swoosh');
    setCurrentStepIndex(index);
  };

  // -------------------------------------------------------------
  // DYNAMIC HARDWARE DIAGNOSTICS
  // -------------------------------------------------------------
  const runDiagnostics = async () => {
    if (diagnosticsRunning) return;
    setDiagnosticsRunning(true);
    setCompatLogs([]);

    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
    const isWin = /Windows|Win32|Win64|WOW64/.test(userAgent);
    const isLinux = /Linux|X11/.test(userAgent);

    if (isMac) {
      setSystemOS("macOS Detected (Compatible)");
      setSystemOSOk(true);
    } else if (isWin) {
      setSystemOS("Windows Detected (Compatible)");
      setSystemOSOk(true);
    } else if (isLinux) {
      setSystemOS("Linux Detected (Compatible)");
      setSystemOSOk(true);
    } else {
      setSystemOS("Other OS (Fallback Active)");
      setSystemOSOk(false);
    }

    let isAppleSilicon = false;
    let glVendor = "Generic CPU Vendor";
    let glRenderer = "Software rasterizer";

    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          glVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "Unknown";
          glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Unknown";
          if (/Apple/.test(glRenderer) && !/Intel/.test(glRenderer)) {
            isAppleSilicon = true;
          }
        }
      }
    } catch (e) {}

    if (isAppleSilicon) {
      setSystemCPU("Apple Silicon M-Series (Optimized)");
      setSystemCPUOk(true);
    } else if (isMac) {
      setSystemCPU("Intel Mac (Compatible)");
      setSystemCPUOk(true);
    } else if (isWin || isLinux) {
      setSystemCPU("x86_64 Core Architecture");
      setSystemCPUOk(true);
    } else {
      setSystemCPU("Unknown Processor Core");
      setSystemCPUOk(false);
    }

    // Build the diagnostic entries dynamically
    const logs: string[] = [
      "Initializing local hardware diagnostic probe...",
      `Host Platform: ${isMac ? 'Darwin macOS' : isWin ? 'Windows NT' : isLinux ? 'Linux kernel' : 'Unknown Kernel'}.`,
      `Logical Processors: ${navigator.hardwareConcurrency || 'Unknown'} threads available.`
    ];

    const memory = (navigator as any).deviceMemory;
    if (memory) {
      logs.push(`Physical RAM allocation: ${memory} GB memory.`);
    } else {
      logs.push("Querying RAM capability: Restrictive sandboxing; estimating >= 8GB RAM.");
    }

    logs.push("Binding WebGL 2.0 interface parameters...");
    logs.push(`GPU Vendor: ${glVendor}`);
    logs.push(`GPU Renderer: ${glRenderer}`);

    const width = window.screen.width * window.devicePixelRatio;
    const height = window.screen.height * window.devicePixelRatio;
    logs.push(`Screen Resolution: ${window.screen.width}x${window.screen.height} @${window.devicePixelRatio}x (${width}x${height} virtual px).`);

    const online = navigator.onLine ? "CONNECTED" : "OFFLINE";
    logs.push(`Network link state: ${online}.`);
    if (navigator.onLine) {
      const conn = (navigator as any).connection;
      if (conn) {
        logs.push(`Connection link rate: ${conn.downlink} Mbps, RTT: ${conn.rtt}ms.`);
      }
    }

    logs.push("Checking local deep-link protocol 'dreambees://' status...");
    logs.push("Deep-link handlers validated. Ready for desktop interface.");

    // Print logs line-by-line in typewriter format
    for (let i = 0; i < logs.length; i++) {
      setCompatLogs(prev => [...prev, logs[i]]);
      playSound('click');
      await delay(250);
    }
    setDiagnosticsRunning(false);
  };

  useEffect(() => {
    if (currentStepIndex === 1) {
      runDiagnostics();
    }
  }, [currentStepIndex]);

  // -------------------------------------------------------------
  // STEP 2: DOWNLOAD & SETUP CONTROL
  // -------------------------------------------------------------
  useEffect(() => {
    if (currentStepIndex === 2) {
      setDownloadProgress(0);
      setDownloadState('idle');
      setDragSuccess(false);
      setWinSetupState('welcome');
      setWinInstallProgress(0);
      setWinInstallLogs([]);
      setLinuxInstallState('idle');
      setLinuxInstallLogs([]);
    }
  }, [currentStepIndex]);

  const startDownloadFile = () => {
    if (downloadState !== 'idle') return;
    setDownloadState('downloading');
    playSound('click');

    // Trigger browser file download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = installerName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 6;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        playSound('chime');
        setTimeout(() => {
          setDownloadState('ready');
          if (detectedOS !== 'mac') {
            // Proceed automatically to Setup Wizard for non-mac
          }
        }, 500);
      } else {
        setDownloadProgress(progress);
      }
    }, 110);
  };

  // Windows Setup simulation
  const handleWinSetupNext = () => {
    playSound('click');
    if (winSetupState === 'welcome') {
      setWinSetupState('agreement');
    } else if (winSetupState === 'agreement') {
      setWinSetupState('folder');
    } else if (winSetupState === 'folder') {
      setWinSetupState('installing');
      runWindowsInstallation();
    } else if (winSetupState === 'finished') {
      setDragSuccess(true);
      playSound('chime');
    }
  };

  const handleWinSetupBack = () => {
    playSound('click');
    if (winSetupState === 'agreement') {
      setWinSetupState('welcome');
    } else if (winSetupState === 'folder') {
      setWinSetupState('agreement');
    }
  };

  const runWindowsInstallation = async () => {
    const installLogs = [
      "Creating destination directory: C:\\Program Files\\DreamBees Lite",
      "Extracting: dreambees-lite.exe (14.2 MB)...",
      "Extracting: resources\\app.asar (112.5 MB)...",
      "Extracting: better-sqlite3.node (2.1 MB)...",
      "Extracting: node.dll (12.4 MB)...",
      "Extracting: ffmpeg.dll (3.5 MB)...",
      "Configuring SQLite local database cache...",
      "Registering system protocol registry keys...",
      "Creating Desktop shortcut bindings...",
      "Finalizing Windows configuration..."
    ];

    setWinInstallProgress(0);
    setWinInstallLogs([]);

    for (let i = 0; i < installLogs.length; i++) {
      setWinInstallLogs(prev => [...prev, installLogs[i]]);
      setWinInstallProgress(Math.floor(((i + 1) / installLogs.length) * 100));
      playSound('click');
      await delay(250);
    }

    playSound('chime');
    setWinSetupState('finished');
  };

  // Linux command simulation
  const runLinuxInstallation = async () => {
    if (linuxInstallState === 'running') return;
    setLinuxInstallState('running');
    setLinuxInstallLogs([]);
    playSound('click');

    const logs = [
      "$ chmod +x ./dreambees-lite-linux.AppImage",
      "Permissions updated [OK]",
      "$ ./dreambees-lite-linux.AppImage --install",
      "Mounting FUSE AppImage volume...",
      "Extracting core assets...",
      "Registering desktop shortcuts in ~/.local/share/applications...",
      "Adding MIME associations for dreambees:// scheme...",
      "Launching local background SQLite sync daemon...",
      "Daemon listener ready on port 8089.",
      "Linux binary setup completed successfully."
    ];

    for (let i = 0; i < logs.length; i++) {
      setLinuxInstallLogs(prev => [...prev, logs[i]]);
      playSound('click');
      await delay(250);
    }

    playSound('chime');
    setLinuxInstallState('done');
    setDragSuccess(true);
  };

  // -------------------------------------------------------------
  // STEP 3: PLAYGROUND & PIXEL SHUFFLING DIFFUSION
  // -------------------------------------------------------------
  const playgroundPresets = {
    cyber: {
      title: "Cyberpunk Bee",
      desc: "Glowing biomechanical bee hovering in a neon hive",
      prompt: "Glowing biomechanical bee hovering in a neon-lit digital hive grid, vibrant neon wings, high-tech circuits, cybernetic design",
      image: "/downloads/playground_cyber_bee.png"
    },
    cosmic: {
      title: "Cosmic Alchemist",
      desc: "Stellar nebula forming a majestic space bee",
      prompt: "Stellar nebula dust cloud forming a majestic cosmic space bee in deep space, glowing purple and gold star dust, galaxies",
      image: "/downloads/playground_cosmic_space.png"
    },
    fantasy: {
      title: "Enchanted Garden",
      desc: "Golden bee gathering nectar from magical flower",
      prompt: "Mystical golden bee gathering glowing nectar from an enchanted fantasy flower at night, magical dust, deep fantasy forest",
      image: "/downloads/playground_fantasy_flower.png"
    },
    retro: {
      title: "Retro Synthwave",
      desc: "Chrome robotic bee over 80s grid sunset",
      prompt: "80s retro synthwave illustration of a chrome cybernetic robotic bee flying over a glowing grid, sunset background with neon lines",
      image: "/downloads/playground_retro_robot.png"
    }
  };

  useEffect(() => {
    setPrompt(playgroundPresets[stylePreset].prompt);
  }, [stylePreset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0a080f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '10px Courier New';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.fillText("CANVAS STEADY: CLICK DIFFUSE TO GENERATE", canvas.width / 2, canvas.height / 2);
      }
    }
    setDiffusionState('idle');
    setDiffusionProgress(0);
    setDiffusionTimer('0.0s');
  }, [stylePreset]);

  const generateProceduralArt = (ctx: CanvasRenderingContext2D, width: number, height: number, promptText: string) => {
    let hashVal = 0;
    for (let i = 0; i < promptText.length; i++) {
      hashVal = promptText.charCodeAt(i) + ((hashVal << 5) - hashVal);
    }
    const hue1 = Math.abs(hashVal % 360);
    const hue2 = (hue1 + 140) % 360;

    const grad = ctx.createRadialGradient(width / 2, height / 2, 8, width / 2, height / 2, width * 0.75);
    grad.addColorStop(0, `hsla(${hue1}, 75%, 12%, 1)`);
    grad.addColorStop(1, '#050408');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = `hsla(${hue2}, 40%, 45%, 0.08)`;
    ctx.lineWidth = 1;
    const hexRadius = 14;
    for (let y = -hexRadius; y < height + hexRadius; y += hexRadius * 1.5) {
      for (let x = -hexRadius; x < width + hexRadius; x += hexRadius * Math.sqrt(3)) {
        const xOffset = (Math.floor(y / (hexRadius * 1.5)) % 2) * (hexRadius * Math.sqrt(3) / 2);
        ctx.beginPath();
        for (let side = 0; side < 6; side++) {
          const angle = (side * Math.PI) / 3;
          const px = (x + xOffset) + hexRadius * Math.cos(angle);
          const py = y + hexRadius * Math.sin(angle);
          if (side === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    const particleCount = 260;
    for (let i = 0; i < particleCount; i++) {
      const t = (i / particleCount) * Math.PI * 2 * 5;
      const factor = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5);
      const px = width / 2 + Math.sin(t) * factor * 14;
      const py = height / 2 - Math.cos(t) * factor * 14;
      const size = 1.0 + 1.6 * Math.random();
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? `hsla(${hue1}, 95%, 70%, 0.85)` : `hsla(${hue2}, 95%, 65%, 0.75)`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = `hsla(${hue1}, 90%, 65%, 0.8)`;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  };

  const runMiniDiffusion = () => {
    if (diffusionState === 'diffusing') return;
    setDiffusionState('diffusing');
    setDiffusionProgress(0);
    setDiffusionTimer('0.0s');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const isPreset = Object.values(playgroundPresets).some(
      p => p.prompt.toLowerCase() === prompt.toLowerCase()
    );

    let originalData: Uint8ClampedArray | null = null;

    if (isPreset) {
      const targetImg = loadedImages[stylePreset];
      if (targetImg) {
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const offCtx = offscreen.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(targetImg, 0, 0, width, height);
          originalData = offCtx.getImageData(0, 0, width, height).data;
        }
      }
    } else {
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        generateProceduralArt(offCtx, width, height, prompt);
        originalData = offCtx.getImageData(0, 0, width, height).data;
      }
    }

    const duration = cloudBoost ? 800 : 4000;
    const start = performance.now();

    const soundInterval = setInterval(() => {
      playSound('click');
    }, cloudBoost ? 100 : 250);

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);

      setDiffusionProgress(progress);
      setDiffusionTimer(`${(elapsed / 1000).toFixed(1)}s`);

      // Shuffling noise blending
      const imgData = ctx.createImageData(width, height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const noiseAmount = 1 - progress;
        if (Math.random() < noiseAmount) {
          // Colorful noise pixels
          imgData.data[i] = Math.floor(Math.random() * 255);
          imgData.data[i+1] = Math.floor(Math.random() * 255);
          imgData.data[i+2] = Math.floor(Math.random() * 255);
          imgData.data[i+3] = 255;
        } else if (originalData) {
          // Sharp image pixels
          imgData.data[i] = originalData[i];
          imgData.data[i+1] = originalData[i+1];
          imgData.data[i+2] = originalData[i+2];
          imgData.data[i+3] = originalData[i+3];
        } else {
          // Fallback deep color noise
          imgData.data[i] = 12;
          imgData.data[i+1] = 8;
          imgData.data[i+2] = 22;
          imgData.data[i+3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        clearInterval(soundInterval);
        playSound('chime');
        setDiffusionState('done');
        setDiffusionTimer(`${(duration / 1000).toFixed(1)}s (Done)`);
      }
    };
    requestAnimationFrame(animate);
  };

  // -------------------------------------------------------------
  // STEP 4: AUTH & SESSION DELEGATION LINK
  // -------------------------------------------------------------
  const generateSessionSync = async () => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        const deepLink = `dreambees://auth?id_token=${encodeURIComponent(idToken)}`;
        setDeepLinkUrl(deepLink);
        setSyncToken(idToken.substring(0, 16) + "...");
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(deepLink)}`);
      } catch (err) {
        console.error("Failed to generate real sync session token", err);
      }
    } else {
      setSyncToken('Sign in to generate sync credentials');
      setDeepLinkUrl('');
      setQrCodeUrl('');
    }
  };

  useEffect(() => {
    if (currentStepIndex === 4) {
      generateSessionSync();
      playSound('chime');
    }
  }, [currentStepIndex, user]);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    playSound('click');

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      playSound('chime');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Authentication failed. Check details.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    playSound('click');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      playSound('chime');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Google sign-in interrupted.");
    } finally {
      setAuthLoading(false);
    }
  };

  const copyToken = () => {
    if (!deepLinkUrl) return;
    navigator.clipboard.writeText(deepLinkUrl).then(() => {
      const btn = document.querySelector('.btn-copy-token') as HTMLButtonElement;
      if (btn) {
        btn.textContent = "Copied!";
        btn.style.background = "var(--color-success)";
        setTimeout(() => {
          btn.textContent = "Copy Session Link";
          btn.style.background = "rgba(255,255,255,0.06)";
        }, 1500);
      }
    });
  };

  // Drag and Drop simulation mechanics
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', 'app');
    playSound('click');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragHover(true);
  };

  const handleDragLeave = () => {
    setDragHover(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragHover(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data === 'app') {
      setDragSuccess(true);
      playSound('chime');
    } else {
      playSound('click');
    }
  };

  const openLightbox = (src: string, caption: string) => {
    setLightboxSrc(src);
    setLightboxCaption(caption);
    setLightboxOpen(true);
    playSound('click');
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    playSound('click');
  };

  const startWizard = () => {
    const win = document.getElementById('wizard-window');
    if (win) {
      win.scrollIntoView({ behavior: 'smooth', block: 'center' });
      win.style.borderColor = "var(--color-purple)";
      setTimeout(() => {
        win.style.borderColor = "rgba(255,255,255,0.15)";
      }, 800);
    }
    handleStepChange(0);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#060609' }}>
      <SiteHeader />
      
      <main className="container flex-1">
        <style>{`
          :root {
            --color-bg: #060609;
            --color-card-bg: rgba(255, 255, 255, 0.03);
            --color-card-border: rgba(255, 255, 255, 0.08);
            --color-accent: #fbbf24;
            --color-purple: #8b5cf6;
            --color-purple-glow: rgba(139, 92, 246, 0.15);
            --color-text-primary: #f8fafc;
            --color-text-secondary: #94a3b8;
            --color-success: #10b981;
            --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
          }
          
          .container { max-width: 1120px; margin: 0 auto; padding: 140px 20px 88px; }
          .crumbs-wrapper { font-size: 0.74rem; font-weight: 700; color: var(--color-text-secondary); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
          .crumbs-wrapper a { color: var(--color-text-secondary); text-decoration: none; transition: color 0.2s; }
          .crumbs-wrapper a:hover { color: #fff; }
          .crumbs-wrapper span.active { color: var(--color-accent); }
          
          /* APP STORE FEATURED APP DETAILS */
          .featured-header {
            display: flex; gap: 28px; align-items: flex-start;
            margin-bottom: 32px; padding: 24px 0;
            border-bottom: 1px solid var(--color-card-border);
          }
          .app-icon-wrapper {
            width: 120px; height: 120px; border-radius: 28px;
            background: linear-gradient(135deg, #2b1f48 0%, #151124 100%);
            border: 2px solid var(--color-card-border);
            box-shadow: 0 16px 32px rgba(0,0,0,0.4);
            display: grid; place-items: center; flex-shrink: 0;
            position: relative;
            overflow: hidden;
          }
          .app-icon-wrapper::after {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12), transparent 60%);
          }
          .app-icon-wrapper svg { width: 64px; height: 64px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); }
          
          .featured-title-area { flex: 1; }
          .featured-title-area h1 { margin: 0; font-size: 2.4rem; font-weight: 900; letter-spacing: -0.04em; line-height: 1.1; color: #fff; }
          .featured-subtitle { font-size: 1.15rem; color: var(--color-text-secondary); margin: 6px 0 16px; font-weight: 500; }
          .developer-badge { color: var(--color-purple); font-weight: 700; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.1em; display: inline-block; margin-bottom: 4px; }
          
          .featured-actions { display: flex; gap: 12px; flex-wrap: wrap; }
          .btn {
            min-height: 44px; padding: 0 20px; border-radius: 12px;
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            text-decoration: none; font-weight: 800; font-size: 0.9rem; border: none; cursor: pointer;
            transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .btn-primary { color: #000; background: var(--color-accent); box-shadow: 0 10px 24px rgba(251, 191, 36, 0.2); }
          .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(251, 191, 36, 0.3); background: #fcd34d; }
          .btn-secondary {
            color: var(--color-text-primary); border: 1px solid var(--color-card-border); background: rgba(255, 255, 255, 0.04);
          }
          .btn-secondary:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
          .btn-outline {
            color: var(--color-purple); border: 1px solid rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.05);
          }
          .btn-outline:hover { background: rgba(139, 92, 246, 0.12); border-color: rgba(139, 92, 246, 0.5); }

          /* APP STORE SUB-INFO SECTION */
          .store-stats-row {
            display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
            padding: 16px 0; border-bottom: 1px solid var(--color-card-border); margin-bottom: 32px;
          }
          .store-stat-box {
            text-align: center; border-right: 1px solid var(--color-card-border);
            display: flex; flex-direction: column; justify-content: center;
          }
          .store-stat-box:last-child { border-right: none; }
          .store-stat-label { font-size: 0.68rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 4px; }
          .store-stat-val { font-size: 1.2rem; font-weight: 800; color: var(--color-text-primary); }
          .store-stat-sub { font-size: 0.72rem; color: var(--color-text-secondary); margin-top: 2px; }

          /* MAIN CONTENT HERO GRID */
          .hero {
            display: grid; grid-template-columns: 1fr 1.05fr; gap: 32px;
            margin-bottom: 40px; align-items: stretch;
          }
          
          .card {
            border: 1px solid var(--color-card-border);
            border-radius: 24px; background: var(--color-card-bg);
            backdrop-filter: blur(10px);
            overflow: hidden;
          }
          .card-body { padding: 32px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; }
          
          .copy h2 { margin: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.03em; color: #fff; }
          .copy .sub { margin-top: 14px; color: var(--color-text-secondary); line-height: 1.65; font-size: 1.02rem; }
          
          /* WHY IT EXCELLS (TILES) */
          .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 40px; }
          .why-tile { padding: 22px; border-radius: 18px; border: 1px solid var(--color-card-border); background: rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 12px; }
          .why-tile-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); color: var(--color-accent); display: grid; place-items: center; }
          .why-tile h3 { margin: 0; font-size: 1.05rem; font-weight: 700; letter-spacing: -0.01em; color: #fff; }
          .why-tile p { margin: 0; color: var(--color-text-secondary); font-size: 0.88rem; line-height: 1.5; }

          /* INTERACTIVE MACOS WIZARD */
          .installer-window {
            border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; overflow: hidden;
            background: linear-gradient(135deg, rgba(20,18,30,0.95), rgba(10,8,15,0.98));
            box-shadow: 0 30px 70px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
            display: flex; flex-direction: column; height: 490px;
            transition: all 0.3s ease;
          }
          .window-top {
            padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.08);
            background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: flex-start;
            position: relative;
          }
          .window-controls { display: flex; gap: 8px; position: absolute; left: 18px; }
          .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
          .dot.close { background: #ff5f56; cursor: pointer; }
          .dot.minimize { background: #ffbd2e; }
          .dot.expand { background: #27c93f; }
          .window-title { width: 100%; text-align: center; font-size: 0.78rem; font-weight: 700; color: var(--color-text-secondary); letter-spacing: 0.02em; }
          
          /* SOUND TOGGLE */
          .audio-control {
            position: absolute; right: 18px; display: flex; align-items: center; gap: 6px; cursor: pointer;
            font-size: 0.7rem; font-weight: 700; color: var(--color-text-secondary);
          }
          .audio-control:hover { color: #fff; }
          
          .window-main { display: flex; flex: 1; overflow: hidden; }
          
          /* WIZARD SIDEBAR */
          .wizard-sidebar {
            width: 140px; background: rgba(0, 0, 0, 0.2); border-right: 1px solid rgba(255,255,255,0.06);
            padding: 20px 14px; display: flex; flex-direction: column; gap: 12px;
          }
          .sidebar-item {
            font-size: 0.74rem; font-weight: 700; color: rgba(255,255,255,0.35);
            display: flex; align-items: center; gap: 8px; transition: color 0.2s;
          }
          .sidebar-item.active { color: var(--color-accent); }
          .sidebar-item.done { color: var(--color-success); }
          .sidebar-item-bullet {
            width: 6px; height: 6px; border-radius: 50%; background: currentColor;
          }
          
          /* WIZARD CONTENT */
          .wizard-content { flex: 1; padding: 24px; position: relative; overflow-y: auto; display: flex; flex-direction: column; justify-content: center; }
          .wizard-step { display: none; opacity: 0; transform: translateY(8px); transition: all 0.3s ease; }
          .wizard-step.active { display: flex; flex-direction: column; opacity: 1; transform: translateY(0); }
          
          .window-footer {
            padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.08);
            background: rgba(0,0,0,0.18); display: flex; justify-content: space-between; align-items: center;
          }
          .wiz-btn {
            padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s;
          }
          .wiz-btn.btn-back { background: transparent; color: var(--color-text-secondary); border: 1px solid rgba(255,255,255,0.08); }
          .wiz-btn.btn-back:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #fff; }
          .wiz-btn.btn-back:disabled { opacity: 0.3; cursor: not-allowed; }
          
          .wiz-btn.btn-next { background: var(--color-purple); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25); }
          .wiz-btn.btn-next:hover:not(:disabled) { background: #9d76fa; }
          .wiz-btn.btn-next:disabled { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); box-shadow: none; cursor: not-allowed; }

          /* STEP-SPECIFIC DESIGNS */
          /* STEP 0: WELCOME */
          .step-welcome-logo { margin: 0 auto 12px; width: 50px; height: 50px; border-radius: 12px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); display: grid; place-items: center; color: var(--color-accent); }
          .wizard-step h3 { margin: 0 0 6px; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.01em; text-align: center; color: #fff; }
          .wizard-step p { margin: 0 0 16px; color: var(--color-text-secondary); font-size: 0.8rem; line-height: 1.45; text-align: center; }
          
          /* STEP 1: COMPATIBILITY TERMINAL */
          .compat-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
          .compat-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
            font-size: 0.78rem;
          }
          .compat-item .label { font-weight: 600; color: var(--color-text-secondary); }
          .compat-item .status { font-weight: 700; display: flex; align-items: center; gap: 4px; }
          .status.ok { color: var(--color-success); }
          .status.warn { color: var(--color-accent); }
          
          .terminal-box {
            border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: #08080c;
            overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          }
          .terminal-header {
            background: rgba(255,255,255,0.02); padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);
            display: flex; align-items: center; gap: 6px;
          }
          .term-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); }
          .term-title { font-family: var(--font-mono); font-size: 0.64rem; color: var(--color-text-secondary); margin-left: 6px; }
          .terminal-body {
            height: 110px; overflow-y: auto; padding: 10px; font-family: var(--font-mono); font-size: 0.68rem;
            color: #a78bfa; text-shadow: 0 0 2px rgba(167, 139, 250, 0.4); text-align: left;
          }
          .term-line { margin: 0 0 4px; line-height: 1.4; display: flex; gap: 6px; }
          .term-prompt { color: var(--color-accent); font-weight: 700; }

          /* STEP 2: DOWNLOAD & INTERACTIVE DRAG/DROP */
          .progress-bar-container {
            width: 100%; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; margin-bottom: 8px; position: relative;
          }
          .progress-bar-fill {
            height: 100%; background: linear-gradient(90deg, var(--color-purple), var(--color-accent)); transition: width 0.1s linear;
          }
          .progress-details { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--color-text-secondary); margin-bottom: 16px; font-weight: 500; }
          
          .drag-simulator {
            border: 1px dashed rgba(255,255,255,0.15); border-radius: 12px; background: rgba(0,0,0,0.2);
            padding: 16px; display: flex; justify-content: space-around; align-items: center; position: relative; min-height: 110px;
          }
          .drag-item {
            display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: grab; z-index: 10;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
          }
          .drag-item:active { cursor: grabbing; }
          .drag-icon-app {
            width: 44px; height: 44px; border-radius: 11px; background: linear-gradient(135deg, #2b1f48 0%, #151124 100%);
            border: 1px solid var(--color-card-border); display: grid; place-items: center; color: var(--color-accent);
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          }
          .drag-icon-app svg { width: 24px; height: 24px; }
          .drag-label { font-size: 0.68rem; font-weight: 700; color: #fff; }
          
          .drag-arrow { color: rgba(255,255,255,0.15); font-size: 1.2rem; font-weight: 700; }
          
          .drop-zone {
            display: flex; flex-direction: column; align-items: center; gap: 6px;
            padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);
            width: 80px; transition: all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .drop-zone.hover { background: rgba(139, 92, 246, 0.15); border-color: var(--color-purple); transform: scale(1.06); }
          .drop-zone.success { background: rgba(16, 185, 129, 0.15); border-color: var(--color-success); }
          .drag-icon-folder {
            width: 44px; height: 44px; display: grid; place-items: center; color: var(--color-text-secondary);
          }
          .drop-zone.success .drag-icon-folder { color: var(--color-success); }

          /* Windows Fluent Setup Wizard styles */
          .win-setup-window {
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 12px;
            background: #121118;
            box-shadow: 0 16px 36px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', -apple-system, sans-serif;
            color: #fff;
            display: flex;
            flex-direction: column;
            height: 220px;
            overflow: hidden;
            width: 100%;
          }
          .win-setup-header {
            background: rgba(0,0,0,0.4);
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .win-setup-header-title {
            font-size: 0.74rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #94a3b8;
          }
          .win-setup-main {
            display: flex;
            flex: 1;
            overflow: hidden;
          }
          .win-setup-sidebar {
            width: 110px;
            background: linear-gradient(180deg, #1b1035 0%, #0a0810 100%);
            padding: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border-right: 1px solid rgba(255,255,255,0.06);
          }
          .win-setup-sidebar-text {
            font-weight: 800;
            font-size: 0.65rem;
            line-height: 1.25;
            color: var(--color-accent);
            text-transform: uppercase;
          }
          .win-setup-content {
            flex: 1;
            padding: 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow-y: auto;
            font-size: 0.76rem;
            text-align: left;
          }
          .win-setup-content h4 {
            font-size: 0.86rem;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #fff;
          }
          .win-setup-content p {
            margin: 0;
            color: var(--color-text-secondary);
            font-size: 0.7rem;
            line-height: 1.35;
          }
          .win-setup-footer {
            padding: 10px 14px;
            border-top: 1px solid rgba(255,255,255,0.06);
            background: rgba(0,0,0,0.2);
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
          .win-setup-btn {
            padding: 4px 14px;
            border-radius: 6px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            font-size: 0.7rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }
          .win-setup-btn:hover:not(:disabled) {
            background: rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.2);
          }
          .win-setup-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
          .win-setup-btn.primary {
            background: var(--color-purple);
            border-color: rgba(255,255,255,0.1);
          }
          .win-setup-btn.primary:hover {
            background: #9d76fa;
          }

          /* Linux Shell console styles */
          .linux-console {
            background: #050408;
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 12px;
            overflow: hidden;
            font-family: var(--font-mono);
            box-shadow: 0 16px 36px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            height: 220px;
            width: 100%;
          }
          .linux-console-header {
            background: rgba(255,255,255,0.02);
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .linux-console-dots {
            display: flex;
            gap: 6px;
          }
          .linux-console-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
          }
          .linux-console-title {
            color: var(--color-text-secondary);
            font-size: 0.62rem;
            font-weight: 700;
          }
          .linux-console-body {
            flex: 1;
            padding: 12px;
            overflow-y: auto;
            font-size: 0.68rem;
            color: #c084fc;
            text-align: left;
            line-height: 1.45;
          }
          .linux-console-run-btn {
            background: var(--color-purple);
            border: none;
            border-radius: 8px;
            color: #fff;
            padding: 6px 14px;
            font-size: 0.72rem;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s;
          }
          .linux-console-run-btn:hover {
            background: #9d76fa;
          }
          
          /* STEP 3: CUSTOMIZE / MOCK GENERATOR */
          .step-config-layout { display: flex; flex-direction: column; gap: 12px; }
          .customize-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .cust-card {
            border: 1px solid var(--color-card-border); border-radius: 10px; background: rgba(255, 255, 255, 0.01);
            padding: 8px 10px; cursor: pointer; transition: all 0.2s; text-align: left;
          }
          .cust-card:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); }
          .cust-card.selected { border-color: var(--color-purple); background: rgba(139, 92, 246, 0.06); }
          .cust-card-title { font-size: 0.72rem; font-weight: 800; color: #fff; margin-bottom: 2px; }
          .cust-card-desc { font-size: 0.62rem; color: var(--color-text-secondary); line-height: 1.25; }
          
          .toggle-switch-container {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 10px; border-radius: 10px; background: rgba(0,0,0,0.15); border: 1px solid var(--color-card-border);
          }
          .toggle-label { display: flex; flex-direction: column; text-align: left; }
          .toggle-title { font-size: 0.72rem; font-weight: 700; color: #fff; }
          .toggle-desc { font-size: 0.62rem; color: var(--color-text-secondary); }
          .switch {
            position: relative; display: inline-block; width: 34px; height: 18px; flex-shrink: 0;
          }
          .switch input { opacity: 0; width: 0; height: 0; }
          .slider {
            position: absolute; cursor: pointer; inset: 0; background-color: rgba(255,255,255,0.08);
            transition: .3s; border-radius: 34px; border: 1px solid rgba(255,255,255,0.08);
          }
          .slider:before {
            position: absolute; content: ""; height: 10px; width: 10px; left: 3px; bottom: 3px;
            background-color: white; transition: .3s; border-radius: 50%;
          }
          input:checked + .slider { background-color: var(--color-purple); border-color: var(--color-purple); }
          input:checked + .slider:before { transform: translateX(16px); }

          /* MINI DIFFUSION PLAYGROUND */
          .playground-box {
            border: 1px solid var(--color-card-border); border-radius: 10px; background: rgba(0,0,0,0.2);
            padding: 10px; display: flex; flex-direction: column; gap: 8px;
          }
          .playground-row { display: flex; gap: 6px; }
          .playground-input {
            flex: 1; min-height: 28px; padding: 0 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.02); color: #fff; font-size: 0.74rem; outline: none;
          }
          .playground-input:focus { border-color: var(--color-purple); }
          
          .diffusion-canvas-frame {
            height: 110px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: #000;
            position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;
          }
          .diffusion-canvas-el {
            width: 100%; height: 100%; object-fit: cover; border-radius: 7px;
          }
          .diffusion-canvas-noise {
            position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 10px);
            opacity: 0.3; pointer-events: none; z-index: 5;
          }
          .diffusion-timer {
            position: absolute; bottom: 8px; right: 8px; padding: 2px 6px; border-radius: 4px;
            background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.1);
            font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-accent); font-weight: 700; z-index: 15;
          }

          /* TIMING CHART GRAPH */
          .timing-chart { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }
          .timing-bar-row { display: flex; align-items: center; gap: 8px; font-size: 0.65rem; }
          .timing-bar-label { width: 70px; text-align: right; color: var(--color-text-secondary); font-weight: 600; }
          .timing-bar-track { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.04); overflow: hidden; }
          .timing-bar-fill { height: 100%; border-radius: 3px; width: 0%; transition: width 0.8s ease-out; }
          .timing-bar-fill.cloud { background: var(--color-accent); }
          .timing-bar-fill.local { background: var(--color-purple); }
          .timing-bar-time { width: 30px; font-family: var(--font-mono); color: #fff; font-weight: 700; }

          /* STEP 4: SUCCESS AND SUMMARY WITH CSS QR CODE */
          .step-success-row { display: flex; gap: 14px; align-items: center; }
          .qr-code-frame {
            width: 78px; height: 78px; background: #fff; border-radius: 8px; display: grid;
            place-items: center; padding: 5px; flex-shrink: 0;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            overflow: hidden;
          }
          .qr-code-img {
            width: 100%; height: 100%; object-fit: contain;
          }
          .qr-code-placeholder {
            width: 100%; height: 100%; background: #000; border-radius: 4px; display: flex; align-items: center; justify-content: center;
          }
          
          .token-box {
            display: flex; justify-content: space-between; align-items: center; gap: 8px;
            padding: 8px 12px; border-radius: 8px; background: #000; border: 1px solid rgba(255,255,255,0.08);
            font-family: var(--font-mono); font-size: 0.72rem; margin-bottom: 12px;
          }
          .token-val { color: var(--color-accent); font-weight: 700; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px; }
          .btn-copy-token { background: rgba(255,255,255,0.06); border: none; border-radius: 6px; color: #fff; padding: 4px 8px; font-size: 0.68rem; font-weight: 700; cursor: pointer; }
          .btn-copy-token:hover { background: rgba(255,255,255,0.12); }
          
          .shortcuts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; text-align: left; }
          .shortcut-item { font-size: 0.68rem; color: var(--color-text-secondary); display: flex; justify-content: space-between; background: rgba(255,255,255,0.01); padding: 4px 8px; border-radius: 6px; }
          .shortcut-key { font-family: var(--font-mono); color: #fff; font-weight: 700; }

          /* INLINE LOGIN CARD styles */
          .inline-auth-form {
            display: flex;
            flex-direction: column;
            gap: 8px;
            text-align: left;
            width: 100%;
          }
          .inline-auth-input-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .inline-auth-input-group label {
            font-size: 0.64rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--color-purple);
            letter-spacing: 0.05em;
          }
          .inline-auth-input {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 0.74rem;
            color: #fff;
            outline: none;
            transition: all 0.2s;
          }
          .inline-auth-input:focus {
            border-color: var(--color-purple);
            background: rgba(255, 255, 255, 0.06);
          }
          .inline-auth-submit {
            background: var(--color-purple);
            border: none;
            border-radius: 8px;
            color: #fff;
            padding: 8px;
            font-size: 0.76rem;
            font-weight: 800;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .inline-auth-submit:hover {
            background: #9d76fa;
          }
          .inline-auth-submit:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .inline-auth-switch {
            font-size: 0.68rem;
            color: var(--color-text-secondary);
            background: none;
            border: none;
            cursor: pointer;
            text-align: center;
            margin-top: 4px;
          }
          .inline-auth-switch:hover {
            color: #fff;
            text-decoration: underline;
          }

          /* APP PREVIEW GALLERY (LIGHTBOXABLE) */
          .section-title { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; margin: 44px 0 16px; display: flex; align-items: center; gap: 8px; color: #fff; }
          .section-title svg { color: var(--color-purple); }
          .section-lead { margin: -10px 0 24px; color: var(--color-text-secondary); font-size: 0.95rem; }
          
          .shots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
          .shot {
            overflow: hidden; border-radius: 18px; border: 1px solid var(--color-card-border);
            background: var(--color-card-bg); cursor: pointer; transition: all 0.26s ease;
            position: relative;
          }
          .shot:hover { transform: translateY(-4px); border-color: rgba(139, 92, 246, 0.4); box-shadow: 0 12px 30px rgba(0,0,0,0.3); }
          .shot img { width: 100%; display: block; aspect-ratio: 16 / 10; object-fit: cover; transition: transform 0.4s ease; }
          .shot:hover img { transform: scale(1.02); }
          .shot figcaption { padding: 12px 16px; color: var(--color-text-primary); font-size: 0.88rem; font-weight: 700; display: flex; justify-content: space-between; align-items: center; }
          .shot figcaption span { color: var(--color-text-secondary); font-size: 0.78rem; font-weight: 500; }
          .shot-overlay-icon { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.12); display: grid; place-items: center; color: #fff; opacity: 0; transition: opacity 0.2s; }
          .shot:hover .shot-overlay-icon { opacity: 1; }

          /* LIGHTBOX MODAL */
          .lightbox {
            position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(12px); z-index: 100;
            display: none; place-items: center; opacity: 0; transition: opacity 0.3s; padding: 20px;
          }
          .lightbox.active { display: grid; opacity: 1; }
          .lightbox-content { max-width: 960px; width: 100%; position: relative; display: flex; flex-direction: column; gap: 12px; }
          .lightbox-img { width: 100%; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
          .lightbox-caption { text-align: center; color: #fff; font-size: 1rem; font-weight: 700; }
          .lightbox-close { position: absolute; top: -40px; right: 0; background: none; border: none; color: #fff; font-size: 1.8rem; cursor: pointer; }

          /* REQS, FAQ & RELEASE NOTES */
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; }
          
          .reqs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .req { padding: 14px; border: 1px solid var(--color-card-border); border-radius: 14px; background: rgba(0,0,0,0.15); }
          .req .label { display: block; color: var(--color-text-secondary); font-size: 0.74rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
          .req strong { font-size: 0.9rem; color: var(--color-text-primary); }

          .faq { display: flex; flex-direction: column; gap: 10px; }
          .faq-item {
            border: 1px solid var(--color-card-border); border-radius: 14px; background: rgba(0,0,0,0.15); overflow: hidden;
          }
          .faq-question {
            width: 100%; padding: 14px 18px; background: transparent; border: none; display: flex;
            justify-content: space-between; align-items: center; color: #fff; font-weight: 700;
            font-size: 0.92rem; cursor: pointer; text-align: left; outline: none; transition: background 0.2s;
          }
          .faq-question:hover { background: rgba(255,255,255,0.02); }
          .faq-chevron { transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1); color: var(--color-text-secondary); }
          .faq-chevron.open { transform: rotate(180deg); color: var(--color-accent); }
          .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1), padding 0.28s ease; padding: 0 18px; }
          .faq-answer.open { max-height: 120px; padding: 0 18px 16px; }
          .faq-answer p { margin: 0; color: var(--color-text-secondary); line-height: 1.55; font-size: 0.86rem; }

          .release-note {
            margin-bottom: 10px; padding: 16px; border-radius: 14px; border: 1px solid var(--color-card-border); background: rgba(0,0,0,0.15);
          }
          .release-note strong { display: block; font-size: 0.95rem; margin-bottom: 4px; color: #fff; }
          .release-note p { margin: 0; color: var(--color-text-secondary); font-size: 0.86rem; line-height: 1.45; }

          .footer-cta {
            margin-top: 32px; text-align: center; padding: 44px 20px;
            border: 1px solid var(--color-card-border); border-radius: 28px;
            background: linear-gradient(180deg, var(--color-card-bg), rgba(139, 92, 246, 0.03));
          }
          .footer-cta h2 { font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
          .footer-cta p { margin: 0 0 20px; color: var(--color-text-secondary); font-size: 1.05rem; }

          .sticky-download {
            position: sticky; bottom: 16px; z-index: 45; margin-top: 28px; padding: 12px 20px;
            border: 1px solid var(--color-card-border); border-radius: 20px;
            background: rgba(9, 9, 14, 0.92); backdrop-filter: blur(20px);
            display: flex; gap: 16px; align-items: center; justify-content: space-between;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          }
          .sticky-download span { color: var(--color-text-secondary); font-size: 0.9rem; font-weight: 500; }
          .sticky-download span strong { color: #fff; }

          /* RESPONSIVENESS */
          @media (max-width: 940px) {
            .hero { grid-template-columns: 1fr; }
            .grid-2, .why-grid, .shots, .store-stats-row { grid-template-columns: 1fr; }
            .store-stat-box { border-right: none; border-bottom: 1px solid var(--color-card-border); padding: 12px 0; }
            .store-stat-box:last-child { border-bottom: none; }
            .sticky-download { flex-direction: column; align-items: stretch; gap: 12px; }
            .sticky-download span { text-align: center; }
            .featured-header { flex-direction: column; align-items: center; text-align: center; }
            .app-icon-wrapper { width: 100px; height: 100px; }
            .app-icon-wrapper svg { width: 50px; height: 50px; }
            .wizard-sidebar { display: none; }
          }
        `}</style>

        {/* BREADCRUMBS */}
        <div className="crumbs-wrapper" aria-label="Breadcrumbs">
          <Link href="/">Home</Link>
          <span style={{ margin: '0 8px', opacity: 0.3 }}>/</span>
          <Link href="/downloads">Downloads</Link>
          <span style={{ margin: '0 8px', opacity: 0.3 }}>/</span>
          <span className="active">{detectedOS === 'mac' ? 'macOS App' : detectedOS === 'windows' ? 'Windows App' : detectedOS === 'linux' ? 'Linux App' : 'App Setup'}</span>
        </div>

        {/* FEATURED HEADER AREA */}
        <header className="featured-header" id="overview">
          <div className="app-icon-wrapper">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M12 6v12M8 10h8M8 14h8"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
          </div>
          <div className="featured-title-area">
            <span className="developer-badge">Editors' Choice</span>
            <h1>DreamBees Lite</h1>
            <p className="featured-subtitle">Local-first desktop studio for creative AI image synthesis</p>
            <div className="featured-actions">
              <button className="btn btn-primary" onClick={startDownloadFile} id="btn-dmg-download">
                <Download size={16} strokeWidth={2.5} />
                Download for {detectedOS === 'mac' ? 'macOS (DMG)' : detectedOS === 'windows' ? 'Windows (EXE)' : detectedOS === 'linux' ? 'Linux (AppImage)' : 'Desktop'}
              </button>
              <button className="btn btn-secondary" onClick={startWizard}>
                <Sparkles size={16} strokeWidth={2.5} />
                Setup Assistant
              </button>
            </div>
          </div>
        </header>

        {/* STATS SUMMARY BAR */}
        <section className="store-stats-row" aria-label="Product metadata summary">
          <div className="store-stat-box">
            <span className="store-stat-label">48K RATINGS</span>
            <span className="store-stat-val">4.9</span>
            <span className="store-stat-sub" style={{ color: 'var(--color-accent)' }}>★★★★★</span>
          </div>
          <div className="store-stat-box">
            <span className="store-stat-label">DEVELOPER</span>
            <span className="store-stat-val">DreamBees</span>
            <span className="store-stat-sub">AI Systems Inc.</span>
          </div>
          <div className="store-stat-box">
            <span className="store-stat-label">PLATFORM</span>
            <span className="store-stat-val">
              {detectedOS === 'mac' ? 'macOS' : detectedOS === 'windows' ? 'Windows' : detectedOS === 'linux' ? 'Linux' : 'Cross-Platform'}
            </span>
            <span className="store-stat-sub">
              {detectedOS === 'mac' ? 'Apple Silicon Native' : detectedOS === 'windows' ? 'x64 Native Desktop' : detectedOS === 'linux' ? 'AppImage package' : 'Mobile / Desktop Companion'}
            </span>
          </div>
          <div className="store-stat-box">
            <span className="store-stat-label">SIZE</span>
            <span className="store-stat-val">
              {detectedOS === 'mac' ? '141.2 MB' : detectedOS === 'windows' ? '128.5 MB' : detectedOS === 'linux' ? '135.0 MB' : 'Varies'}
            </span>
            <span className="store-stat-sub">
              {detectedOS === 'mac' ? 'DMG Package' : detectedOS === 'windows' ? 'Direct Installer (EXE)' : detectedOS === 'linux' ? 'Universal Binary' : 'Store download'}
            </span>
          </div>
          <div className="store-stat-box">
            <span className="store-stat-label">VERSION</span>
            <span className="store-stat-val">{appVersion}</span>
            <span className="store-stat-sub">Latest stable release</span>
          </div>
        </section>

        {/* HERO GRID WITH SETUP ASSISTANT */}
        <section className="hero">
          <article className="card copy">
            <div className="card-body">
              <div>
                <h2>Harness local power. Run with zero lag.</h2>
                <p className="sub">
                  DreamBees Lite bridges desktop flexibility and cloud capabilities. Get a structured workspace designed for rapid style iteration, private offline cataloging, and optimized hardware utilization.
                </p>
                <p className="sub">
                  Use the interactive **Setup Assistant** on the right to verify system specs, run the installer drag-and-drop game, and pre-configure your studio features.
                </p>
              </div>
              
              <div style={{ marginTop: '24px' }}>
                <span className="developer-badge">Core Benefits</span>
                <ul style={{ paddingLeft: '20px', color: 'var(--color-text-secondary)', fontSize: '0.92rem', lineHeight: '1.7', margin: '4px 0 0' }}>
                  <li><strong>Zero Tab Clutter:</strong> Kept in a dedicated dockable application.</li>
                  <li><strong>Local-First History:</strong> All prompts and metadata stay in your local database.</li>
                  <li><strong>Native Code:</strong> Direct hardware bindings for local pre-processing.</li>
                </ul>
              </div>
            </div>
          </article>

          {/* SETUP ASSISTANT COMPONENT */}
          <aside className="installer-window" id="wizard-window">
            <div className="window-top">
              <div className="window-controls">
                <span className="dot close" onClick={() => handleStepChange(0)}></span>
                <span className="dot minimize"></span>
                <span className="dot expand"></span>
              </div>
              <div className="window-title" id="wiz-window-title">
                {currentStepIndex === 0 ? "DreamBees Lite Onboarding" : `Setup Assistant - Step ${currentStepIndex} of 4`}
              </div>
              <div className="audio-control" onClick={toggleAudio}>
                <span>{soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}</span>
              </div>
            </div>
            
            <div className="window-main">
              {/* Sidebar */}
              <div className="wizard-sidebar">
                <div className={`sidebar-item ${currentStepIndex === 0 ? 'active' : ''} ${currentStepIndex > 0 ? 'done' : ''}`} id="sb-welcome">
                  <span className="sidebar-item-bullet"></span>Welcome
                </div>
                <div className={`sidebar-item ${currentStepIndex === 1 ? 'active' : ''} ${currentStepIndex > 1 ? 'done' : ''}`} id="sb-compat">
                  <span className="sidebar-item-bullet"></span>Compatibility
                </div>
                <div className={`sidebar-item ${currentStepIndex === 2 ? 'active' : ''} ${currentStepIndex > 2 ? 'done' : ''}`} id="sb-install">
                  <span className="sidebar-item-bullet"></span>Install App
                </div>
                <div className={`sidebar-item ${currentStepIndex === 3 ? 'active' : ''} ${currentStepIndex > 3 ? 'done' : ''}`} id="sb-config">
                  <span className="sidebar-item-bullet"></span>Playground
                </div>
                <div className={`sidebar-item ${currentStepIndex === 4 ? 'active' : ''}`} id="sb-finish">
                  <span className="sidebar-item-bullet"></span>Complete
                </div>
              </div>

              {/* Steps panels */}
              <div className="wizard-content" id="wiz-content">
                
                {/* STEP 0: WELCOME */}
                <div className={`wizard-step ${currentStepIndex === 0 ? 'active' : ''}`} id="step-welcome">
                  <div className="step-welcome-logo">
                    <Monitor size={24} />
                  </div>
                  <h3>Welcome to DreamBees Lite</h3>
                  <p>This interactive assistant checks system compatibility, simulates installation, and sets up your generation preferences.</p>
                  <div style={{ textAlign: 'center' }}>
                    <button className="btn btn-outline" style={{ minHeight: '36px', fontSize: '0.8rem', padding: '0 16px' }} onClick={() => handleStepChange(1)}>
                      Start Assistant
                    </button>
                  </div>
                </div>

                {/* STEP 1: COMPATIBILITY LOGS */}
                <div className={`wizard-step ${currentStepIndex === 1 ? 'active' : ''}`} id="step-compat">
                  <h3>Hardware Compatibility</h3>
                  <div className="compat-list">
                    <div className="compat-item">
                      <span className="label">Operating System</span>
                      <span className={systemOSOk ? "status ok" : "status warn"}>{systemOS}</span>
                    </div>
                    <div className="compat-item">
                      <span className="label">Processor Architecture</span>
                      <span className={systemCPUOk ? "status ok" : "status warn"}>{systemCPU}</span>
                    </div>
                  </div>
                  
                  <div className="terminal-box" id="compat-terminal">
                    <div className="terminal-header">
                      <span className="term-dot"></span>
                      <span className="term-dot"></span>
                      <span className="term-dot"></span>
                      <span className="term-title">hardware_probe.sh</span>
                    </div>
                    <div className="terminal-body" id="term-logs">
                      {compatLogs.map((log, idx) => (
                        <div key={idx} className="term-line">
                          <span className="term-prompt">➜</span> {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* STEP 2: INSTALL SIMULATION */}
                <div className={`wizard-step ${currentStepIndex === 2 ? 'active' : ''}`} id="step-install">
                  <h3>Simulated Installation</h3>
                  <p id="install-instruction" style={{ color: dragSuccess ? 'var(--color-success)' : 'inherit', fontSize: '0.74rem' }}>
                    {downloadState === 'idle' 
                      ? "First step: Download the installer package file:" 
                      : downloadState === 'downloading' 
                        ? "Downloading package to local filesystem..." 
                        : dragSuccess 
                          ? "✓ Application successfully mounted!" 
                          : "Complete install using your OS installer simulator below:"}
                  </p>
                  
                  {/* Download trigger/loader */}
                  {(downloadState === 'idle' || downloadState === 'downloading') && (
                    <div id="download-progress-area" style={{ width: '100%' }}>
                      {downloadState === 'idle' && (
                        <button className="btn btn-primary" style={{ width: '100%', minHeight: '38px', fontSize: '0.78rem' }} onClick={startDownloadFile}>
                          <Download size={14} /> Download Installer ({installerName})
                        </button>
                      )}
                      {downloadState === 'downloading' && (
                        <>
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${downloadProgress}%` }}></div>
                          </div>
                          <div className="progress-details">
                            <span>{downloadProgress}%</span>
                            <span>{((detectedOS === 'mac' ? 141.2 : detectedOS === 'windows' ? 128.5 : 135.0) * downloadProgress / 100).toFixed(1)} MB</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Drag-and-drop game for Mac */}
                  {downloadState === 'ready' && detectedOS === 'mac' && (
                    <div 
                      className="drag-simulator" 
                      id="drag-zone"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div 
                        className="drag-item" 
                        id="drag-app" 
                        draggable={!dragSuccess}
                        onDragStart={handleDragStart}
                        onClick={() => setDragSuccess(true)}
                        style={{
                          opacity: dragSuccess ? 0.3 : 1,
                          transform: dragSuccess ? 'scale(0.8) translate(100px, 0)' : 'none',
                          pointerEvents: dragSuccess ? 'none' : 'auto'
                        }}
                      >
                        <div className="drag-icon-app">
                          <Monitor size={24} />
                        </div>
                        <span className="drag-label">DreamBees.app</span>
                      </div>
                      
                      <div className="drag-arrow">➜</div>
                      
                      <div className={`drop-zone ${dragHover ? 'hover' : ''} ${dragSuccess ? 'success' : ''}`} id="drop-target">
                        <div className="drag-icon-folder">
                          <Database size={32} />
                        </div>
                        <span className="drag-label">Applications</span>
                      </div>
                    </div>
                  )}

                  {/* Windows Wizard Dialog */}
                  {downloadState === 'ready' && detectedOS === 'windows' && (
                    <div className="win-setup-window">
                      <div className="win-setup-header">
                        <div className="win-setup-header-title">
                          <Monitor size={12} />
                          <span>DreamBees Lite Setup</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>✕</span>
                      </div>
                      <div className="win-setup-main">
                        <div className="win-setup-sidebar">
                          <span className="win-setup-sidebar-text">DreamBees Studio</span>
                          <span style={{ fontSize: '0.52rem', color: '#64748b' }}>v{appVersion}</span>
                        </div>
                        <div className="win-setup-content">
                          {winSetupState === 'welcome' && (
                            <>
                              <h4>Welcome to the Setup Wizard</h4>
                              <p>This wizard will guide you through the local desktop workspace setup. Click Next to continue.</p>
                            </>
                          )}
                          {winSetupState === 'agreement' && (
                            <>
                              <h4>License Agreement</h4>
                              <p style={{ maxHeight: '70px', overflowY: 'scroll', background: 'rgba(0,0,0,0.3)', padding: '6px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                                By installing this software, you agree to run model workloads locally on your device neural engines. No graphic files are uploaded without consent.
                              </p>
                            </>
                          )}
                          {winSetupState === 'folder' && (
                            <>
                              <h4>Destination Folder</h4>
                              <p>Setup will install DreamBees Lite in the folder:</p>
                              <input type="text" readOnly value="C:\Program Files\DreamBees Lite" style={{ background: '#09080e', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.66rem', color: '#a78bfa', marginTop: '4px' }} />
                            </>
                          )}
                          {winSetupState === 'installing' && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem' }}>
                                <span style={{ color: '#c084fc' }}>Installing local binaries...</span>
                                <span>{winInstallProgress}%</span>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.06)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ background: 'var(--color-purple)', height: '100%', width: `${winInstallProgress}%` }} />
                              </div>
                              <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.4)', height: '35px', overflowY: 'hidden', textAlign: 'left', fontFamily: 'monospace' }}>
                                {winInstallLogs.slice(-2).map((log, lIdx) => (
                                  <div key={lIdx}>Extract: {log}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {winSetupState === 'finished' && (
                            <>
                              <h4 style={{ color: 'var(--color-success)' }}>✓ Complete!</h4>
                              <p>DreamBees Lite has been successfully configured. Click Finish to close this wizard and proceed.</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="win-setup-footer">
                        <button className="win-setup-btn" onClick={handleWinSetupBack} disabled={winSetupState === 'welcome' || winSetupState === 'installing' || winSetupState === 'finished'}>&lt; Back</button>
                        <button className="win-setup-btn primary" onClick={handleWinSetupNext} disabled={winSetupState === 'installing'}>{winSetupState === 'folder' ? 'Install' : winSetupState === 'finished' ? 'Finish' : 'Next &gt;'}</button>
                      </div>
                    </div>
                  )}

                  {/* Linux terminal console */}
                  {downloadState === 'ready' && detectedOS === 'linux' && (
                    <div className="linux-console">
                      <div className="linux-console-header">
                        <div className="linux-console-dots">
                          <span className="linux-console-dot"></span>
                          <span className="linux-console-dot"></span>
                          <span className="linux-console-dot"></span>
                        </div>
                        <span className="linux-console-title">user@local:~</span>
                      </div>
                      <div className="linux-console-body">
                        {linuxInstallState === 'idle' && (
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ color: 'rgba(255,255,255,0.4)' }}># Run helper permissions command:</div>
                              <div style={{ color: '#fff', margin: '4px 0 8px' }}>chmod +x ./dreambees-lite-linux.AppImage && ./dreambees-lite-linux.AppImage</div>
                            </div>
                            <button className="linux-console-run-btn" onClick={runLinuxInstallation}>Run Console Install</button>
                          </div>
                        )}
                        {(linuxInstallState === 'running' || linuxInstallState === 'done') && (
                          <div style={{ fontFamily: 'monospace', fontSize: '0.62rem' }}>
                            {linuxInstallLogs.map((log, lIdx) => (
                              <div key={lIdx} style={{ color: log.startsWith('$') ? '#fbbf24' : '#c084fc' }}>{log}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fallback / Mobile screen */}
                  {downloadState === 'ready' && detectedOS !== 'mac' && detectedOS !== 'windows' && detectedOS !== 'linux' && (
                    <div style={{ width: '100%', textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                      <Monitor size={32} style={{ color: 'var(--color-accent)', margin: '0 auto 8px' }} />
                      <h4 style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '4px' }}>Desktop Install Sync</h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Complete wizard steps to view dynamic integration parameters or log in below.</p>
                      <button className="btn btn-secondary" style={{ minHeight: '32px', fontSize: '0.72rem', width: '100%' }} onClick={() => setDragSuccess(true)}>Skip to Sync</button>
                    </div>
                  )}

                  {downloadState === 'ready' && (
                    <div id="drag-tip" style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '6px' }}>
                      {dragSuccess 
                        ? "Click Continue to finalize configuration" 
                        : detectedOS === 'mac' 
                          ? "Drag app icon to folder or click it to auto-install" 
                          : detectedOS === 'windows' 
                            ? "Follow the setup dialog steps to install"
                            : "Click Execute to configure binary shortcuts"}
                    </div>
                  )}
                </div>

                {/* STEP 3: PLAYGROUND SIMULATOR */}
                <div className={`wizard-step ${currentStepIndex === 3 ? 'active' : ''}`} id="step-config">
                  <div className="step-config-layout">
                    <div className="customize-options">
                      <div className={`cust-card ${stylePreset === 'cyber' ? 'selected' : ''}`} onClick={() => setStylePreset('cyber')}>
                        <div className="cust-card-title">Cyberpunk</div>
                        <div className="cust-card-desc">Neon-lit digital bees.</div>
                      </div>
                      <div className={`cust-card ${stylePreset === 'cosmic' ? 'selected' : ''}`} onClick={() => setStylePreset('cosmic')}>
                        <div className="cust-card-title">Cosmic</div>
                        <div className="cust-card-desc">Space nebulas & dust.</div>
                      </div>
                      <div className={`cust-card ${stylePreset === 'fantasy' ? 'selected' : ''}`} onClick={() => setStylePreset('fantasy')}>
                        <div className="cust-card-title">Fantasy</div>
                        <div className="cust-card-desc">Magical enchanted flowers.</div>
                      </div>
                      <div className={`cust-card ${stylePreset === 'retro' ? 'selected' : ''}`} onClick={() => setStylePreset('retro')}>
                        <div className="cust-card-title">Retro</div>
                        <div className="cust-card-desc">Synthwave grid aesthetic.</div>
                      </div>
                    </div>

                    <div className="toggle-switch-container">
                      <div className="toggle-label">
                        <span className="toggle-title">Cloud-Boost Accelerator</span>
                        <span className="toggle-desc" id="toggle-desc-txt">
                          {cloudBoost ? "Uses cloud servers to speed up rendering." : "Generates offline on your graphics core."}
                        </span>
                      </div>
                      <label className="switch">
                        <input type="checkbox" id="toggle-cloud" checked={cloudBoost} onChange={(e) => { setCloudBoost(e.target.checked); playSound('click'); }} />
                        <span className="slider"></span>
                      </label>
                    </div>

                    {/* Playground image renderer */}
                    <div className="playground-box">
                      <div className="playground-row">
                        <input type="text" className="playground-input" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                        <button className="btn btn-primary" style={{ minHeight: '28px', padding: '0 12px', fontSize: '0.7rem', borderRadius: '6px' }} onClick={runMiniDiffusion} disabled={diffusionState === 'diffusing'}>
                          Diffuse
                        </button>
                      </div>
                      <div className="diffusion-canvas-frame">
                        <div className="diffusion-canvas-noise"></div>
                        <canvas ref={canvasRef} width="320" height="200" className="diffusion-canvas-el" />
                        {diffusionState !== 'idle' && (
                          <div className="diffusion-timer" id="demo-timer">{diffusionTimer}</div>
                        )}
                      </div>
                    </div>

                    {/* timing comparison bar chart */}
                    <div className="timing-chart">
                      <div className="timing-bar-row">
                        <span className="timing-bar-label">Cloud-Boost</span>
                        <div className="timing-bar-track">
                          <div className="timing-bar-fill cloud" id="bar-cloud" style={{ width: currentStepIndex === 3 ? '20%' : '0%' }}></div>
                        </div>
                        <span className="timing-bar-time">0.8s</span>
                      </div>
                      <div className="timing-bar-row">
                        <span className="timing-bar-label">Local GPU</span>
                        <div className="timing-bar-track">
                          <div className="timing-bar-fill local" id="bar-local" style={{ width: currentStepIndex === 3 ? '100%' : '0%' }}></div>
                        </div>
                        <span className="timing-bar-time">4.0s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 4: COMPLETE WITH AUTH / SYNC */}
                <div className={`wizard-step ${currentStepIndex === 4 ? 'active' : ''}`} id="step-finish">
                  {user ? (
                    // Authenticated State
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="step-success-row">
                        <div className="qr-code-frame" aria-label="Mobile Sync QR Code">
                          {qrCodeUrl ? (
                            <img className="qr-code-img" src={qrCodeUrl} alt="Active user sync QR Code" />
                          ) : (
                            <div className="qr-code-placeholder">
                              <RefreshCw size={18} className="animate-spin text-purple-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 style={{ color: 'var(--color-success)', textAlign: 'left', marginBottom: '2px', fontSize: '0.9rem' }}>✓ Authed as {user.displayName || user.email?.split('@')[0]}</h3>
                          <p style={{ textAlign: 'left', fontSize: '0.68rem', margin: 0, color: 'var(--color-text-secondary)' }}>You are logged in on the web. Sync your desktop app by clicking launch below or scanning the QR code.</p>
                        </div>
                      </div>
                      
                      <div className="token-box" style={{ marginTop: '4px' }}>
                        <span className="token-val" id="token-display">{syncToken}</span>
                        <button className="btn-copy-token" onClick={copyToken}>Copy Session</button>
                      </div>

                      {deepLinkUrl && (
                        <a className="btn btn-primary" href={deepLinkUrl} style={{ width: '100%', minHeight: '34px', fontSize: '0.78rem' }}>
                          <Zap size={14} /> Launch & Sync Desktop App
                        </a>
                      )}
                    </div>
                  ) : (
                    // Unauthenticated Inline Auth Block
                    <div className="inline-auth-form">
                      <h3 style={{ textAlign: 'left', fontSize: '0.9rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={14} className="text-purple-400" />
                        <span>{isRegistering ? 'Create DreamBees Account' : 'Sign in to Sync Desktop'}</span>
                      </h3>
                      <p style={{ fontSize: '0.64rem', color: 'var(--color-text-secondary)', margin: '0 0 6px 0', textAlign: 'left' }}>
                        Sign in to generate your secure local workspace authentication deep-link parameters.
                      </p>

                      <form onSubmit={handleInlineLogin} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input 
                          type="email" 
                          placeholder="Email Address" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="inline-auth-input"
                          required
                        />
                        <input 
                          type="password" 
                          placeholder="Password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="inline-auth-input"
                          required
                        />
                        
                        {authError && (
                          <div style={{ fontSize: '0.62rem', color: '#ef4444', textAlign: 'left', padding: '2px 4px' }}>
                            {authError}
                          </div>
                        )}

                        <button type="submit" className="inline-auth-submit" disabled={authLoading}>
                          {authLoading ? <RefreshCw size={12} className="animate-spin" /> : (isRegistering ? 'Create & Sync' : 'Log in & Sync')}
                        </button>
                      </form>

                      <button type="button" className="inline-auth-switch" onClick={() => setIsRegistering(!isRegistering)}>
                        {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Sign up here'}
                      </button>

                      <button type="button" className="btn-secondary" style={{ minHeight: '30px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', marginTop: '4px' }} onClick={handleGoogleLogin} disabled={authLoading}>
                        <svg width="12" height="12" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                    </div>
                  )}

                  <div className="shortcuts-grid" style={{ marginTop: '8px' }}>
                    <div className="shortcut-item"><span>Generate:</span><span className="shortcut-key">⌘ G</span></div>
                    <div className="shortcut-item"><span>Save Work:</span><span className="shortcut-key">⌘ S</span></div>
                    <div className="shortcut-item"><span>Open Library:</span><span className="shortcut-key">⌘ L</span></div>
                    <div className="shortcut-item"><span>Toggle Sidebar:</span><span className="shortcut-key">⌘ \</span></div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="window-footer">
              <button 
                className="wiz-btn btn-back" 
                id="wiz-prev" 
                onClick={() => handleStepChange(currentStepIndex - 1)} 
                disabled={currentStepIndex === 0}
              >
                {currentStepIndex === 0 ? "Cancel" : "Back"}
              </button>
              <button 
                className="wiz-btn btn-next" 
                id="wiz-next" 
                onClick={() => handleStepChange(currentStepIndex === stepIds.length - 1 ? 0 : currentStepIndex + 1)}
                disabled={(currentStepIndex === 1 && diagnosticsRunning) || (currentStepIndex === 2 && !dragSuccess)}
              >
                {currentStepIndex === stepIds.length - 1 ? "Close Wizard" : "Continue"}
              </button>
            </div>
          </aside>
        </section>

        {/* WHY CREATORS CHOOSE DESKTOP */}
        <section className="card-body card" style={{ marginBottom: '40px', background: 'rgba(0,0,0,0.12)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '24px' }}>Why creators install the desktop app</h2>
          <div className="why-grid">
            <div className="why-tile">
              <div className="why-tile-icon">
                <CheckCircle2 size={20} />
              </div>
              <h3>Reliable Context</h3>
              <p>Your prompt logs, model parameters, and saved templates stay grouped in one workspace.</p>
            </div>
            <div className="why-tile">
              <div className="why-tile-icon">
                <Database size={20} />
              </div>
              <h3>Local Database</h3>
              <p>Built-in high-performance local SQLite storage maps catalog changes immediately.</p>
            </div>
            <div className="why-tile">
              <div className="why-tile-icon">
                <Zap size={20} />
              </div>
              <h3>Direct Integration</h3>
              <p>Allows instant exporting and drag-and-drop support into native vector design tools.</p>
            </div>
          </div>
        </section>

        {/* PREVIEW GALLERY */}
        <section id="gallery">
          <div className="section-title">
            <Monitor size={24} />
            <h2>App Preview Gallery</h2>
          </div>
          <p className="section-lead">Click on any screenshot below to inspect the high-fidelity UI layout and studio panels.</p>
          
          <div className="shots">
            <figure className="shot" onClick={() => openLightbox('/downloads/studio-home.png', 'Studio Home Dashboard View')}>
              <div className="shot-overlay-icon">
                <Sparkles size={18} />
              </div>
              <img src="/downloads/studio-home.png" alt="DreamBees Home Studio View screenshot" />
              <figcaption>Home Studio Dashboard <span>Select styles & browse catalog</span></figcaption>
            </figure>
            
            <figure className="shot" onClick={() => openLightbox('/downloads/generation-flow.png', 'Workspace Generation Detail View')}>
              <div className="shot-overlay-icon">
                <Sparkles size={18} />
              </div>
              <img src="/downloads/generation-flow.png" alt="DreamBees Generation workspace view screenshot" />
              <figcaption>Active Generation Workspace <span>Write prompts & adjust weights</span></figcaption>
            </figure>
            
            <figure className="shot" onClick={() => openLightbox('/downloads/history-library.png', 'Saved Generation Library View')}>
              <div className="shot-overlay-icon">
                <Sparkles size={18} />
              </div>
              <img src="/downloads/history-library.png" alt="DreamBees library and local history screenshot" />
              <figcaption>History Library View <span>Organize folders & manage outputs</span></figcaption>
            </figure>
          </div>
        </section>

        {/* SPECIFICATIONS & FAQs GRID */}
        <section className="grid-2" id="requirements">
          <article className="card">
            <div className="card-body">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 16px', color: '#fff' }}>System Requirements</h2>
              <div className="reqs">
                <div className="req">
                  <span className="label">Operating System</span>
                  <strong>
                    {detectedOS === 'mac' ? 'macOS 13.0+' : detectedOS === 'windows' ? 'Windows 10 / 11 x64' : detectedOS === 'linux' ? 'Ubuntu 20.04+ / Debian' : 'Desktop OS Required'}
                  </strong>
                </div>
                <div className="req">
                  <span className="label">Processor</span>
                  <strong>
                    {detectedOS === 'mac' ? 'Apple Silicon M1/M2/M3+' : detectedOS === 'windows' ? 'Intel i5/i7/i9 or AMD Ryzen' : detectedOS === 'linux' ? 'Intel x64 or AMD' : 'Core i5 or equivalent'}
                  </strong>
                </div>
                <div className="req">
                  <span className="label">Disk Space</span>
                  <strong>At least 1 GB free</strong>
                </div>
                <div className="req">
                  <span className="label">Network</span>
                  <strong>Sign-in & Cloud boost</strong>
                </div>
              </div>
            </div>
          </article>

          <article className="card" id="faq">
            <div className="card-body">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 16px', color: '#fff' }}>Frequently Asked Questions</h2>
              <div className="faq">
                <div className="faq-item">
                  <button className="faq-question" onClick={() => setFaqOpenIndex(faqOpenIndex === 0 ? null : 0)}>
                    <span>Do I need technical setup?</span>
                    <ChevronDown size={16} className={`faq-chevron ${faqOpenIndex === 0 ? 'open' : ''}`} />
                  </button>
                  <div className={`faq-answer ${faqOpenIndex === 0 ? 'open' : ''}`}>
                    <p>
                      {detectedOS === 'mac' 
                        ? 'No. Drag the app icon to your Applications folder in Step 2. No terminal configuration is required.'
                        : detectedOS === 'windows' 
                          ? 'No. Run the Setup Wizard simulation to choose your directory and install automatically in Step 2.'
                          : 'Simply make the AppImage executable and launch it, or execute the quick terminal installation script.'}
                    </p>
                  </div>
                </div>

                <div className="faq-item">
                  <button className="faq-question" onClick={() => setFaqOpenIndex(faqOpenIndex === 1 ? null : 1)}>
                    <span>Can I still use the web app?</span>
                    <ChevronDown size={16} className={`faq-chevron ${faqOpenIndex === 1 ? 'open' : ''}`} />
                  </button>
                  <div className={`faq-answer ${faqOpenIndex === 1 ? 'open' : ''}`}>
                    <p>Yes. The web app remains completely operational. The desktop client is a companion app that runs in a focused, standalone window.</p>
                  </div>
                </div>

                <div className="faq-item">
                  <button className="faq-question" onClick={() => setFaqOpenIndex(faqOpenIndex === 2 ? null : 2)}>
                    <span>What is Cloud-Boost acceleration?</span>
                    <ChevronDown size={16} className={`faq-chevron ${faqOpenIndex === 2 ? 'open' : ''}`} />
                  </button>
                  <div className={`faq-answer ${faqOpenIndex === 2 ? 'open' : ''}`}>
                    <p>Cloud-boost uses our server cluster to synthesize images in 1-2 seconds, while local-first operations use your CPU/GPU for slower offline processing.</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* WHAT'S NEW SECTION */}
        <section className="card" style={{ marginBottom: '40px' }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 16px', color: '#fff' }}>Release Notes</h2>
            <div className="release-note">
              <strong>Version {appVersion} (Latest)</strong>
              <p>Implements client-side state recovery for slow local loads, adds robust Electron IPC boundaries, and fixes database locks. Features platform-native binary compilation for direct device execution.</p>
            </div>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="footer-cta">
          <h2>Download DreamBees Lite</h2>
          <p>Start generating high-resolution assets locally on your device today.</p>
          <button className="btn btn-primary" onClick={startDownloadFile}>
            <Download size={18} strokeWidth={2.5} />
            Download Direct Installer
          </button>
        </section>

        {/* STICKY DOWNLOAD BAR */}
        <section className="sticky-download" aria-label="Sticky download bar">
          <span>Ready to create? <strong>DreamBees Lite for {detectedOS === 'mac' ? 'macOS' : detectedOS === 'windows' ? 'Windows' : detectedOS === 'linux' ? 'Linux' : 'Desktop'}</strong> installer.</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ minHeight: '36px', padding: '0 12px', fontSize: '0.8rem' }} onClick={startWizard}>
              Launch Wizard
            </button>
            <button className="btn btn-primary" style={{ minHeight: '36px', padding: '0 16px', fontSize: '0.8rem' }} onClick={startDownloadFile}>
              Download
            </button>
          </div>
        </section>
      </main>

      {/* LIGHTBOX MODAL */}
      <div className={`lightbox ${lightboxOpen ? 'active' : ''}`} id="gallery-lightbox" onClick={closeLightbox}>
        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
          <button className="lightbox-close" onClick={closeLightbox}>✕</button>
          <img className="lightbox-img" id="lightbox-img" src={lightboxSrc || undefined} alt="Expanded screenshot preview" />
          <div className="lightbox-caption" id="lightbox-caption">{lightboxCaption}</div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
