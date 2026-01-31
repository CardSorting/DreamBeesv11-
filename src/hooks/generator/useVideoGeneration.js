import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { httpsCallable } from 'firebase/functions'; // Removed
import { db } from '../../firebase';
import { useApi } from '../../hooks/useApi';
import { onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore';
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
    reels: _reels,
    deductReelsOptimistically,
    rollbackReels
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
    }, [currentUser]);

    const { call: apiCall } = useApi();
    const navigate = useNavigate();

    const triggerVideoAnimation = async (imageUrl, imageId = null, imgAspectRatio = null) => {
        if (generating) return;

        if (!currentUser) {
            toast.error("Please log in to animate images");
            navigate('/auth');
            return;
        }

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

        let requestId = 'legacy';
        try {
            let processedImage = imageUrl;

            if (imageUrl && imageUrl.startsWith('data:')) {
                console.warn(`[Video] Compressing input image...`);
                processedImage = await compressImage(imageUrl, 1024, 0.7);
            }

            // const api = httpsCallable(functions, 'api', { timeout: 540000 });
            // Replaced with useApi call
            requestId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const cost = 1; // Video generation costs 1 Reel
            if (deductReelsOptimistically) deductReelsOptimistically(cost, requestId);

            const { data } = await apiCall('api', {
                action: 'createVideoGenerationRequest',
                autoPrompt: true,
                image: processedImage,
                duration: videoDuration,
                resolution: videoResolution,
                aspectRatio: imgAspectRatio || aspectRatio,
                requestId
            }, {
                timeout: 540000,
                toastErrors: false // We handle specific errors below
            });

            setCurrentJobId(data.requestId);
            clearProgressTimers();
            toast.success("Video job finished setup!", { id: 'video-animate' });

        } catch (error) {
            clearProgressTimers();
            console.error("Video generation error", error);

            const cost = 1;
            if (rollbackReels) rollbackReels(cost, requestId);

            let errorMessage = "Failed to animate image.";
            if (error.message?.includes('concurrency')) errorMessage = "Video generation already in progress.";
            else if (error.code === 'resource-exhausted') errorMessage = "Insufficient Reels balance.";
            else if (error.message?.includes('INVALID_ARGUMENT')) errorMessage = "Image too large or invalid.";
            else if (error.message) errorMessage = error.message;

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
