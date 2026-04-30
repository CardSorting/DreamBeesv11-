/**
 * [LAYER: INFRASTRUCTURE]
 */

import React, { Suspense, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    IconCheck, 
    IconChevronRight,
    IconLayers,
    IconZap
} from '../icons';
import { getOptimizedImageUrl, copyToClipboard, showToast, downloadImage, formatDuration } from '@/lite-utils';
import { GenerationOrchestrator } from '@/core/GenerationOrchestrator';
import { GenerationRepository } from '@/infrastructure/GenerationRepository';
import { NavigatonHandler } from '@/core/NavigationHandler';
import { formatParameters } from '@/pages/GenerationDetail/MetadataFormatter';

// Import components
import ImmersiveHero from '@/pages/GenerationDetail/ImmersiveHero';
import PromptReveal from '@/pages/GenerationDetail/PromptReveal';
import MetadataGrid from '@/pages/GenerationDetail/MetadataGrid';
import ActionToolbar from '@/pages/GenerationDetail/ActionToolbar';

export default function GenerationDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const generationId = id || '';
    
    // State
    const [generation, setGeneration] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isCompareMode, setIsCompareMode] = useState(false);
    
    // Initialize orchestrator once
    const orchestrator = new GenerationOrchestrator(new GenerationRepository());
    
    // Fetch generation data
    useEffect(() => {
        const fetchGeneration = async () => {
            try {
                setIsLoading(true);
                const data = await orchestrator.fetchFullGeneration(generationId);
                setGeneration(data);
                setError(null);
            } catch (err: any) {
                console.error('Failed to load generation:', err);
                setError(err.message || 'Failed to load generation details');
            } finally {
                setIsLoading(false);
            }
        };
        
        if (generationId) {
            fetchGeneration();
        }
    }, [generationId, orchestrator]);
    
    // Handle copy prompt
    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(generation?.prompt || '').then(() => {
            showToast('Prompt copied!', 'success');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    // Handle download
    const handleDownload = () => {
        if (generation?.imageUrl) {
            downloadImage(generation.imageUrl, `dreambees-${generationId}.png`);
        }
    };
    
    // Handle share
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/generation/${generationId}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'DreamBees Generation',
                    text: generation?.prompt || 'Check out this generation!',
                    url: shareUrl
                });
            } catch (err) {
                // Fallback to clipboard
                copyToClipboard(shareUrl);
            }
        } else {
            copyToClipboard(shareUrl);
        }
    };
    
    // Handle compare mode toggle
    const toggleCompareMode = () => {
        setIsCompareMode(!isCompareMode);
    };
    
    if (isLoading) {
        return (
            <div className="generation-detail-loading glass-immersive">
                <div className="loading-animation">
                    <IconZap size={64} fill="currentColor" />
                    <div className="loading-message">
                        Loading your creation...
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="generation-detail-error glass-immersive">
                <IconLayers size={64} />
                <h2 className="error-title">Failed to Load</h2>
                <p className="error-message">{error}</p>
                <button onClick={() => navigate(-1)} className="back-button">
                    <IconChevronRight rotation={180} /> Go Back
                </button>
            </div>
        );
    }
    
    return (
        <div className="generation-detail-page glass-immersive full-page">
            
            {/* Header */}
            <header className="generation-detail-header">
                <div className="header-overview">
                    <h1 className="generation-title">{generationId.slice(0, 12)}</h1>
                    <p className="generation-subtitle">Generation Details</p>
                </div>
                <div className="header-actions">
                    <button 
                        onClick={handleShare}
                        className="action-button-outline"
                    >
                        Share
                    </button>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="action-button-outline"
                    >
                        Back
                    </button>
                </div>
            </header>
            
            {/* Content Grid */}
            <div className="detail-content-grid">
                {/* Main content area (left side) */}
                <div className="detail-main">
                    <div className="immersive-hero-wrapper">
                        <ImmersiveHero 
                            generation={generation}
                            onCopyPrompt={handleCopyPrompt}
                            onDownload={handleDownload}
                            onShare={handleShare}
                        />
                        
                        <PromptReveal 
                            prompt={generation.prompt}
                            parameters={formatParameters(generation)}
                            onClickCopy={handleCopyPrompt}
                            copied={copied}
                        />
                        
                        <MetadataGrid generation={generation} />
                    </div>
                </div>
                
                {/* Side panel (right side) */}
                <div className="detail-sidebar">
                    <ActionToolbar 
                        generationId={generation.id}
                        prompt={generation.prompt}
                        modelId={generation.modelId}
                        generationTime={generation.generationTime}
                        onToggleCompare={toggleCompareMode}
                    />
                </div>
            </div>
            
            {/* Overlay for compare mode (when it exists in future) */}
            <AnimatePresence>
                {isCompareMode && (
                    <motion.div 
                        className="compare-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="compare-header">
                            <h3>Similar Generations</h3>
                            <button onClick={toggleCompareMode} aria-label="Close compare">
                                <IconCheck size={24} rotation={180} />
                            </button>
                        </div>
                        <div className="compare-content">
                            {/* Future: Load similar generations */}
                            <p className="compare-placeholder">
                                Coming soon: Compare with similar variations
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}