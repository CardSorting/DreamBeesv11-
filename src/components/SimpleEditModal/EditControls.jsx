import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, X, Plus, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PRESET_CATEGORIES } from './constants';

const MAX_PROMPT_LENGTH = 500;

const EditControls = ({
    prompt,
    setPrompt,
    handleEdit,
    isGenerating,
    activeCategoryIndex,
    setActiveCategoryIndex,
    activePresetIndex,
    setActivePresetIndex,
    isMobile,
    isCompact,
    hideGenerateButton,
    statusText
}) => {
    const [appendMode, setAppendMode] = useState(true);
    const presetsScrollRef = useRef(null);

    // Sync with parent category index
    useEffect(() => {
        if (activeCategoryIndex !== undefined) {
            // Scroll to active category if needed
        }
    }, [activeCategoryIndex]);

    const handlePresetClick = (presetText, index) => {
        let newPrompt = prompt.trim();
        const cleanPreset = presetText.trim();

        // Update active index for visual feedback
        if (setActivePresetIndex) {
            setActivePresetIndex(index);
        }

        if (appendMode && newPrompt) {
            // Avoid duplicates: check if preset is already in prompt (case-insensitive)
            const lowerPrompt = newPrompt.toLowerCase();
            const lowerPreset = cleanPreset.toLowerCase();

            if (!lowerPrompt.includes(lowerPreset)) {
                // Remove trailing punctuation if present before appending
                if (newPrompt.endsWith('.') || newPrompt.endsWith(',')) {
                    newPrompt = newPrompt.slice(0, -1);
                }
                newPrompt = `${newPrompt}, ${lowerPreset}`;
            } else {
                // If already present, maybe just flash the UI or do nothing? 
                // For now, let's re-run generation to be safe/responsive to the click
            }
        } else {
            newPrompt = cleanPreset;
        }

        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        // Immediate feedback toast
        toast.dismiss(); // Clear existing
        toast.success(`Applying ${cleanPreset}...`, {
            icon: '✨',
            duration: 2000,
            style: {
                background: 'rgba(9, 9, 11, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
            }
        });

        setPrompt(newPrompt);
        // Trigger generation immediately with the new prompt
        handleEdit(newPrompt);
    };

    const handleClear = () => {
        setPrompt('');
    };

    const charCount = prompt.length;
    const isNearLimit = charCount > MAX_PROMPT_LENGTH * 0.8;
    const isAtLimit = charCount >= MAX_PROMPT_LENGTH;

    const activeCategory = PRESET_CATEGORIES[activeCategoryIndex || 0];
    const activePresets = activeCategory?.presets || [];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '12px' : '16px',
            flex: 1,
            minHeight: 0
        }}>
            {/* Header with Label and Character Count */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <label style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: isGenerating ? '#a855f7' : 'var(--color-text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    animation: isGenerating ? 'pulse-purple 2s infinite' : 'none'
                }}>
                    <Wand2 size={isMobile ? 12 : 14} style={{ animation: isGenerating ? 'spin-slow 4s linear infinite' : 'none' }} />
                    Instructions
                </label>
                <span style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: isAtLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                    fontWeight: '600',
                    transition: 'color 0.3s'
                }}>
                    {charCount}/{MAX_PROMPT_LENGTH}
                </span>
            </div>

            {/* Prompt Input with Clear Button */}
            <div style={{ position: 'relative' }}>
                <textarea
                    value={prompt}
                    onChange={(e) => {
                        if (e.target.value.length <= MAX_PROMPT_LENGTH) {
                            setPrompt(e.target.value);
                        }
                    }}
                    placeholder="Describe the changes you want to make..."
                    maxLength={MAX_PROMPT_LENGTH}
                    style={{
                        flex: 1,
                        width: '100%',
                        minHeight: isMobile ? '80px' : '120px',
                        padding: isMobile ? '12px 40px 12px 12px' : '16px 44px 16px 16px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isGenerating ? 'rgba(168, 85, 247, 0.3)' : isAtLimit ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: isMobile ? '12px' : '16px',
                        color: 'white',
                        fontFamily: 'inherit',
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        lineHeight: '1.5',
                        resize: 'none',
                        outline: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                        opacity: isGenerating ? 0.6 : 1
                    }}
                    onFocus={e => {
                        if (isGenerating) return;
                        e.currentTarget.style.borderColor = isAtLimit ? 'rgba(239, 68, 68, 0.8)' : 'rgba(168, 85, 247, 0.5)';
                        e.currentTarget.style.boxShadow = `0 0 0 4px ${isAtLimit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(168, 85, 247, 0.1)'}, inset 0 2px 4px rgba(0, 0, 0, 0.3)`;
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onBlur={e => {
                        e.currentTarget.style.borderColor = isAtLimit ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }}
                    disabled={isGenerating}
                    autoFocus={!isMobile}
                />

                {isGenerating && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: isMobile ? '12px' : '16px',
                        overflow: 'hidden',
                        pointerEvents: 'none',
                        zIndex: 5
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            width: '40%',
                            background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.1), transparent)',
                            animation: 'shimmer-x 2s infinite linear'
                        }} />
                    </div>
                )}

                {prompt && !isGenerating && (
                    <button
                        onClick={handleClear}
                        style={{
                            position: 'absolute',
                            top: isMobile ? '8px' : '12px',
                            right: isMobile ? '8px' : '12px',
                            padding: isMobile ? '4px' : '6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            minWidth: isMobile ? '32px' : 'auto',
                            minHeight: isMobile ? '32px' : 'auto',
                            zIndex: 10
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                        }}
                        title="Clear prompt"
                    >
                        <X size={isMobile ? 14 : 16} />
                    </button>
                )}
            </div>

            {!isMobile && (
                <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.45)',
                    fontWeight: '500',
                    lineHeight: '1.5'
                }}>
                    Tip: be specific about what to change, like “add soft lighting” or “swap the background to a city”.
                </div>
            )}

            {isMobile && !isCompact && (
                <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.45)',
                    fontWeight: '500',
                    lineHeight: '1.5'
                }}>
                    Tip: be specific about what to change, like “add soft lighting” or “swap the background to a city”.
                </div>
            )}

            {/* Append Mode Toggle */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '6px 10px' : '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: isMobile ? '8px' : '10px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: '500'
                }}>
                    Presets:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setAppendMode(true)}
                        style={{
                            padding: isMobile ? '4px 10px' : '6px 12px',
                            background: appendMode ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                            border: `1px solid ${appendMode ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '8px',
                            color: appendMode ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Plus size={isMobile ? 10 : 12} />
                        Add
                    </button>
                    <button
                        onClick={() => setAppendMode(false)}
                        style={{
                            padding: isMobile ? '4px 10px' : '6px 12px',
                            background: !appendMode ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                            border: `1px solid ${!appendMode ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '8px',
                            color: !appendMode ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Replace
                    </button>
                </div>
            </div>

            {!isMobile && (
                <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontWeight: '500'
                }}>
                    Add = append to your instructions. Replace = swap the entire prompt.
                </div>
            )}

            {isMobile && !isCompact && (
                <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontWeight: '500'
                }}>
                    Add = append to your instructions. Replace = swap the entire prompt.
                </div>
            )}

            {/* Category Tabs - Horizontal scroll on mobile */}
            <div style={{
                display: 'flex',
                gap: isMobile ? '6px' : '8px',
                overflowX: isMobile ? 'auto' : 'visible',
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                padding: '4px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: isMobile ? '10px' : '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
            }}>
                {PRESET_CATEGORIES.map((category, index) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategoryIndex && setActiveCategoryIndex(index)}
                        style={{
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            background: (activeCategoryIndex || 0) === index ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: (activeCategoryIndex || 0) === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        {category.label}
                        {(activeCategoryIndex || 0) === index && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px',
                                height: '4px',
                                background: '#a855f7',
                                borderRadius: '50%'
                            }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Preset Chips - Horizontal scroll on mobile */}
            {/* Preset Cards Grid - Responsive & Animated */}
            <div className="preset-grid" ref={presetsScrollRef} style={{ marginTop: '12px' }}>
                {activePresets.map((preset, index) => {
                    const isActive = activePresetIndex === index;
                    return (
                        <button
                            key={preset.text}
                            onClick={() => handlePresetClick(preset.text, index)}
                            title={preset.description}
                            disabled={isGenerating}
                            className={`preset-card ${isActive ? 'active' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="preset-card-bg" />
                            <div className="preset-card-content">
                                {isActive && isGenerating ? (
                                    <Loader2 className="preset-card-icon spin" size={20} />
                                ) : (
                                    <span className="preset-card-icon">{preset.icon}</span>
                                )}
                                <span className="preset-card-text">{preset.text}</span>
                            </div>
                            {isActive && <div className="preset-card-glow" />}
                        </button>
                    );
                })}
            </div>

            {/* Generate Button */}
            {!hideGenerateButton && (
                <button
                    onClick={handleEdit}
                    disabled={isGenerating || !prompt.trim() || isAtLimit}
                    style={{
                        width: '100%',
                        height: isMobile ? '48px' : '56px',
                        marginTop: 'auto',
                        background: isGenerating || !prompt.trim() || isAtLimit
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                        color: isGenerating || !prompt.trim() || isAtLimit
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'white',
                        borderRadius: isMobile ? '14px' : '16px',
                        fontWeight: '800',
                        fontSize: isMobile ? '0.85rem' : '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        cursor: isGenerating || !prompt.trim() || isAtLimit ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        border: 'none',
                        boxShadow: isGenerating || !prompt.trim() || isAtLimit
                            ? 'none'
                            : '0 10px 25px -10px rgba(168, 85, 247, 0.5)',
                        position: 'relative',
                        overflow: 'hidden',
                        flexShrink: 0,
                        touchAction: 'manipulation',
                        minHeight: isMobile ? '48px' : '56px'
                    }}
                    onMouseEnter={e => {
                        if (!isGenerating && prompt.trim() && !isAtLimit) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(168, 85, 247, 0.6)';
                            e.currentTarget.style.filter = 'brightness(1.1)';
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = isGenerating || !prompt.trim() || isAtLimit
                            ? 'none'
                            : '0 10px 25px -10px rgba(168, 85, 247, 0.5)';
                        e.currentTarget.style.filter = 'brightness(1)';
                    }}
                    onTouchStart={e => {
                        if (!isGenerating && prompt.trim() && !isAtLimit) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.filter = 'brightness(1.1)';
                        }
                    }}
                    onTouchEnd={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.filter = 'brightness(1)';
                    }}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={isMobile ? 18 : 20} style={{ animation: 'spin 1s linear infinite' }} />
                            {statusText || 'Creating...'}
                        </>
                    ) : (
                        <>
                            <Sparkles size={isMobile ? 18 : 20} />
                            {isMobile ? 'Generate' : 'Generate Edit'}
                        </>
                    )}
                </button>
            )}

            {/* Keyboard Shortcut Hint - Desktop only */}
            {!isMobile && (
                <div style={{
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontWeight: '500'
                }}>
                    Press <kbd style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'inherit'
                    }}>Ctrl</kbd> + <kbd style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'inherit'
                    }}>Enter</kbd> to generate
                </div>
            )}

            <style>{`
                @keyframes pulse-purple {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; transform: scale(0.98); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes shimmer-x {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
            `}</style>
        </div>
    );
};

export default EditControls;