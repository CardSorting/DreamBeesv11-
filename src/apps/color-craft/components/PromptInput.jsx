import React, { useState } from 'react';
import { ArtStyle } from '../constants';
import {
    Wand2,
    Loader2,
    Smile,
    Feather,
    Snowflake,
    Zap,
    CheckCircle,
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

const PromptInput = ({ onCreateImage, isGenerating, error }) => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState(ArtStyle.SIMPLE);

    const handleCreateClick = () => {
        if (!prompt.trim()) return;
        onCreateImage(prompt, style);
    };

    return (
        <div className="cc-card">
            <div className="cc-card-body space-y-6">
                <div className="space-y-4">
                    <label style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', display: 'block' }}>
                        What would you like to color?
                    </label>
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A magical forest adventure with cute animals, mushrooms, and fairies..."
                            className="cc-textarea"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', display: 'block' }}>
                        Choose an Art Style
                    </label>
                    <div className="cc-gallery-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        {STYLE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isSelected = style === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setStyle(option.id)}
                                    className="relative p-3 rounded-xl border-2 text-left transition-all duration-200"
                                    style={{
                                        borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                                        backgroundColor: isSelected ? '#eef2ff' : 'white',
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div style={{
                                            padding: '0.4rem',
                                            borderRadius: '0.4rem',
                                            backgroundColor: isSelected ? '#4f46e5' : '#f1f5f9',
                                            color: isSelected ? 'white' : '#64748b'
                                        }}>
                                            <Icon style={{ width: '1rem', height: '1rem' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: isSelected ? '#312e81' : '#0f172a' }}>
                                                {option.label}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#4f46e5' }}>
                                            <CheckCircle style={{ width: '1rem', height: '1rem', fill: '#4f46e5', color: 'white' }} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle style={{ width: '1rem', height: '1rem' }} />
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCreateClick}
                    disabled={isGenerating || !prompt.trim()}
                    className="cc-btn cc-btn-primary"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '0.875rem',
                        borderRadius: '0.75rem',
                        background: isGenerating ? '#cbd5e1' : 'linear-gradient(to right, #4f46e5, #7c3aed)',
                        cursor: isGenerating ? 'wait' : (prompt.trim() ? 'pointer' : 'not-allowed'),
                        opacity: !prompt.trim() && !isGenerating ? 0.6 : 1
                    }}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="cc-animate-spin" style={{ width: '1.25rem', height: '1.25rem' }} />
                            Generating Page...
                        </>
                    ) : (
                        <>
                            <Wand2 style={{ width: '1.25rem', height: '1.25rem' }} />
                            Generate Coloring Page
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PromptInput;
