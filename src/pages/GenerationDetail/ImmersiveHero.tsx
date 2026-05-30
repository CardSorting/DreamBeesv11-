/**
 * [LAYER: INFRASTRUCTURE]
 */

import React, { useEffect, useState } from 'react';
import { IconDownload, IconShare, IconZap, IconText } from '@/icons';
import { downloadImage, formatDuration, getOptimizedImageUrl } from '@/lite-utils';
import type { GenerationDetail } from '@/domain/models/GenerationDetail';

interface ImmersiveHeroProps {
    generation: GenerationDetail;
    onCopyPrompt: () => void;
    onDownload: () => void;
    onShare: () => void;
}

export default function ImmersiveHero({
    generation,
    onCopyPrompt,
    onDownload,
    onShare
}: ImmersiveHeroProps) {
    const [imgSrc, setImgSrc] = useState(() => {
        const preview = generation.previewUrl as string | undefined;
        const primary = generation.imageUrl;
        return getOptimizedImageUrl(preview || primary) || preview || primary;
    });

    useEffect(() => {
        const preview = generation.previewUrl as string | undefined;
        const primary = generation.imageUrl;
        const next = preview || primary;
        setImgSrc(getOptimizedImageUrl(next) || next);
    }, [generation.imageUrl, generation.previewUrl]);

    return (
        <div className="immersive-hero">
            {/* Image container with generation time badge */}
            <div className="hero-image-container">
                <div className="generation-time-badge">
                    <IconZap size={12} />
                    <span>{formatDuration(generation.generationTime || 0)}</span>
                </div>
                <img
                    src={imgSrc}
                    alt={generation.prompt}
                    className="hero-image"
                    decoding="async"
                    onError={() => {
                        const fallback = generation.imageUrl;
                        if (imgSrc !== fallback) setImgSrc(fallback);
                    }}
                />
            </div>

            {/* Action buttons grid */}
            <div className="hero-actions">
                <button
                    onClick={onCopyPrompt}
                    className="action-button large"
                >
                    <IconText size={20} />
                    Copy Prompt
                </button>

                <button
                    onClick={onDownload}
                    className="action-button large includes"
                >
                    <IconDownload size={20} />
                    Download Image
                </button>

                <button
                    onClick={onShare}
                    className="action-button"
                >
                    <IconShare size={20} />
                    Share
                </button>
            </div>
        </div>
    );
}