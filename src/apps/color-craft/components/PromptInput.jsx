import React, { useState } from 'react';
import { ArtStyle } from '../constants';
import {
    Wand2,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Smile,
    Feather,
    Snowflake,
    Zap,
    CheckCircle,
    BookOpen,
    AlertCircle
} from 'lucide-react';

const STYLE_OPTIONS = [
    {
        id: ArtStyle.SIMPLE,
        label: 'Simple',
        description: 'Thick lines, easy to color. Perfect for kids.',
        icon: Smile
    },
    {
        id: ArtStyle.DETAILED,
        label: 'Realistic',
        description: 'Intricate details and textures for adults.',
        icon: Feather
    },
    {
        id: ArtStyle.MANDALA,
        label: 'Mandala',
        description: 'Geometric patterns for relaxation.',
        icon: Snowflake
    },
    {
        id: ArtStyle.ANIME,
        label: 'Anime',
        description: 'Dynamic manga-style line art.',
        icon: Zap
    },
];

const PromptInput = ({ onCreateBook, isGeneratingConcepts, error }) => {
    const [step, setStep] = useState(1);
    const [theme, setTheme] = useState('');
    const [style, setStyle] = useState(ArtStyle.SIMPLE);

    const handleNext = () => {
        if (step === 1 && !theme.trim()) return;
        setStep((prev) => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setStep((prev) => Math.max(prev - 1, 1));
    };

    const handleCreateClick = () => {
        onCreateBook(theme, style);
        // We stay on step 3 to show loading state via button props
    };

    // --- Step Content Renderers ---

    const renderStep1 = () => (
        <div className="space-y-6" style={{ animation: 'cc-slide-in-top 0.3s ease-out' }}>
            <div className="cc-hero-text-center space-y-2">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>1. Choose a Theme</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>What should your coloring book be about?</p>
            </div>
            <div className="relative">
                <textarea
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g., A magical forest adventure with cute animals, mushrooms, and fairies..."
                    className="cc-textarea"
                    autoFocus
                />
                <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem' }}>
                    <BookOpen style={{ width: '1.25rem', height: '1.25rem', color: '#cbd5e1' }} />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6" style={{ animation: 'cc-slide-in-top 0.3s ease-out' }}>
            <div className="cc-hero-text-center space-y-2">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>2. Pick an Art Style</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Consistent style for all 30 pages.</p>
            </div>
            <div className="cc-gallery-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {STYLE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = style === option.id;
                    return (
                        <button
                            key={option.id}
                            onClick={() => setStyle(option.id)}
                            className="relative p-4 rounded-xl border-2 text-left transition-all duration-200 group"
                            style={{
                                borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                                backgroundColor: isSelected ? '#eef2ff' : 'white',
                                boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                                ring: isSelected ? '2px solid rgba(79, 70, 229, 0.2)' : 'none'
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: isSelected ? '#4f46e5' : '#f1f5f9',
                                    color: isSelected ? 'white' : '#64748b'
                                }}>
                                    <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: isSelected ? '#312e81' : '#0f172a' }}>
                                        {option.label}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: isSelected ? '#4338ca' : '#64748b' }}>
                                        {option.description}
                                    </div>
                                </div>
                            </div>
                            {isSelected && (
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#4f46e5' }}>
                                    <CheckCircle style={{ width: '1.25rem', height: '1.25rem', fill: '#4f46e5', color: 'white' }} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="cc-hero-text-center" style={{ animation: 'cc-slide-in-top 0.3s ease-out', padding: '1rem 0' }}>
            <div className="space-y-2">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Ready to Create?</h3>
                <p style={{ color: '#64748b' }}>We will brainstorm 30 unique pages and start generating them.</p>
            </div>

            <div style={{
                backgroundColor: '#f8fafc',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                maxWidth: '24rem',
                margin: '2rem auto',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }} className="space-y-4">
                <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Book Theme</span>
                    <p style={{ fontWeight: '500', color: '#1e293b', marginTop: '0.25rem' }}>{theme}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                        {(() => {
                            const opt = STYLE_OPTIONS.find(o => o.id === style);
                            const Icon = opt?.icon || Smile;
                            return <Icon style={{ width: '1.25rem', height: '1.25rem', color: '#4f46e5' }} />;
                        })()}
                    </div>
                    <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Art Style</span>
                        <p style={{ fontWeight: '500', color: '#1e293b' }}>
                            {STYLE_OPTIONS.find(o => o.id === style)?.label}
                        </p>
                    </div>
                </div>
                <div style={{ paddingTop: '0.5rem' }}>
                    <div style={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'inline-block' }}>
                        30 Pages Total
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <AlertCircle style={{ width: '1rem', height: '1rem' }} />
                    {error}
                </div>
            )}
        </div>
    );

    return (
        <div className="cc-card">

            {/* Loading Overlay for Step 2 (Concept Generation) */}
            {isGeneratingConcepts && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 50, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <div className="cc-animate-spin" style={{ width: '5rem', height: '5rem', border: '4px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%' }}></div>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                            <Wand2 className="animate-pulse" style={{ width: '2rem', height: '2rem', color: '#4f46e5' }} />
                        </div>
                    </div>
                    <h3 style={{ marginTop: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>Dreaming up ideas...</h3>
                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Brainstorming 30 unique page concepts for your book.</p>
                </div>
            )}

            {/* Step Progress Indicator */}
            <div className="cc-card-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '20rem', margin: '0 auto', position: 'relative' }}>
                    {/* Connecting Line */}
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>

                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            style={{
                                position: 'relative',
                                zIndex: 10,
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s',
                                backgroundColor: step >= s ? '#4f46e5' : 'white',
                                color: step >= s ? 'white' : '#94a3b8',
                                border: step >= s ? 'none' : '2px solid #e2e8f0',
                                transform: step === s ? 'scale(1.1)' : 'scale(1)',
                                boxShadow: step === s ? '0 10px 15px -3px rgba(79, 70, 229, 0.3)' : 'none'
                            }}
                        >
                            {s}
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '20rem', margin: '0.5rem auto 0', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                    <span style={{ color: step >= 1 ? '#4f46e5' : '' }}>Theme</span>
                    <span style={{ color: step >= 2 ? '#4f46e5' : '' }}>Style</span>
                    <span style={{ color: step >= 3 ? '#4f46e5' : '' }}>Create</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="cc-card-body">
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                {/* Footer Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f8fafc' }}>
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: '500', padding: '0.5rem 1rem', borderRadius: '0.5rem', transition: 'color 0.2s' }}
                            disabled={isGeneratingConcepts}
                        >
                            <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
                            Back
                        </button>
                    ) : (
                        <div></div> // Spacer
                    )}

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!theme.trim()}
                            className="cc-btn cc-btn-primary"
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.75rem',
                                backgroundColor: !theme.trim() ? '#e2e8f0' : '#4f46e5',
                                cursor: !theme.trim() ? 'not-allowed' : 'pointer',
                                color: !theme.trim() ? '#94a3b8' : 'white',
                                boxShadow: !theme.trim() ? 'none' : '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                            }}
                        >
                            Next
                            <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreateClick}
                            disabled={isGeneratingConcepts}
                            className="cc-btn cc-btn-primary"
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                padding: '0.75rem 2rem',
                                border: 'none',
                                borderRadius: '0.75rem',
                                background: isGeneratingConcepts ? '#cbd5e1' : 'linear-gradient(to right, #4f46e5, #7c3aed)',
                                cursor: isGeneratingConcepts ? 'wait' : 'pointer'
                            }}
                        >
                            {isGeneratingConcepts ? (
                                <>
                                    <Loader2 className="cc-animate-spin" style={{ width: '1.25rem', height: '1.25rem' }} />
                                    Wait...
                                </>
                            ) : (
                                <>
                                    <Wand2 style={{ width: '1.25rem', height: '1.25rem' }} />
                                    Generate 30-Page Book
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptInput;
