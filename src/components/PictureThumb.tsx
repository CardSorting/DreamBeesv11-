import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../lite-utils';
import { historyThumbUrl } from '../lib/generationFlow';

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
    const [src, setSrc] = useState(() => getOptimizedImageUrl(rawThumb) || rawThumb || '');

    useEffect(() => {
        const next = historyThumbUrl(item);
        setSrc(getOptimizedImageUrl(next) || next || '');
    }, [item.imageUrl, item.thumbnailUrl, item.previewUrl, item.lqip]);

    if (!item.imageUrl) return null;

    return (
        <Link
            to={`/generation/${item.id}`}
            state={{ generation: item }}
            className={className}
        >
            <img
                src={src}
                alt={item.prompt || 'Your picture'}
                loading="lazy"
                onError={() => {
                    const fallback = item.imageUrl;
                    if (src !== fallback) setSrc(fallback);
                }}
            />
            {showCaption && item.prompt ? <span>{item.prompt}</span> : null}
        </Link>
    );
}
