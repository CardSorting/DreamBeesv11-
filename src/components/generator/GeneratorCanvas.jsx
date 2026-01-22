import React from 'react';
import { Loader2, Film, Image as ImageIcon, Maximize2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../../utils';

export default function GeneratorCanvas({
    generating,
    progress,
    elapsedTime,
    currentJobId,
    generatedImage,
    generationMode,
    activeJob: _activeJob,
    onRate,
    onFullscreen,
    prompt
}) {
    return (
        <div style={{ flex: '0 0 auto', height: '500px', background: '#050505', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
            `}</style>

            {generating ? (
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: 'rgba(255,255,255,0.1)', letterSpacing: '-0.05em' }} className="animate-pulse-slow">
                        RENDERING
                    </div>
                    <div style={{ height: '1px', width: '200px', background: 'rgba(255,255,255,0.1)', margin: '20px auto', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: 'var(--color-accent-primary)' }} />
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {(elapsedTime / 10).toFixed(1)}s / JOB-{currentJobId ? currentJobId.slice(0, 4).toUpperCase() : 'INIT'}
                    </div>
                </div>
            ) : generatedImage ? (
                <div className="fade-in" style={{ position: 'absolute', inset: 0, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/\.(mp4|webm|mov|mkv)($|\?)/i.test(generatedImage) ? (
                        <video
                            src={generatedImage}
                            controls
                            autoPlay
                            loop
                            style={{ width: '100%', height: '100%', boxShadow: '0 0 50px rgba(0,0,0,0.5)', objectFit: 'contain' }}
                        />
                    ) : (
                        <>
                            <img
                                src={getOptimizedImageUrl(generatedImage)}
                                alt={`Generated artwork for prompt: ${prompt}`}
                                style={{
                                    width: '100%', height: '100%', boxShadow: '0 0 50px rgba(0,0,0,0.5)', objectFit: 'contain',
                                    transition: 'opacity 0.4s ease', transformOrigin: 'center'
                                }}
                                onLoad={(e) => { e.target.style.opacity = '1'; }}
                            />
                        </>
                    )}
                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginRight: '16px', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <button onClick={() => onRate(1)} className="btn-icon-hover" style={{ padding: '6px', borderRadius: '6px', color: 'white', cursor: 'pointer', background: 'transparent', border: 'none' }} title="I like this">
                                <ThumbsUp size={18} />
                            </button>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '4px 0' }} />
                            <button onClick={() => onRate(-1)} className="btn-icon-hover" style={{ padding: '6px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', background: 'transparent', border: 'none' }} title="I dislike this (Hide)">
                                <ThumbsDown size={18} />
                            </button>
                        </div>
                        <button onClick={onFullscreen} className="btn-icon" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Fullscreen">
                            <Maximize2 size={18} />
                        </button>
                        <Link to="/gallery" className="btn btn-outline" style={{ padding: '0 16px', height: '36px', fontSize: '0.8rem' }}>Gallery</Link>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', opacity: 0.3 }}>
                    {generationMode === 'video' ? <Film size={64} style={{ marginBottom: '16px' }} /> : <ImageIcon size={64} style={{ marginBottom: '16px' }} />}
                    <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>Ready to Dream</div>
                </div>
            )}
        </div>
    );
}
