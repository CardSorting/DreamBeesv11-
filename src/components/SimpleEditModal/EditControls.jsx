import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { PRESETS } from './constants';

const EditControls = ({ prompt, setPrompt, handleEdit, isGenerating }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructions</label>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Add red hair, change to night scene, make it cinematic..."
                style={{
                    flex: 1,
                    width: '100%',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s'
                }}
                onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(168, 85, 247, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                disabled={isGenerating}
                autoFocus
            />

            {/* Preset Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESETS.map((preset) => (
                    <button
                        key={preset.text}
                        onClick={() => setPrompt(preset.text)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '16px',
                            padding: '6px 12px',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.borderColor = 'var(--color-text-muted)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        disabled={isGenerating}
                    >
                        <span>{preset.icon}</span>
                        {preset.text}
                    </button>
                ))}
            </div>

            <button
                onClick={handleEdit}
                disabled={isGenerating || !prompt.trim()}
                style={{
                    width: '100%',
                    height: '56px',
                    background: isGenerating || !prompt.trim() ? 'var(--color-zinc-800)' : 'linear-gradient(to right, #4f46e5, #9333ea)',
                    color: isGenerating || !prompt.trim() ? 'var(--color-text-dim)' : 'white',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.3s',
                    boxShadow: isGenerating || !prompt.trim() ? 'none' : '0 10px 20px -5px rgba(79, 70, 229, 0.3)'
                }}
                onMouseEnter={e => {
                    if (!isGenerating && prompt.trim()) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(79, 70, 229, 0.4)';
                    }
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isGenerating || !prompt.trim() ? 'none' : '0 10px 20px -5px rgba(79, 70, 229, 0.3)';
                }}
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                        Processing...
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        APPLY EDIT
                    </>
                )}
            </button>
        </div>
    );
};

export default EditControls;
