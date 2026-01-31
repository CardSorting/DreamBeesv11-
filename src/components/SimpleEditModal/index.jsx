import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Keyboard, ChevronDown, ChevronUp } from 'lucide-react';
import { useEditLogic } from './useEditLogic';
import EditHeader from './EditHeader';
import ReferencePanel from './ReferencePanel';
import ResultPanel from './ResultPanel';
import EditControls from './EditControls';
import { useMobileDetect } from '../../hooks/useMobileDetect';

const SimpleEditModal = ({ isOpen, onClose, referenceImage }) => {
    // Shared UI state
    const [isComparing, setIsComparing] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showReference, setShowReference] = useState(true);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    // Mobile detection
    const isMobile = useMobileDetect();

    // Logic hook
    const {
        prompt,
        setPrompt,
        isGenerating,
        generatedImage,
        setGeneratedImage,
        activeReference,
        activeCategoryIndex,
        setActiveCategoryIndex,
        activePresetIndex,
        handleEdit,
        promoteToReference
    } = useEditLogic({ isOpen, onClose, referenceImage });

    useEffect(() => {
        if (!isOpen) return;

        const timeoutId = window.setTimeout(() => {
            setShowReference(true);
            setShowHowItWorks(!isMobile);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [isOpen, isMobile]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: isMobile ? 'flex-end' : 'center',
                    justifyContent: 'center',
                    padding: isMobile ? 0 : '16px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(180%)'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: isMobile ? 100 : 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: isMobile ? 100 : 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: isMobile ? '100%' : '900px',
                        maxHeight: isMobile ? '95vh' : '90vh',
                        height: isMobile ? '95vh' : 'auto',
                        overflow: 'auto',
                        background: 'rgba(9, 9, 11, 0.95)',
                        borderRadius: isMobile ? '20px 20px 0 0' : '24px',
                        border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <EditHeader onClose={onClose} isMobile={isMobile} />

                    {/* Stepper */}
                    {!isMobile && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 32px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            flexShrink: 0
                        }}>
                            {[
                                { label: 'Reference', active: true },
                                { label: 'Edit', active: !generatedImage },
                                { label: 'Result', active: !!generatedImage }
                            ].map((step, index) => (
                                <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: step.active ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                                        border: `1px solid ${step.active ? 'rgba(168, 85, 247, 0.6)' : 'rgba(255, 255, 255, 0.15)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: step.active ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '0.7rem',
                                        fontWeight: '700'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <span style={{
                                        color: step.active ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}>
                                        {step.label}
                                    </span>
                                    {index < 2 && (
                                        <div style={{
                                            width: '36px',
                                            height: '1px',
                                            background: 'rgba(255, 255, 255, 0.1)'
                                        }} />
                                    )}
                                </div>
                            ))}
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => {
                                        if (!isOpen) {
                                            return;
                                        }
                                        setShowHowItWorks((prev) => !prev);
                                    }}
                                    style={{
                                        fontSize: '0.7rem',
                                        color: showHowItWorks ? 'white' : 'rgba(255, 255, 255, 0.4)',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        background: showHowItWorks ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                        borderRadius: '100px',
                                        border: `1px solid ${showHowItWorks ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {showHowItWorks ? 'Hide Tips' : 'How it works'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mobile: Collapsible Reference Toggle */}
                    {isMobile && generatedImage && (
                        <button
                            onClick={() => setShowReference(!showReference)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: 'none',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            {showReference ? (
                                <>
                                    <ChevronUp size={16} />
                                    Hide Reference Image
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={16} />
                                    Show Reference Image
                                </>
                            )}
                        </button>
                    )}

                    {/* Mobile quick tip + step indicator */}
                    {isMobile && (
                        <div style={{
                            padding: '10px 16px',
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.55)',
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '10px',
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em'
                            }}>
                                {['Reference', generatedImage ? 'Result' : 'Edit', generatedImage ? 'Download' : 'Generate'].map((label, index) => (
                                    <span key={label} style={{
                                        color: index === (generatedImage ? 1 : 1) ? 'white' : 'rgba(255, 255, 255, 0.4)'
                                    }}>
                                        {label}
                                    </span>
                                ))}
                            </div>
                            {!generatedImage && (
                                <div>
                                    Choose a preset or write instructions, then tap <strong style={{ color: 'white' }}>Generate</strong>.
                                </div>
                            )}
                            {generatedImage && (
                                <div>
                                    Compare the result or tap <strong style={{ color: 'white' }}>Download</strong> to save.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Content */}
                    <div style={{
                        padding: isMobile ? '12px 16px 16px' : '24px 32px',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '20px' : '32px',
                        flex: 1,
                        overflow: 'auto',
                        minHeight: 0
                    }}>
                        {/* Desktop How it Works */}
                        {!isMobile && showHowItWorks && (
                            <div style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '14px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}>
                                <strong style={{ color: 'white' }}>Quick flow:</strong> choose a reference ➜ describe your edit ➜ pick a preset ➜ generate.
                                After the result, use <span style={{ color: '#a855f7', fontWeight: 700 }}>Keep & Continue</span> to iterate or <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 700 }}>Edit Original</span> to start over.
                            </div>
                        )}
                        {/* Reference Image Panel */}
                        {(!isMobile || !generatedImage || showReference) && (
                            <div style={{
                                flex: isMobile ? 'none' : 1,
                                width: isMobile ? '100%' : 'auto',
                                maxWidth: isMobile ? '280px' : 'none',
                                margin: isMobile ? '0 auto' : '0',
                                display: isMobile && generatedImage && !showReference ? 'none' : 'block'
                            }}>
                                <ReferencePanel
                                    referenceImage={activeReference}
                                    generatedImage={generatedImage}
                                    isGenerating={isGenerating}
                                    isMobile={isMobile}
                                />
                            </div>
                        )}

                        {/* Edit Controls or Result Panel */}
                        <div style={{
                            flex: isMobile ? 'none' : 1,
                            width: isMobile ? '100%' : 'auto',
                            minHeight: isMobile ? 'auto' : '400px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <AnimatePresence mode="wait">
                                {generatedImage ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
                                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                        style={{ flex: 1 }}
                                    >
                                        <ResultPanel
                                            referenceImage={activeReference}
                                            generatedImage={generatedImage}
                                            isComparing={isComparing}
                                            setIsComparing={setIsComparing}
                                            onReset={() => setGeneratedImage(null)}
                                            onIterate={promoteToReference}
                                            prompt={prompt}
                                            isMobile={isMobile}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="controls"
                                        initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
                                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                        style={{ flex: 1 }}
                                    >
                                        <EditControls
                                            prompt={prompt}
                                            setPrompt={setPrompt}
                                            handleEdit={handleEdit}
                                            isGenerating={isGenerating}
                                            activeCategoryIndex={activeCategoryIndex}
                                            setActiveCategoryIndex={setActiveCategoryIndex}
                                            activePresetIndex={activePresetIndex}
                                            isMobile={isMobile}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: isMobile ? '12px 16px' : '16px 24px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        flexShrink: 0
                    }}>
                        {/* Gallery Notice */}
                        <div style={{
                            fontSize: isMobile ? '10px' : '11px',
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '100px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <Camera size={isMobile ? 12 : 14} style={{ color: 'var(--color-accent-primary)' }} />
                            {isMobile ? 'Saved to gallery' : 'Edits are saved to your gallery'}
                        </div>

                        {/* Shortcuts Toggle (Desktop only) */}
                        {!isMobile && (
                            <button
                                onClick={() => setShowShortcuts(!showShortcuts)}
                                style={{
                                    fontSize: '11px',
                                    color: showShortcuts ? 'white' : 'rgba(255, 255, 255, 0.4)',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    background: showShortcuts ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '100px',
                                    border: `1px solid ${showShortcuts ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Keyboard size={14} />
                                Shortcuts
                            </button>
                        )}
                    </div>

                    {/* Keyboard Shortcuts Panel (Desktop only) */}
                    {!isMobile && (
                        <AnimatePresence>
                            {showShortcuts && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        overflow: 'hidden',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <div style={{
                                        padding: '20px 32px',
                                        background: 'rgba(0, 0, 0, 0.3)'
                                    }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '16px'
                                        }}>
                                            {[
                                                { key: 'Ctrl + Enter', desc: 'Generate edit', icon: '⚡' },
                                                { key: 'Escape', desc: 'Close modal', icon: '✕' },
                                                { key: 'Tab', desc: 'Switch preset category', icon: '↹' },
                                                { key: '↑ / ↓', desc: 'Navigate presets', icon: '↕' }
                                            ].map((shortcut) => (
                                                <div key={shortcut.key} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px 16px',
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                                }}>
                                                    <span style={{ fontSize: '1.2rem' }}>{shortcut.icon}</span>
                                                    <div>
                                                        <kbd style={{
                                                            display: 'inline-block',
                                                            padding: '4px 8px',
                                                            background: 'rgba(168, 85, 247, 0.2)',
                                                            border: '1px solid rgba(168, 85, 247, 0.3)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '700',
                                                            color: 'white',
                                                            fontFamily: 'inherit',
                                                            marginBottom: '4px'
                                                        }}>
                                                            {shortcut.key}
                                                        </kbd>
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: '0.8rem',
                                                            color: 'rgba(255, 255, 255, 0.5)',
                                                            fontWeight: '500'
                                                        }}>
                                                            {shortcut.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SimpleEditModal;