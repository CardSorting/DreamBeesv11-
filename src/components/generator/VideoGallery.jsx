import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Video, ImageIcon, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils';

export default function VideoGallery({
    recentImages,
    analyzingImageId,
    handleVideoAutoAnimate,
    onViewAll
}) {
    return (
        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} className="text-purple-400" />
                    Bring to Life (Recent)
                </div>
                {onViewAll && (
                    <Link to="/gallery" style={{ fontSize: '0.8rem', color: 'var(--color-accent-primary)', textDecoration: 'none' }}>
                        View All
                    </Link>
                )}
            </div>

            {recentImages.length > 0 ? (
                <div className="custom-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', scrollBehavior: 'smooth' }}>
                    {recentImages.map(img => (
                        <button
                            key={img.id}
                            onClick={() => handleVideoAutoAnimate(img)}
                            disabled={!!analyzingImageId}
                            className="carousel-item"
                            style={{
                                flexShrink: 0, width: '140px', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', padding: 0,
                                background: '#000', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                            }}
                        >
                            <img src={getOptimizedImageUrl(img.imageUrl)} alt={img.prompt?.slice(0, 80) || "Generated image for animation"} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: analyzingImageId === img.id ? 0.5 : 1 }} />
                            <div className="hover-overlay" style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', backdropFilter: 'blur(2px)'
                            }}>
                                <div style={{ background: 'white', color: 'black', borderRadius: '50%', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Video size={18} fill="currentColor" />
                                </div>
                            </div>
                            {analyzingImageId === img.id && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                                    <Loader2 size={24} className="animate-spin" color="white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    <ImageIcon size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <div style={{ fontSize: '0.9rem' }}>No recent images found.</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Generate or upload an image to animate it.</div>
                </div>
            )}
            <style>{`
                .carousel-item:hover .hover-overlay { opacity: 1; }
                .carousel-item:hover { transform: translateY(-4px) scale(1.02); border-color: var(--color-accent-primary) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10; }
            `}</style>
        </div>
    );
}
