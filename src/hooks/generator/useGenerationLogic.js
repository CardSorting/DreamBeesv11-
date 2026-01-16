import { useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { functions, db } from '../../firebase';
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

    // Listen to job status changes
    const listenToJob = (requestId) => {
        // Cleanup any existing listener
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        currentJobIdRef.current = requestId;
        console.log('[useGenerationLogic] Setting up listener for job:', requestId);

        const unsubscribe = onSnapshot(
            doc(db, 'generation_queue', requestId),
            (docSnap) => {
                if (!docSnap.exists()) {
                    console.warn('[useGenerationLogic] Job document does not exist:', requestId);
                    return;
                }

                const data = docSnap.data();
                console.log('[useGenerationLogic] Job update:', { requestId, status: data.status });

                if (data.status === 'completed' && data.imageUrl) {
                    console.log('[useGenerationLogic] Generation completed! Image URL:', data.imageUrl);
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
                } else if (data.status === 'failed') {
                    console.error('[useGenerationLogic] Generation failed:', data.error);
                    setGenerating(false);
                    toast.error(`Generation failed: ${data.error || 'Unknown error'}`, { id: 'gen-image' });

                    // Cleanup listener after failure
                    if (unsubscribeRef.current) {
                        unsubscribeRef.current();
                        unsubscribeRef.current = null;
                    }
                } else if (data.status === 'processing') {
                    toast.loading('Processing your image...', { id: 'gen-image' });
                }
            },
            (error) => {
                console.error('[useGenerationLogic] Listener error:', error);
                setGenerating(false);
                toast.error('Error tracking generation status', { id: 'gen-image' });
            }
        );

        unsubscribeRef.current = unsubscribe;
    };

    const handleGenerate = async (promptOverride = null) => {
        try {
            // VERY VISIBLE DEBUG
            const debugInfo = `START handleGenerate\nprompt: ${prompt?.substring(0, 50)}...\nmodel: ${selectedModel?.id}\nmode: ${generationMode}\nzaps: ${zaps}`;
            console.log('[handleGenerate] ' + debugInfo);

            console.log('[handleGenerate] ============ START ============');
            console.log('[handleGenerate] promptOverride:', promptOverride);
            console.log('[handleGenerate] prompt from hook:', prompt);
            console.log('[handleGenerate] selectedModel:', JSON.stringify(selectedModel));
            console.log('[handleGenerate] generationMode:', generationMode);
            console.log('[handleGenerate] zaps:', zaps);
            console.log('[handleGenerate] useTurbo:', useTurbo);
            console.log('[handleGenerate] subscriptionStatus:', subscriptionStatus);

            const effectivePrompt = (typeof promptOverride === 'string' ? promptOverride : prompt);
            console.log('[handleGenerate] effectivePrompt:', effectivePrompt);

            if (!effectivePrompt || !selectedModel) {
                console.warn('[handleGenerate] ABORT: Missing prompt or model', {
                    hasPrompt: !!effectivePrompt,
                    hasModel: !!selectedModel
                });
                return;
            }
            console.log('[handleGenerate] PASSED: prompt and model check');

            // Cost Checks
            if (generationMode === 'video') {
                console.warn('[handleGenerate] ABORT: Video mode - should use video generation hook');
                return;
            }
            console.log('[handleGenerate] PASSED: not video mode');

            const isPremiumModel = selectedModel?.id === 'zit-model' || selectedModel?.id === 'qwen-image-2512';
            const cost = (useTurbo || isPremiumModel) ? 1 : (subscriptionStatus === 'active' ? 0 : 0.5);
            console.log('[handleGenerate] isPremiumModel:', isPremiumModel);
            console.log('[handleGenerate] cost:', cost);

            if (zaps < cost) {
                console.warn('[handleGenerate] ABORT: Insufficient zaps', { zaps, cost });
                toast.error(`Insufficient Zaps ⚡ (Need ${cost}, have ${zaps.toFixed(1)})`);
                return;
            }
            console.log('[handleGenerate] PASSED: zaps check');

            console.log('[handleGenerate] Setting generating=true...');
            setGenerating(true);
            setGeneratedImage(null);
            setCurrentJobType(generationMode);
            console.log('[handleGenerate] State updated, about to call API...');

            const api = httpsCallable(functions, 'api', { timeout: 540000 });
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

            console.log('[handleGenerate] >>>>>>> CALLING API with:', {
                action: 'createGenerationRequest',
                prompt: finalPrompt,
                modelId: selectedModel.id,
                aspectRatio: aspectRatio
            });

            const result = await api({
                action: 'createGenerationRequest',
                prompt: finalPrompt,
                negative_prompt: finalNegativePrompt,
                modelId: selectedModel.id,
                aspectRatio: aspectRatio,
                steps: steps,
                cfg: cfg,
                seed: seed,
                useTurbo
            });

            console.log('[handleGenerate] <<<<<<< API RESPONSE:', result.data);

            const { requestId } = result.data;
            console.log('[useGenerationLogic] Request created with ID:', requestId);

            setCurrentJobId(requestId);
            clearProgressTimers();
            toast.loading("Generation in progress...", { id: 'gen-image' });

            // Start listening for job completion
            listenToJob(requestId);

        } catch (error) {
            console.error("[handleGenerate] CAUGHT ERROR:", error);
            setGenerating(false);
            const errorMessage = error.message || "Failed to create generation request";
            toast.error(errorMessage, { id: 'gen-image' });
        }
    };

    return { handleGenerate };
}
