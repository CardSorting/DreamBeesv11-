import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { useModel } from '../contexts/ModelContext';
import { getOptimizedImageUrl } from '../utils';

const ShowcaseModal = ({ image, onClose, model }) => {
    const { rateShowcaseImage } = useModel();
    const navigate = useNavigate();
    if (!image) return null;

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
                        src={getOptimizedImageUrl(image.url || image)}
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
                                rateShowcaseImage(image.id, newRating, model.id);
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
                                rateShowcaseImage(image.id, newRating, model.id);
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
                            <label className="meta-label">BASE</label>
                            <div className="meta-value">SDXL 1.0</div>
                        </div>
                        <div>
                            <label className="meta-label">STATUS</label>
                            <div className="meta-value">OFFICIAL</div>
                        </div>
                        <div>
                            <label className="meta-label">SOURCE</label>
                            <div className="meta-value">Official Showcase</div>
                        </div>
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
                            <button
                                onClick={() => {
                                    onClose();
                                    const params = new URLSearchParams();
                                    if (image.prompt) params.set('prompt', image.prompt);
                                    if (image.steps) params.set('steps', image.steps);
                                    if (image.cfg) params.set('cfg', image.cfg);
                                    if (image.aspectRatio) params.set('aspectRatio', image.aspectRatio);

                                    navigate(`/generate?${params.toString()}`);
                                }}
                                className="btn btn-outline w-full justify-center text-xs"
                            >
                                START CREATING
                            </button>
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
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ShowcaseModal;
