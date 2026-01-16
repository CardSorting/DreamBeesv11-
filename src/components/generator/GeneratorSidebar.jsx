import React from 'react';
import { Sliders, HelpCircle, ChevronDown, ImageIcon, Square, Monitor, Smartphone, RectangleHorizontal, RectangleVertical, Sparkles, AlertCircle, Upload, Trash2, Dices, X } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils';

export default function GeneratorSidebar({
    activeTab, setActiveTab,
    generationMode, setGenerationMode,
    selectedModel,
    setIsModelModalOpen,
    aspectRatio, setAspectRatio,
    showcaseImages, setPrompt, setGeneratedImage,
    // Video Params
    videoDuration, setVideoDuration,
    videoResolution, setVideoResolution,
    setVideoAspectRatio, // Optional if we want separate video aspect control
    // Advanced Params
    seed, setSeed,
    steps, setSteps,
    cfg, setCfg,
    negPrompt, setNegPrompt,
    // Video Helper
    referenceImage, clearReferenceImage,
    setIsImagePickerOpen,
    recentImages,
    handleVideoAutoAnimate,
    analyzingImageId
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div className="glass-panel" style={{ padding: '16px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                    <Sliders size={16} /> PARAMETERS
                </div>

                {/* Mode Selector - Moved to main column */}

                {generationMode !== 'video' && (
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
                        {['simple', 'advanced'].map(tab => (
                            <button
                                key={tab} onClick={() => setActiveTab(tab)}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '8px',
                                    background: activeTab === tab ? 'var(--color-accent-primary)' : 'transparent',
                                    color: activeTab === tab ? 'white' : 'var(--color-text-muted)',
                                    fontSize: '0.85rem', fontWeight: '600', border: 'none', cursor: 'pointer',
                                    textTransform: 'capitalize', transition: 'all 0.2s'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Model Selector */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <label className="setting-label" style={{ marginBottom: 0 }}>MODEL ENGINE</label>
                                <div className="tooltip-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <HelpCircle size={12} color="var(--color-text-muted)" style={{ cursor: 'help' }} />
                                    <div className="tooltip-content">The Model Engine determines the artistic style and capability of your generation.</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{selectedModel?.id?.toUpperCase()}</span>
                        </div>
                        <button
                            onClick={() => setIsModelModalOpen(true)}
                            className="hover-glow-border"
                            style={{
                                width: '100%', padding: '12px', borderRadius: '16px',
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px',
                                cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#000', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {selectedModel?.image ? (
                                    <img src={getOptimizedImageUrl(selectedModel.image)} alt={selectedModel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}><ImageIcon size={24} /></div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', letterSpacing: '-0.02em', marginBottom: '2px' }}>{selectedModel?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {selectedModel?.description || "High quality image generation model."}
                                </div>
                            </div>
                            <div style={{ opacity: 0.5, paddingRight: '4px' }}><ChevronDown size={18} /></div>
                        </button>
                    </div>

                    {/* Simple Tab */}
                    {activeTab === 'simple' && (
                        <div className="fade-in">
                            <div style={{ marginBottom: '24px' }}>
                                <label className="setting-label">ASPECT RATIO</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                                    {[
                                        { label: '1:1', value: '1:1', icon: <Square size={16} /> },
                                        { label: '16:9', value: '16:9', icon: <Monitor size={16} /> },
                                        { label: '9:16', value: '9:16', icon: <Smartphone size={16} /> },
                                        { label: '3:2', value: '3:2', icon: <RectangleHorizontal size={16} /> },
                                        { label: '2:3', value: '2:3', icon: <RectangleVertical size={16} /> }
                                    ].map(r => (
                                        <button
                                            key={r.value} onClick={() => setAspectRatio(r.value)} title={r.label}
                                            className="hover:bg-white/5"
                                            style={{
                                                padding: '10px 4px', borderRadius: '10px',
                                                border: aspectRatio === r.value ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                                background: aspectRatio === r.value ? 'rgba(var(--color-accent-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                                                color: aspectRatio === r.value ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ opacity: aspectRatio === r.value ? 1 : 0.7 }}>{r.icon}</div>
                                            <span style={{ fontSize: '0.6rem', fontWeight: '600' }}>{r.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {generationMode === 'image' && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                        <label className="setting-label" style={{ marginBottom: 0 }}>PROMPT TEMPLATES</label>
                                        <div className="tooltip-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <HelpCircle size={12} color="var(--color-text-muted)" style={{ cursor: 'help' }} />
                                            <div className="tooltip-content">Selecting a template will overwrite your current prompt.</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                        {showcaseImages.slice(0, 9).map((img) => (
                                            <button
                                                key={img.id} onClick={() => setPrompt(img.prompt)}
                                                className="hover-card"
                                                style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', cursor: 'pointer', padding: 0, position: 'relative' }}
                                                title={img.prompt}
                                            >
                                                <img src={getOptimizedImageUrl(img.imageUrl)} alt="Style" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </button>
                                        ))}
                                    </div>
                                    {showcaseImages.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                            Select a model to see examples via showcase
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Advanced Tab (or Video Main) */}
                    {activeTab === 'advanced' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {generationMode === 'video' && (
                                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
                                    <div className="alert-box" style={{ padding: '12px', background: 'rgba(var(--color-accent-rgb), 0.1)', borderRadius: '8px', border: '1px solid var(--color-accent-primary)', color: 'white', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={16} /> <span>Video generation consumes usage-based <b>Reels</b> currency.</span>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <label className="setting-label">DURATION (SECONDS)</label>
                                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'white' }}>{videoDuration}s</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            {[6, 8, 10].map((dur) => (
                                                <button
                                                    key={dur} onClick={() => setVideoDuration(dur)}
                                                    style={{ padding: '10px', borderRadius: '8px', border: videoDuration === dur ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)', background: videoDuration === dur ? 'rgba(var(--color-accent-rgb), 0.1)' : 'rgba(255,255,255,0.02)', color: videoDuration === dur ? 'var(--color-accent-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s' }}
                                                >
                                                    {dur}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <label className="setting-label">RESOLUTION</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div className="tooltip-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                    <HelpCircle size={12} color="var(--color-text-muted)" style={{ cursor: 'help' }} />
                                                    <div className="tooltip-content">Higher resolutions consume more reels and take longer to generate.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                                            {['1080p', '2k', '4k'].map(res => (
                                                <button
                                                    key={res} onClick={() => setVideoResolution(res)}
                                                    style={{ padding: '10px', borderRadius: '8px', border: videoResolution === res ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)', background: videoResolution === res ? 'rgba(var(--color-accent-rgb), 0.1)' : 'rgba(255,255,255,0.02)', color: videoResolution === res ? 'var(--color-accent-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                                                >
                                                    {res}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Video Reference Images */}
                                    <div style={{ marginTop: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label className="setting-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 0 }}>
                                                <Sparkles size={12} /> BRING TO LIFE
                                            </label>
                                            {referenceImage && (
                                                <button onClick={clearReferenceImage} style={{ fontSize: '0.7rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Trash2 size={12} /> Clear
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            <button onClick={() => setIsImagePickerOpen(true)} className="carousel-item" style={{ aspectRatio: '1', borderRadius: '12px', border: '1px dashed var(--color-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', padding: 0 }}>
                                                <Upload size={18} /> <span style={{ fontSize: '0.65rem' }}>Upload</span>
                                            </button>
                                            {recentImages && recentImages.slice(0, 8).map((img) => {
                                                const isSelected = referenceImage === img.imageUrl;
                                                const isAnalyzing = analyzingImageId === img.id;
                                                return (
                                                    <button
                                                        key={img.id} onClick={() => handleVideoAutoAnimate(img)} disabled={!!analyzingImageId}
                                                        className="carousel-item"
                                                        style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: isSelected ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)', cursor: 'pointer', padding: 0, position: 'relative', transition: 'all 0.2s', background: '#000' }}
                                                    >
                                                        <img src={getOptimizedImageUrl(img.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: (isSelected || isAnalyzing) ? 1 : 0.7 }} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {generationMode !== 'video' && (
                                <>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <label className="setting-label">SEED</label>
                                            <button onClick={() => setSeed(seed === -1 ? Math.floor(Math.random() * 1000000000) : -1)} style={{ fontSize: '0.7rem', color: 'var(--color-accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                                {seed === -1 ? 'RANDOM' : 'CUSTOM'}
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input type="number" value={seed === -1 ? '' : seed} onChange={(e) => setSeed(parseInt(e.target.value) || -1)} placeholder="Random (-1)" style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.9rem' }} />
                                            <button onClick={() => setSeed(Math.floor(Math.random() * 1000000000))} className="btn-ghost" title="Roll Seed" style={{ padding: '8px', borderRadius: '8px', color: 'white', border: '1px solid var(--color-border)' }}>
                                                <Dices size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <label className="setting-label">STEPS</label>
                                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'white' }}>{steps}</span>
                                        </div>
                                        <input type="range" min="10" max="50" value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <label className="setting-label">GUIDANCE SCALE</label>
                                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'white' }}>{cfg}</span>
                                        </div>
                                        <input type="range" min="1" max="20" step="0.5" value={cfg} onChange={(e) => setCfg(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="setting-label">NEGATIVE PROMPT</label>
                                        <textarea value={negPrompt} onChange={(e) => setNegPrompt(e.target.value)} placeholder="blur, watermark, low quality..." style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', color: 'var(--color-text-main)', fontSize: '0.85rem', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .setting-label { display: block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 8px; text-transform: uppercase; }
                .hover-scale { transition: transform 0.4s ease; }
                .hover-card:hover .hover-scale { transform: scale(1.05); }
                .hover-card:hover { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.06) !important; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                .hover-glow-border:hover { border-color: rgba(255,255,255,0.3) !important; box-shadow: 0 0 20px rgba(255,255,255,0.05) !important; background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%) !important; }
                .tooltip-container:hover .tooltip-content { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
                .tooltip-content { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(5px); background: rgba(0,0,0,0.9); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 12px; border-radius: 8px; font-size: 0.75rem; width: max-content; max-width: 200px; text-align: center; opacity: 0; visibility: hidden; transition: all 0.2s; pointer-events: none; z-index: 10; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); text-transform: none; font-weight: 400; line-height: 1.4; }
            `}</style>
        </div>
    );
}
