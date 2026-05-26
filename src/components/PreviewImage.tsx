import React, { useEffect, useState } from 'react';
import { getOptimizedImageUrl } from '../lite-utils';

interface PreviewImageProps {
    src: string;
    alt?: string;
    className?: string;
    loading?: 'lazy' | 'eager';
}

/** CDN-optimized image with automatic fallback to raw URL */
export default function PreviewImage({
    src,
    alt = '',
    className,
    loading = 'lazy',
}: PreviewImageProps) {
    const [resolved, setResolved] = useState(() => getOptimizedImageUrl(src) || src);

    useEffect(() => {
        setResolved(getOptimizedImageUrl(src) || src);
    }, [src]);

    if (!src) return null;

    return (
        <img
            src={resolved}
            alt={alt}
            className={className}
            loading={loading}
            onError={() => {
                if (resolved !== src) setResolved(src);
            }}
        />
    );
}
