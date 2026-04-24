import { lazy, ComponentType } from 'react';

export interface AIModel {
    id: string;
    name: string;
    description: string;
    image: string;
    order?: number;
}

/**
 * Optimizes image URLs for the DreamBees CDN
 */
export const getOptimizedImageUrl = (url: string | null | undefined): string | null | undefined => {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('https://cdn.dreambeesai.com')) return url;
    if (url.includes('backblazeb2.com')) {
        const b2Pattern = /https?:\/\/[^/]+\.backblazeb2\.com\//;
        return url.replace(b2Pattern, 'https://cdn.dreambeesai.com/file/printeregg/');
    }
    return !url.startsWith('http') && !url.startsWith('/') ? `/${url}` : url;
};

/**
 * Retries lazy component loading to handle network hiccups
 */
export const lazyRetry = (componentImport: () => Promise<{ default: ComponentType<any> }>) => {
    return lazy(async () => {
        try {
            return await componentImport();
        } catch (error) {
            console.error('Lazy load failed, retrying...', error);
            try {
                return await componentImport();
            } catch (secondError) {
                throw secondError;
            }
        }
    });
};

/**
 * Update document title without react-helmet
 */
export const useTitle = (title: string) => {
    if (typeof document !== 'undefined') {
        document.title = `${title} | DreamBees LITE`;
    }
};
