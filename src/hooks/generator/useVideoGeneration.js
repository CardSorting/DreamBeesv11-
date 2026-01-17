import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../../firebase';
import { doc, onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils';

export function useVideoGeneration({
    currentUser,
    generating, setGenerating,
    setGeneratedImage,
    setReferenceImage,
    setPrompt,
    setCurrentJobType,
    setCurrentJobId,
    setAnalyzingImageId,
    videoDuration,
    videoResolution,
    aspectRatio,
    reels
}) {
    const [recentImages, setRecentImages] = useState([]);

    // Fetch Recent Images
    useEffect(() => {
        if (currentUser) {
            const q = query(
                collection(db, 'generation_queue'),
                where('userId', '==', currentUser.uid),
                where('status', '==', 'completed'),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setRecentImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribe();
        }
    }, [currentUser?.uid]);

    const triggerVideoAnimation = async (imageUrl, imageId = null, imgAspectRatio = null) => {
        if (generating) return;

        if (imageId) setAnalyzingImageId(imageId);
        setGenerating(true);
        setGeneratedImage(null);
        setCurrentJobType('video');
        setReferenceImage(imageUrl);
        setPrompt("Analyzing image...");

        const progressUpdates = [
            { delay: 500, message: `🎬 Preparing video studio...` },
            { delay: 1500, message: `📤 Uploading image for analysis...` },
            { delay: 3500, message: `🤖 Analyzing scene composition...` },
            { delay: 6000, message: `🎥 Configuring camera motion...` },
            { delay: 9000, message: `✨ Queuing generation job...` }
        ];

        const progressTimers = progressUpdates.map(({ delay, message }) =>
            setTimeout(() => toast.loading(message, { id: 'video-animate' }), delay)
        );

        const clearProgressTimers = () => progressTimers.forEach(timer => clearTimeout(timer));

        toast.loading("Starting video animation...", { id: 'video-animate' });

        const MAX_RETRIES = 3;
        let retries = 0;
        let success = false;

        try {
            const api = httpsCallable(functions, 'api', { timeout: 540000 });
            let processedImage = imageUrl;

            if (imageUrl && imageUrl.startsWith('data:')) {
                console.log(`[Video] Compressing input image...`);
                processedImage = await compressImage(imageUrl, 1024, 0.7);
            }

            while (retries < MAX_RETRIES && !success) {
                try {
                    const videoResult = await api({
                        action: 'createVideoGenerationRequest',
                        autoPrompt: true,
                        image: processedImage,
                        duration: videoDuration,
                        resolution: videoResolution,
                        aspectRatio: imgAspectRatio || aspectRatio
                    });

                    setCurrentJobId(videoResult.data.requestId);
                    success = true;
                    clearProgressTimers();
                    toast.success("Video job finished setup!", { id: 'video-animate' });

                } catch (innerError) {
                    console.error(`Video attempt ${retries + 1} failed:`, innerError);
                    const isRetryable = innerError.message?.includes('internal') || innerError.code === 'internal';

                    if (isRetryable && retries < MAX_RETRIES - 1) {
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retries)));
                        toast.loading(`Retrying... (Attempt ${retries + 1})`, { id: 'video-animate' });
                    } else {
                        throw innerError;
                    }
                }
            }
        } catch (error) {
            clearProgressTimers();
            console.error("Video generation error", error);

            let errorMessage = "Failed to animate image.";
            if (error.message?.includes('concurrency')) errorMessage = "Video generation already in progress.";
            else if (error.code === 'resource-exhausted') errorMessage = "Insufficient Reels balance.";
            else if (error.message?.includes('INVALID_ARGUMENT')) errorMessage = "Image too large or invalid.";

            toast.error(errorMessage, { id: 'video-animate' });
            setGenerating(false);
            setPrompt("");
            setReferenceImage(null);
        } finally {
            setAnalyzingImageId(null);
        }
    };

    const handleVideoAutoAnimate = (image) => triggerVideoAnimation(image.imageUrl, image.id, image.aspectRatio);

    return {
        recentImages,
        triggerVideoAnimation,
        handleVideoAutoAnimate
    };
}
