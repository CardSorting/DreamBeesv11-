import { useEffect, useRef } from 'react';
import { useApi } from '../../hooks/useApi';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { trackEvent, trackCreativeTelemetry, trackFriction } from '../../utils/analytics';
import { calculateZapCost } from '../../constants/zapCosts';

// Reliability Constants
const DEBOUNCE_MS = 2000;        // Minimum time between generation requests
const SLOW_THRESHOLD_MS = 120000; // 2 min - show "taking longer" message

export function useGenerationLogic({
    prompt,
    selectedModel,
    generationMode,
    negPrompt,
    aspectRatio, steps, cfg, seed, useTurbo,
    zaps, reels: _reels, subscriptionStatus,
    setGenerating, setGeneratedImage, setCurrentJobType, setCurrentJobId, setActiveJob,
    deductZapsOptimistically,
    rollbackZaps
}) {
    // Track timing
    const startTimeRef = useRef(null);
    // Track the current job listener
    const unsubscribeRef = useRef(null);
    const currentJobIdRef = useRef(null);

    // Reliability: Debounce guard
    const lastRequestTimeRef = useRef(null);

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
    const listenToJob = (requestId, isRestored = false) => {
        // Cleanup any existing listener
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        currentJobIdRef.current = requestId;
        let lastKnownStatus = 'queued';
        let fallbackTimer = null;

        const cleanup = () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            if (fallbackTimer) {
                clearInterval(fallbackTimer);
                fallbackTimer = null;
            }
            localStorage.removeItem('activeGenerationJob');
        };

        // Advanced Stability: Backup Polling Fallback
        // If onSnapshot stalls or Firestore stream breaks, this ensures we eventually get the result.
        const startFallback = () => {
            if (fallbackTimer) return;
            console.log(`[useGenerationLogic] Initializing backup polling for ${requestId}`);
            fallbackTimer = setInterval(async () => {
                try {
                    const { getDoc, doc } = await import('firebase/firestore');
                    const snap = await getDoc(doc(db, 'generation_queue', requestId));
                    if (snap.exists()) {
                        const data = snap.data();
                        handleStatusUpdate(data);
                    }
                } catch (err) {
                    console.error("[useGenerationLogic] Fallback poll failed:", err);
                }
            }, 10000); // Poll every 10s as a safety net
        };

        const handleStatusUpdate = (data) => {
            if (!data) return;

            if (data.status === 'completed' && data.imageUrl) {
                setGeneratedImage(data.imageUrl);
                setGenerating(false);
                if (setActiveJob) {
                    setActiveJob({ id: requestId, ...data });
                }
                toast.success('Image generated successfully! 🎨', { id: 'gen-image' });
                cleanup();

                const promptLength = data.prompt?.length || 0;
                const promptBucket = promptLength <= 50 ? 'short' : (promptLength <= 150 ? 'medium' : 'long');

                trackEvent('generate_image_success', {
                    model_id: data.modelId,
                    job_id: requestId,
                    duration_ms: startTimeRef.current ? Date.now() - startTimeRef.current : undefined,
                    aspect_ratio: data.aspectRatio || aspectRatio,
                    prompt_length_bucket: promptBucket
                });

                trackCreativeTelemetry('generation_success', {
                    model_id: data.modelId,
                    aspect_ratio: data.aspectRatio || aspectRatio,
                    prompt_length_bucket: promptBucket
                });
            } else if (data.status === 'failed') {
                setGenerating(false);
                toast.error(`Generation failed: ${data.error || 'Unknown error'}`, { id: 'gen-image' });

                trackEvent('generate_image_failure', {
                    model_id: data.modelId || selectedModel?.id,
                    error: data.error || 'Server Side Failure'
                });
                trackFriction('generation_failure', 'Generation_Listener', data.error || 'Server Side Failure');
                cleanup();
            } else if (data.status === 'processing' && lastKnownStatus !== 'processing') {
                lastKnownStatus = 'processing';
                toast.loading('Processing your image...', { id: 'gen-image' });
            }

            // Slow Detection: Notify user if taking longer than usual
            if (data.status === 'processing' && startTimeRef.current) {
                const elapsedTime = Date.now() - startTimeRef.current;
                if (elapsedTime > SLOW_THRESHOLD_MS) {
                    toast.loading('This is taking longer than usual...', { id: 'gen-image' });
                }
            }
        };

        // Start fallback after a short delay to see if onSnapshot works
        const gracePeriod = isRestored ? 2000 : 25000;
        setTimeout(startFallback, gracePeriod);

        const unsubscribe = onSnapshot(
            doc(db, 'generation_queue', requestId),
            (docSnap) => {
                if (!docSnap.exists()) return;
                handleStatusUpdate(docSnap.data());
            },
            (error) => {
                console.error('[useGenerationLogic] Listener error:', error);
                startFallback(); // Immediate fallback trigger on error
            }
        );

        unsubscribeRef.current = unsubscribe;
    };

    const handleGenerate = async (promptOverride = null) => {
        try {
            // Debounce Guard: Prevent rapid duplicate submissions
            const now = Date.now();
            if (lastRequestTimeRef.current && (now - lastRequestTimeRef.current < DEBOUNCE_MS)) {
                toast('Too fast! Please wait a moment.', { icon: '⏳', id: 'debounce' });
                return;
            }
            lastRequestTimeRef.current = now;

            const effectivePrompt = (typeof promptOverride === 'string' ? promptOverride : prompt);

            if (!effectivePrompt || !selectedModel) {
                return;
            }

            // Cost Checks
            if (generationMode === 'video') {
                console.warn('[handleGenerate] ABORT: Video mode - should use video generation hook');
                return;
            }

            const cost = calculateZapCost('IMAGE_GENERATION', {
                subscriptionStatus,
                modelId: selectedModel.id,
                useTurbo
            });

            if (zaps < cost && cost > 0) {
                toast.error(`Insufficient Zaps ⚡ (Need ${cost}, have ${zaps.toFixed(1)})`);
                trackFriction('insufficient_credits', 'Generation_Start', `Need ${cost}, have ${zaps}`);
                return;
            }

            // Generate unique requestId for deduplication and optimistic tracking
            const requestId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            // Optimistic Deduction
            if (cost > 0 && deductZapsOptimistically) {
                deductZapsOptimistically(cost, requestId);
            }

            setGenerating(true);
            setGeneratedImage(null);
            setCurrentJobType(generationMode);
            startTimeRef.current = Date.now();

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
                useTurbo,
                requestId // Pass the client-generated ID
            }, {
                timeout: 540000,
                toastErrors: false // We handle errors manually below
            });

            trackEvent('generate_image_start', {
                model_id: selectedModel.id,
                generation_mode: generationMode,
                aspect_ratio: aspectRatio
            });

            const promptLength = finalPrompt?.length || 0;
            const promptBucket = promptLength <= 50 ? 'short' : (promptLength <= 150 ? 'medium' : 'long');

            trackCreativeTelemetry('generation_start', {
                model_id: selectedModel.id,
                aspect_ratio: aspectRatio,
                prompt_length_bucket: promptBucket
            });

            const { requestId: serverRequestId } = data;
            const finalRequestId = serverRequestId || requestId;

            setCurrentJobId(finalRequestId);
            clearProgressTimers();
            toast.loading("Generation in progress...", { id: 'gen-image' });

            // Persist
            localStorage.setItem('activeGenerationJob', JSON.stringify({
                requestId,
                jobType: generationMode
            }));

            // Start listening for job completion
            listenToJob(finalRequestId);

        } catch (error) {
            console.error("[handleGenerate] CAUGHT ERROR:", error);
            const cost = calculateZapCost('IMAGE_GENERATION', {
                subscriptionStatus,
                modelId: selectedModel.id,
                useTurbo
            });
            if (cost > 0 && rollbackZaps) {
                // If we have a requestId available in the scope (it's declared in the try block)
                // We need to ensure it's accessible here. 
                // Let's move requestId declaration up.
                rollbackZaps(cost, typeof requestId !== 'undefined' ? requestId : 'legacy');
            }
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

    const cancelGeneration = () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        setGenerating(false);
        localStorage.removeItem('activeGenerationJob');
        toast('Generation stopped', { icon: '🛑', id: 'gen-image' });
    };

    return { handleGenerate, cancelGeneration };
}
