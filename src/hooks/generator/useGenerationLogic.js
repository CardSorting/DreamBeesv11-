import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import toast from 'react-hot-toast';
import { getStylePrompt, GLOBAL_NEGATIVES } from '../../data/styles';

export function useGenerationLogic({
    prompt,
    selectedModel,
    generationMode,
    activeStyleId, styleIntensity,
    negPrompt,
    aspectRatio, steps, cfg, seed, useTurbo,
    zaps, reels, subscriptionStatus,
    setGenerating, setGeneratedImage, setCurrentJobType, setCurrentJobId,
    referenceImage, handleMagicEnhance // Dependency for redirect
}) {

    const handleGenerate = async (promptOverride = null) => {
        const effectivePrompt = (typeof promptOverride === 'string' ? promptOverride : prompt);

        // SAFEGUARD: Redirect to Magic Enhance if reference image + style present
        const isReferenceImageValid = (img) => img && typeof img === 'string' && img.trim().length > 0;
        if (isReferenceImageValid(referenceImage) && activeStyleId && generationMode === 'image') {
            console.log("[handleGenerate] Redirecting to Magic Enhance");
            await handleMagicEnhance();
            return;
        }

        if (!effectivePrompt || !selectedModel) return;

        // Cost Checks
        if (generationMode === 'video') {
            // This hook actually handles the "click" action, but video logic is separate in useVideoGeneration
            // However, the button might call this.
            // If generationMode is video, we should probably warn or delegate.
            // But usually the UI separates the buttons.
            // We'll keep the basic check here just in case.
            return;
        } else {
            const isPremiumModel = selectedModel?.id === 'zit-model' || selectedModel?.id === 'qwen-image-2512';
            const cost = (useTurbo || isPremiumModel) ? 1 : (subscriptionStatus === 'active' ? 0 : 0.5);
            if (zaps < cost) {
                toast.error(`Insufficient Zaps ⚡ (Need ${cost}, have ${zaps.toFixed(1)})`);
                return;
            }
        }

        setGenerating(true);
        setGeneratedImage(null);
        setCurrentJobType(generationMode);

        try {
            const api = httpsCallable(functions, 'api', { timeout: 540000 });
            let finalPrompt = effectivePrompt;
            let finalNegativePrompt = negPrompt;

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

            // Apply Styles
            if (activeStyleId) {
                const styleData = getStylePrompt(activeStyleId, styleIntensity);
                if (styleData.tags.length > 0) {
                    finalPrompt = `${finalPrompt}, ${styleData.tags.join(', ')}`;
                }
                const combinedNegatives = [
                    negPrompt,
                    ...GLOBAL_NEGATIVES,
                    ...styleData.negatives
                ].filter(Boolean).join(', ');
                finalNegativePrompt = combinedNegatives;
            }

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

            setCurrentJobId(result.data.requestId);
            clearProgressTimers();
            toast.success("Generation started!", { id: 'gen-image' });

        } catch (error) {
            console.error("Queue error", error);
            setGenerating(false);
            const errorMessage = error.message || "Failed to create generation request";
            toast.error(errorMessage, { id: 'gen-image' });
        }
    };

    return { handleGenerate };
}
