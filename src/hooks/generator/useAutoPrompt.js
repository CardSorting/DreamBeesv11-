import { useState, useRef, useEffect } from 'react';
import { db } from '../../firebase';
import { useApi } from '../../hooks/useApi';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils';

export function useAutoPrompt(prompt, setPrompt, referenceImage, setReferenceImage, generationMode, { deductZapsOptimistically, rollbackZaps } = {}) {
    const [isAutoPrompting, setIsAutoPrompting] = useState(false);
    const listenerRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (listenerRef.current) {
                listenerRef.current();
            }
        };
    }, []);

    const { call: apiCall } = useApi();

    const handleAutoPrompt = async () => {
        if (!referenceImage) return toast.error("Please attach an image first");

        setIsAutoPrompting(true);

        const progressUpdates = [
            { delay: 500, message: `📤 Uploading image to analysis engine...` },
            { delay: 1500, message: `🧠 AI feels inspired...` },
            { delay: 3500, message: `📝 Drafting detailed prompt...` },
            { delay: 6000, message: `✨ Polishing description...` }
        ];

        const progressTimers = progressUpdates.map(({ delay, message }) =>
            setTimeout(() => toast.loading(message, { id: 'auto-prompt' }), delay)
        );

        const clearProgressTimers = () => progressTimers.forEach(timer => clearTimeout(timer));

        try {
            const cost = 0.5; // IMAGE_ANALYSIS
            const requestId = `ap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            if (deductZapsOptimistically) deductZapsOptimistically(cost, requestId);

            toast.loading("Starting analysis...", { id: 'auto-prompt' });

            // const api = httpsCallable(functions, 'api', { timeout: 540000 });
            const payload = { action: 'createAnalysisRequest' };

            if (referenceImage.startsWith('data:')) {
                const compressedImage = await compressImage(referenceImage, 1024, 0.7);
                payload.image = compressedImage;
            } else {
                payload.imageUrl = referenceImage;
            }

            const { data } = await apiCall('api', {
                ...payload,
                requestId
            }, {
                timeout: 540000,
                toastErrors: true
            });

            const finalRequestId = data.requestId || requestId;

            // Advanced Stability: Polling Fallback
            let fallbackTimer = null;
            const startFallback = () => {
                if (fallbackTimer) return;
                fallbackTimer = setInterval(async () => {
                    try {
                        const { getDoc, doc } = await import('firebase/firestore');
                        const snap = await getDoc(doc(db, "analysis_queue", requestId));
                        if (snap.exists()) handleUpdate(snap.data());
                    } catch (e) { console.error("AutoPrompt fallback fail", e); }
                }, 10000);
            };

            const handleUpdate = (data) => {
                if (data.status === 'completed') {
                    clearProgressTimers();
                    if (fallbackTimer) clearInterval(fallbackTimer);
                    setPrompt(data.prompt);
                    toast.success("Prompt generated!", { id: 'auto-prompt' });

                    if (generationMode === 'image') setReferenceImage(null);
                    setIsAutoPrompting(false);
                    if (listenerRef.current) {
                        listenerRef.current();
                        listenerRef.current = null;
                    }
                } else if (data.status === 'failed') {
                    clearProgressTimers();
                    if (fallbackTimer) clearInterval(fallbackTimer);
                    toast.error("Analysis failed: " + data.error, { id: 'auto-prompt' });
                    setIsAutoPrompting(false);
                    if (listenerRef.current) {
                        listenerRef.current();
                        listenerRef.current = null;
                    }
                }
            };

            setTimeout(startFallback, 25000);

            const unsub = onSnapshot(doc(db, "analysis_queue", finalRequestId), (snapshot) => {
                if (snapshot.exists()) handleUpdate(snapshot.data());
            }, (err) => {
                console.error("AutoPrompt listener err", err);
                startFallback();
            });
            listenerRef.current = unsub;

            setTimeout(() => {
                if (listenerRef.current) {
                    listenerRef.current();
                    listenerRef.current = null;
                }
                if (isAutoPrompting) {
                    clearProgressTimers();
                    setIsAutoPrompting(false);
                    toast.error("Analysis timeout.", { id: 'auto-prompt' });
                }
            }, 180000);

        } catch (error) {
            const cost = 0.5;
            if (rollbackZaps) rollbackZaps(cost, typeof requestId !== 'undefined' ? requestId : 'legacy');

            clearProgressTimers();
            console.error("Auto prompt error", error);
            toast.error(`Failed to start analysis: ${error.message}`, { id: 'auto-prompt' });
            setIsAutoPrompting(false);
        }
    };

    return { isAutoPrompting, handleAutoPrompt };
}
