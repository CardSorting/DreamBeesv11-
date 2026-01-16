import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';

// Components

import ModelSelectorModal from '../components/ModelSelectorModal';
import ImagePickerModal from '../components/ImagePickerModal';
import GenerationHistory from '../components/GenerationHistory';
import SEO from '../components/SEO';

// Refactored Sub-Components
import GeneratorCanvas from '../components/generator/GeneratorCanvas';
import GeneratorControls from '../components/generator/GeneratorControls';
import GeneratorSidebar from '../components/generator/GeneratorSidebar';
import VideoGallery from '../components/generator/VideoGallery';

// Custom Hooks
import { useGeneratorState } from '../hooks/generator/useGeneratorState';
import { useVideoGeneration } from '../hooks/generator/useVideoGeneration';
import { useAutoPrompt } from '../hooks/generator/useAutoPrompt';
import { useGenerationLogic } from '../hooks/generator/useGenerationLogic';

export default function Generator() {
    // 1. Global Contexts
    const { currentUser } = useAuth();
    const { selectedModel, setSelectedModel, availableModels, loading: modelLoading, getShowcaseImages, rateGeneration } = useModel();

    // 2. State Management Hook
    const state = useGeneratorState();
    const {
        // UI
        isModelModalOpen, setIsModelModalOpen,
        isFullscreen, setIsFullscreen,
        activeTab, setActiveTab,
        showcaseImages, setShowcaseImages,
        isImagePickerOpen, setIsImagePickerOpen,

        // Generator Data
        prompt, setPrompt,
        generating, setGenerating,
        generatedImage, setGeneratedImage,
        currentJobId, setCurrentJobId,
        activeJob, setActiveJob,
        elapsedTime, progress,

        // Parameters
        aspectRatio, setAspectRatio,
        steps, setSteps,
        cfg, setCfg,
        negPrompt, setNegPrompt,
        seed, setSeed,

        // User
        zaps, reels, subscriptionStatus,
        useTurbo, setUseTurbo,

        // Video
        generationMode, setGenerationMode,
        videoDuration, setVideoDuration,
        videoResolution, setVideoResolution,
        currentJobType, setCurrentJobType,

        // Reference
        referenceImage, setReferenceImage
    } = state;

    // 3. Logic Hooks
    const { handleGenerate } = useGenerationLogic({
        prompt, selectedModel, generationMode,
        negPrompt, aspectRatio, steps, cfg, seed, useTurbo,
        zaps, reels, subscriptionStatus,
        setGenerating, setGeneratedImage, setCurrentJobType, setCurrentJobId, setActiveJob
    });

    const [analyzingImageId, setAnalyzingImageId] = useState(null);
    const { recentImages, triggerVideoAnimation, handleVideoAutoAnimate } = useVideoGeneration({
        currentUser, generating, setGenerating, setGeneratedImage, setReferenceImage, setPrompt, setCurrentJobType, setCurrentJobId,
        setAnalyzingImageId, videoDuration, videoResolution, aspectRatio, reels
    });

    const { isAutoPrompting, handleAutoPrompt } = useAutoPrompt(
        prompt, setPrompt, referenceImage, setReferenceImage, generationMode
    );

    // 4. Effects
    useEffect(() => {
        const loadShowcase = async () => {
            if (activeTab === 'simple' && showcaseImages.length === 0) {
                const images = await getShowcaseImages(selectedModel?.id);
                setShowcaseImages(images);
            }
        };
        loadShowcase();
    }, [activeTab, selectedModel, getShowcaseImages, showcaseImages.length, setShowcaseImages]);

    // Speech Recognition
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = React.useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
                setPrompt(prev => {
                    // Only append if it's a new sentence to avoid duplication in some browsers
                    return transcript;
                });
            };
            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            recognitionRef.current = recognition;
        }
    }, [setPrompt]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition not supported in this browser");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
            toast.success("Listening... Speak your prompt!", { icon: '🎙️' });
        }
    };

    // HISTORY RESTORE
    const handleHistorySelect = (item) => {
        setPrompt(item.prompt || '');
        setGeneratedImage(item.imageUrl || item.thumbnailUrl);
        setReferenceImage(null);
        setActiveJob(item);
        if (item.modelId) {
            const model = availableModels.find(m => m.id === item.modelId);
            if (model) setSelectedModel(model);
        }
        if (item.aspect_ratio) setAspectRatio(item.aspect_ratio);
        if (item.seed) setSeed(item.seed);
        if (item.steps) setSteps(item.steps);
        if (item.cfg) setCfg(item.cfg);
        if (item.negative_prompt) setNegPrompt(item.negative_prompt);
        setCurrentJobId(item.id);

        if (item.metadata?.type === 'video' || item.type === 'video') {
            setGenerationMode('video');
        } else {
            setGenerationMode('image');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            <SEO title="DreamBees Studio" description="Create stunning AI art." />
            <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '12px' } }} />


            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 280px', height: 'calc(100vh - 64px)', maxWidth: '1800px', margin: '0 auto' }}>

                {/* 1. LEFT SIDEBAR (History & Modes) */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 4px', gap: '16px', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
                        <button
                            onClick={() => setGenerationMode('image')}
                            className={generationMode === 'image' ? "btn-nav-active" : "btn-nav"}
                            title="Image Generation"
                            style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', background: generationMode === 'image' ? 'var(--color-accent-primary)' : 'transparent', color: generationMode === 'image' ? 'white' : 'var(--color-text-muted)' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </button>
                        <button
                            onClick={() => setGenerationMode('video')}
                            className={generationMode === 'video' ? "btn-nav-active" : "btn-nav"}
                            title="Video Animation"
                            style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', background: generationMode === 'video' ? 'var(--color-accent-primary)' : 'transparent', color: generationMode === 'video' ? 'white' : 'var(--color-text-muted)' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                        </button>
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                    <GenerationHistory
                        currentUser={currentUser}
                        onSelect={handleHistorySelect}
                        currentJobId={currentJobId}
                        compact={true}
                    />
                </div>

                {/* 2. CENTER STAGE (Canvas & Controls) */}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px', gap: '12px' }}>
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px', overflow: 'hidden' }}>
                        <GeneratorCanvas
                            generating={generating}
                            progress={progress}
                            elapsedTime={elapsedTime}
                            currentJobId={currentJobId}
                            generatedImage={generatedImage}
                            // isEnhancing removed
                            generationMode={generationMode}
                            activeJob={activeJob}
                            onRate={(rating) => currentJobId && rateGeneration(currentJobId, rating)}
                            onFullscreen={() => setIsFullscreen(true)}
                            prompt={prompt}
                        />

                        {generationMode === 'video' ? (
                            <VideoGallery
                                recentImages={recentImages}
                                analyzingImageId={analyzingImageId}
                                handleVideoAutoAnimate={handleVideoAutoAnimate}
                                onViewAll={() => { }}
                            />
                        ) : (
                            <GeneratorControls
                                prompt={prompt} setPrompt={setPrompt}
                                generationMode={generationMode}
                                // isEnhancing, handleMagicEnhance, activeStyleId removed
                                referenceImage={referenceImage} setReferenceImage={setReferenceImage} clearReferenceImage={() => setReferenceImage(null)}
                                isListening={isListening} setIsListening={setIsListening} toggleListening={toggleListening}
                                setIsImagePickerOpen={setIsImagePickerOpen}
                                isAutoPrompting={isAutoPrompting} handleAutoPrompt={handleAutoPrompt}
                                useTurbo={useTurbo} setUseTurbo={setUseTurbo}
                                generating={generating} handleGenerate={() => handleGenerate()}
                                seed={seed} aspectRatio={aspectRatio} steps={steps} cfg={cfg} negPrompt={negPrompt}
                            />
                        )}
                    </div>
                </div>

                {/* 3. RIGHT SIDEBAR (Parameters) */}
                <GeneratorSidebar
                    activeTab={activeTab} setActiveTab={setActiveTab}
                    generationMode={generationMode}
                    selectedModel={selectedModel}
                    setIsModelModalOpen={setIsModelModalOpen}
                    aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
                    showcaseImages={showcaseImages} setPrompt={setPrompt} setGeneratedImage={setGeneratedImage}
                    // activeStyleId, styleIntensity removed
                    // Video
                    videoDuration={videoDuration} setVideoDuration={setVideoDuration}
                    videoResolution={videoResolution} setVideoResolution={setVideoResolution}
                    // Advanced
                    seed={seed} setSeed={setSeed}
                    steps={steps} setSteps={setSteps}
                    cfg={cfg} setCfg={setCfg}
                    negPrompt={negPrompt} setNegPrompt={setNegPrompt}
                    // Helpers
                    recentImages={recentImages}
                    referenceImage={referenceImage} clearReferenceImage={() => setReferenceImage(null)}
                    setIsImagePickerOpen={setIsImagePickerOpen}
                    handleVideoAutoAnimate={handleVideoAutoAnimate}
                    analyzingImageId={analyzingImageId}
                />
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isModelModalOpen && (
                    <ModelSelectorModal
                        isOpen={isModelModalOpen}
                        onClose={() => setIsModelModalOpen(false)}
                        models={availableModels}
                        selectedModel={selectedModel}
                        onSelectModel={setSelectedModel}
                    />
                )}
                {isImagePickerOpen && (
                    <ImagePickerModal
                        isOpen={isImagePickerOpen}
                        onClose={() => setIsImagePickerOpen(false)}
                        onSelect={(url) => { setReferenceImage(url); setIsImagePickerOpen(false); }}
                        currentUser={currentUser}
                    />
                )}
                {isFullscreen && generatedImage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => setIsFullscreen(false)} style={{ position: 'absolute', top: 20, right: 20, color: 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                        {/\.(mp4|webm)/i.test(generatedImage) ? (
                            <video src={generatedImage} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '100%' }} />
                        ) : (
                            <img src={generatedImage} alt="Fullscreen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global CSS for this page's specific needs not covered by Tailwind/global styles */}
            <style>{`
                .glass-panel { background: rgba(30,30,30,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .btn-nav { cursor: pointer; }
                .btn-nav:hover { background: rgba(255,255,255,0.1) !important; color: white !important; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>
        </div>
    );
}
