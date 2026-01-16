import React, { useRef, useEffect } from 'react';
import {
    Wand2, Loader2, X, Mic, MicOff, Paperclip, Sparkles, Share2, Trash2, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl } from '../../utils';
import { STYLE_REGISTRY } from '../../data/styles';

export default function GeneratorControls({
    prompt, setPrompt,
    generationMode,
    referenceImage, setReferenceImage, clearReferenceImage,
    isListening, setIsListening,
    toggleListening,
    setIsImagePickerOpen,
    isAutoPrompting,
    handleAutoPrompt,
    useTurbo, setUseTurbo,
    generating,
    handleGenerate,
    seed, aspectRatio, steps, cfg, negPrompt
}) {
    const handleShare = () => {
        const url = new URL(window.location);
        url.searchParams.set('prompt', prompt);
        if (seed !== -1) url.searchParams.set('seed', seed);
        if (aspectRatio !== '1:1') url.searchParams.set('aspectRatio', aspectRatio);
        if (steps !== 30) url.searchParams.set('steps', steps);
        if (cfg !== 7.0) url.searchParams.set('cfg', cfg);
        if (negPrompt) url.searchParams.set('negPrompt', negPrompt);
        navigator.clipboard.writeText(url.toString());
        toast.success('Link copied to clipboard');
    };

    return (
        <div style={{ padding: '0', background: 'transparent', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="glass-panel" style={{
                margin: '12px', padding: '6px', borderRadius: '16px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {referenceImage && (
                        <div style={{ position: 'relative', width: 'fit-content', marginBottom: '8px' }}>
                            <img
                                src={referenceImage.startsWith('data:') ? referenceImage : getOptimizedImageUrl(referenceImage)}
                                alt="Reference"
                                style={{ height: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
                            />
                            <button onClick={clearReferenceImage} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={referenceImage ? "Click the Sparkles icon below to analyze this image..." : "Describe your vision..."}
                        className="custom-scrollbar"
                        style={{
                            width: '100%', background: 'transparent', border: 'none', color: 'white',
                            fontSize: '1.1rem', fontWeight: '400', resize: 'none', minHeight: '200px',
                            outline: 'none', lineHeight: '1.6', fontFamily: '"Outfit", sans-serif', letterSpacing: '0.01em'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !generating) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={toggleListening}
                            className={`btn-ghost ${isListening ? 'listening-pulse' : ''}`}
                            style={{
                                padding: '8px 12px', borderRadius: '8px',
                                color: isListening ? '#ef4444' : 'var(--color-text-muted)',
                                background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem'
                            }}
                        >
                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            {isListening && <span>Listening...</span>}
                        </button>

                        <button onClick={() => setIsImagePickerOpen(true)} className="btn-ghost" title={generationMode === 'video' ? "Attach Image to Animate" : "Upload Reference Image for Prompt Analysis"} style={{ padding: '8px', borderRadius: '8px', color: referenceImage ? 'var(--color-accent-primary)' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                            <Paperclip size={16} />
                        </button>

                        {referenceImage && (
                            <button onClick={handleAutoPrompt} className={`btn-ghost ${isAutoPrompting ? 'animate-pulse' : ''}`} title="Analyze image with Gemini to auto-generate a detailed prompt" disabled={isAutoPrompting} style={{ padding: '8px', borderRadius: '8px', color: 'var(--color-accent-primary)', transition: 'all 0.2s', background: 'rgba(var(--color-accent-rgb), 0.1)' }}>
                                {isAutoPrompting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            </button>
                        )}

                        <button onClick={handleShare} className="btn-ghost" title="Share Configuration" style={{ padding: '8px', borderRadius: '8px', color: 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                            <Share2 size={16} />
                        </button>
                        <button onClick={() => setPrompt('')} className="btn-ghost" title="Clear Prompt" style={{ padding: '8px', borderRadius: '8px', color: 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setUseTurbo(!useTurbo)}
                            className="btn-ghost"
                            title={useTurbo ? "Disable Turbo Mode" : "Enable Turbo Mode (H100)"}
                            style={{
                                padding: '8px 16px', borderRadius: '10px',
                                border: useTurbo ? '1px solid #f59e0b' : '1px solid var(--color-border)',
                                background: useTurbo ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                color: useTurbo ? '#f59e0b' : 'var(--color-text-muted)',
                                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
                            }}
                        >
                            <Zap size={16} fill={useTurbo ? "currentColor" : "none"} />
                            <span>Turbo</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.8, background: useTurbo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                {useTurbo ? '1 ⚡' : 'OFF'}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                console.log('[GeneratorControls] Generate button CLICKED!');
                                console.log('[GeneratorControls] generating:', generating);
                                console.log('[GeneratorControls] prompt:', prompt);
                                console.log('[GeneratorControls] typeof handleGenerate:', typeof handleGenerate);
                                handleGenerate();
                            }}
                            disabled={generating || (!prompt && !referenceImage)}
                            className="btn-primary"
                            style={{
                                padding: '10px 24px', fontSize: '1rem', fontWeight: '600',
                                background: generating ? 'var(--color-surface-hover)' : 'var(--color-accent-primary)',
                                border: 'none', borderRadius: '10px', color: 'white',
                                cursor: generating || (!prompt && !referenceImage) ? 'not-allowed' : 'pointer',
                                opacity: generating || (!prompt && !referenceImage) ? 0.7 : 1,
                                boxShadow: '0 0 20px rgba(var(--color-accent-rgb), 0.3)',
                                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s'
                            }}
                        >
                            {generating ? <Loader2 className="animate-spin" size={18} /> : (
                                <> <Sparkles size={18} style={{ fill: 'currentColor' }} /> Generate </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
