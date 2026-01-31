import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Info, Image as ImageIcon, Wand2, Layers, RefreshCw } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../firebase';
import { useMobileDetect } from '../../hooks/useMobileDetect';
import EditHeader from '../../components/SimpleEditModal/EditHeader';
import ReferencePanel from '../../components/SimpleEditModal/ReferencePanel';
import EditControls from '../../components/SimpleEditModal/EditControls';
import ResultPanel from '../../components/SimpleEditModal/ResultPanel';
import { useEditLogic } from '../../components/SimpleEditModal/useEditLogic';
import './EditStudio.css';

const STEP_FLOW = [
    { id: 'reference', label: 'Reference', icon: ImageIcon },
    { id: 'describe', label: 'Describe', icon: Wand2 },
    { id: 'presets', label: 'Presets', icon: Layers },
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'result', label: 'Result', icon: Sparkles }
];

const EditStudio = () => {
    const { id: generationId } = useParams();
    const navigate = useNavigate();
    const isMobile = useMobileDetect();

    const [referenceImage, setReferenceImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showHowItWorks, setShowHowItWorks] = useState(true);
    const [showReference, setShowReference] = useState(true);
    const [isComparing, setIsComparing] = useState(false);

    const storageKey = useMemo(() => `edit-studio-prompt-${generationId}`, [generationId]);

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
    } = useEditLogic({
        isOpen: true,
        onClose: () => navigate(-1),
        referenceImage
    });

    useEffect(() => {
        const fetchReference = async () => {
            if (!generationId) {
                setError('Missing generation id.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const docRef = doc(db, 'generations', generationId);
                const snapshot = await getDoc(docRef);

                if (!snapshot.exists()) {
                    setReferenceImage(null);
                    setError('We could not find that generation.');
                } else {
                    setReferenceImage({ id: snapshot.id, ...snapshot.data() });
                }
            } catch (err) {
                console.error('[EditStudio] Failed to load generation', err);
                setError('Unable to load this edit right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchReference();
    }, [generationId]);

    useEffect(() => {
        if (!storageKey) return;
        const cachedPrompt = sessionStorage.getItem(storageKey);
        if (cachedPrompt && !prompt) {
            setPrompt(cachedPrompt);
        }
    }, [storageKey, prompt, setPrompt]);

    useEffect(() => {
        if (!storageKey) return;
        if (prompt) {
            sessionStorage.setItem(storageKey, prompt);
        } else {
            sessionStorage.removeItem(storageKey);
        }
    }, [prompt, storageKey]);

    useEffect(() => {
        const guard = (event) => {
            if (!isGenerating) return;
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, [isGenerating]);

    const activeStepIndex = useMemo(() => {
        if (generatedImage) return 4;
        if (prompt?.trim()) return 2;
        return 1;
    }, [generatedImage, prompt]);

    const handleReset = () => {
        setGeneratedImage(null);
        setPrompt('');
        setIsComparing(false);
    };

    if (loading) {
        return (
            <div className="edit-studio-page">
                <div className="edit-studio-loading">
                    <div className="edit-studio-skeleton-header" />
                    <div className="edit-studio-skeleton-body">
                        <div className="edit-studio-skeleton-card" />
                        <div className="edit-studio-skeleton-card" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !referenceImage) {
        return (
            <div className="edit-studio-page">
                <div className="edit-studio-error">
                    <div className="edit-studio-error-card">
                        <h2>Unable to open Edit Studio</h2>
                        <p>{error || 'This edit could not be loaded.'}</p>
                        <div className="edit-studio-error-actions">
                            <button onClick={() => navigate(-1)} className="btn-secondary">
                                Back
                            </button>
                            <button onClick={() => window.location.reload()} className="btn-primary">
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-studio-page">
            <header className="edit-studio-header">
                <div className="edit-studio-header-left">
                    <button className="edit-studio-back" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <div className="edit-studio-title">
                        <span className="edit-studio-title-label">Edit Studio</span>
                        <span className="edit-studio-title-sub">
                            {referenceImage.prompt ? `“${referenceImage.prompt.slice(0, 60)}...”` : 'Transform your generation with precision.'}
                        </span>
                    </div>
                </div>
                <div className="edit-studio-header-actions">
                    <button className="edit-studio-header-pill" onClick={() => setShowHowItWorks((prev) => !prev)}>
                        <Info size={14} />
                        {showHowItWorks ? 'Hide Tips' : 'Show Tips'}
                    </button>
                    <button className="edit-studio-header-pill" onClick={handleReset}>
                        <RefreshCw size={14} />
                        Reset
                    </button>
                </div>
            </header>

            <div className="edit-studio-stepper">
                {STEP_FLOW.map((step, index) => {
                    const isActive = index === activeStepIndex;
                    const isComplete = generatedImage ? index <= 4 : index < activeStepIndex;
                    const Icon = step.icon;
                    return (
                        <div key={step.id} className={`edit-studio-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                            <div className="edit-studio-step-icon">
                                <Icon size={14} />
                            </div>
                            <span>{step.label}</span>
                        </div>
                    );
                })}
            </div>

            {showHowItWorks && (
                <div className="edit-studio-tips">
                    <Sparkles size={16} />
                    <div>
                        <strong>Flow:</strong> reference → describe changes → apply a preset → generate → iterate.
                        <span> Use <em>Keep & Continue</em> to build on results or reset to the original.</span>
                    </div>
                </div>
            )}

            <div className="edit-studio-body">
                <div className="edit-studio-left">
                    {isMobile && generatedImage && (
                        <button className="edit-studio-toggle" onClick={() => setShowReference((prev) => !prev)}>
                            {showReference ? 'Hide Reference' : 'Show Reference'}
                        </button>
                    )}

                    {(!isMobile || !generatedImage || showReference) && (
                        <div className="edit-studio-panel">
                            <ReferencePanel
                                referenceImage={activeReference}
                                generatedImage={generatedImage}
                                isGenerating={isGenerating}
                                isMobile={isMobile}
                            />
                        </div>
                    )}
                </div>

                <div className="edit-studio-right">
                    <EditHeader onClose={() => navigate(-1)} isMobile={isMobile} />

                    <div className="edit-studio-panel edit-studio-panel-main">
                        {generatedImage ? (
                            <ResultPanel
                                referenceImage={activeReference}
                                generatedImage={generatedImage}
                                isComparing={isComparing}
                                setIsComparing={setIsComparing}
                                onReset={handleReset}
                                onIterate={promoteToReference}
                                prompt={prompt}
                                isMobile={isMobile}
                            />
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>

            {isMobile && !generatedImage && (
                <div className="edit-studio-mobile-bar">
                    <button
                        onClick={handleEdit}
                        disabled={isGenerating || !prompt.trim()}
                        className="edit-studio-mobile-cta"
                    >
                        {isGenerating ? 'Generating...' : 'Generate Edit'}
                    </button>
                    <span className="edit-studio-mobile-hint">
                        {prompt.trim() ? 'Ready to generate' : 'Add instructions to continue'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default EditStudio;