import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl, optimizeImageUrl } from '../lite-utils';
import { historyThumbUrl, canonicalGenerationRouteId } from '../lib/generationFlow';

interface PictureThumbProps {
    item: {
        id: string;
        prompt?: string;
        imageUrl: string;
        thumbnailUrl?: string;
        previewUrl?: string;
        lqip?: string;
        [key: string]: unknown;
    };
    className?: string;
    showCaption?: boolean;
}

export default function PictureThumb({ item, className = 'picture-card', showCaption = true }: PictureThumbProps) {
    const rawThumb = historyThumbUrl(item);
    
    const getFinalThumb = (url: string) => {
        const optimized = getOptimizedImageUrl(url) || url || '';
        if (optimized && optimized.startsWith('http')) {
            return optimizeImageUrl(optimized, 'thumbnail');
        }
        return optimized;
    };

    const [src, setSrc] = useState(() => getFinalThumb(rawThumb));

    useEffect(() => {
        const next = historyThumbUrl(item);
        setSrc(getFinalThumb(next));
    }, [item.imageUrl, item.thumbnailUrl, item.previewUrl, item.lqip]);

    if (!item.imageUrl) return null;

    const routeId = canonicalGenerationRouteId(item);

    return (
        <Link
            to={`/generation/${routeId}`}
            state={{ generation: item }}
            className={className}
            onMouseEnter={() => import('../pages/GenerationDetail')}
        >
            <img
                src={src}
                alt={item.prompt || 'Your picture'}
                loading="lazy"
                decoding="async"
                onError={() => {
                    const fallback = item.imageUrl;
                    if (src !== fallback) setSrc(fallback);
                }}
            />
            {showCaption && item.prompt ? <span>{item.prompt}</span> : null}
        </Link>
    );
}
