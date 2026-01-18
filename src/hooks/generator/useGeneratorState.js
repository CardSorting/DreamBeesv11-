import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserInteractions } from '../../contexts/UserInteractionsContext';

export function useGeneratorState() {
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();
    // Centralized Profile Data
    const { userProfile } = useUserInteractions();

    // UI State
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeTab, setActiveTab] = useState('simple');
    const [showcaseImages, setShowcaseImages] = useState([]);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

    // Generation Core State
    const [prompt, setPrompt] = useState(searchParams.get('prompt') || '');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [activeJob, setActiveJob] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [progress, setProgress] = useState(0);

    // Parameters
    const [aspectRatio, setAspectRatio] = useState(searchParams.get('aspectRatio') || '1:1');
    const [steps, setSteps] = useState(parseInt(searchParams.get('steps')) || 30);
    const [cfg, setCfg] = useState(parseFloat(searchParams.get('cfg')) || 7.0);
    const [negPrompt, setNegPrompt] = useState(searchParams.get('negPrompt') || "");
    const [seed, setSeed] = useState(parseInt(searchParams.get('seed')) || -1);

    // Advanced / User State (From Context)
    const zaps = userProfile?.zaps || 5;
    const reels = userProfile?.reels || 0;
    const subscriptionStatus = userProfile?.subscriptionStatus || 'inactive';
    const [useTurbo, setUseTurbo] = useState(false);

    // Video & Advanced State
    const [generationMode, setGenerationMode] = useState('image'); // 'image' | 'video'
    const [videoDuration, setVideoDuration] = useState(5);
    const [videoResolution, setVideoResolution] = useState('large_landscape');
    const [currentJobType, setCurrentJobType] = useState('image');

    // Reference Image
    const [referenceImage, setReferenceImage] = useState(null);

    // Timer Logic
    useEffect(() => {
        if (!generating) {
            setElapsedTime(0);
            setProgress(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
            setProgress(prev => prev + (99 - prev) * 0.02);
        }, 100);

        return () => clearInterval(interval);
    }, [generating]);

    // Fullscreen Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    return {
        // UI
        isModelModalOpen, setIsModelModalOpen,
        isFullscreen, setIsFullscreen,
        activeTab, setActiveTab,
        showcaseImages, setShowcaseImages,
        isImagePickerOpen, setIsImagePickerOpen,

        // Core
        prompt, setPrompt,
        generating, setGenerating,
        generatedImage, setGeneratedImage,
        currentJobId, setCurrentJobId,
        activeJob, setActiveJob,
        elapsedTime,
        progress, setProgress,

        // Params
        aspectRatio, setAspectRatio,
        steps, setSteps,
        cfg, setCfg,
        negPrompt, setNegPrompt,
        seed, setSeed,

        // User
        zaps,
        reels,
        subscriptionStatus,
        useTurbo, setUseTurbo,

        // Video
        generationMode, setGenerationMode,
        videoDuration, setVideoDuration,
        videoResolution, setVideoResolution,
        currentJobType, setCurrentJobType,

        // Reference
        referenceImage, setReferenceImage
    };
}
