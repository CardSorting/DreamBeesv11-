import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, ThumbsUp, ThumbsDown, Sparkles, Flag } from 'lucide-react';
import { useUserInteractions } from '../contexts/UserInteractionsContext';
import { useModel } from '../contexts/ModelContext';
import { useTwitch } from '../contexts/TwitchContext';
import { getOptimizedImageUrl } from '../utils';
import { trackLoopConversion } from '../utils/analytics';

const ShowcaseModal = ({ image, onClose, model }) => {
    const { rateShowcaseImage } = useModel();
    const { hidePost, isHidden } = useUserInteractions();
    const { personas } = useTwitch();
    const navigate = useNavigate();

    // Defensive check: If image is missing, don't render anything (or could render error state)
    if (!image) return null;

    // Auto close if hidden while open
    if (isHidden(image.id)) {
        // slightly delayed close if we just hid it? Or immediate?
        // If it's hidden, we shouldn't show it.
        // If the user *just* hid it, we probably want to show a toast and close.
        // But if we return null, it just disappears.
        onClose();
        return null;
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'var(--color-bg)',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {/* Top Bar */}
            <div style={{
                height: '60px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', background: 'var(--color-bg)'
            }}>
                <button
                    onClick={onClose}
                    className="flex-center"
                    style={{ gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: '500', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <ArrowLeft size={16} /> Back to Gallery
                </button>

                <div className="flex-center" style={{ gap: '12px' }}>
                    <button
                        onClick={() => {
                            hidePost(image);
                            onClose();
                        }}
                        className="btn-ghost"
                        title="Hide Post"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <Flag size={20} />
                    </button>
                    <button onClick={onClose} className="btn-ghost" title="Close" style={{ marginLeft: '12px' }}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Split Layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Image View */}
                <div style={{
                    flex: 1,
                    background: '#050505',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '40px',
                    position: 'relative'
                }}>
                    <img
                        src={getOptimizedImageUrl(image.imageUrl || image.url || image)}
                        alt={image.prompt ? `Showcase: ${image.prompt}` : "Model Showcase Detail"}
                        style={{
                            maxWidth: '100%', maxHeight: '100%',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {/* Info Panel */}
                <div style={{
                    width: '400px',
                    borderLeft: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    overflowY: 'auto',
                    padding: '32px'
                }}>
                    <div style={{ marginBottom: '40px' }}>
                        <label className="meta-label">PROMPT</label>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'white', fontWeight: '400', fontStyle: 'italic', opacity: 0.8 }}>
                            {image.prompt ? `"${image.prompt}"` : `"This is a curated showcase generation demonstrating the capabilities of ${model?.name || 'this model'}. High-fidelity details and texture handling are key characteristics shown here."`}
                        </p>
                    </div>

                    {/* Ranking UI */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                        <button
                            onClick={() => {
                                const newRating = image.rating === 1 ? 0 : 1;
                                rateShowcaseImage(image.id, newRating, model?.id); // Safe model access
                            }}
                            className={`btn-ghost ${image.rating === 1 ? 'active-vote' : ''}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                color: image.rating === 1 ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                background: image.rating === 1 ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                padding: '8px 16px', borderRadius: '100px', border: '1px solid transparent',
                                borderColor: image.rating === 1 ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                        >
                            <ThumbsUp size={16} fill={image.rating === 1 ? "currentColor" : "none"} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Helpful</span>
                        </button>

                        <button
                            onClick={() => {
                                const newRating = image.rating === -1 ? 0 : -1;
                                rateShowcaseImage(image.id, newRating, model?.id); // Safe model access
                            }}
                            className={`btn-ghost ${image.rating === -1 ? 'active-vote' : ''}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                color: image.rating === -1 ? '#ef4444' : 'var(--color-text-muted)',
                                background: image.rating === -1 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                padding: '8px 16px', borderRadius: '100px', border: '1px solid transparent',
                                borderColor: image.rating === -1 ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                        >
                            <ThumbsDown size={16} fill={image.rating === -1 ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 0 40px 0' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 12px' }}>
                        <div>
                            <label className="meta-label">MODEL</label>
                            <div className="meta-value">{model?.name || 'Unknown'}</div>
                        </div>
                        <div>
                            <label className="meta-label">AESTHETIC</label>
                            <div className="meta-value">
                                {image.aesthetics?.quality || 'Standard'}
                                <span style={{ opacity: 0.5, fontSize: '0.8em', marginLeft: '6px' }}>
                                    {image.aesthetics?.score ? `${image.aesthetics.score}/10` : ''}
                                </span>
                            </div>
                        </div>

                        {/* New Metadata Display */}
                        {image.colors?.paletteName && (
                            <div className="col-span-2" style={{ gridColumn: 'span 2' }}>
                                <label className="meta-label">PALETTE</label>
                                <div className="meta-value flex items-center gap-2">
                                    {image.colors.paletteName}
                                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                        {image.colors.dominant?.map((c, i) => (
                                            <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.2)' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {image.discovery?.vibeTags && (
                            <div className="col-span-2" style={{ gridColumn: 'span 2' }}>
                                <label className="meta-label">VIBE TAGS</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {image.discovery.vibeTags.map((tag, i) => (
                                        <span key={i} style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem'
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {image.style?.primary && (
                            <div>
                                <label className="meta-label">STYLE</label>
                                <div className="meta-value">{image.style.primary}</div>
                            </div>
                        )}
                        {image.style?.subGenre && (
                            <div>
                                <label className="meta-label">GENRE</label>
                                <div className="meta-value">{image.style.subGenre}</div>
                            </div>
                        )}

                        <div>
                            <label className="meta-label">STEPS</label>
                            <div className="meta-value">{image.steps || 30}</div>
                        </div>
                        <div>
                            <label className="meta-label">GUIDANCE</label>
                            <div className="meta-value">{image.cfg || 7.0}</div>
                        </div>
                        <div>
                            <label className="meta-label">DIMENSIONS</label>
                            <div className="meta-value">{image.width && image.height ? `${image.width}x${image.height}` : '1024x1024'}</div>
                        </div>
                        <div>
                            <label className="meta-label">SCHEDULER</label>
                            <div className="meta-value">{image.scheduler || 'DPM++ 2M'}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '60px' }}>
                        <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)]">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Sparkles size={14} className="text-[var(--color-accent-primary)]" />
                                INSPIRED?
                            </h4>
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                Activate this model engine to generate similar high-quality results.
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => {
                                        onClose();
                                        const params = new URLSearchParams();
                                        if (image.prompt) params.set('prompt', image.prompt);
                                        if (image.steps) params.set('steps', image.steps);
                                        if (image.cfg) params.set('cfg', image.cfg);
                                        if (image.aspectRatio) params.set('aspectRatio', image.aspectRatio);

                                        trackLoopConversion('showcase_start_creating', model?.id);
                                        navigate(`/generate?${params.toString()}`);
                                    }}
                                    className="btn btn-outline w-full justify-center text-xs"
                                    style={{ flex: 1 }}
                                >
                                    START CREATING
                                </button>
                                {(() => {
                                    const persona = personas.find(p => p.id === image.id);

                                    // Threshold Logic (Matches Backend: 15 mins)
                                    const ACTIVE_THRESHOLD_MS = 15 * 60 * 1000;
                                    const activePersonas = personas.filter(p => {
                                        const lastActivity = p.lastActivity?.toMillis?.() || p.lastActivity?.seconds * 1000 || 0;
                                        return (Date.now() - lastActivity) < ACTIVE_THRESHOLD_MS;
                                    });

                                    const isSystemAtCapacity = activePersonas.length >= 5;
                                    const isTargetPersonaActive = persona && (Date.now() - (persona.lastActivity?.toMillis?.() || persona.lastActivity?.seconds * 1000 || 0)) < ACTIVE_THRESHOLD_MS;

                                    const shouldRedirectToBrowse = !isTargetPersonaActive && isSystemAtCapacity;

                                    return (
                                        <button
                                            onClick={() => {
                                                onClose();
                                                if (shouldRedirectToBrowse) {
                                                    navigate('/browse');
                                                } else {
                                                    trackLoopConversion('showcase_talk_to_picture', model?.id);
                                                    navigate(`/channel/${image.id}`, { state: { imageItem: image } });
                                                }
                                            }}
                                            className="btn w-full justify-center text-xs"
                                            title={shouldRedirectToBrowse ? "System at capacity. View active channels." : ""}
                                            style={{
                                                flex: 1,
                                                background: '#a970ff',
                                                color: 'white',
                                                border: 'none',
                                                fontWeight: '700',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {shouldRedirectToBrowse ? 'VIEW LIVE CHANNELS' : 'TALK TO A PICTURE'}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                .meta-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: var(--color-text-dim);
                    text-transform: uppercase;
                    display: block;
                    margin-bottom: 8px;
                }
                .meta-value {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: white;
                }
                /* Mobile Responsiveness for Modal */
                @media (max-width: 768px) {
                    div[style*="display: flex; flex: 1"] {
                        flex-direction: column;
                        overflow-y: auto !important;
                    }
                    /* Image Container */
                    div[style*="background: #050505"] {
                        min-height: 400px;
                        padding: 20px !important;
                    }
                    /* Info Panel */
                    div[style*="width: 400px"] {
                        width: 100% !important;
                        border-left: none !important;
                        border-top: 1px solid var(--color-border);
                        padding: 20px !important;
                        overflow-y: visible !important;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ShowcaseModal;
