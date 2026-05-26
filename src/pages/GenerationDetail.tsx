/**
 * [LAYER: INFRASTRUCTURE]
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconCheck,
    IconChevronRight,
    IconLayers,
    IconZap
} from '../icons';
import { getOptimizedImageUrl, copyToClipboard, showToast, downloadImage, formatDuration } from '@/lite-utils';
import { matchesGenerationRoute, mapHistoryItemToDetail, canonicalGenerationRouteId } from '@/lib/generationFlow';
import { useLite } from '@/contexts/LiteContext';
import { GenerationOrchestrator } from '@/core/GenerationOrchestrator';
import { GenerationRepository, PermissionError } from '@/infrastructure/GenerationRepository';
import { formatParameters } from '@/pages/GenerationDetail/MetadataFormatter';

// Import components
import ImmersiveHero from '@/pages/GenerationDetail/ImmersiveHero';
import PromptReveal from '@/pages/GenerationDetail/PromptReveal';
import MetadataGrid from '@/pages/GenerationDetail/MetadataGrid';
import ActionToolbar from '@/pages/GenerationDetail/ActionToolbar';

export default function GenerationDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const generationId = id || '';
    const prefetched = (location.state as { generation?: Record<string, unknown> } | null)?.generation;
    const { displayHistory, currentUser } = useLite();

    // State
    const [generation, setGeneration] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isCompareMode, setIsCompareMode] = useState(false);

    const orchestrator = useMemo(
        () => new GenerationOrchestrator(new GenerationRepository()),
        []
    );
    const resolvedIdRef = useRef<string | null>(null);
    const lastFetchAttemptRef = useRef<string | null>(null);
    const [fetchVersion, setFetchVersion] = useState(0);

    const retryFetch = useCallback(() => {
        resolvedIdRef.current = null;
        lastFetchAttemptRef.current = null;
        setError(null);
        setGeneration(null);
        setIsLoading(true);
        setFetchVersion((v) => v + 1);
    }, []);
    useEffect(() => {
        if (!generationId) return;

        if (resolvedIdRef.current !== generationId) {
            resolvedIdRef.current = null;
            lastFetchAttemptRef.current = null;
            setGeneration(null);
            setError(null);
            setIsLoading(true);
        }

        const tryPrefetch = (raw: Record<string, unknown> | undefined): boolean => {
            if (!raw?.imageUrl || !matchesGenerationRoute(raw as any, generationId)) return false;
            setGeneration(mapHistoryItemToDetail(raw));
            setError(null);
            setIsLoading(false);
            resolvedIdRef.current = generationId;
            return true;
        };

        if (tryPrefetch(prefetched)) return;

        const fromHistory = displayHistory.find((item) =>
            matchesGenerationRoute(item, generationId)
        );
        if (tryPrefetch(fromHistory)) return;

        if (resolvedIdRef.current === generationId) return;

        if (lastFetchAttemptRef.current === generationId && fetchVersion === 0) {
            const fromHistoryRetry = displayHistory.find((item) =>
                matchesGenerationRoute(item, generationId)
            );
            if (!fromHistoryRetry?.imageUrl) return;
        }

        if (!currentUser) {
            setError('Sign in to view this picture.');
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        lastFetchAttemptRef.current = generationId;

        const fetchGeneration = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await orchestrator.fetchFullGeneration(generationId);
                if (cancelled) return;
                setGeneration(data);
                resolvedIdRef.current = generationId;
            } catch (err: any) {
                if (cancelled) return;
                console.error('Failed to load generation:', err);
                if (err instanceof PermissionError) {
                    setError('You cannot view this picture. Try signing in with the account that created it.');
                } else if (err?.message?.includes('not found')) {
                    setError('This picture could not be found. It may have been removed.');
                } else {
                    setError(err.message || 'Could not load this picture.');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchGeneration();
        return () => { cancelled = true; };
    }, [generationId, orchestrator, prefetched, displayHistory, fetchVersion, currentUser]);

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
        const shareId = generation ? canonicalGenerationRouteId(generation) : generationId;
        const shareUrl = `${window.location.origin}/generation/${shareId}`;

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
        const needsSignIn = !currentUser;
        return (
            <div className="generation-detail-error glass-immersive">
                <IconLayers size={64} />
                <h2 className="error-title">Could not open picture</h2>
                <p className="error-message">{error}</p>
                <div className="error-actions">
                    {needsSignIn ? (
                        <Link to="/auth" className="back-button">
                            Sign in
                        </Link>
                    ) : (
                        <button type="button" onClick={retryFetch} className="back-button">
                            Try again
                        </button>
                    )}
                    <button type="button" onClick={() => navigate(-1)} className="back-button secondary">
                        <IconChevronRight rotation={180} /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="generation-detail-page glass-immersive full-page">

            {/* Header */}
            <header className="generation-detail-header">
                <div className="header-overview">
                    <h1 className="generation-title">
                        {(generation?.prompt || generationId).slice(0, 48)}
                    </h1>
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
                        generationId={canonicalGenerationRouteId(generation)}
                        imageUrl={generation.imageUrl}
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