import { useEffect, useRef } from 'react';
import { useApi } from '../../hooks/useApi';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export function useGenerationLogic({
    prompt,
    selectedModel,
    generationMode,
    negPrompt,
    aspectRatio, steps, cfg, seed, useTurbo,
    zaps, reels, subscriptionStatus,
    setGenerating, setGeneratedImage, setCurrentJobType, setCurrentJobId, setActiveJob
}) {
    // Track the current job listener
    const unsubscribeRef = useRef(null);
    const currentJobIdRef = useRef(null);

    // Cleanup listener on unmount
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    const { call: apiCall } = useApi();

    // Listen to job status changes
    const listenToJob = (requestId) => {
        // Cleanup any existing listener
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        currentJobIdRef.current = requestId;

        const unsubscribe = onSnapshot(
            doc(db, 'generation_queue', requestId),
            (docSnap) => {
                if (!docSnap.exists()) return;

                const data = docSnap.data();

                if (data.status === 'completed' && data.imageUrl) {
                    setGeneratedImage(data.imageUrl);
                    setGenerating(false);
                    if (setActiveJob) {
                        setActiveJob({ id: requestId, ...data });
                    }
                    toast.success('Image generated successfully! 🎨', { id: 'gen-image' });

                    // Cleanup listener after completion
                    if (unsubscribeRef.current) {
                        unsubscribeRef.current();
                        unsubscribeRef.current = null;
                    }
                    localStorage.removeItem('activeGenerationJob');
                } else if (data.status === 'failed') {
                    setGenerating(false);
                    toast.error(`Generation failed: ${data.error || 'Unknown error'}`, { id: 'gen-image' });

                    // Cleanup listener after failure
                    if (unsubscribeRef.current) {
                        unsubscribeRef.current();
                        unsubscribeRef.current = null;
                    }
                    localStorage.removeItem('activeGenerationJob');
                } else if (data.status === 'processing') {
                    toast.loading('Processing your image...', { id: 'gen-image' });
                }
            },
            (error) => {
                console.error('[useGenerationLogic] Listener error:', error);
                setGenerating(false);
                toast.error('Error tracking generation status', { id: 'gen-image' });
                localStorage.removeItem('activeGenerationJob');
            }
        );

        unsubscribeRef.current = unsubscribe;
    };

    const handleGenerate = async (promptOverride = null) => {
        try {
            const effectivePrompt = (typeof promptOverride === 'string' ? promptOverride : prompt);

            if (!effectivePrompt || !selectedModel) {
                return;
            }

            // Cost Checks
            if (generationMode === 'video') {
                console.warn('[handleGenerate] ABORT: Video mode - should use video generation hook');
                return;
            }

            const isPremiumModel = selectedModel?.id === 'zit-model';
            const cost = (useTurbo || isPremiumModel) ? 1 : (subscriptionStatus === 'active' ? 0 : 0.5);

            if (zaps < cost) {
                toast.error(`Insufficient Zaps ⚡ (Need ${cost}, have ${zaps.toFixed(1)})`);
                return;
            }

            setGenerating(true);
            setGeneratedImage(null);
            setCurrentJobType(generationMode);

            const finalPrompt = effectivePrompt;
            const finalNegativePrompt = negPrompt;

            const progressUpdates = [
                { delay: 500, message: `🚀 Queueing request...` },
                { delay: 1500, message: `🎨 Allocating GPU resources...` },
                { delay: 3500, message: `🖌️ Painting your vision...` },
                { delay: 6000, message: `✨ Refining details...` }
            ];

            const progressTimers = progressUpdates.map(({ delay, message }) =>
                setTimeout(() => toast.loading(message, { id: 'gen-image' }), delay)
            );

            const clearProgressTimers = () => progressTimers.forEach(timer => clearTimeout(timer));
            toast.loading("Starting generation...", { id: 'gen-image' });

            const { data } = await apiCall('api', {
                action: 'createGenerationRequest',
                prompt: finalPrompt,
                negative_prompt: finalNegativePrompt,
                modelId: selectedModel.id,
                aspectRatio: aspectRatio,
                steps: steps,
                cfg: cfg,
                seed: seed,
                useTurbo
            }, {
                timeout: 540000,
                toastErrors: false // We handle errors manually below
            });

            const { requestId } = data;

            setCurrentJobId(requestId);
            clearProgressTimers();
            toast.loading("Generation in progress...", { id: 'gen-image' });

            // Persist
            localStorage.setItem('activeGenerationJob', JSON.stringify({
                requestId,
                jobType: generationMode
            }));

            // Start listening for job completion
            listenToJob(requestId);

        } catch (error) {
            console.error("[handleGenerate] CAUGHT ERROR:", error);
            setGenerating(false);
            const errorMessage = error.message || "Failed to create generation request";
            toast.error(errorMessage, { id: 'gen-image' });
            localStorage.removeItem('activeGenerationJob');
        }
    };

    // Restore on mount
    useEffect(() => {
        const saved = localStorage.getItem('activeGenerationJob');
        if (saved) {
            try {
                const { requestId, jobType } = JSON.parse(saved);
                if (requestId) {
                    console.log("Restoring active generation job:", requestId);
                    // We need these setters to handle the restored state
                    if (setGenerating) setGenerating(true);
                    if (setCurrentJobId) setCurrentJobId(requestId);
                    if (setCurrentJobType && jobType) setCurrentJobType(jobType);

                    listenToJob(requestId);
                }
            } catch (e) {
                console.error("Failed to restore job:", e);
                localStorage.removeItem('activeGenerationJob');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { handleGenerate };
}
