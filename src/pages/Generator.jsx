import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// motion.div is used for fullscreen view
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { trackEvent, trackSettingChange, trackFeatureAdoption } from '../utils/analytics';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useModel } from '../contexts/ModelContext';
import { useUserInteractions } from '../contexts/UserInteractionsContext';

// Components

import ModelSelectorModal from '../components/ModelSelectorModal';
import ImagePickerModal from '../components/ImagePickerModal';
import GenerationHistory from '../components/GenerationHistory';
import SEO from '../components/SEO';

// Refactored Sub-Components
// import GeneratorCanvas from '../components/generator/GeneratorCanvas'; // Removed as per request
import ResultModal from '../components/generator/ResultModal';
import GeneratorControls from '../components/generator/GeneratorControls';
import GeneratorSidebar from '../components/generator/GeneratorSidebar';
import VideoGallery from '../components/generator/VideoGallery';
import LoadingModal from '../components/generator/LoadingModal';

// Custom Hooks
import { useVideoGeneration } from '../hooks/generator/useVideoGeneration';
import { useAutoPrompt } from '../hooks/generator/useAutoPrompt';
import { useGenerationLogic } from '../hooks/generator/useGenerationLogic';

export default function Generator() {
    // 1. Global Contexts
    const { currentUser } = useAuth();
    const { selectedModel, setSelectedModel, availableModels, loading: _modelLoading, getShowcaseImages, rateGeneration } = useModel();

    // 2. State Management (Inlined from useGeneratorState)
    const [searchParams, setSearchParams] = useSearchParams();
    const { userProfile, deductZapsOptimistically, rollbackZaps, deductReelsOptimistically, rollbackReels } = useUserInteractions();

    const modeParam = searchParams.get('mode') || 'image';
    const tabParam = searchParams.get('tab') || 'simple';

    // UI State
    /**
     * @typedef {'simple' | 'advanced'} TabType
     */
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeTab, setActiveTab] = useState(tabParam);
    const [showcaseImages, setShowcaseImages] = useState([]);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

    // Generation Core State
    const [prompt, setPrompt] = useState(searchParams.get('prompt') || '');
    const [_activeStyleId, _setActiveStyleId] = useState(null);
    const [_hasValidPrompt, _setHasValidPrompt] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [_currentJobType, setCurrentJobType] = useState('image');
    const [_activeJob, setActiveJob] = useState(null);
    const [_elapsedTime, _setElapsedTime] = useState(0);
    const [_progress, _setProgress] = useState(0);

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
    const [generationMode, setGenerationMode] = useState(modeParam); // 'image' | 'video'
    const [videoDuration, setVideoDuration] = useState(5);
    const [videoResolution, setVideoResolution] = useState('large_landscape');

    // Sync with URL
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (modeParam !== generationMode) setGenerationMode(modeParam);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (tabParam !== activeTab) setActiveTab(tabParam);
    }, [modeParam, tabParam, generationMode, activeTab]);

    const handleModeChange = (newMode) => {
        setGenerationMode(newMode);
        trackEvent('switch_generation_mode', { mode: newMode });
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (newMode && newMode !== 'image') next.set('mode', newMode);
            else next.delete('mode');
            return next;
        }, { replace: true });
    };

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        trackEvent('switch_generator_tab', { tab: newTab });
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (newTab && newTab !== 'simple') next.set('tab', newTab);
            else next.delete('tab');
            return next;
        }, { replace: true });
    };

    const updateParam = (key, val) => {
        trackSettingChange(key, val);
        if (val !== undefined && val !== null && val !== '' && val !== -1) {
            trackFeatureAdoption(`custom_${key}`, { value: val });
        }
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (val !== undefined && val !== null && val !== '' && val !== -1) {
                next.set(key, val);
            } else {
                next.delete(key);
            }
            return next;
        }, { replace: true });
    };

    // Track model selection
    useEffect(() => {
        if (selectedModel) {
            trackEvent('select_model', { model_id: selectedModel.id, model_name: selectedModel.name });
        }
    }, [selectedModel]);

    // Reference Image
    const [referenceImage, setReferenceImage] = useState(null);

    // Timer Logic
    useEffect(() => {
        if (!generating) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            _setElapsedTime(prev => (prev !== 0 ? 0 : prev));
            // eslint-disable-next-line react-hooks/set-state-in-effect
            _setProgress(prev => (prev !== 0 ? 0 : prev));
            return;
        }

        const interval = setInterval(() => {
            _setElapsedTime(prev => prev + 1);
            _setProgress(prev => prev + (99 - prev) * 0.02);
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

    // 3. Logic Hooks
    const { handleGenerate, cancelGeneration } = useGenerationLogic({
        prompt, selectedModel, generationMode,
        negPrompt, aspectRatio, steps, cfg, seed, useTurbo,
        zaps: selectedModel?.id === 'galmix' ? 999 : zaps, // bypass local check
        reels, subscriptionStatus,
        setGenerating, setGeneratedImage, setCurrentJobType, setCurrentJobId, setActiveJob,
        deductZapsOptimistically,
        rollbackZaps
    });

    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    // Open Modal when generation completes (generatedImage changes and not generating)
    useEffect(() => {
        if (generatedImage && !generating) {
            setIsResultModalOpen(true); // eslint-disable-line react-hooks/set-state-in-effect
        }
    }, [generatedImage, generating]);

    const [analyzingImageId, setAnalyzingImageId] = useState(null);
    const { recentImages, triggerVideoAnimation: _triggerVideoAnimation, handleVideoAutoAnimate } = useVideoGeneration({
        currentUser, generating, setGenerating, setGeneratedImage, setReferenceImage, setPrompt, setCurrentJobType, setCurrentJobId,
        setAnalyzingImageId, videoDuration, videoResolution, aspectRatio, reels,
        deductReelsOptimistically, rollbackReels
    });


    const { isAutoPrompting, handleAutoPrompt } = useAutoPrompt(
        prompt, setPrompt, referenceImage, setReferenceImage, generationMode,
        { deductZapsOptimistically, rollbackZaps }
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
                setPrompt(_prev => {
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
            const model = availableModels?.find(m => m.id === item.modelId);
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
        setIsResultModalOpen(true);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            <SEO
                title="AI Art Studio - Create Images & Videos"
                description="Generate stunning AI images and videos in seconds. Simple prompts, powerful results. Turbo mode for instant generation. Private by default."
                keywords="AI image generator, create AI art, text to image, AI art studio, prompt to picture, image synthesis, AI video generation"
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "SoftwareApplication",
                            "name": "DreamBees Studio",
                            "applicationCategory": "DesignApplication",
                            "operatingSystem": "Web",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD"
                            },
                            "featureList": [
                                "Text to Image Generation",
                                "AI Video Animation",
                                "Turbo Mode",
                                "Private Gallery",
                                "Multiple AI Models",
                                "Pro Editing Tools"
                            ],
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": "4.9",
                                "reviewCount": "1250"
                            }
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Studio", "item": "https://dreambeesai.com/generate" }
                            ]
                        }
                    ]
                }}
            />
            <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '12px' } }} />


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 'calc(100vh - 64px)', maxWidth: '1800px', margin: '0 auto' }}>

                {/* 2. CENTER STAGE (Canvas & Controls) */}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px', gap: '12px' }}>
                    <div className="glass-panel custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflowY: 'auto' }}>
                        {/* GeneratorCanvas removed. Showing placeholder or just controls container */}



                        {/* Mode Selector */}
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
                            <button
                                onClick={() => handleModeChange('image')}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px',
                                    background: generationMode === 'image' ? 'var(--color-accent-primary)' : 'transparent',
                                    color: generationMode === 'image' ? 'white' : 'var(--color-text-muted)',
                                    fontSize: '0.9rem', fontWeight: '600', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                Image Generation
                            </button>
                            <button
                                onClick={() => handleModeChange('video')}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px',
                                    background: generationMode === 'video' ? 'var(--color-accent-primary)' : 'transparent',
                                    color: generationMode === 'video' ? 'white' : 'var(--color-text-muted)',
                                    fontSize: '0.9rem', fontWeight: '600', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                Video Animation
                            </button>
                        </div>

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
                                selectedModel={selectedModel}
                                zaps={zaps}
                                subscriptionStatus={subscriptionStatus}
                            />
                        )}

                        <div style={{ marginTop: '12px' }}>
                            <GenerationHistory
                                currentUser={currentUser}
                                onSelect={handleHistorySelect}
                                currentJobId={currentJobId}
                                compact={true}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT SIDEBAR (Parameters) */}
                <GeneratorSidebar
                    activeTab={activeTab} setActiveTab={handleTabChange}
                    generationMode={generationMode} setGenerationMode={handleModeChange}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    availableModels={currentUser ? availableModels.filter(m => !m.hideFromGenerator) : availableModels.filter(m => m.id === 'galmix')}
                    setIsModelModalOpen={setIsModelModalOpen}
                    aspectRatio={aspectRatio} setAspectRatio={(val) => { setAspectRatio(val); updateParam('aspectRatio', val); }}
                    showcaseImages={showcaseImages} setPrompt={setPrompt} setGeneratedImage={setGeneratedImage}
                    // activeStyleId, styleIntensity removed
                    // Video
                    videoDuration={videoDuration} setVideoDuration={setVideoDuration}
                    videoResolution={videoResolution} setVideoResolution={setVideoResolution}
                    // Advanced
                    seed={seed} setSeed={(val) => { setSeed(val); updateParam('seed', val); }}
                    steps={steps} setSteps={(val) => { setSteps(val); updateParam('steps', val); }}
                    cfg={cfg} setCfg={(val) => { setCfg(val); updateParam('cfg', val); }}
                    negPrompt={negPrompt} setNegPrompt={(val) => { setNegPrompt(val); updateParam('negPrompt', val); }}
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
                        models={currentUser ? availableModels.filter(m => !m.hideFromGenerator) : availableModels.filter(m => m.id === 'galmix')}
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
                {isResultModalOpen && (
                    <ResultModal
                        isOpen={isResultModalOpen}
                        onClose={() => setIsResultModalOpen(false)}
                        generatedImage={generatedImage}
                        generationMode={generationMode}
                        prompt={prompt}
                        onRate={(rating) => currentJobId && rateGeneration(currentJobId, rating)}
                        downloadUrl={generatedImage}
                    />
                )}
                {/* Fullscreen handled by result modal mostly, keeping this if needed for other contexts or removing if redundant. Keeping for now as fallback */}
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
                {generating && <LoadingModal prompt={prompt} useTurbo={useTurbo} onCancel={cancelGeneration} />}
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
