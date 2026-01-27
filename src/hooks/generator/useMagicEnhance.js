import { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, functions } from '../../firebase';
import toast from 'react-hot-toast';
import { STYLE_REGISTRY } from '../../data/styles';
import { compressImage } from '../../utils';

export function useMagicEnhance({
    prompt, setPrompt,
    referenceImage, setReferenceImage,
    activeStyleId,
    generatedImage, setGeneratedImage,
    activeJob, setActiveJob,
    styleIntensity,
    handleGenerate, // Callback to trigger standard generation if needed
    deductZapsOptimistically,
    rollbackZaps
}) {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanceStatus, setEnhanceStatus] = useState(''); // 'transforming', 'enhancing', 'uploading', etc.
    const listenerRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (listenerRef.current) {
                listenerRef.current();
            }
        };
    }, []);

    const handleMagicEnhance = async () => {
        if (isEnhancing) return;

        // Capture current values
        let currentReferenceImage = referenceImage;
        const currentPrompt = prompt;

        // Fallback Logic
        if (activeStyleId) {
            if (!currentReferenceImage && activeJob && (activeJob.imageUrl || activeJob.thumbnailUrl)) {
                console.log("[handleMagicEnhance] ReferenceImage is null, using activeJob image as fallback");
                currentReferenceImage = activeJob.imageUrl || activeJob.thumbnailUrl;
                setReferenceImage(currentReferenceImage);
            }
            if (!currentReferenceImage && generatedImage) {
                console.log("[handleMagicEnhance] ReferenceImage is null, using generatedImage as fallback");
                currentReferenceImage = generatedImage;
                setReferenceImage(currentReferenceImage);
            }
        }

        if (!currentPrompt && !currentReferenceImage) {
            console.log("[handleMagicEnhance] Early return: no prompt and no referenceImage");
            return;
        }

        setIsEnhancing(true);

        const isReferenceImageValid = (img) => img && typeof img === 'string' && img.trim().length > 0;

        try {
            const api = httpsCallable(functions, 'api', { timeout: 540000 });
            const hasValidReferenceImage = isReferenceImageValid(currentReferenceImage);
            const hasValidPrompt = currentPrompt && typeof currentPrompt === 'string' && currentPrompt.trim().length > 0;

            // 1. Image Transformation (Style Transfer)
            if (hasValidReferenceImage && activeStyleId) {
                const styleObj = STYLE_REGISTRY.find(s => s.id === activeStyleId);
                if (!styleObj || !styleObj.instruction) {
                    toast.error("Selected style is missing instructions", { id: 'style-magic' });
                    setIsEnhancing(false);
                    return;
                }

                if (currentReferenceImage && !generatedImage) {
                    setGeneratedImage(currentReferenceImage); // Show original temporarily
                }

                setEnhanceStatus('Transforming image...');
                toast.loading(`✨ Starting ${styleObj.label} transformation...`, { id: 'style-magic' });

                const cost = 0.5; // IMAGE_TRANSFORM
                if (deductZapsOptimistically) deductZapsOptimistically(cost);

                try {
                    let processedImage = currentReferenceImage;
                    if (processedImage && processedImage.startsWith('data:')) {
                        setEnhanceStatus('Compressing...');
                        processedImage = await compressImage(processedImage, 1024, 0.7);
                    }

                    const progressUpdates = [
                        { delay: 300, message: `📤 Uploading image to AI...`, status: 'Uploading...' },
                        { delay: 800, message: `🎨 AI is transforming with ${styleObj.label} style...`, status: 'Stylizing...' },
                        { delay: 2000, message: `⚙️ Processing transformation...`, status: 'Processing...' },
                        { delay: 4000, message: `✨ Finalizing your transformed image...`, status: 'Finalizing...' }
                    ];

                    const progressTimers = progressUpdates.map(({ delay, message, status }) =>
                        setTimeout(() => {
                            toast.loading(message, { id: 'style-magic' });
                            setEnhanceStatus(status);
                        }, delay)
                    );

                    const clearProgressTimers = () => progressTimers.forEach(timer => clearTimeout(timer));

                    const transformResult = await api({
                        action: 'transformImage',
                        imageUrl: processedImage,
                        styleName: styleObj.label,
                        intensity: styleIntensity,
                        instructions: styleObj.instruction
                    });

                    clearProgressTimers();

                    if (transformResult?.data?.imageUrl) {
                        const imageToShow = transformResult.data.thumbnailUrl || transformResult.data.imageUrl;

                        // Preload
                        const img = new Image();
                        img.src = transformResult.data.imageUrl;

                        toast.loading(`🎉 Loading your transformed image...`, { id: 'style-magic' });
                        setGeneratedImage(imageToShow);

                        img.onload = () => setGeneratedImage(transformResult.data.imageUrl);

                        if (transformResult.data.imageId) {
                            setActiveJob({
                                id: transformResult.data.imageId,
                                imageUrl: transformResult.data.imageUrl,
                                thumbnailUrl: transformResult.data.thumbnailUrl,
                                prompt: `Vision Transformation: ${styleObj.label}`
                            });
                        }

                        setReferenceImage(null);
                        setTimeout(() => {
                            toast.success(`✨ ${styleObj.label} transformation complete!`, { id: 'style-magic', duration: 3000, icon: '🎨' });
                        }, 200);
                        setIsEnhancing(false);
                        setEnhanceStatus('');
                        return;
                    } else {
                        clearProgressTimers();
                        throw new Error("Transformation failed to return an image");
                    }
                } catch (error) {
                    const cost = 0.5; // IMAGE_TRANSFORM
                    if (rollbackZaps) rollbackZaps(cost);

                    console.error("[handleMagicEnhance] transformImage error:", error);
                    let errorMessage = error.message || "Failed to transform image";
                    if (errorMessage.includes('INVALID_ARGUMENT') || errorMessage.includes('too large')) {
                        errorMessage = "Image too large. Compression failed.";
                    }
                    toast.error(`Transformation failed: ${errorMessage}`, { id: 'style-magic', duration: 4000 });
                    setIsEnhancing(false);
                    setEnhanceStatus('');
                    return;
                }
            }

            // 2. Prompt Transformation
            if (hasValidPrompt) {
                if (activeStyleId) {
                    const styleObj = STYLE_REGISTRY.find(s => s.id === activeStyleId);
                    if (styleObj && styleObj.instruction) {
                        toast.loading(`✨ Transforming prompt with ${styleObj.label}...`, { id: 'style-magic' });

                        try {
                            const transformResult = await api({
                                action: 'transformPrompt',
                                prompt: currentPrompt,
                                styleName: styleObj.label,
                                intensity: styleIntensity,
                                instructions: styleObj.instruction
                            });

                            const newPrompt = transformResult?.data?.prompt;
                            if (!newPrompt) {
                                toast.error("Empty prompt returned", { id: 'style-magic' });
                                setIsEnhancing(false);
                                setEnhanceStatus('');
                                return;
                            }

                            toast.loading(`✨ Applying ${styleObj.label} style...`, { id: 'style-magic' });
                            setPrompt(newPrompt);

                            setTimeout(() => {
                                toast.success(`✨ Prompt transformed!`, { id: 'style-magic', duration: 2000, icon: '✨' });
                            }, 100);

                            setIsEnhancing(false);
                            setEnhanceStatus('');

                            // Auto-Trigger Generation
                            setTimeout(() => {
                                handleGenerate(newPrompt);
                            }, 400);
                            return;

                        } catch (error) {
                            console.error("Transform prompt error", error);
                            toast.error("Failed to transform prompt", { id: 'style-magic' });
                            setIsEnhancing(false);
                            setEnhanceStatus('');
                            return;
                        }
                    }
                }

                // 3. Standard Magic Enhance (No Style)
                try {
                    const cost = 1.0; // IMAGE_ENHANCE
                    if (deductZapsOptimistically) deductZapsOptimistically(cost);

                    const result = await api({ action: 'createEnhanceRequest', prompt: currentPrompt });
                    const requestId = result.data.requestId;

                    // Set safety timeout (60s)
                    const timeoutId = setTimeout(() => {
                        toast.error("Enhance request timed out", { id: 'style-magic' });
                        setIsEnhancing(false);
                        setEnhanceStatus('');
                    }, 60000);

                    // Advanced Stability: Backup Polling Fallback
                    let fallbackTimer = null;
                    const startFallback = () => {
                        if (fallbackTimer) return;
                        fallbackTimer = setInterval(async () => {
                            try {
                                const { getDoc, doc } = await import('firebase/firestore');
                                const snap = await getDoc(doc(db, 'enhance_queue', requestId));
                                if (snap.exists()) {
                                    const data = snap.data();
                                    if (data.status === 'completed' || data.status === 'failed') {
                                        handleStatus(data);
                                    }
                                }
                            } catch (e) { console.error("Enhance fallback fail", e); }
                        }, 10000);
                    };

                    const handleStatus = (data) => {
                        if (data.status === 'completed') {
                            clearTimeout(timeoutId);
                            if (fallbackTimer) clearInterval(fallbackTimer);
                            setPrompt(data.prompt);
                            toast.success("Magic enhanced!", { id: 'style-magic' });
                            setIsEnhancing(false);
                            setEnhanceStatus('');
                            if (listenerRef.current) {
                                listenerRef.current();
                                listenerRef.current = null;
                            }
                        } else if (data.status === 'failed') {
                            clearTimeout(timeoutId);
                            if (fallbackTimer) clearInterval(fallbackTimer);
                            toast.error("Failed: " + (data.error || "Unknown"), { id: 'style-magic' });
                            setIsEnhancing(false);
                            setEnhanceStatus('');
                            if (listenerRef.current) {
                                listenerRef.current();
                                listenerRef.current = null;
                            }
                        }
                    };

                    setTimeout(startFallback, 25000);

                    const unsubscribe = onSnapshot(doc(db, 'enhance_queue', requestId), (snapshot) => {
                        if (!snapshot.exists()) return;
                        handleStatus(snapshot.data());
                    }, (err) => {
                        console.error("Enhance listener err", err);
                        startFallback();
                    });
                    listenerRef.current = unsubscribe;
                } catch (error) {
                    const cost = 1.0; // IMAGE_ENHANCE
                    if (rollbackZaps) rollbackZaps(cost);

                    console.error("Enhance request error", error);
                    toast.error("Failed to enhance prompt", { id: 'style-magic' });
                    setIsEnhancing(false);
                }
                return;
            }

            toast.error("Please provide an image or prompt", { id: 'style-magic' });
            setIsEnhancing(false);

        } catch (error) {
            console.error("Unexpected error", error);
            toast.error("Request failed", { id: 'style-magic' });
            setIsEnhancing(false);
            setEnhanceStatus('');
        }
    };

    return { isEnhancing, enhanceStatus, handleMagicEnhance };

}
