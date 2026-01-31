import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';
import { useEditLogic } from './useEditLogic';
import EditHeader from './EditHeader';
import ReferencePanel from './ReferencePanel';
import ResultPanel from './ResultPanel';
import EditControls from './EditControls';

const SimpleEditModal = ({ isOpen, onClose, referenceImage }) => {
    // Shared UI state
    const [isComparing, setIsComparing] = useState(false);

    // Logic hook
    const {
        prompt,
        setPrompt,
        isGenerating,
        generatedImage,
        setGeneratedImage,
        handleEdit
    } = useEditLogic({ isOpen, onClose, referenceImage });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'var(--backdrop-blur)',
                    WebkitBackdropFilter: 'var(--backdrop-blur)'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '800px',
                        overflow: 'hidden',
                        background: 'var(--color-zinc-950)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-lg)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <EditHeader onClose={onClose} />

                    <div style={{
                        padding: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        <ReferencePanel
                            referenceImage={referenceImage}
                            generatedImage={generatedImage}
                            isGenerating={isGenerating}
                        />

                        {generatedImage ? (
                            <ResultPanel
                                referenceImage={referenceImage}
                                generatedImage={generatedImage}
                                isComparing={isComparing}
                                setIsComparing={setIsComparing}
                                onReset={() => setGeneratedImage(null)}
                                prompt={prompt}
                            />
                        ) : (
                            <EditControls
                                prompt={prompt}
                                setPrompt={setPrompt}
                                handleEdit={handleEdit}
                                isGenerating={isGenerating}
                            />
                        )}
                    </div>

                    <div style={{
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        textAlign: 'center',
                        borderTop: '1px solid var(--color-border)'
                    }}>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-dim)', margin: 0, display: 'flex', alignItems: 'center', justifySelf: 'center', gap: '8px', width: 'fit-content' }}>
                            <Camera size={12} />
                            EDITS ARE SAVED TO YOUR GALLERY
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SimpleEditModal;
