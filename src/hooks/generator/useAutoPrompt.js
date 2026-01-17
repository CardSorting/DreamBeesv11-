import { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils';

export function useAutoPrompt(prompt, setPrompt, referenceImage, setReferenceImage, generationMode) {
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
            toast.loading("Starting analysis...", { id: 'auto-prompt' });

            const api = httpsCallable(functions, 'api', { timeout: 540000 });
            const payload = { action: 'createAnalysisRequest' };

            if (referenceImage.startsWith('data:')) {
                const compressedImage = await compressImage(referenceImage, 1024, 0.7);
                payload.image = compressedImage;
            } else {
                payload.imageUrl = referenceImage;
            }

            const { data } = await api(payload);
            const requestId = data.requestId;

            const unsub = onSnapshot(doc(db, "analysis_queue", requestId), (snapshot) => {
                if (snapshot.exists()) {
                    const status = snapshot.data().status;
                    if (status === 'completed') {
                        clearProgressTimers();
                        setPrompt(snapshot.data().prompt);
                        toast.success("Prompt generated!", { id: 'auto-prompt' });

                        if (generationMode === 'image') {
                            setReferenceImage(null);
                        }
                        setIsAutoPrompting(false);
                        unsub();
                        listenerRef.current = null;
                    } else if (status === 'failed') {
                        clearProgressTimers();
                        toast.error("Analysis failed: " + snapshot.data().error, { id: 'auto-prompt' });
                        setIsAutoPrompting(false);
                        unsub();
                        listenerRef.current = null;
                    }
                }
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
            clearProgressTimers();
            console.error("Auto prompt error", error);
            toast.error(`Failed to start analysis: ${error.message}`, { id: 'auto-prompt' });
            setIsAutoPrompting(false);
        }
    };

    return { isAutoPrompting, handleAutoPrompt };
}
