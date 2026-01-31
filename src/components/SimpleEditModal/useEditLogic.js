import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { PRESET_CATEGORIES } from './constants';

export const useEditLogic = ({ isOpen, onClose, referenceImage }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const { call: apiCall } = useApi();

    const [activeReference, setActiveReference] = useState(referenceImage);
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
    const [activePresetIndex, setActivePresetIndex] = useState(-1);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setGeneratedImage(null);
            setIsGenerating(false);
            setCurrentJobId(null);
            setActiveReference(referenceImage);
            setActiveCategoryIndex(0);
            setActivePresetIndex(-1);
        }
    }, [isOpen, referenceImage]);

    // Handle job status listening via Firestore
    useEffect(() => {
        if (!currentJobId) return;

        const jobRef = doc(db, 'jobs', currentJobId);
        const unsubscribe = onSnapshot(jobRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const data = snapshot.data();

            if (data.status === 'completed' || data.status === 'success') {
                const finalUrl = data.outputUrl || (data.result && data.result[0]) || data.images?.[0];
                if (finalUrl) {
                    setGeneratedImage(finalUrl);
                    setIsGenerating(false);
                    setCurrentJobId(null);
                    toast.success('Edit completed!', { id: 'edit-gen' });
                }
            } else if (data.status === 'failed' || data.status === 'error') {
                setIsGenerating(false);
                setCurrentJobId(null);
                toast.error(data.error || 'Edit failed', { id: 'edit-gen' });
            }
        });

        return () => unsubscribe();
    }, [currentJobId]);

    const handleEdit = useCallback(async (promptOverride) => {
        const promptToUse = typeof promptOverride === 'string' ? promptOverride : prompt;

        if (!promptToUse.trim()) {
            toast.error("Please enter what you'd like to change.");
            return;
        }

        try {
            setIsGenerating(true);
            toast.loading('Starting edit...', { id: 'edit-gen' });

            const { data } = await apiCall('api', {
                action: 'createGenerationRequest',
                prompt: promptToUse,
                modelId: 'flux-klein-4b',
                image: activeReference.imageUrl || activeReference.url || activeReference,
                aspectRatio: activeReference.aspectRatio || '1:1',
                steps: 30,
                cfg: 7.5,
                isPublic: true
            });

            if (data?.requestId) {
                setCurrentJobId(data.requestId);
                toast.loading('Painting your vision...', { id: 'edit-gen' });
            } else {
                throw new Error("Missing requestId from API");
            }

        } catch (err) {
            console.error("Edit failed:", err);
            setIsGenerating(false);
            toast.error(err.message || "Failed to start edit", { id: 'edit-gen' });
        }
    }, [prompt, apiCall, activeReference]);

    const promoteToReference = useCallback(() => {
        if (!generatedImage) return;
        setActiveReference({
            ...activeReference,
            imageUrl: generatedImage,
            url: generatedImage
        });
        setGeneratedImage(null);
        setPrompt('');
        toast.success('Using result as new reference');
    }, [generatedImage, activeReference]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            // Escape to close
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }

            // Ctrl/Cmd + Enter to generate
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!isGenerating && prompt.trim()) {
                    handleEdit();
                }
                return;
            }

            // Tab to switch categories
            if (e.key === 'Tab' && !e.shiftKey && !generatedImage) {
                e.preventDefault();
                setActiveCategoryIndex((prev) => (prev + 1) % PRESET_CATEGORIES.length);
                setActivePresetIndex(-1);
                return;
            }

            // Shift+Tab to go back
            if (e.key === 'Tab' && e.shiftKey && !generatedImage) {
                e.preventDefault();
                setActiveCategoryIndex((prev) => (prev - 1 + PRESET_CATEGORIES.length) % PRESET_CATEGORIES.length);
                setActivePresetIndex(-1);
                return;
            }

            // Arrow keys to navigate presets
            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !generatedImage) {
                e.preventDefault();
                const category = PRESET_CATEGORIES[activeCategoryIndex];
                const presetCount = category.presets.length;

                if (e.key === 'ArrowDown') {
                    setActivePresetIndex((prev) => {
                        const next = prev + 1;
                        return next >= presetCount ? 0 : next;
                    });
                } else {
                    setActivePresetIndex((prev) => {
                        const next = prev - 1;
                        return next < 0 ? presetCount - 1 : next;
                    });
                }
                return;
            }

            // Enter to select preset
            if (e.key === 'Enter' && activePresetIndex >= 0 && !generatedImage && !isGenerating) {
                e.preventDefault();
                const category = PRESET_CATEGORIES[activeCategoryIndex];
                const preset = category.presets[activePresetIndex];
                if (preset) {
                    setPrompt((prev) => prev ? `${prev}, ${preset.text.toLowerCase()}` : preset.text);
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isGenerating, prompt, onClose, handleEdit, activeCategoryIndex, activePresetIndex, generatedImage]);

    return {
        prompt,
        setPrompt,
        isGenerating,
        generatedImage,
        setGeneratedImage,
        activeReference,
        activeCategoryIndex,
        setActiveCategoryIndex,
        activePresetIndex,
        setActivePresetIndex,
        handleEdit,
        promoteToReference
    };
};