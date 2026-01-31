import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useEditLogic = ({ isOpen, onClose, referenceImage }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const { call: apiCall } = useApi();

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setGeneratedImage(null);
            setIsGenerating(false);
            setCurrentJobId(null);
        }
    }, [isOpen]);

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

    const handleEdit = useCallback(async () => {
        if (!prompt.trim()) {
            toast.error("Please enter what you'd like to change.");
            return;
        }

        try {
            setIsGenerating(true);
            toast.loading('Starting edit...', { id: 'edit-gen' });

            const { data } = await apiCall('api', {
                action: 'createGenerationRequest',
                prompt: prompt,
                modelId: 'flux-klein-4b',
                image: referenceImage.imageUrl || referenceImage.url || referenceImage,
                aspectRatio: referenceImage.aspectRatio || '1:1',
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
    }, [prompt, apiCall, referenceImage]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                if (!isGenerating && prompt.trim()) {
                    handleEdit();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isGenerating, prompt, onClose, handleEdit]);

    return {
        prompt,
        setPrompt,
        isGenerating,
        generatedImage,
        setGeneratedImage,
        handleEdit
    };
};
