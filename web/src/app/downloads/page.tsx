'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { 
  ArrowRight, Download, Sparkles, Monitor, Database, Zap, 
  Terminal, ShieldCheck, Cpu, HardDrive, Network, HelpCircle, ChevronDown, CheckCircle2
} from 'lucide-react';

const stepIds = ['step-welcome', 'step-compat', 'step-install', 'step-config', 'step-finish'];
const sidebarIds = ['sb-welcome', 'sb-compat', 'sb-install', 'sb-config', 'sb-finish'];

const diagnosticLogs = [
  "Initializing local hardware diagnostic probe...",
  "Querying CPU instruction extensions...",
  "Host Architecture: MacIntel (Simulated ARM Bridge)",
  "WebGL 2.0 rendering context bound successfully.",
  "GPU Core Mapping: Apple GPU Neural Engine detected.",
  "Probing deep-link registry: 'dreambees://' available.",
  "System diagnostics completed. M-series acceleration active."
];

export default function DownloadsPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Step 1: Compatibility Terminal
  const [compatLogs, setCompatLogs] = useState<string[]>([]);
  const [systemOS, setSystemOS] = useState('Checking...');
  const [systemCPU, setSystemCPU] = useState('Checking...');
  const [systemOSOk, setSystemOSOk] = useState(true);
  const [systemCPUOk, setSystemCPUOk] = useState(true);

  // Step 2: Download & Drag Simulator
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadState, setDownloadState] = useState<'downloading' | 'dragging' | 'success'>('downloading');
  const [dragHover, setDragHover] = useState(false);
  const [dragSuccess, setDragSuccess] = useState(false);

  // Step 3: Playground Customizer
  const [stylePreset, setStylePreset] = useState<'beginner' | 'advanced'>('beginner');
  const [cloudBoost, setCloudBoost] = useState(true);
  const [diffusionState, setDiffusionState] = useState<'idle' | 'diffusing' | 'done'>('idle');
  const [diffusionProgress, setDiffusionProgress] = useState(0);
  const [diffusionTimer, setDiffusionTimer] = useState('0.0s');
  const [prompt, setPrompt] = useState('Futuristic glowing bee on digital flower');

  // Step 4: Token
  const [syncToken, setSyncToken] = useState('DB-LITE-WAITING');

  // Gallery Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [lightboxCaption, setLightboxCaption] = useState('');

  // FAQs Accordion
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

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
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'swoosh') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.16);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'chime') {
      const notes = [293.66, 349.23, 440.00, 587.33]; // D Minor Chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.4);
      });
    }
  };

  const handleStepChange = (index: number) => {
    playSound('swoosh');
    setCurrentStepIndex(index);
  };

  // -------------------------------------------------------------
  // DYNAMIC COMPATIBILITY EFFECT
  // -------------------------------------------------------------
  useEffect(() => {
    if (currentStepIndex === 1) {
      setCompatLogs([]);
      
      // Check OS
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
      const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
      if (isMac) {
        setSystemOS("macOS Detected (Compatible)");
        setSystemOSOk(true);
      } else {
        setSystemOS("Other OS (Simulating Mac)");
        setSystemOSOk(false);
      }

      // Check CPU
      let isAppleSilicon = false;
      try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter((debugInfo as any).UNMASKED_RENDERER_VENDOR_ID || (debugInfo as any).UNMASKED_RENDERER_STRING);
            if (/Apple/.test(renderer) && !/Intel/.test(renderer)) {
              isAppleSilicon = true;
            }
          }
        }
      } catch (e) {}

      if (isAppleSilicon) {
        setSystemCPU("Apple Silicon M-Series (Optimized)");
        setSystemCPUOk(true);
      } else if (isMac) {
        setSystemCPU("Intel Architecture (Compatible)");
        setSystemCPUOk(true);
      } else {
        setSystemCPU("Non-ARM (Simulated)");
        setSystemCPUOk(false);
      }

      // Print terminal diagnostics line by line
      let lineIdx = 0;
      const interval = setInterval(() => {
        if (lineIdx < diagnosticLogs.length) {
          setCompatLogs(prev => [...prev, diagnosticLogs[lineIdx]]);
          playSound('click');
          lineIdx++;
        } else {
          clearInterval(interval);
        }
      }, 350);

      return () => clearInterval(interval);
    }
  }, [currentStepIndex]);

  // -------------------------------------------------------------
  // SIMULATED DOWNLOAD EFFECT
  // -------------------------------------------------------------
  useEffect(() => {
    if (currentStepIndex === 2) {
      setDownloadProgress(0);
      setDownloadState('downloading');
      setDragSuccess(false);

      // Trigger actual DMG file download
      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = "/downloads/dreambees-lite-mac.dmg";
        link.download = "dreambees-lite-mac.dmg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setDownloadProgress(100);
          playSound('chime');
          setTimeout(() => {
            setDownloadState('dragging');
          }, 600);
        } else {
          setDownloadProgress(progress);
        }
      }, 110);

      return () => clearInterval(interval);
    }
  }, [currentStepIndex]);

  // -------------------------------------------------------------
  // STEP 3 PLAYGROUND TIMING BARS INITIATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (currentStepIndex === 3) {
      // Small timeout to trigger css bars width transitions
      const cloudBar = document.getElementById('bar-cloud');
      const localBar = document.getElementById('bar-local');
      if (cloudBar && localBar) {
        cloudBar.style.width = "20%";
        localBar.style.width = "100%";
      }
    }
  }, [currentStepIndex]);

  // -------------------------------------------------------------
  // STEP 4 SYNC TOKEN INITIATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (currentStepIndex === 4) {
      generateCredsToken();
      playSound('chime');
    }
  }, [currentStepIndex]);

  // -------------------------------------------------------------
  // IMAGE DIFFUSION PLAYGROUND EFFECT
  // -------------------------------------------------------------
  const runMiniDiffusion = () => {
    if (diffusionState === 'diffusing') return;
    setDiffusionState('diffusing');
    setDiffusionProgress(0);
    setDiffusionTimer('0.0s');

    const duration = cloudBoost ? 800 : 4000;
    const start = performance.now();

    const soundInterval = setInterval(() => {
      playSound('click');
    }, cloudBoost ? 150 : 350);

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);

      setDiffusionProgress(progress);
      setDiffusionTimer(`${(elapsed / 1000).toFixed(1)}s`);

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
  // DRAG AND DROP HANDLERS
  // -------------------------------------------------------------
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
      triggerDropSuccess();
    } else {
      playSound('click');
    }
  };

  const triggerDropSuccess = () => {
    playSound('chime');
    setDragSuccess(true);
  };

  // -------------------------------------------------------------
  // UTILITY CONTROLS
  // -------------------------------------------------------------
  const generateCredsToken = () => {
    const chars = '0123456789ABCDEF';
    let token = 'DB-LITE-';
    for (let i = 0; i < 4; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    token += '-';
    for (let i = 0; i < 4; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    setSyncToken(token);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(syncToken).then(() => {
      const btn = document.querySelector('.btn-copy-token') as HTMLButtonElement;
      if (btn) {
        btn.textContent = "Copied!";
        btn.style.background = "var(--color-success)";
        setTimeout(() => {
          btn.textContent = "Copy Key";
          btn.style.background = "rgba(255,255,255,0.06)";
        }, 1500);
      }
    });
  };

  const toggleCloudBoost = (checkbox: HTMLInputElement) => {
    setCloudBoost(checkbox.checked);
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
          
          .container { max-width: 1120px; margin: 0 auto; padding: 24px 20px 88px; }
          
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
            width: 0%; height: 100%; background: linear-gradient(90deg, var(--color-purple), var(--color-accent)); transition: width 0.1s linear;
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
            height: 100px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: #000;
            position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;
          }
          .diffusion-canvas-img {
            width: 100%; height: 100%; object-fit: cover; border-radius: 7px;
            filter: blur(28px) saturate(0) contrast(1.8); opacity: 0;
          }
          .diffusion-canvas-noise {
            position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px);
            opacity: 0.4; pointer-events: none; z-index: 5;
          }
          .diffusion-canvas-placeholder {
            color: var(--color-text-secondary); font-size: 0.7rem; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 10;
          }
          .diffusion-canvas-placeholder svg { color: var(--color-accent); }
          .diffusion-timer {
            position: absolute; bottom: 8px; right: 8px; padding: 2px 6px; border-radius: 4px;
            background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.1);
            font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-accent); font-weight: 700; z-index: 15; display: none;
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
          .qr-code-box {
            width: 72px; height: 72px; background: #fff; border-radius: 8px; display: grid;
            grid-template-columns: repeat(12, 1fr); padding: 5px; flex-shrink: 0;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          }
          .qr-pixel { background: #fff; }
          .qr-pixel.b { background: #000; }
          
          .token-box {
            display: flex; justify-content: space-between; align-items: center; gap: 8px;
            padding: 8px 12px; border-radius: 8px; background: #000; border: 1px solid rgba(255,255,255,0.08);
            font-family: var(--font-mono); font-size: 0.72rem; margin-bottom: 12px;
          }
          .token-val { color: var(--color-accent); font-weight: 700; }
          .btn-copy-token { background: rgba(255,255,255,0.06); border: none; border-radius: 6px; color: #fff; padding: 4px 8px; font-size: 0.68rem; font-weight: 700; cursor: pointer; }
          .btn-copy-token:hover { background: rgba(255,255,255,0.12); }
          
          .shortcuts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; text-align: left; }
          .shortcut-item { font-size: 0.68rem; color: var(--color-text-secondary); display: flex; justify-content: space-between; background: rgba(255,255,255,0.01); padding: 4px 8px; border-radius: 6px; }
          .shortcut-key { font-family: var(--font-mono); color: #fff; font-weight: 700; }

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
          details {
            border: 1px solid var(--color-card-border); border-radius: 14px; background: rgba(0,0,0,0.15); padding: 12px 16px; transition: border-color 0.2s;
          }
          details:hover { border-color: rgba(255,255,255,0.15); }
          summary { cursor: pointer; font-weight: 700; font-size: 0.92rem; outline: none; color: #fff; }
          details p { margin: 10px 0 0; color: var(--color-text-secondary); line-height: 1.55; font-size: 0.86rem; }

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

        {/* FEATURED HEADER AREA */}
        <header className="featured-header" id="overview">
          <div className="app-icon-wrapper">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round">
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
              <a className="btn btn-primary" href="/downloads/dreambees-lite-mac.dmg" id="btn-dmg-download">
                <Download size={16} strokeWidth={2.5} />
                Download DMG
              </a>
              <button className="btn btn-secondary" onClick={startWizard}>
                <Sparkles size={16} strokeWidth={2.5} />
                Setup Wizard
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
            <span className="store-stat-val">macOS</span>
            <span className="store-stat-sub">Apple Silicon Native</span>
          </div>
          <div className="store-stat-box">
            <span className="store-stat-label">SIZE</span>
            <span className="store-stat-val">141.2 MB</span>
            <span className="store-stat-sub">DMG package</span>
          </div>
          <div className="store-stat-box">
            <span className="store-stat-label">AGE RATING</span>
            <span className="store-stat-val">4+</span>
            <span className="store-stat-sub">Safe for everyone</span>
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
                  <li><strong>M1/M2/M3 Native:</strong> Direct hardware bindings for local pre-processing.</li>
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
                  <p id="install-instruction" style={{ color: dragSuccess ? 'var(--color-success)' : 'inherit' }}>
                    {downloadState === 'downloading' ? "Downloading installer package..." : dragSuccess ? "✓ Application successfully mounted!" : "Complete install by placing app into Applications:"}
                  </p>
                  
                  {/* Download loader */}
                  {downloadState === 'downloading' && (
                    <div id="download-progress-area">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${downloadProgress}%` }}></div>
                      </div>
                      <div className="progress-details">
                        <span>{downloadProgress}%</span>
                        <span>{((141.2 * downloadProgress) / 100).toFixed(1)} / 141.2 MB</span>
                      </div>
                    </div>
                  )}

                  {/* Drag-and-drop game */}
                  {downloadState !== 'downloading' && (
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
                        onClick={triggerDropSuccess}
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
                  {downloadState !== 'downloading' && (
                    <div id="drag-tip" style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '6px' }}>
                      {dragSuccess ? "Click Continue to finalize configuration" : "Drag app icon to folder or click it to auto-install"}
                    </div>
                  )}
                </div>

                {/* STEP 3: PLAYGROUND SIMULATOR */}
                <div className={`wizard-step ${currentStepIndex === 3 ? 'active' : ''}`} id="step-config">
                  <div className="step-config-layout">
                    <div className="customize-options">
                      <div className={`cust-card ${stylePreset === 'beginner' ? 'selected' : ''}`} onClick={() => { setStylePreset('beginner'); playSound('click'); }}>
                        <div className="cust-card-title">Beginner Mode</div>
                        <div className="cust-card-desc">Sleek defaults. Ready out-of-the-box.</div>
                      </div>
                      <div className={`cust-card ${stylePreset === 'advanced' ? 'selected' : ''}`} onClick={() => { setStylePreset('advanced'); playSound('click'); }}>
                        <div className="cust-card-title">Pro Studio</div>
                        <div className="cust-card-desc">Exposes raw seeds, resolution and sliders.</div>
                      </div>
                    </div>

                    <div className="toggle-switch-container">
                      <div className="toggle-label">
                        <span className="toggle-title">Cloud-Boost Accelerator</span>
                        <span className="toggle-desc" id="toggle-desc-txt">
                          {cloudBoost ? "Uses cloud servers to speed up rendering." : "Generates offline on your Apple neural core."}
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
                        {diffusionState === 'diffusing' && (
                          <div className="diffusion-timer" id="demo-timer" style={{ display: 'block' }}>{diffusionTimer}</div>
                        )}
                        {diffusionState === 'done' && (
                          <div className="diffusion-timer" id="demo-timer" style={{ display: 'block' }}>{diffusionTimer}</div>
                        )}
                        <img 
                          className="diffusion-canvas-img" 
                          id="demo-canvas-img" 
                          src="/downloads/generation-flow.png" 
                          alt="Simulated render"
                          style={{
                            opacity: diffusionState === 'idle' ? 0 : diffusionState === 'diffusing' ? (0.15 + 0.85 * diffusionProgress) : 1,
                            filter: diffusionState === 'idle' 
                              ? 'blur(28px) saturate(0) contrast(1.8)' 
                              : diffusionState === 'diffusing' 
                                ? `blur(${(28 * (1 - diffusionProgress)).toFixed(1)}px) saturate(${diffusionProgress}) contrast(${(1.8 - 0.8 * diffusionProgress).toFixed(2)})` 
                                : 'none'
                          }}
                        />
                        {diffusionState === 'idle' && (
                          <div className="diffusion-canvas-placeholder" id="demo-canvas-ph">
                            <Sparkles size={20} />
                            <span>Canvas Ready</span>
                          </div>
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

                {/* STEP 4: COMPLETE WITH SYNC QR */}
                <div className={`wizard-step ${currentStepIndex === 4 ? 'active' : ''}`} id="step-finish">
                  <div className="step-success-row">
                    <div className="qr-code-box" aria-label="Mobile Sync QR Code">
                      {/* Grid QR pixels */}
                      <span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span>
                      <span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span>
                      <span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span>
                      <span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span>
                      <span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span>
                      <span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span>
                      <span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span>
                      <span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span>
                      <span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span>
                      <span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span>
                      <span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span>
                      <span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel b"></span><span className="qr-pixel b"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel"></span><span className="qr-pixel"></span>
                    </div>
                    <div>
                      <h3 style={{ color: 'var(--color-success)', textAlign: 'left', marginBottom: '4px' }}>✓ Configuration Completed</h3>
                      <p style={{ textAlign: 'left', fontSize: '0.74rem', margin: 0 }}>Scan this sync code from your mobile app to link accounts, or sync the desktop app using the sync key below.</p>
                    </div>
                  </div>
                  
                  <div className="token-box" style={{ marginTop: '10px' }}>
                    <span className="token-val" id="token-display">{syncToken}</span>
                    <button className="btn-copy-token" onClick={copyToken}>Copy Key</button>
                  </div>

                  <div className="shortcuts-grid">
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
                disabled={currentStepIndex === 2 && !dragSuccess}
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
                  <strong>macOS 13.0+</strong>
                </div>
                <div className="req">
                  <span className="label">Processor</span>
                  <strong>Apple M1/M2/M3+</strong>
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
                <details open={faqOpenIndex === 0} onClick={(e) => { e.preventDefault(); setFaqOpenIndex(faqOpenIndex === 0 ? null : 0); }}>
                  <summary>Do I need technical setup?</summary>
                  <p>No. You download the DMG file, open it, and drag the application icon to your Applications folder. No code compiler or terminal config required.</p>
                </details>
                <details open={faqOpenIndex === 1} onClick={(e) => { e.preventDefault(); setFaqOpenIndex(faqOpenIndex === 1 ? null : 1); }}>
                  <summary>Can I still use the web app?</summary>
                  <p>Yes. The web app remains completely operational. The desktop client is a companion app that runs in a focused, standalone window.</p>
                </details>
                <details open={faqOpenIndex === 2} onClick={(e) => { e.preventDefault(); setFaqOpenIndex(faqOpenIndex === 2 ? null : 2); }}>
                  <summary>What is Cloud-Boost acceleration?</summary>
                  <p>Cloud-boost uses our server cluster to synthesize images in 1-2 seconds, while local-first operations use your CPU/GPU for slower offline processing.</p>
                </details>
              </div>
            </div>
          </article>
        </section>

        {/* WHAT'S NEW SECTION */}
        <section className="card" style={{ marginBottom: '40px' }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 16px', color: '#fff' }}>Release Notes</h2>
            <div className="release-note">
              <strong>Version 1.4.11 (Latest)</strong>
              <p>Implements client-side state recovery for slow local loads, adds robust Electron IPC boundaries, and fixes database locks. Features Apple Silicon native binary compilation for direct Mac execution.</p>
            </div>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="footer-cta">
          <h2>Download DreamBees Lite for macOS</h2>
          <p>Start generating high-resolution assets locally on your device today.</p>
          <a className="btn btn-primary" href="/downloads/dreambees-lite-mac.dmg">
            <Download size={18} strokeWidth={2.5} />
            Download Direct Installer
          </a>
        </section>

        {/* STICKY DOWNLOAD BAR */}
        <section className="sticky-download" aria-label="Sticky download bar">
          <span>Ready to create? <strong>DreamBees Lite for macOS</strong> direct DMG installer.</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ minHeight: '36px', padding: '0 12px', fontSize: '0.8rem' }} onClick={startWizard}>
              Launch Wizard
            </button>
            <a className="btn btn-primary" style={{ minHeight: '36px', padding: '0 16px', fontSize: '0.8rem' }} href="/downloads/dreambees-lite-mac.dmg">
              Download DMG
            </a>
          </div>
        </section>
      </main>

      {/* LIGHTBOX MODAL */}
      <div className={`lightbox ${lightboxOpen ? 'active' : ''}`} id="gallery-lightbox" onClick={closeLightbox}>
        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
          <button className="lightbox-close" onClick={closeLightbox}>✕</button>
          <img className="lightbox-img" id="lightbox-img" src={lightboxSrc} alt="Expanded screenshot preview" />
          <div className="lightbox-caption" id="lightbox-caption">{lightboxCaption}</div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
